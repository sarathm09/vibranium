const ora = require('ora')
const chalk = require('chalk')
const ms = require('pretty-ms')
const { join } = require('path')
const treeify = require('treeify')
const { env } = require('process')
const { create } = require('xmlbuilder2')
const { existsSync, mkdirSync } = require('fs')
const { writeFile, rmdir } = require('fs').promises


const { executionStatus } = require('./constants')
const utils = require('./utils')

let spinner = undefined, cachedFormattedString = {}


/**
 * Get the current execution index of the api
 * 
 * @param {object} api The endpoint object
 */
const getAPIIndex = api => api.repeat ? `${api.variables._range_index}/${(api.repeat || '1')}` : '1/1'


/**
 * Print the assertion test stament in a formatted manner
 * @param {boolean} result The assertion status
 * @param {string} test The test statement
 */
const getAssertLogString = ({ result, test }) => utils.isMac ? result ? chalk.green('✔  ') + test : chalk.red('✖  ') + test : test


/**
 * Styles for log level
 */
const logLevelStyles = {
	info: (text, color) => color ? chalk.blueBright(text) : text,
	i: (text, color) => color ? chalk.blueBright(text) : text,
	debug: (text, color) => color ? chalk.yellow(text) : text,
	d: (text, color) => color ? chalk.yellow(text) : text,
	warn: (text, color) => color ? chalk.keyword('orange')(text) : text,
	w: (text, color) => color ? chalk.keyword('orange')(text) : text,
	error: (text, color) => color ? chalk.redBright(text) : text,
	e: (text, color) => color ? chalk.redBright(text) : text,
	success: (text, color) => color ? chalk.greenBright(text) : text,
	s: (text, color) => color ? chalk.greenBright(text) : text,
	log: (text, color) => color ? chalk.blue(text) : text,
	l: (text, color) => color ? chalk.blue(text) : text,
}


/**
 * Status code based styles
 */
const statusStyles = {
	success: (text, color) => color ? (utils.isMac ? '🟢 ' : '') + chalk.greenBright('SUCCESS') : text,
	fail: (text, color) => color ? (utils.isMac ? '🔴 ' : '') + chalk.redBright('FAIL') : text,
	error: (text, color) => color ? (utils.isMac ? '🟠 ' : '') + chalk.redBright('ERROR') : text
}


/**
 * API pretty printing styles
 */
const stylesForAPI = {
	jobId: (text, color) => color ? chalk.greenBright(text) : text,
	collection: (text, color) => color ? (utils.isMac ? '📂 ' : '') + chalk.cyan(text) : text,
	scenario: (text, color) => color ? (utils.isMac ? '📄 ' : '') + chalk.cyanBright(text) : text,
	api: (text, color) => color ? (utils.isMac ? '🌐 ' : '') + chalk.greenBright(text) : text,
	date: (text, color) => color ? `${chalk.grey(new Date().toLocaleTimeString('en'))}` : text
}


/**
 * styles based on Status Symbol object
 */
const statusForSymbol = {
	[executionStatus.SUCESS]: 'success',
	[true]: 'success',
	[executionStatus.FAIL]: 'fail',
	[false]: 'fail',
	[executionStatus.ERROR]: 'error'
}


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
		let formattedCollection = prettyPrint('collection', collection, color)
		formattedTree[formattedCollection] = {}

		for (const scenario in apis[collection]) {
			let formattedScenario = prettyPrint('scenario', scenario, color)
			formattedTree[formattedCollection][formattedScenario] = {}

			for (const api in apis[collection][scenario]) {
				formattedTree[formattedCollection][formattedScenario][prettyPrint('api', api, color)] = {}
			}
		}
	}
	logger.info('API list: \n')
	console.log(treeify.asTree(formattedTree))
}


/**
 * Print the API tree as a formatted json
 *
 * @param {array} apis List of apis
 */
const printApiListAsJson = apis => console.log(JSON.stringify(apis, null, 2))


/**
 * Print the API names in a csv format
 *
 * @param {array} apis List of apis
 */
const printApiListAsCSV = apis => {
	let apisList = [];
	for (const collection in apis) {
		let apisInCollection = Object.keys(apis[collection])
			.map(scenario => [...Object.keys(apis[collection][scenario])
				.map(api => api)])

		apisList = [...apisList, ...apisInCollection]

	}
	console.log(apisList.join(','));
}


