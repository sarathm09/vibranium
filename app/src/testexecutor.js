const { join } = require('path');
const RandExp = require('randexp');
const { existsSync } = require('fs')
const { exit } = require('process');
const { LoremIpsum } = require('lorem-ipsum');
const { mkdir, writeFile } = require('fs').promises
const { green, yellow, yellowBright, red } = require('chalk')

const utils = require('./utils');
const compiler = require('./compiler');
const logHandler = require('./loghandler');
const logger = require('./logger')('runner');
const { vibPath, executionStatus, scriptTypes, loremGeneratorConfig, userConfig } = require('./constants');
const { callApi, setAvailableSystems } = require('./servicehandler');

let ACTIVE_PARALLEL_EXECUTORS = 0, scenarioCache = {}, lorem = new LoremIpsum(loremGeneratorConfig);


/**
 * Utility method to wait for executors to handle requests.
 * This method limits the number of cuncurrent requests that can be made so that server is not overloaded.
 * The max number of executors is controlled by the MAX_PARALLEL_EXECUTORS variable (default is 10)
 */
const waitForExecutors = () => new Promise(resolve => {
	const MAX_PARALLEL_EXECUTORS = utils.getParallelExecutorLimit();
	if (ACTIVE_PARALLEL_EXECUTORS < MAX_PARALLEL_EXECUTORS) {
		ACTIVE_PARALLEL_EXECUTORS++;
		resolve();
	} else {
		setTimeout(() => {
			waitForExecutors().then(() => resolve());
		}, 300);
	}
});


/**
 * Log the start of execution for the scenario in the given job id
 *
 * @param {object} scenario Scenario details
 * @param {string} jobId Job execution Id
 */
const logScenarioStart = async (scenario, jobId) => logHandler.logScenarioStart(logger, scenario, jobId);


/**
 * Evaluate global variables and apis
 * 
 * @param {object} variables Current variables
 * @param {object} globals Generate object in the scenario
 */
const processGeneratorsAndGlobals = async (variables, globals, isDependency) => {
	if (!!globals && typeof (globals) === 'object') {
		for (let globalVar of Object.keys(globals)) {
			if (typeof (globals[globalVar]) === 'object' && !isDependency) {
				globals[globalVar].variable = globalVar
				// TODO execute api
				let dependencyExecutionResult = await loadDependendentEndpoint({}, globals[globalVar], { ...variables })
				// eslint-disable-next-line require-atomic-updates
				variables[globalVar] = dependencyExecutionResult[globalVar]
			} else if (typeof (globals[globalVar]) === 'string') {
				variables[globalVar] = replacePlaceholderInString(globals[globalVar], variables)
			}
		}
	}
	return variables
};

/**
 * Execute an api from a script
 *
 * @param {object} variables Variables to be used for executing
 * @param {string} parentScenario Scenario from whcich the script is executed
 */
const customApiExecutor = (variables, parentScenario) => {
	return async (collection, scenario, api) => {
		try {
			const scenarioList = await compiler.search(collection, scenario, api);
			const executionOptions = {
				...this.executionOptions,
				variables
			};

			const response = await runTests(scenarioList, executionOptions);
			const results = response[0].endpoints[0]._result.map(res => res.response);
			return results.length == 1 ? results[0] : results;
		} catch (error) {
			logger.error(`Error executing api [${collection}, ${scenario}, ${api}] from ${parentScenario}: ${error}`);
			return {};
		}
	};

};


/**
 * Execute the custom js script before scenario execution starts
 *
 * @param {object} variables Variables to be used for executing the script
 * @param {object} scenario scenaio from which the api is executed.
 */
const executePreScenarioScripts = async (variables, scenario) => {
	if (!!scenario.scripts && !!scenario.scripts.pre_scenario) {
		utils.executeScript(
			scenario.scripts.pre_scenario,
			customApiExecutor(variables, scenario),
			variables,
			scenario.name,
			scriptTypes.preScenario
		);
	}
	return (variables);
};

/**
 * Execute the custom js script after all dependent endpoints are executed
 *
 * @param {object} endPointVariables Variables at the endpoint level
 * @param {object} endpoint endpoint details
 */
