const chalk = require('chalk');
const { join } = require('path')
const treeify = require('treeify');
const { env } = require('process')
const { create } = require('xmlbuilder2');
const { existsSync, mkdirSync } = require('fs')
const { writeFile, rmdir } = require('fs').promises;

const { executionStatus } = require('./constants');
const utils = require('./utils');


/**
 * Print the API tree in a formatted tree structure.
 * Only prints api list and not the dependency tree
 *
 * @param {array} apis List of apis
 * @param {boolean} color Use colored text for printing
 */
const printApiListAsTree = (logger, apis, color = true) => {
	let formattedTree = {};
	for (const collection in apis) {
		formattedTree[prettyPrint('collection', collection, color)] = {};
		for (const scenario in apis[collection]) {
			formattedTree[prettyPrint('collection', collection, color)][prettyPrint('scenario', scenario, color)] = {};
			for (const api in apis[collection][scenario]) {
				formattedTree[prettyPrint('collection', collection, color)][prettyPrint('scenario', scenario, color)][
					prettyPrint('api', api, color)
				] = {};
			}
		}
	}
	logger.info('');
	logger.info('API list: \n');
	console.log(treeify.asTree(formattedTree))
};

/**
 * Print the API tree as a formatted json
 *
 * @param {array} apis List of apis
 */
const printApiListAsJson = apis => console.log(JSON.stringify(apis, null, 4));

/**
 * Print the API names in a csv format
 *
 * @param {array} apis List of apis
 */
const printApiListAsCSV = apis => {
	let apisList = [];
	for (const collection in apis) {
		for (const scenario in apis[collection]) {
			for (const api in apis[collection][scenario]) {
				apisList.push(api);
			}
		}
	}
	console.log(apisList.join(','));
};

/**
 * Print the API tree in a formatted way.
 * The format can be json, tree or csv
 *
 * @param {array} apis List of APis
 * @param {string} format The format in which the API tree is to be printed.
 * @param {boolean} color Use colored text for printing
 */
const printApiList = (logger, apis, format = 'tree', color = true) => new Promise(resolve => {
	if (format === 'json') {
		printApiListAsJson(apis, color);
	} else if (format === 'csv') {
		printApiListAsCSV(apis, color);
	} else {
		printApiListAsTree(logger, apis, color);
	}
	resolve();
});

/**
 * Print the execution start
 * 
 * @param {Logger} logger logger object
 * @param {string} jobId Execution job Id
 * @param {object} scenarios List of scenarios to execute
 */
const logExecutionStart = async (logger, jobId, scenarios, executorCount) => {
	logger.info('Job Execution ID: ' + prettyPrint('jobId', jobId))
	logger.info(`Starting execution at ${prettyPrint('date')} with ${chalk.blue(executorCount)} parallel thread(s), ${scenarios.length} scenario(s) and ${scenarios.map(sc => sc.endpoints.length).reduce((a, c) => a + c, 0)} API(s)`)
	logger.info()
}

/**
 * Log scenario start
 * 
 * @param {Logger} logger logger object
 * @param {object} scenario Scenario details
 */
const logScenarioStart = (logger, scenario) => {
	logger.info(`Scenario ${prettyPrint('scenario', scenario.name)} [${scenario.file}] started`);
	logger.info()
};


const logScenarioEnd = async (logger, scenario) => {
	logger.info(
		`${prettyPrint('scenario', scenario.name)} status: ${prettyPrint('status', scenario._result.status)} [${
		scenario.endpoints.filter(e => !!e && e._status).length
		}/${scenario.endpoints.length}] time: ${scenario._result.timing.delta / 1000} sec`
	);
	return
};

const getAPIIndex = api => {
	if (api.repeat) {
		return api.variables._range_index + '/' + (api.repeat ? api.repeat : '1')
	} else {
		return '1/1'
	}
}

const printApiExecutionStart = async (logger, api, variables) => {
	logger.info(`${prettyPrint('scenario', api.scenario)}.${prettyPrint('api', api.name)} started`);
	logger.debug('Variables' + utils.printSpaces('Variables') + ': ' + JSON.stringify(variables, null, 2)
		.split('\n')
		.map((line, i) => (i > 0 ? utils.printSpaces('Variables', 45) : '') + syntaxHighlight(line))
		.join('\n'));
};