/**
 * Print the API tree in a formatted way.
 * The format can be json, tree or csv
 *
 * @param {array} apis List of APis
 * @param {string} format The format in which the API tree is to be printed.
 * @param {boolean} color Use colored text for printing
 */
const printApiList = async (logger, apis, format = 'tree', color = true) => {
	if (format === 'json') {
		printApiListAsJson(apis, color);
	} else if (format === 'csv') {
		printApiListAsCSV(apis, color);
	} else {
		printApiListAsTree(logger, apis, color);
	}
	return
}


/**
 * Print the execution start
 * 
 * @param {Logger} logger logger object
 * @param {string} jobId Execution job Id
 * @param {object} scenarios List of scenarios to execute
 */
const logExecutionStart = async (logger, jobId, scenarios, executorCount) => {
	if (env.LOG_MINIMAL) {
		spinner = ora('Starting Job #' + prettyPrint('jobId', jobId)).start()
	}
	logger.info()
	logger.info('Job Execution ID: ' + prettyPrint('jobId', jobId))
	logger.info(`Starting execution at ${prettyPrint('date')} with ${chalk.blueBright(executorCount)} parallel thread(s), ${scenarios.length} scenario(s) and ${scenarios.map(sc => sc.endpoints.length).reduce((a, c) => a + c, 0)} API(s)`)
	logger.info()
}


/**
 * Log scenario start
 * 
 * @param {Logger} logger logger object
 * @param {object} scenario Scenario details
 */
const logScenarioStart = (logger, scenario) => {
	if (env.LOG_MINIMAL) {
		spinner.text = `Running ${prettyPrint('scenario', scenario.name)}`
	}
	logger.info(`Scenario ${prettyPrint('scenario', scenario.name)} [${scenario.file}] started`);
	logger.info()
}


/**
 * Log the End of the Scenario Execution
 * @param {Logger} logger The logger object
 * @param {object} scenario Scenario details
 */
const logScenarioEnd = async (logger, scenario) => {
	if (env.LOG_MINIMAL) {
		let tempText = spinner.text
		scenario._result.status === executionStatus.SUCESS ? spinner.succeed(prettyPrint('scenario', scenario.name)) : spinner.fail(scenario.name)
		spinner.text = tempText
	}
	logger.info(`${prettyPrint('scenario', scenario.name)} status: ${prettyPrint('status', scenario._result.status)} [${
		scenario.endpoints.filter(e => !!e && e._status).length}/${scenario.endpoints.length}] time: ${ms(scenario._result.timing.delta)}`
	)
	return
}


/**
 * Print a success message for the endpoint using the spinner
 * 
 * @param {object} api The endpoint object
 */
const handleSpinnerForAPIExectutionEnd = async api => {
	let tempText = spinner.text
	spinner.prefixText = '  '
	let text = `${chalk.blueBright(api.method ? api.method.toUpperCase() : 'GET')} ${prettyPrint('scenario', api.scenario)}.${prettyPrint('api', api.name)}`
	api._status ? spinner.succeed(text) : spinner.fail(text)
	if (api._expect) {
		spinner.prefixText = '    '
		api._expect.forEach(e => {
			e.result ? spinner.succeed(e.test) : spinner.fail(e.test)
		})
		spinner.prefixText = ''
	}
	spinner.text = tempText
}


/**
 * Convert the API response into the data to be printed in the log
 * 
 * @param {object} api Endpoint Object
 * @param {string} contentType Response content type
 * @param {objectr} response Response object
 * @param {boolean} isResponseJson Is the response of type boolean
 */
const getAPIExecutionResultLogObject = (api, contentType, response, isResponseJson, status) => ({
	'Name': prettyPrint('api', api.name),
	'Collection': prettyPrint('collection', api.collection),
	'Scenario': prettyPrint('scenario', api.scenario),
	'Method': api.method ? api.method.toUpperCase() : 'GET',
	'Url': api.url,
	'Complete Url': api.fullUrl,
	'Payload': (!!api.payload && typeof (api.payload) === 'object') ? JSON.stringify(api.payload, null, 2) : '{}',
	'Repeat Index': getAPIIndex(api),
	'StatusCode': status,
	'Status': prettyPrint('status', api._status),
	'Content-Type': contentType,
	'Response': (!!response && isResponseJson) ? JSON.stringify(response, null, 2) : response,
	'Timing': api._result.timing ? Object.entries(api._result.timing).map(([key, value]) => chalk.cyan(key) + ': ' +
		chalk.cyanBright(ms(value))).join(', ') : 'not available',
	'Assertions': ''
})