const executeEndpointPostDependencyScripts = (endPointVariables, endpoint) => {
	if (!!endpoint.scripts && !!endpoint.scripts.post_dependency) {
		utils.executeScript(
			endpoint.scripts.post_dependency,
			customApiExecutor(endPointVariables, endpoint.name),
			endPointVariables,
			endpoint.name,
			scriptTypes.postDependency
		);
	}
	return endPointVariables;
};


/**
 * Execute the custom js script before the endpoint execution starts
 *
 * @param {object} endPointVariables Variables at the endpoint level
 * @param {object} endpoint endpoint details
 */
const executeEndpointPreScripts = (scenarioVariables, endpoint) => {
	if (!!endpoint.scripts && !!endpoint.scripts.pre_endpoint) {
		utils.executeScript(
			endpoint.scripts.pre_endpoint,
			customApiExecutor(scenarioVariables, endpoint.name),
			scenarioVariables,
			endpoint.name,
			scriptTypes.preApi
		);
	}
	return scenarioVariables;
};


/**
 * Execute the custom js script after scenario execution ends
 *
 * @param {object} variables Variables to be used for executing the script
 * @param {object} scenario scenaio from which the api is executed.
 */
const executePostScenarioScripts = (variables, scenario) =>
	new Promise(resolve => {
		if (!!scenario.scripts && !!scenario.scripts.post_scenario) {
			utils.executeScript(
				scenario.scripts.post_scenario,
				customApiExecutor(variables, scenario),
				variables,
				scenario.name,
				scriptTypes.postScenario
			);
		}
		resolve(variables);
	});

/**
 * Execute the custom js script after scenario globals and generator execution ends
 *
 * @param {object} variables Variables to be used for executing the script
 * @param {object} scenario scenaio from which the api is executed.
 */
const executePostGeneratorScripts = (variables, scenario) =>
	new Promise(resolve => {
		if (!!scenario.scripts && !!scenario.scripts.post_globals) {
			utils.executeScript(
				scenario.scripts.post_globals,
				customApiExecutor(variables, scenario),
				variables,
				scenario.name,
				scriptTypes.postGlobal
			);
		}
		resolve(variables);
	});


/**
 * Replace the available placeholders with the value of the corresponding variables
 *
 * @param {any} objectToBeParsed A String/Object that contains placeholder variables that needs to be replaced
 * @param {object} variables Available variables
 */
const replacePlaceholderInString = (objectToBeParsed, variables) => {
	let stringToBeReplaced = objectToBeParsed;
	if (typeof stringToBeReplaced === 'string' || typeof stringToBeReplaced === 'object') {
		if (typeof objectToBeParsed === 'object') {
			stringToBeReplaced = JSON.stringify(objectToBeParsed);
		}

		for (const variableName of Object.keys(variables)) {
			if (typeof variables[variableName] === 'function') {
				stringToBeReplaced = stringToBeReplaced.split(`{${variableName}}`).join(variables[variableName]());
			} else if (typeof variables[variableName] === 'object' && stringToBeReplaced === `{${variableName}}`) {
				stringToBeReplaced = variables[variableName];
			} else if (typeof variables[variableName] === 'object' && typeof objectToBeParsed === 'object') {
				stringToBeReplaced = stringToBeReplaced
					.split(`"{${variableName}}"`)
					.join(JSON.stringify(variables[variableName]));
			} else if (typeof variables[variableName] === 'object') {
				stringToBeReplaced = stringToBeReplaced
					.split(`{${variableName}}`)
					.join(JSON.stringify(variables[variableName]));
			} else if (stringToBeReplaced.includes(`{${variableName}}`)) {
				stringToBeReplaced = stringToBeReplaced.split(`{${variableName}}`).join(variables[variableName]);
			}
		}

		for (const loremMatches of stringToBeReplaced.matchAll('{(lorem_[0-9]+)}')) {
			const loremVariable = loremMatches[1];
			stringToBeReplaced = stringToBeReplaced
				.split(`{${loremVariable}}`)
				.join(loremGenerator(parseInt(loremVariable.split('_')[1])));
		}
		if (typeof objectToBeParsed === 'string' && objectToBeParsed !== '{}' && objectToBeParsed.length < 99) {
			stringToBeReplaced = new RandExp(stringToBeReplaced).gen();
		}
	}

	return typeof objectToBeParsed === 'object' ?
		JSON.parse(stringToBeReplaced) :
		stringToBeReplaced;
};


