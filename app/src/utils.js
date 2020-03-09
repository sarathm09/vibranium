const { VM } = require('vm2');
const { homedir } = require('os');
const { sep, join } = require('path');
const { platform, env } = require('process');
const { readFile, unlink } = require('fs').promises;
const { existsSync, mkdirSync, writeFileSync, readFileSync } = require('fs');

const { vibPath, userConfig, logLevels } = require('./constants');
const moduleLogger = require('./logger');

const logger = moduleLogger('util');

/**
 * Check if the system is a Mac or not
 */
module.exports.isMac = platform === 'darwin';

/**
 * Get the loglevel object from the string
 */
module.exports.getLogLevel = level =>
	level.toLowerCase() === 'error'
		? logLevels.ERROR
		: level.toLowerCase() === 'debug'
			? logLevels.DEBUG
			: level.toLowerCase() === 'warn'
				? logLevels.WARN
				: logLevels.INFO;

/**
 * Get the collection name from the absolute file path
 * @param {string} fileToParse
 * @returns {string}
 */
module.exports.getCollectionNameForScenario = fileToParse => fileToParse.replace(vibPath.scenarios, '').split(sep)[1];

/**
 * Get the scenario name from the absolute file path
 * @param {string} fileToParse
 * @returns {string}
 */
module.exports.getScenarioFileNameFromPath = fileToParse =>
	fileToParse
		.replace(vibPath.scenarios, '')
		.split(sep)
		.pop()
		.split('.')[0];

/**
 * Split and trim user input string
 * @param {string} input
 * @returns {array}
 */
module.exports.splitAndTrimInput = input => (input ? input.split(',').map(_ => _.trim()) : []);

/**
 * Check if the user has passed 'all' as the input.
 * If the user hasn't given any input, it is still considered as 'all' as it's the default
 * @param {string} input
 * @returns {boolean}
 */
module.exports.isAll = input => (input ? input.toLowerCase() === 'all' : true);

/**
 * Asynchronous sleep function.
 * Used for limiting the number of parallel executions
 * @param {integer} ms milliseconds to sleep
 */
module.exports.sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Split the given and input and see if any of the elements specified in the array match
 * the set of inputs
 * @param {array} arr
 * @param {string} input
 * @returns {boolean}
 */
module.exports.includesRegex = (arr, input) => arr.filter(_ => input.toLowerCase().match(_.toLowerCase())).length > 0;

const parseJsonFile = async (fileToParse, fileData, payload) => {
	let fileParseStatus = {};
	try {
		let obj = JSON.parse(fileData);
		// If the file is a scenario file, add filepath and scenario name to the json
		if (!payload) {
			obj = {
				...obj,
				file: fileToParse.replace(vibPath.scenarios, ''),
				collection: module.exports.getCollectionNameForScenario(fileToParse),
				sid: `${fileToParse.replace(vibPath.scenarios, '').split(sep)[1]}_${obj.name}`
			};
		}
		fileParseStatus = { status: true, data: obj };
	} catch (error) {
		fileParseStatus = {
			status: false,
			message: `Parsing file ${fileToParse} failed with the error ${error}`
		};
	}
	return fileParseStatus;
};

/**
 * Read the json file (scenario/payload) from the filesystem, parse it as json
 * and return the json object
 *
 * @param {string} fileToParse The absolute path of the file to be read and parsed
 * @param {boolean} payload is the file a payload file or not. Used for file parsing
 */
module.exports.readJsonFile = async (fileToParse, payload = false) => {
	if (!fileToParse) return { status: false, message: 'The filename is not valid.' };

	if (!!fileToParse && fileToParse.split('.').pop() != 'json')
		return {
			status: false,
			message: `The file ${fileToParse} does not have the extension '.json'`
		};
	else {
		let fileData = await readFile(fileToParse, 'utf8');
		return parseJsonFile(fileToParse, fileData, payload);
	}
};

/**
 * Save the scenarios into cache.
 * Cache is created by running --freeze option
 *
 * @param {array} scenarios List of scenarios
 */