/**
 * Log the starting of the endpoint execution
 * 
 * @param {Logger} logger The logger object
 * @param {object} api The endpoint object
 * @param {object} variables Endpoint Variables
 */
const printApiExecutionStart = async (logger, api, variables) => {
	if (env.LOG_MINIMAL) {
		spinner.prefixText = '  '
		spinner.text = `${chalk.blueBright(api.method ? api.method.toUpperCase() : 'GET')} ${prettyPrint('scenario', api.scenario)}.${prettyPrint('api', api.name)}`
		spinner.prefixText = ''
	}
	logger.info(`${prettyPrint('scenario', api.scenario)}.${prettyPrint('api', api.name)} started`);
	logger.debug('Variables' + utils.printSpaces('Variables') + ': ' + JSON.stringify(variables, null, 2)
		.split('\n')
		.map((line, i) => (i > 0 ? utils.printSpaces('Variables', 45) : '') + syntaxHighlight(line))
		.join('\n'));
}


/**
 * Prin the API execution syatus
 * @param {Logger} logger The logger object
 * @param {object} api The endpoint object
 */
const printApiExecutionEnd = async (logger, api) => {
	if (env.LOG_MINIMAL) {
		await handleSpinnerForAPIExectutionEnd(api)
	}
	// eslint-disable-next-line no-unused-vars
	let { response, contentType, status } = api._result
	const isResponseJson = typeof (api._result.response) === 'object'

	let details = getAPIExecutionResultLogObject(api, contentType, response, isResponseJson, status)
	logger.info()

	for (let [key, value] of Object.entries(details)) {
		if (['Payload', 'Response'].includes(key)) {
			if (!api._status || process.env.LOG_LEVEL === 'debug') {
				let dataToBePrinted = `${key}${utils.printSpaces(key)}: ${value ? value.split('\n')
					.map((line, i) => (i > 0 ? utils.printSpaces(key, process.env.LOG_LEVEL === 'debug' ? 43 : 33) : '') + syntaxHighlight(line, isResponseJson))
					.join('\n') : ''}`
				api._status ? logger.debug(dataToBePrinted) : logger.error(dataToBePrinted);
			}
		} else if (key === 'Assertions' && api._expect) {
			api._status ? logger.info(key + utils.printSpaces(key) + ' ') :
				logger.error(key + utils.printSpaces(key) + ': ')

			api._expect.forEach(expect => {
				api._status ? logger.info(utils.printSpaces('          ') + ' ' + getAssertLogString(expect)) :
					logger.error(utils.printSpaces('          ') + ' ' + getAssertLogString(expect))
			})
		} else {
			api._status ? logger.info(key + utils.printSpaces(key) + ': ' + value) :
				logger.error(key + utils.printSpaces(key) + ': ' + value)
		}
	}

	logger.info()
	return
}


/**
 * Summary of all scenario responses
 * 
 * @param {Logger} logger Logger object
 * @param {string} jobId job Id string
 * @param {object} result List of all scenario responses
 */
const logExecutionEnd = (logger, jobId, result, totalEndpointsExecuted, totalEndpointsSuccessful) => {
	const consoleColor = totalEndpointsExecuted === totalEndpointsSuccessful ? chalk.green : chalk.red
	logger.info()
	logger.info(`Execution summary for job #${prettyPrint('jobId', jobId)}`)
	logger.info(`Successful API executions (incl. dependencies) : ${consoleColor(totalEndpointsSuccessful + ' out of ' + totalEndpointsExecuted)}`)

	let apisWithError = [], scenariosCount = result.length, assertionsSuccess = 0, totalAssertions = 0;

	for (let i = 0; i < scenariosCount; i++) {
		const scenario = result[i]
		apisWithError = [...scenario.endpoints
			.filter(e => !e._status)
			.map(e => {
				return {
					scenario: scenario.name,
					collection: scenario.collection,
					name: e.name,
					statusCode: e._result && e._result.statusCode
				}
			}), ...apisWithError]

		scenario.endpoints.forEach(e => {
			totalAssertions += e._expect ? e._expect.length : 0
			assertionsSuccess += e._expect ? e._expect.filter(expect => expect.result).length : 0
		})
	}

	if (apisWithError.length > 0) {
		logger.error(`Successful assertions ${utils.printSpaces('', 25)}: ${consoleColor(assertionsSuccess + ' out of ' + totalAssertions)}`)
		logger.error()
		logger.error(chalk.redBright('Failed Tests'))
		apisWithError
			.map(e => `\t${e.scenario}.${chalk.redBright(e.name)}`)
			.map(logger.error)

		logger.error()

		logger.error('Rerun the failed tests with the following command: ')
		let failedCollections = [...new Set(apisWithError.map(e => e.collection))].join(','),
			failedScenarios = [...new Set(apisWithError.map(e => e.scenario))].join(','),
			failedEndpoints = [...new Set(apisWithError.map(e => e.name))].join(',')

		logger.error(chalk.keyword('orange')(`\n\tvc r -c ${failedCollections} -s ${failedScenarios} -a ${failedEndpoints}`))
		logger.error()
		logger.error('Status: ' + prettyPrint('status', false))
	} else {
		logger.success(`Successful assertions ${utils.printSpaces('', 25)}: ${consoleColor(assertionsSuccess + ' out of ' + totalAssertions)}`)
		logger.success('Status: ' + prettyPrint('status', true))
	}

	if (env.LOG_MINIMAL) {
		let text = `Result: ${totalEndpointsSuccessful}/${totalEndpointsExecuted} endpoints and ${assertionsSuccess}/${totalAssertions} assertions`
		apisWithError.length === 0 ? spinner.succeed(chalk.green(text)) : spinner.fail(chalk.red(text))
	}
}