/**
 * Replace the placeholder variables in the api url and in the payload
 *
 * @param {object} api The endpoint object
 * @param {object} variables All the variables available for the endpoint execution
 */
const replaceVariablesInApi = (api, variables) => {
	if (api.variables) {
		for (const variableAlias of Object.keys(api.variables)) {
			variables[variableAlias] = replacePlaceholderInString(api.variables[variableAlias], variables);
		}
	}

	api.url = replacePlaceholderInString(api.url, variables);
	api.payload = replacePlaceholderInString(api.payload, variables);

	return api;
};


/**
 * Execute the api endpoint when executors are available
 *
 * @param {object} api The api to be executed
 * callAPI response:
 * { timing, response, status, contentType }
 */
const executeAPI = async (endpoint, endpointVaribles) => {
	let api = replaceVariablesInApi(endpoint, endpointVaribles);
	let expectedStatus = 200;

	if (!!api.expect && !!api.expect.status) expectedStatus = api.expect.status;

	await waitForExecutors()
	logHandler.printApiExecutionStart(logger, api, endpointVaribles)

	const endpointResponse = await callApi(api.url, api.method, api.payload, api.system, api.language)
	api = {
		...api,
		_result: endpointResponse,
		_status: endpointResponse.status === expectedStatus,
		_variables: endpointVaribles
	}

	ACTIVE_PARALLEL_EXECUTORS -= 1;
	logHandler.printApiExecutionEnd(logger, api);
	return api;
}

/**
 * Convert list of scenarios to cache
 *
 * @param {array} scenarios List of all scenarios
 */
const createScenarioCache = async scenarios => {
	scenarios.forEach(scenario => {
		if (!Object.keys(scenarioCache).includes(scenario.collection)) {
			scenarioCache[scenario.collection] = {
				[scenario.name]: scenario
			};

		} else if (scenarioCache[scenario.collection][scenario.name]) {
			scenarioCache[scenario.collection][scenario.name].endpoints = [
				...scenarioCache[scenario.collection][scenario.name].endpoints,
				...scenario.endpoints
			];
		} else scenarioCache[scenario.collection][scenario.name] = scenario;
	});
};


/**
 * Search for the api in the cache and if not found, find the file in local and update cache
 *
 * @param {string} collection Collection name
 * @param {string} scenario Scenario name
 * @param {string} api Api name
 */
const searchForEndpointInCache = async (collection, scenario, api) => {
	if (scenarioCache[collection] && scenarioCache[collection][scenario]) {
		for (const endpoint of scenarioCache[collection][scenario].endpoints) {
			if (!!endpoint && endpoint.name === api) {
				let searchResult = { ...scenarioCache[collection][scenario] };

				searchResult.endpoints = [endpoint];
				return {
					scenario: searchResult,
					api: endpoint
				};
			}
		}

	}
	const searchResult = await compiler.compile(collection, scenario, api);

	if (searchResult.length > 0) {
		createScenarioCache(searchResult);
		searchResult[0].endpoints = [searchResult[0].endpoints.find(endpoint => endpoint.name === api)];
		return {
			scenario: searchResult[0],
			api: searchResult[0].endpoints.find(endpoint => endpoint.name === api)
		};

	} else {
		return undefined;
	}
};


/**
 * Parse the endpoint response object and get the element that is availabe in the given path 
 * to get value for the variable
 * 
 * @param {array} endpointResult Result of the execution
 * @param {string} dependencyPath Path to the key in the response tha needs to be parsed and stored as a variable
 */
