const open = require('open');
const uuid4 = require('uuid/v4');
const { join } = require('path');
const { env } = require('process')
const readline = require('readline');
const { hostname, homedir } = require('os');
const { mkdirSync, writeFileSync, readFileSync, existsSync, createReadStream, createWriteStream } = require('fs');

const utils = require('./utils');
const compiler = require('./compiler');
const testexecutor = require('./testexecutor');
const logHandler = require('./loghandler');
const logger = require('./logger')('cli');
const { vibPath, userConfig } = require('./constants');


/**
 * Run the tests
 *
 * @param {object} options Commander object containing user input
 */
const handleRunCommand = async options => {
	console.time();
	const scenarioList = await compiler.search(options.collections, options.scenarios, options.apis);
	const executionOptions = {
		variables: options.variables,
		systems: options.system,
		color: options.color,
		log: options.log,
		cred: options.cred,
		sync: options.sync
	};

	const result = await testexecutor.runTests(scenarioList, executionOptions);
	//onsole.log(JSON.stringify(result, null, 4));
	console.timeEnd();
};

/**
 * List the scenarios matching the parameters that user specified
 *
 * @param {object} options Commander object containing user input
 */
const handleListCommand = async options => {
	console.time();
	if (options.unfreeze || options.freeze) {
		utils.unfreezeScenarios();
	}

	let scenarios = await compiler.search(options.collections, options.scenarios, options.apis);
	if (!utils.isAll(options.keys)) {
		scenarios = compiler.filterScenariosMatchingKeys(scenarios, options.keys)
	}
	let apiList = await compiler.convertScenarios(scenarios);

	if (options.format == 'tree' || options.format == 'csv') {
		apiList = compiler.convertApiListToTreeStructure(apiList);
	}
	logHandler.printApiList(logger, apiList, options.format, options.color);

	if (options.freeze) {
		utils.freezeScenarios(scenarios);
	}

	console.timeEnd();
};

/**
 * Setup vibranium in the given path.
 *
 * @param {object} options Commander object containing user input
 * @param {*} workspacePath Path where vibranium needs to be setup
 */
const handleVibraniumSetup = async (options, workspacePath) => {
	const userDetails = !!options.email && !!options.name ? options : await getUserDetailsFromConsole();
	createWorksaceAndUserConfig(userDetails, workspacePath);
	createVibraniumDirectories(workspacePath);

	createReadStream(join(__dirname, '..', 'config', '_config.json')).pipe(
		createWriteStream(join(workspacePath, 'config.json'))
	);

	logger.info(`Please clone your repo in the directory: ${workspacePath}`);
	await open(workspacePath);
};

/**
 * Get the sample scenario file corresponding to the user input
 *
 * @param {object} options Commander object containing user input
 */
const getScenarioFileForOptions = options => {
	let fileName = 'basic_scenario.json';
	if (options.complex) fileName = 'complex_scenario.json';
	if (options.withDependency) fileName = 'scenario_dependency.json';
	return JSON.parse(readFileSync(join(__dirname, '..', 'config', fileName)));
};

/**
 * Create a new collection/scenario
 *
 * @param {object} options Commander object containing user input
 */
const handleCreateCommand = options => {
	if (!options.collection || !options.scenario) {
		logger.error('Please specify the collection and the scenario. Syntax: -c <collection> -s <scenario_name>');
		process.exit(1);
	} else if (!utils.isValidName(options.collection) || !utils.isValidName(options.scenario)) {
		logger.error('Invalid scenario/collection name');
		process.exit(1);
	}

	utils.isVibraniumInitialized();
	if (!existsSync(vibPath.scenarios)) mkdirSync(vibPath.scenarios);
	if (!existsSync(join(vibPath.scenarios, options.collection))) mkdirSync(join(vibPath.scenarios, options.collection));

	if (!existsSync(vibPath.payloads)) mkdirSync(vibPath.payloads);
	if (!existsSync(join(vibPath.payloads, options.scenario))) mkdirSync(join(vibPath.payloads, options.scenario));

	const scenarioFileName = join(vibPath.scenarios, options.collection, `${options.scenario}.json`);

	if (existsSync(scenarioFileName)) {
		logger.error('Scenario already exists. File: ' + scenarioFileName);
		process.exit(1);
	}

	createAndOpenScenario(options, scenarioFileName);
};

/**
 * Creates and opens the scenario in the default editor
 *
 * @param {object} options Commander options
 * @param {string} scenarioFileName Scenario file name
 */
const createAndOpenScenario = (options, scenarioFileName) => {
	let sampleScenario = getScenarioFileForOptions(options),
		dt = new Date();
	let dateString = `${dt.getFullYear()}-${dt.getMonth() +
		1}-${dt.getDate()} ${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}`;
	let scenarioData = {
		id: uuid4(),
		name: options.scenario,
		author: userConfig.name,
		email: userConfig.email,
		created_on: dateString
	};
	sampleScenario = { ...sampleScenario, ...scenarioData };

	writeFileSync(
		scenarioFileName,
		JSON.stringify(sampleScenario, null, 4).replace('{payloadNameToBeReplaced}', '!sample_payload')
	);
	writeFileSync(join(vibPath.payloads, options.scenario, 'sample_payload.json'), JSON.stringify({}, null, 4));

	logger.info('Scenario created. File: ' + scenarioFileName);
	open(scenarioFileName);
};

/**
 * Create the directories that vibranium uses for execution
 *
 * @param {string} workspace Vibranium workspace path
 */
const createVibraniumDirectories = workspace => {
	if (!existsSync(workspace)) mkdirSync(workspace);
	if (!existsSync(join(workspace, 'jobs'))) mkdirSync(join(workspace, 'jobs'));
	if (!existsSync(join(workspace, 'logs'))) mkdirSync(join(workspace, 'logs'));
};

/**
 * Create the bibranium workspace and setup user configuration json file
 *
 * @param {object} userDetails User details
 * @param {string} workspace Vibranium Workspace
 */
const createWorksaceAndUserConfig = (userDetails, workspace) => {
	const systemConfigDirectory = join(homedir(), '.vib');
	if (!existsSync(systemConfigDirectory)) {
		mkdirSync(systemConfigDirectory);
	}

	let sysConfig = {
		id: hostname(),
		userid: userDetails.userid,
		email: userDetails.email,
		name: userDetails.name,
		workspace
	};
	writeFileSync(join(systemConfigDirectory, 'config.json'), JSON.stringify(sysConfig, null, 4));
};

/**
 * Get the user details, for setting up vibranium for the first time.
 */
const getUserDetailsFromConsole = () =>
	new Promise(resolve => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		rl.question('Please enter your user id: ', userid => {
			rl.question('Please enter your email id: ', email => {
				rl.question('Please enter your name: ', name => {
					rl.close();
					resolve({ userid, email, name });
				});
			});
		});
	});

module.exports = {
	handleRunCommand,
	handleListCommand,
	handleCreateCommand,
	handleVibraniumSetup
};