/**
 * Process the scenario result and publish the reports
 * 
 * @param {string} jobId JobId
 * @param {object} result Scenario result object
 * @param {string} report Report type
 * @param {string} jobsPath Path to jobs directory
 */
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
		// TODO: generate JUNIT report
		await generateJunitReportForScenario(result)

		if (existsSync(join(jobsPath, 'latest', 'reports', 'html'))) {
			await rmdir(join(jobsPath, 'latest', 'reports', 'html'), { recursive: true })
		}
	}

	return
}


/**
 * Pretty print JSOn with syntax highlighting
 * 
 * @param {string} json Json string
 * @param {boolean} isJson Is the object a json
 */
const syntaxHighlight = (json, isJson) => {
	if (!isJson) return json

	let jsonRegex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g

	json = json
		.split('&').join('&amp;')
		.split('<').join('&lt;')
		.split('>').join('&gt;')

	return json.replace(jsonRegex, (match) => {
		let cls = chalk.yellow
		if (/^"/.test(match)) {
			if (/:$/.test(match)) {
				cls = chalk.blue
			} else {
				cls = chalk.yellowBright
			}
		} else if (/true|false/.test(match)) {
			cls = chalk.cyan
		} else if (/null/.test(match)) {
			cls = chalk.grey
		}
		return cls(match)
	}
	)
}


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
	if (cachedFormattedString[type] && cachedFormattedString[type][text]) return cachedFormattedString[type][text]

	let response = ''
	if (type === 'loglevel') response = logLevelStyles[text](text, color)
	else if (type === 'status') response = statusStyles[statusForSymbol[text]](text, color)
	else if (Object.keys(stylesForAPI).includes(type)) response = stylesForAPI[type](text, color)

	if (!cachedFormattedString[type]) cachedFormattedString[type] = {}
	cachedFormattedString[type][text] = response
	return response
}


/**
 * Generate the junit reports with the scenario reponse
 * 
 * @param {object} scenario Scenario object with results
 */
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
			timestamp: new Date().toISOString(),
			time: endpoints.map(e => e._time && e._time.total)
				.filter(t => !!t && !isNaN(t)).reduce((a, c) => a + c, 0)
		})

	for (const endpoint of endpoints) {
		const testCase = testReport.ele('testcase', {
			name: endpoint.name,
			classname: [scenario.collection, scenario.name, endpoint.name].join('.'),
			assertions: endpoint._expect ? endpoint._expect.length : 1,
			time: endpoint._time ? endpoint._time.total :
				endpoint._result.map(res => res.timing.total).reduce((a, c) => a + c, 0)
		})
		if (!endpoint._status) {
			let endpointResponses = endpoint._result
				.map(res => res.response)
				.map(res => typeof (res) === 'object' ? JSON.stringify(res) : res)
				.map(res => res.split('&').join('&amp;')
					.split('<').join('&lt;')
					.split('>').join('&gt;')
					.split('"').join('&quot;')
					.split('\'').join('&apos;'))
				.join(',')

			testCase.ele('failure', {
				time: endpoint._result || 0,
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