const parseResponseVariableFromPath = (endpointResult, dependencyPath) => {
	let parsedResponse = { ...endpointResult }
	if (!dependencyPath || dependencyPath === '' || typeof (endpointResult) === 'string') {
		return endpointResult
	}
	dependencyPath = dependencyPath.split('/').join('.')
	let path = dependencyPath.split('.')

	try {
		if (path[0] === 'response') path.shift()
		logger.debug(`Parsing ${yellow(path.join('.'))} from ${green(JSON.stringify(parsedResponse))}`)
		const pathLength = path.length
		for (let index = 0; index < pathLength; index++) {
			let key = path[index] ? path[index].trim() : undefined
			if (!key || key === '') continue

			if (['ANY', 'ANY_OBJECT', 'RANDOM', 'RANDOM_OBJECT'].includes(key.toLocaleUpperCase())) {
				key = Math.floor(Math.random() * Math.floor(Object.values(parsedResponse).length))
				parsedResponse = parsedResponse[Math.abs(parseInt(key))]
			}

			if (key.toLocaleUpperCase() === 'ALL') {
				++index
				parsedResponse = Object.values(parsedResponse).map(r => r[path[index]])
			}

			if (!isNaN(key) && Math.abs(parseInt(key)) < Object.values(parsedResponse).length) {
				parsedResponse = parsedResponse[Math.abs(parseInt(key))]
			}

			if (Object.keys(parsedResponse).includes(key)) {
				parsedResponse = parsedResponse[key]
			}
		}
		logger.debug(`Parsed ${yellow(path.join('.'))} as ${green(typeof (parsedResponse) === 'object' ? JSON.stringify(parsedResponse) : parsedResponse)}`)
	} catch (error) {
		logger.error(`Could not parse ${yellow(path.join('.'))} from ${green(typeof (parsedResponse) === 'object' ? JSON.stringify(parsedResponse) : parsedResponse)}` + error)
	}

	return parsedResponse;
}

const getFormattedEndpointName = (collection, scenario, endpoint) =>
	logHandler.prettyPrint('collection', collection) + '.' +
	logHandler.prettyPrint('scenario', scenario) + '.' +
	logHandler.prettyPrint('api', endpoint)

/**
 * Load the variable data from the dependency's variables
 * 
 * @param {string} variableName variable to be loaded from the dependency
 * @param {object} variables list of variables
 */
const loadVariableFromDependencyToParentEndpoint = (variableName, variables) => {
	variableName = variableName.replace('{', '').replace('}', '')
	return (variables[variableName]) ? variables[variableName] : ''
}


/**
 *  Parse dependent endpoint result and return variable data
 * 
 * @param {object} scenarioResponse Dependency execution result
 * @param {object} endpoint Endpoint from which dependency is executed
 * @param {object} dependency dependendent endpoint details
 * @param {object} endpointVariables List of endpoint variables
 */
const processDependencyExecutionResult = (scenarioResponse, endpoint, dependency, endpointVariables) => {
	logger.info(`Executing dependency ${getFormattedEndpointName(dependency.collection, dependency.scenario, dependency.api)} : ${green('SUCCESS')}`)
	let endpointResults = scenarioResponse.endpoints.find(_ => _.name === dependency.api)._result, endpointResponse;
	if (endpointResults.length == 1) {
		endpointResponse = endpointResults[0].response;
	} else {
		endpointResponse = endpointResults.map(res => res.response);
	}
	// eslint-disable-next-line require-atomic-updates
	dependency._response = endpointResponse

	if (typeof (dependency.variable) === 'string') {
		let responseCopy = JSON.parse(JSON.stringify(endpointResponse))
		let parsedValue = dependency.path.startsWith('{') && dependency.path.endsWith('}') ?
			loadVariableFromDependencyToParentEndpoint(dependency.path, scenarioResponse.endpoints[0].variables) :
			parseResponseVariableFromPath(responseCopy, dependency.path);
		// eslint-disable-next-line require-atomic-updates
		endpointVariables[dependency.variable] = parsedValue;
		logger.info(`Setting value ${yellow(parsedValue)} for ${yellowBright(dependency.variable)}`)
		if (endpoint.variables) {
			Object.keys(endpoint.variables)
				.filter(key => endpoint.variables[key] === dependency.variable)
				.forEach(key => endpoint.variables[key] = parsedValue)
		}
	} else if (typeof (dependency.variable) === 'object') {
		for (let [variable, path] of Object.entries(dependency.variable)) {
			let responseCopy = JSON.parse(JSON.stringify(endpointResponse))
			let parsedValue = path.startsWith('{') && path.endsWith('}') ?
				loadVariableFromDependencyToParentEndpoint(path, scenarioResponse.endpoints[0].variables) :
				parseResponseVariableFromPath(responseCopy, path);

			endpointVariables[variable] = parsedValue;
			logger.info(`Setting value ${yellow(parsedValue)} for ${yellowBright(variable)}`)
			if (endpoint.variables) {
				Object.keys(endpoint.variables)
					.filter(key => endpoint.variables[key] === variable)
					.forEach(key => endpoint.variables[key] = parsedValue)
			}
		}
	}
	logger.info()
	return endpointVariables;
}