module.exports.freezeScenarios = scenarios => {
	if (!existsSync(vibPath.cache)) {
		mkdirSync(vibPath.cache);
	}
	writeFileSync(vibPath.cachedScenarios, JSON.stringify(scenarios));
};

/**
 * Remove all cache. Triggered by the --unfreeze option
 */
module.exports.unfreezeScenarios = async () => {
	await unlink(vibPath.cachedScenarios);
};

/**
 * Check if cache exists. Cache is created by running --freeze option
 */
module.exports.cacheExists = () => existsSync(vibPath.cachedScenarios);

/**
 * Load the cached scenarios
 */
module.exports.loadCachedScenarios = async () => {
	let cachedScenarios = await readFile(vibPath.cachedScenarios, 'utf8');
	return JSON.parse(cachedScenarios);
};

/**
 * Get available systems defined in the config
 */
module.exports.getAvailableSystemsFromConfig = () => {
	return {
		systems: userConfig.accounts,
		default: userConfig.default_account
	};
};

/**
 * Check if the config is set and Vibranium is cloned
 */
module.exports.isVibraniumInitialized = () => {
	let status = true;
	if (!existsSync(join(homedir(), '.vib', 'config.json'))) {
		status = false;
	} else {
		try {
			let systemConfig = JSON.parse(readFileSync(join(homedir(), '.vib', 'config.json'), 'utf-8'));
			let workspace = systemConfig.workspace;
			if (
				!existsSync(join(workspace, 'config.json')) ||
				!existsSync(join(workspace, 'jobs')) ||
				!existsSync(join(workspace, 'logs'))
			) {
				status = false;
			}
			let userConfig = JSON.parse(readFileSync(join(workspace, 'config.json'), 'utf-8'));
			let testsDirectory = userConfig.tests_directory ? userConfig.tests_directory : 'tests';
			if (!existsSync(join(workspace, testsDirectory)) || !existsSync(join(workspace, testsDirectory, 'scenarios'))) {
				status = false;
			}
		} catch (err) {
			status = false;
		}
	}

	if (!status) {
		logger.error(
			'Vibranium not initialized. Please run the setup command to initialize and then clone/create the tests.'
		);
		process.exit(1);
	}
};

/**
 * Execute a given script and return the variables
 *
 * @param {string} script The script to execute
 * @param {object} variables The variables to be used for script execution and also for setting env vars from script
 * @param {logger} logger object to log details
 * @param {function} getApiResponse method to get API response. Used inscripts to get api response.
 * @returns {object} modified variables
 */
module.exports.executeScript = (script, getApiResponse, variables, parent, scriptType) => {
	scriptType = scriptType
		.toString()
		.replace('Symbol(', '')
		.replace(')', '');
	const scriptName = `script_${parent}_${scriptType}_${Date.now()}`;
	const vm = new VM({
		external: true,
		sandbox: { variables, getApiResponse, logger: moduleLogger(scriptName) }
	});
	logger.debug(`Executing ${scriptType} script [${scriptName}]: ${script}`)
	vm.run(`
        const ${scriptName} = () => {
            ${script}
        }
        logger.debug('Executing script ${scriptName}')
        ${scriptName}()
    `);
	return variables;
};

module.exports.isValidName = inputText => {
	if (inputText == undefined || inputText == null || inputText == '') return false;

	if ('|}{[]\\/*&ˆ%$#@!();:,?<>˜`+'.split().filter(char => inputText.includes(char)) > 0) return false;

	if (inputText.length < 2) return false;

	return true;
};

module.exports.getParallelExecutorLimit = () => {
	if (env.MAX_PARALLEL_EXECUTORS && !isNaN(env.MAX_PARALLEL_EXECUTORS))
		return parseInt(env.MAX_PARALLEL_EXECUTORS)
	return !!userConfig.executor && !!userConfig.executor.max_parallel_executors
		? userConfig.executor.max_parallel_executors
		: 10;
}


module.exports.printSpaces = (text, max = 15) =>
	Array.from(Array(max - text.length))
		.map(' ')
		.join('');