const printApiExecutionEnd = async (logger, api) => {
	let details = {
		'Name': prettyPrint('api', api.name),
		'Collection': prettyPrint('collection', api.collection),
		'Scenario': prettyPrint('scenario', api.scenario),
		'Method': api.method ? api.method.toUpperCase() : 'GET',
		'Url': api.url,
		'Payload': (!!api.payload && typeof (api.payload) === 'object') ? JSON.stringify(api.payload, null, 2) : '{}',
		'Repeat Index': getAPIIndex(api),
		'StatusCode': api._result.status,
		'Status': prettyPrint('status', api._status),
		'Response': (!!api._result.response && typeof (api._result.response) === 'object') ? JSON.stringify(api._result.response, null, 2) : '{}',
		'Timing': api._result.timing ? Object.entries(api._result.timing).map(([key, value]) => chalk.yellowBright(key) + ': ' +
			chalk.yellowBright(parseFloat(value).toFixed(2))).join(', ') : 'not available',
		'_result': (!api._status && !!api._result && typeof (api._result) === 'object') ? JSON.stringify(api._result, null, 2) : '{}'
	}
	logger.info()
	for (let [key, value] of Object.entries(details)) {
		if (['Payload', 'Response', '_result'].includes(key)) {
			if (!api._status || process.env.LOG_LEVEL === 'debug') {
				let dataToBePrinted = key + utils.printSpaces(key) + ': ' + value.split('\n')
					.map((line, i) => (i > 0 ? utils.printSpaces(key, 42) : '') + syntaxHighlight(line))
					.join('\n')
				api._status ? logger.debug(dataToBePrinted) : logger.error(dataToBePrinted);
			}
		} else {
			api._status ? logger.info(key + utils.printSpaces(key) + ': ' + value) :
				logger.error(key + utils.printSpaces(key) + ': ' + value)
		}
	}

	logger.info()
	return
};

/**
 * Summary of all scenario responses
 * @param {Logger} logger Logger object
 * @param {string} jobId job Id string
 * @param {object} result List of all scenario responses
 */
const logExecutionEnd = (logger, jobId, result) => {
	logger.info()
	logger.info(`Execution summary for job #${jobId}`)

	let endpointResult = [], scenariosCount = result.length;

	for (let i = 0; i < scenariosCount; i++) {
		const scenario = result[i]
		endpointResult = scenario.endpoints
			.filter(e => !e._status)
			.map(e => {
				return {
					scenario: scenario.name,
					name: e.name,
					statusCode: e._result.statusCode
				}
			})
	}

	if (endpointResult.length > 0) {
		logger.info()
		logger.error(chalk.redBright('Failed Tests'))
		endpointResult
			.map(e => `\t${e.scenario}.${chalk.redBright(e.name)}`)
			.map(logger.error)
	} else {
		logger.info(prettyPrint('status', true))
	}
}

// TODO
// TODO: log scenario timing
// TODO: collect and print results 
// if --report -> junit, html and console report
// eslint-disable-next-line no-unused-vars
const processScenarioResult = async (jobId, result, report, jobsPath) => {
	if (env.SILENT) return

	if (!!report && report.split(',').includes('junit')) {
		let junitReport = await generateJunitReportForScenario(result)
		let junitReportpaths = ['latest', jobId]
			.map(path => join(jobsPath, path, 'reports', 'junit', result.collection))

		if (existsSync(join(jobsPath, 'latest', 'reports', 'junit'))) {
			await rmdir(join(jobsPath, 'latest', 'reports', 'junit'), { recursive: true })
		}
		junitReportpaths.map(path => {
			if (!existsSync(path))
				mkdirSync(path, { recursive: true });
		})

		let tasks = junitReportpaths.map(path => join(path, `${result.collection}.${result.name}.${jobId}.xml`))
			.map(p => writeFile(p, junitReport))
		await (Promise.all(tasks))

	} else if (!!report && report.split(',').includes('html')) {
		// eslint-disable-next-line no-unused-vars
		let junitReport = await generateJunitReportForScenario(result)

		if (existsSync(join(jobsPath, 'latest', 'reports', 'html'))) {
			await rmdir(join(jobsPath, 'latest', 'reports', 'html'), { recursive: true })
		}
	}


	return
}