/**
 * Execute and parse dependent endpoint
 * 
 * @param {object} endpoint Endpoint from which dependency is executed
 * @param {object} dependency dependendent endpoint details
 * @param {object} endpointVariables List of endpoint variables
 */
const loadDependendentEndpoint = async (endpoint, dependency, endpointVariables) => {
	let searchResult = await searchForEndpointInCache(dependency.collection, dependency.scenario, dependency.api);
	let dependencyVariables = !!dependency.variables && typeof (dependency.variables) === 'object' ? { ...endpointVariables, ...dependency.variables } : endpointVariables

	if (searchResult === undefined || !searchResult.scenario || !searchResult.api) {
		throw ({ message: `Endpoint ${dependency.collection}.${dependency.scenario}.${dependency.api} not found` });
	}

	searchResult = JSON.parse(JSON.stringify(searchResult))
	if (!!dependency.repeat && dependency.repeat > 0) searchResult.scenario.endpoints[0].repeat = dependency.repeat
	
	if (endpoint.name) {
		logger.info(`Executing dependency ${getFormattedEndpointName(dependency.collection, dependency.scenario, dependency.api)} ` +
		`for endpoint ${getFormattedEndpointName(endpoint.collection, endpoint.scenario, endpoint.name)}`)
	} else {
		logger.info(`Executing dependency ${getFormattedEndpointName(dependency.collection, dependency.scenario, dependency.api)} for globals`)
	}

	searchResult.scenario.endpoints[0].variables = { ...searchResult.scenario.endpoints[0].variables, ...dependencyVariables }
	let response = await performScenarioExecutionSteps(searchResult.scenario, dependencyVariables, true, true)
	const scenarioResponse = response.scenarioResponse;
	// eslint-disable-next-line require-atomic-updates
	dependency._result = scenarioResponse.endpoints[0]

	if (scenarioResponse.endpoints.filter(endpoint => !endpoint._status).length > 0) {
		logger.error(`Executing dependency ${getFormattedEndpointName(dependency.collection, dependency.scenario, dependency.api)} : ${red('FAIL')}`)
		throw ({ message: `Endpoint ${dependency.collection}.${dependency.scenario}.${dependency.api} execution failed` });
	} else {
		return processDependencyExecutionResult(scenarioResponse, endpoint, dependency, endpointVariables)
	}
}


/**
 * Sets the repeat index as a variable available in the endpoint
 *
 * @param {object} endpoint Endpoint object
 * @param {integer} index repeat index
 * @returns {object} endpoint eith the variable set
 */
const setRangeIndexForEndpoint = (endpoint, index) => {
	let variables = endpoint.variables ? endpoint.variables : {};

	variables['_range_index'] = index + 1;
	endpoint.variables = variables;
	return endpoint;
};


/**
 * Return the promise that handles the api execution
 *
 * @param {object} scenarioVariables variables set at the scenario level
 * @param {object} endpoint endpoint object
 * @param {integer} repeatIndex index if the endpoint is reunning in repeat
 */
