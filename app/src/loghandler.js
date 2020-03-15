const chalk = require('chalk');
const treeify = require('treeify');
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
	logger.info('#' + prettyPrint('jobId', jobId))
	logger.info(`Starting execution at ${prettyPrint('date')} with ${chalk.blue(executorCount)} parallel thread(s), ${scenarios.length} scenario(s) and ${scenarios.map(sc => sc.endpoints.length).reduce((a, c) => a + c, 0)} API(s)`)
}

/**
 * Log scenario start
 * 
 * @param {Logger} logger logger object
 * @param {object} scenario Scenario details
 */
const logScenarioStart = (logger, scenario) => {
	logger.info(`${prettyPrint('scenario', scenario.name)} [${scenario.file}] started`);
};


const logScenarioEnd = (logger, scenario, variables) => {
	if (scenario._result.status == executionStatus.ERROR) {
		logger.error(`${prettyPrint('scenario', scenario.name)} execution variables:`);
		prettyPrintJson(variables, logger.debug);
	}
	logger.info(
		`${prettyPrint('scenario', scenario.name)} status: ${prettyPrint('status', scenario._result.status)} [${
		scenario.endpoints.filter(e => e._status).length
		}/${scenario.endpoints.length}] time: ${scenario._result.timing.delta / 1000} sec`
	);
};

const getAPIIndex = api => {
	if (api.repeat) {
		return api.variables._range_index + '/' + (api.repeat ? api.repeat : '1')
	} else {
		return '1/1'
	}
}

const printApiExecutionStart = async (logger, api, variables, dependencyLevel=0) => {
	let details = {
		'Name': prettyPrint('api', api.name),
		'Collection': prettyPrint('collection', api.collection),
		'Scenario': prettyPrint('scenario', api.scenario),
		'Method': chalk.blue(api.method ? api.method.toUpperCase() : 'GET'),
		'Url': api.url,
		'Payload': (!!api.payload && typeof (api.payload) === 'object') ? JSON.stringify(api.payload, null, 2) : '{}',
		'Variables': JSON.stringify(variables, null, 2),
		'Repeat Index': getAPIIndex(api)
	}
	logger.info()
	for (let [key, value] of Object.entries(details)) {
		if (key === 'Payload') {
			logger.debug(utils.printSpaces('', dependencyLevel*2) + 'Payload' + utils.printSpaces('Payload') + ': ' + value.split('\n')
				.map((line, i) => (i > 0 ? utils.printSpaces('Payload', 42) : '') + syntaxHighlight(line))
				.join('\n'));
		} else if (key === 'Variables') {
			logger.debug(utils.printSpaces('', dependencyLevel*2) + 'Variables' + utils.printSpaces('Variables') + ': ' + value.split('\n')
				.map((line, i) =>  (i > 0 ? utils.printSpaces('Variables', 45) : '') + syntaxHighlight(line))
				.join('\n'));
		} else {
			logger.info(utils.printSpaces('', dependencyLevel*2) + key + utils.printSpaces(key) + ': ' + value)
		}
	}
	return
};

const printApiExecutionEnd = (logger, apiResult) => {
	logger.info(`${prettyPrint('scenario', apiResult.scenario)}.${prettyPrint('api', apiResult.name)} completed: ${prettyPrint('status', apiResult._status)}`);
	if (apiResult._status) {
		logger.debug(`\t${prettyPrint('api', apiResult.name)} Response:`);
		prettyPrintJson(apiResult._result.response, logger.debug);
	} else {
		logger.error(`\t${prettyPrint('api', apiResult.name)} Response:`);
		prettyPrintJson(apiResult._result.response, logger.error);
		logger.error('Endpoint response object: ');
		prettyPrintJson(apiResult._result, logger.error);
	}
};

// TODO
// eslint-disable-next-line no-unused-vars
const logExecutionEnd = (logger, jobId, result) => {
	logger.info(jobId);
};

const prettyPrintJson = (json, log) => {
	JSON.stringify(json, null, 2)
		.split('\n')
		.forEach(line => log('\t' + syntaxHighlight(line)));
};

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
	if (type == 'loglevel' && text == 'info') return color ? chalk.blue(text) : text;
	if (type == 'loglevel' && text == 'debug') return color ? chalk.yellow(text) : text;
	if (type == 'loglevel' && text == 'warn') return color ? chalk.keyword('orange')(text) : text;
	if (type == 'loglevel' && text == 'error') return color ? chalk.redBright(text) : text;
	if (type == 'loglevel' && text == 'success') return color ? chalk.greenBright(text) : text;
	if (type == 'status' && (text == executionStatus.SUCESS || text == true))
		return color ? chalk.greenBright('SUCCESS') : text;
	if (type == 'status' && (text == executionStatus.FAIL || text == false))
		return color ? chalk.redBright('FAIL') : text;
	if (type == 'status' && text == executionStatus.ERROR) return color ? chalk.redBright('ERROR') : text;
};

module.exports = {
	printApiList,
	prettyPrint,
	logScenarioStart,
	logScenarioEnd,
	printApiExecutionStart,
	printApiExecutionEnd,
	logExecutionStart,
	logExecutionEnd
};