const syntaxHighlight = json => {
	json = json
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
	return json.replace(
		/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
			let cls = chalk.yellow;
			if (/^"/.test(match)) {
				if (/:$/.test(match)) {
					cls = chalk.blue;
				} else {
					cls = chalk.yellowBright;
				}
			} else if (/true|false/.test(match)) {
				cls = chalk.cyan;
			} else if (/null/.test(match)) {
				cls = chalk.grey;
			}
			return cls(match);
		}
	);
};

/**
 * Utility function to get a prettified string that contains colors and
 * ascii characters/smileys if the system supports them and else prints
 * plain text
 *
 * @param {string} type The type of text to be prettyified
 * @param {string} text The text to be prettified
 * @param {boolean} color se colored text for printing
 * @returns {string} Pretty printed text
 */
const prettyPrint = (type, text = '', color = true) => {
	const isMac = utils.isMac;
	if (type == 'jobId') return color ? chalk.greenBright(text) : text;
	if (type == 'collection') return color ? (isMac ? '📂 ' : ' ') + chalk.cyan(text) : text;
	if (type == 'scenario') return color ? (isMac ? '📄 ' : ' ') + chalk.cyanBright(text) : text;
	if (type == 'api') return color ? (isMac ? '🌐 ' : ' ') + chalk.greenBright(text) : text;
	if (type == 'date') return color ? `${chalk.grey(new Date().toLocaleTimeString('en'))}` : text;
	if (type == 'loglevel' && (text == 'info' || text == 'i')) return color ? chalk.blue(text) : text;
	if (type == 'loglevel' && (text == 'debug' || text == 'd')) return color ? chalk.yellow(text) : text;
	if (type == 'loglevel' && (text == 'warn' || text == 'w')) return color ? chalk.keyword('orange')(text) : text;
	if (type == 'loglevel' && (text == 'error' || text == 'e')) return color ? chalk.redBright(text) : text;
	if (type == 'loglevel' && (text == 'success' || text == 's')) return color ? chalk.greenBright(text) : text;
	if (type == 'status' && (text == executionStatus.SUCESS || text === true))
		return color ? (isMac ? '🟢 ' : '') + chalk.greenBright('SUCCESS') : text;
	if (type == 'status' && (text == executionStatus.FAIL || text === false))
		return color ? (isMac ? '🔴 ' : '') + chalk.redBright('FAIL') : text;
	if (type == 'status' && text == executionStatus.ERROR)
		return color ? (isMac ? '🟠 ' : '') + chalk.redBright('ERROR') : text;
};


const generateJunitReportForScenario = async (scenario) => {
	let endpoints = scenario.endpoints
	let endpointsCount = endpoints.length, failedEndpointsCount =
		endpoints.filter(e => !e._status).length

	let testReport = create({ version: '1.0' })
		.ele('testsuites', { errors: 0, failures: failedEndpointsCount, tests: endpointsCount })
		.ele('testsuite', {
			name: [scenario.collection, scenario.name].join('.'),
			id: scenario.id,
			hostname: '',
			package: scenario.collection,
			tests: endpointsCount,
			failures: failedEndpointsCount,
			errors: 0,
			skipped: endpoints.filter(e => e.ignore),
			timestamp: new Date().toISOString()
		})

	for (const endpoint of endpoints) {
		const testCase = testReport.ele('testcase', {
			name: endpoint.name,
			classname: [scenario.collection, scenario.name, endpoint.name].join('.'),
			assertions: 1,
			time: endpoint._result.map(res => res.timing.total).reduce((a, c) => a + c, 0)
		})
		if (!endpoint._status) {
			let endpointResponses = endpoint._result
				.map(res => res.response)
				.map(res => typeof (res) === 'object' ? JSON.stringify(res) : res)
				.map(res => res.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(/"/g, '&quot;')
					.replace(/'/g, '&apos;'))
				.join(',')

			testCase.ele('failure', {
				message: `Failed [status: ${endpoint._result.map(res => res.status).join(',')}]`
			}).txt(endpointResponses)
		}
	}
	return testReport.end({ prettyPrint: true })
};


module.exports = {
	printApiList,
	prettyPrint,
	logScenarioStart,
	logScenarioEnd,
	printApiExecutionStart,
	printApiExecutionEnd,
	logExecutionStart,
	processScenarioResult,
	logExecutionEnd
};