const getApiExecuterPromise = (scenarioVariables, endpoint, repeatIndex) => new Promise(resolveEndpoint => {
	let endPointVariables = executeEndpointPreScripts(scenarioVariables, endpoint);
	let dependencyResolver = Promise.resolve();

	endpoint = { ...setRangeIndexForEndpoint(endpoint, repeatIndex) };

	if (!!endpoint.dependencies && endpoint.dependencies.length > 0) {
		endpoint.dependencies.forEach(dependency => {
			dependencyResolver = dependencyResolver.then(response => {
				if (response) endPointVariables = { ...endPointVariables, ...response };
				return loadDependendentEndpoint(endpoint, dependency, endPointVariables);
			})
		});
	}

	dependencyResolver
		.then(response => {
			if (response) endPointVariables = { ...endPointVariables, ...response };
			endPointVariables = executeEndpointPostDependencyScripts(endPointVariables, endpoint);
			executeAPI(endpoint, endPointVariables)
				.then(resolveEndpoint);
		})
		.catch(error => {
			endpoint._result = {
				response: {},
				status: -1,
				message: error.message
			};
			logger.error(`Dependency execution failed: ${error.message}`)

			endpoint._status = false;
			resolveEndpoint(endpoint);
		});
});

/**
 * Resolve with the results set in the endpoint
 *
 * @param {object} endpoint endpoint object
 * @param {array} results List of results of API execution
 * @param {function} resolve Promise resolve function
 */
const resolveEndpointResponses = (endpoint, results) => {
	endpoint._result = results.map(endpoint => endpoint._result);
	endpoint._status = results.every(endpoint => !!endpoint._status);
	return endpoint;
};


// TODO: collect and print results
const processEndpoint = async (scenarioVariables, endpoint, scenarioName, collection) => {
	let results = []

	endpoint.scenario = scenarioName
	endpoint.collection = collection
	if (!!endpoint.async && !this.executionOptions.sync && !endpoint.globals) {
		let endpointExecutors = [...(endpoint.repeat || 1)].map(i =>
			getApiExecuterPromise(scenarioVariables, endpoint, i)
		);
		results = await Promise.all(endpointExecutors)

	} else {

		let endpointResolver = Promise.resolve();
		[...(endpoint.repeat || 1)].forEach(i => {
			endpointResolver = endpointResolver.then(result => {
				if (result) results.push(result);
				return getApiExecuterPromise(scenarioVariables, endpoint, i);
			});
		});

		const result = await endpointResolver;
		results.push(result);
	}

	return resolveEndpointResponses(endpoint, results);
}


/**
 * Perform all the tasks needed to run a scenario and endpoint
 *
 * @param {object} scenario The scenario to be executed.
 * @param {object} variables List of global and user variables provided
 * @param {boolean} overrideIgnoreFlag Consider ignore flag in endpoint or not
 */
const performScenarioExecutionSteps = async (scenario, variables, overrideIgnoreFlag = false, isDependency = false) => {
	// Execute the pre scenario scripts
	let preScriptVariables = await executePreScenarioScripts(variables, scenario);
	// Process Generators and global variables
	let globalVariables = await processGeneratorsAndGlobals(preScriptVariables, scenario.generate, isDependency);
	// Execute the post generator scripts
	let postScriptVariables = await executePostGeneratorScripts({ ...preScriptVariables, ...globalVariables }, scenario);
	// Combine the results
	let scenarioVariables = {
		...preScriptVariables,
		...globalVariables,
		...postScriptVariables
	};
	// Take the endpoints that have ignore flag as false and execute them
	let endpointsToBeProcessed = overrideIgnoreFlag
		? scenario.endpoints
		: scenario.endpoints.filter(endpoint => !endpoint.ignore);

	await Promise.all(endpointsToBeProcessed
		.map(endpoint => processEndpoint(scenarioVariables, endpoint, scenario.name, scenario.collection)));

	return {
		scenarioResponse: scenario,
		scenarioVariables
	};

};


/**
 * The start point of execution for each scenario
 * Tasks:
 *  1. Log the scenario start
 *  2. Get the global variables defined in config and those passed by user
 *  3. Execute generator/pre-scenario scripts
 *  4. Filter endpoints to be executed and execute them
 *  5. Collect results and publish scenario results
 *  6. Execute post scenario scripts
 *
 * @param {object} scenario The scenario to be executed.
 * @param {string} jobId The job execution id
 * @param {object} variables List of global and user variables provided
 * @returns {Promise} Execution status
 */
const processScenario = async (scenario, jobId, variables) => {
	const scenarioExecutionStartTime = Date.now();
	logScenarioStart(scenario);

	const { scenarioResponse, scenarioVariables } = await performScenarioExecutionSteps(scenario, variables);

	let scenarioExecutionEndTime = Date.now();
	// Summarize the results
	let scenarioResult = {
		...scenarioResponse,
		_result: {
			scenarioVariables,
			status: scenarioResponse.endpoints.filter(e => !!e).every(endpoint => endpoint._status)
				? executionStatus.SUCESS
				: executionStatus.FAIL,
			timing: {
				start: scenarioExecutionStartTime,
				end: scenarioExecutionEndTime,
				delta: scenarioExecutionEndTime - scenarioExecutionStartTime
			}
		}
	};

	// Do post scenario tasks
	await Promise.all([
		executePostScenarioScripts(scenarioVariables, scenarioResult),
		logHandler.logScenarioEnd(logger, scenarioResult)
	])

	return {
		...scenarioResult,
		status: scenarioResult._result.status,
		_status: scenarioResult._result.status === executionStatus.SUCESS
	};
};


/**
 * Mark the scenario as ignored
 *
 * @param {object} scenario The scenario with ignore flag set as true
 * @returns {object} scenario with result set
 */
const markAsIgnored = scenario => {
	scenario._result = {
		variables: {},
		status: executionStatus.ERROR,
		message: 'Scenario ignored'
	};

	return scenario;
};


/**
 * Get the list of globally available variables
 *
 * @param {string} jobId Job execution id
 * @returns {object} containing all global variables
 */
const loadGlobalVariables = jobId => {
	return {
		jobId,
		job_id: jobId,

		timestamp_n: () => new Date().getTime(),
		timestamp: () => new Date().toISOString(),
		time: () => new Date().toLocaleTimeString(),
		time_ms: () => new Date().getMilliseconds(),
		time_sec: () => new Date().getSeconds(),
		time_min: () => new Date().getMinutes(),
		time_hours: () => new Date().getHours(),

		date: () => new Date().toLocaleDateString(),
		date_date: () => new Date().getDate(),
		date_month: () => new Date().getMonth(),
		date_month_name_long: () => new Date().toLocaleString('default', { month: 'long' }),
		date_month_name: () => new Date().toLocaleString('default', { month: 'short' }),
		date_year: () => new Date().getFullYear(),
		...userConfig.env_vars
	};


};


/**
 * Generate Lorem texts upto a given length
 *
 * @param {integer} limit number of characters in the lorem text
 */
const loremGenerator = limit => {
	let generatedString = '';

	if (limit < 0) generatedString = '';
	if (limit < 10) generatedString = [...limit].join();
	else {
		while (limit > 0) {
			let tempSentence = lorem.generateSentences(10)
				.split('"').join('\'')
				.split('{').join('\'')
				.split('}').join('\'')
				.split('[').join('\'')
				.split(']').join('\'')

			if (limit - tempSentence.length > 0) generatedString += tempSentence;
			else generatedString += tempSentence.slice(0, limit - generatedString.length - 1);

			limit -= tempSentence.length;
		}
	}

	return generatedString + '.';
};


/**
 * Set the available system details
 * Combines the systems obtained from config file with the sytems that user provided for the execution
 *
 * @param {string} systems User provided system variables
 * @param {string} cred User provided system details in base64 format
 */
const setSystemDetails = (systems, cred) => {
	let availableSystemDetails = utils.getAvailableSystemsFromConfig();
	let availableSystems = availableSystemDetails.systems;
	availableSystems.default = availableSystems[availableSystemDetails.default];
	if (!!systems && systems.length > 3) {
		for (const userProvidedSystem of systems.split(',')) {
			let sysInfo = userProvidedSystem.split('=');
			if (sysInfo.length < 2 || !Object.keys(availableSystems).includes(sysInfo[1])) {
				logger.error('Invalid user provided system');
				exit(1);
			}
			availableSystems[sysInfo[0]] = availableSystems[sysInfo[1]];
		}
	}
	if (!!cred && cred.length > 3) {
		let decodedCredentials = new Buffer(cred, 'base64').toString('ascii');
		let systemDetails = JSON.parse(decodedCredentials)
		availableSystems.user_provided = systemDetails
		availableSystems.default = systemDetails
		availableSystemDetails.default = 'user_provided'
	}
	setAvailableSystems(availableSystems);
};


/**
 * Parses the user provided variables
 *
 * @param {string} variables User provided variables
 * @returns {object} parsed variables object
 */
const processUserVariables = variables => {
	let parsedVariables = {};

	if (variables) {
		for (const userProvidedVariable of variables.split(',')) {
			let varInfo = userProvidedVariable.split('=');
			if (varInfo.length < 2) {
				logger.error('Invalid user provided variables');
				exit(1);
			}
			parsedVariables[varInfo[0]] = replacePlaceholderInString(varInfo[1])
		}
	} else {
		variables = {};
	}

	return parsedVariables;
};


/**
 * Save the scenario list for a file
 * 
 * @param {string} jobId Job Id
 * @param {object} scenarios list of all scenarios
 */
const savePreExecutionData = async (jobId, scenarios) => {
	let jobDirPath = join(vibPath.jobs, jobId), latestDirPath = join(vibPath.jobs, 'latest')

	let scenariosJson = JSON.stringify(scenarios, null, 2)

	if (!existsSync(vibPath.jobs)) await mkdir(vibPath.jobs)
	if (!existsSync(jobDirPath)) await mkdir(jobDirPath)
	if (!existsSync(latestDirPath)) await mkdir(latestDirPath)

	await writeFile(join(jobDirPath, 'scenarios.json'), scenariosJson)
	await writeFile(join(latestDirPath, 'scenarios.json'), scenariosJson)
}

/**
 * Save the scenario results to a file
 * 
 * @param {string} jobId Job Id
 * @param {object} scenarios list of all scenarios
 */
const savePostExecutionData = async (jobId, scenarios) => {
	let jobDirPath = join(vibPath.jobs, jobId), latestDirPath = join(vibPath.jobs, 'latest')

	let scenariosJson = JSON.stringify(scenarios, null, 2)

	if (!existsSync(vibPath.jobs)) await mkdir(vibPath.jobs)
	if (!existsSync(jobDirPath)) await mkdir(jobDirPath)
	if (!existsSync(latestDirPath)) await mkdir(latestDirPath)

	await writeFile(join(jobDirPath, 'scenarios_result.json'), scenariosJson)
	await writeFile(join(latestDirPath, 'scenarios_result.json'), scenariosJson)
}


/**
 * Trigger point for all scenario executions
 *
 * @param {array} scenarios List of scenarios
 * @returns {boolean} Execution status
 */
const runTests = async (scenarios, executionOptions) => {
	const jobId = Date.now().toString();
	logHandler.logExecutionStart(logger, jobId, scenarios, utils.getParallelExecutorLimit());
	savePreExecutionData(jobId, scenarios)
	setSystemDetails(executionOptions.systems, executionOptions.cred);
	this.executionOptions = executionOptions;

	this.scenarioCache = createScenarioCache(scenarios);

	let globalVariables = loadGlobalVariables(jobId);
	let userVariables = processUserVariables(executionOptions.variables);

	// Select the scenarios that don't have an ignore flag
	let scenariosToExecute = scenarios.filter(scenario => !!scenario && !scenario.ignore);
	scenarios.filter(scenario => !!scenario && !!scenario.ignore)
		.map(scenario => markAsIgnored(scenario));

	// Run the tests
	const scenarioResults = await Promise.all(scenariosToExecute.map(scenario =>
		processScenario(scenario, jobId, { ...globalVariables, ...userVariables })
	));

	savePostExecutionData(jobId, scenarios)
	await Promise.all(scenarioResults
		.map(result => logHandler.processScenarioResult(jobId, result, executionOptions.report, vibPath.jobs)))
	logHandler.logExecutionEnd(logger, jobId, scenarioResults);
	return scenarioResults;
};


module.exports = {
	runTests
};

