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
const { processAssertionsInResponse } = require('./asserthandler')
const { initializeDatabase, updateApiCache, findApiDetailsFromCache, insertApiExecutionData,
	insertJobHistory, insertApiResponseCache, findApiResponseFromCache } = require('./dbhandler')
const { vibPath, executionStatus, scriptTypes, loremGeneratorConfig, userConfig, dataSets } = require('./constants');
const { callApi, setAvailableSystems } = require('./servicehandler');


let ACTIVE_PARALLEL_EXECUTORS = 0, lorem = new LoremIpsum(loremGeneratorConfig);
let totalEndpointsExecuted = 0, totalEndpointsSuccessful = 0, db


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
 * Execute the api endpoint when executors are available
 *
 * @param {object} api The api to be executed
 * callAPI response:
 * { timing, response, status, contentType }
 */
const executeAPI = async (endpoint, endpointVaribles) => {
	let expectedStatus = 200;
	if (!!endpoint.expect && !!endpoint.expect.status) expectedStatus = endpoint.expect.status;

	if (endpoint.cache) {
		let cachedResponse = await loadEndpointFromCache(endpoint, endpointVaribles, expectedStatus)
		if (cachedResponse) return cachedResponse
	}
	let api = replaceVariablesInApi(endpoint, endpointVaribles);
	await waitForExecutors()
	logHandler.printApiExecutionStart(logger, api, endpointVaribles)
	let endpointResponse = { ...endpoint }

	try {
		endpointResponse = await callApi(api.url, api.method, api.payload, api.system, api.language, api.headers)
	} catch ({ response, error }) {
		endpointResponse._result = { response: {}, status: response && response.statusCode, message: error }
		endpointResponse._status = false
		logger.error(`Executing api ${endpoint.name} failed: ${red(error)}`)
	}

	let assertionResults = []
	if (endpoint.dependencyLevel === 0 && endpointResponse.status === expectedStatus) {
		assertionResults = await processAssertionsInResponse(endpoint, endpointResponse, replacePlaceholderInString, endpointVaribles)
	}

	// eslint-disable-next-line no-unused-vars
	let { auth, ...responseDataWithoutAuth } = endpointResponse
	api = {
		...api,
		fullUrl: endpointResponse.fullUrl,
		_expect: assertionResults,
		_result: responseDataWithoutAuth,
		// eslint-disable-next-line no-unused-vars
		_variables: { ...Object.fromEntries(Object.entries(endpointVaribles).filter(([key, value]) => typeof value !== 'function')) },
		jobId: endpointVaribles.jobId,
		_status: endpointResponse.status === expectedStatus && assertionResults.every(expect => expect.result),
		_id: totalEndpointsExecuted * 10 ** 14 + +endpointVaribles.jobId
	}

	totalEndpointsExecuted += 1
	totalEndpointsSuccessful += endpointResponse.status === expectedStatus && assertionResults.every(expect => expect.result) ? 1 : 0
	ACTIVE_PARALLEL_EXECUTORS -= 1;
	if (endpoint.cache) {
		logger.info(`Caching response of ${api.collection}.${api.scenario}.${api.name}`)
		await insertApiResponseCache(db, { ...api, _expect: assertionResults, _result: endpointResponse })
	}

	await Promise.all([
		logHandler.printApiExecutionEnd(logger, api),
		insertApiExecutionData(db, api)
	])
	return api;
}


/**
 * Load the endpoint result from cache
 * 
 * @param {object} endpoint The Endpoint object
 * @param {object} endpointVaribles Variables for executing the api
 * @param {integer} expectedStatus Expected status of the endpoint
 */
const loadEndpointFromCache = async (endpoint, endpointVaribles, expectedStatus) => {
	try {
		logger.info(`Loading response of ${endpoint.collection}.${endpoint.scenario}.${endpoint.name} from cache`)
		let { _result: cachedResponse, _expect } = await findApiResponseFromCache(db, endpoint.collection, endpoint.scenario, endpoint.name)
		endpoint = {
			...endpoint,
			_expect,
			_result: cachedResponse,
			_variables: endpointVaribles,
			jobId: endpointVaribles.jobId,
			_status: cachedResponse.status === expectedStatus,
			_id: totalEndpointsExecuted * (10 ** 14) + +endpointVaribles.jobId
		}

		totalEndpointsExecuted += 1
		totalEndpointsSuccessful += cachedResponse.status === expectedStatus ? 1 : 0
		ACTIVE_PARALLEL_EXECUTORS -= 1;
		logHandler.printApiExecutionEnd(logger, endpoint)
		return endpoint;
	} catch (error) {
		logger.info(`Could not fetch ${endpoint.name} from cache: ${error ? error : 'not found'}`)
		return
	}
}

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
	try {
		if (!!globals && typeof (globals) === 'object') {
			for (let globalVar of Object.keys(globals)) {
				if (typeof (globals[globalVar]) === 'object' && !isDependency) {
					globals[globalVar].variable = globalVar

					let dependencyExecutionResult = await loadDependendentEndpoint({}, globals[globalVar], { ...variables })
					// eslint-disable-next-line require-atomic-updates
					variables[globalVar] = dependencyExecutionResult[globalVar]
				} else if (typeof (globals[globalVar]) === 'string') {
					variables[globalVar] = replacePlaceholderInString(globals[globalVar], variables)
				}
			}
		}
	} catch (error) {
		logger.error('Could not execute globals and generators. Scenario will be skipped.')
		throw (error)
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
			logger.error(`Error executing api [${collection}, ${scenario}, ${api}] from ${parentScenario}: ${error}`, error);
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
const executePostScenarioScripts = async (variables, scenario) => {
	if (!!scenario.scripts && !!scenario.scripts.post_scenario) {
		utils.executeScript(
			scenario.scripts.post_scenario,
			customApiExecutor(variables, scenario),
			variables,
			scenario.name,
			scriptTypes.postScenario
		);
	}
	return variables;
};

/**
 * Execute the custom js script after scenario globals and generator execution ends
 *
 * @param {object} variables Variables to be used for executing the script
 * @param {object} scenario scenaio from which the api is executed.
 */
const executePostGeneratorScripts = async (variables, scenario) => {
	if (!!scenario.scripts && !!scenario.scripts.post_globals) {
		utils.executeScript(
			scenario.scripts.post_globals,
			customApiExecutor(variables, scenario),
			variables,
			scenario.name,
			scriptTypes.postGlobal
		);
	}
	return variables;
}

/**
 * Replace Dataset texts in the variables
 * 
 * @param {string} value The string in which dataset is to be replaced
 */
const replaceDataSetPlaceHolders = value => {
	if (value.includes('{dataset.')) {
		for (const name of dataSets.names) {
			if (value.includes('{dataset.' + name)) {
				let length = dataSets.data[name].length
				let finalString = ''
				let occurences = value.split(`{dataset.${name}}`)
				let numOfOccurences = occurences.length
				for (let occurenceIndex = 0; occurenceIndex < numOfOccurences - 1; occurenceIndex++) {
					let index = Math.floor(Math.random() * Math.floor(length))
					finalString += occurences[occurenceIndex] + dataSets.data[name][index]
				}
				finalString += occurences[numOfOccurences - 1]
				value = finalString
				// value = value.split(`{dataset.${name}}`)
				// 	.join(`${dataSets.data[name][index]}`)
			}
		}
	}
	return value
}


/**
 * Escape regex chars in string before sending it to generate new string
 * If the string is actually and object, then useRegex will be false as it should not be used to replace the characters
 * 
 * @param {boolean} useRegex Use regex generator ?
 * @param {string} value String to be replaced
 */
const escapeRegexCharsInReplacedVariable = (useRegex, value) => {
	return useRegex ? value.split('[').join('\\[')
		.split(']').join('\\]')
		.split('{').join('\\{')
		.split('(').join('\\(')
		.split(')').join('\\)')
		.split('.').join('\\.') : value
}


/**
 * Replace the varibles that contain the dot notation
 * for example 	`{variable.abc}`
 * 
 * @param {string} objectToParse The string from which varibles are to be replaced
 * @param {array} stringMatch variables matching the dot notation
 * @param {object} variableValue value for the variable
 */
const replacePlaceholderWithDotNotation = (objectToParse, stringMatch, variableValue, useRegex) => {
	for (let match of stringMatch) {
		match = match.split('{').join('').split('}').join('')
		let path = match.split('.')
		path.shift()

		let parsedValue = parseResponseVariableFromPath(variableValue, path.join('.'))

		let isValueAnObject = typeof parsedValue === 'object'
		if (objectToParse.includes(`"{${match}}"`)) {
			objectToParse = objectToParse
				.split(isValueAnObject ? `"{${match}}"` : `{${match}}`)
				.join(`${isValueAnObject ? escapeRegexCharsInReplacedVariable(useRegex, JSON.stringify(parsedValue)) : parsedValue}`)
		} else if (objectToParse === `{${match}}`) {
			objectToParse = isValueAnObject ? escapeRegexCharsInReplacedVariable(useRegex, JSON.stringify(parsedValue)) : parsedValue
		} else {
			objectToParse = objectToParse
				.split(`{${match}}`)
				.join(`${isValueAnObject ? escapeRegexCharsInReplacedVariable(useRegex, JSON.stringify(parsedValue)) : parsedValue}`)
		}
	}
	return objectToParse
}


/**
 * Replace the placeholders when the string from which they have to be replaced is a JSON
 * 
 * @param {string} objectToParse The string with the variables to be parsed and replaced
 * @param {string} variableName variable to replace
 * @param {any} variableValue replacement value
 * @param {boolean} isObjectToParseAJSON typeof the object to be parsed 
 */
const replacePlaceholderWhenValueIsAnObject = (objectToParse, variableName, variableValue, useRegex) => {
	let stringMatch = objectToParse.match(new RegExp(`\\{${variableName}\\.[\\.a-zA-Z0-9_]*\\}`, 'gm'))

	if (!!stringMatch && stringMatch.length > 0) {
		objectToParse = replacePlaceholderWithDotNotation(objectToParse, stringMatch, variableValue, useRegex)
	} else if (objectToParse === `{${variableName}}`) {
		objectToParse = JSON.stringify(variableValue)
	} else if (objectToParse.includes(`"{${variableName}}"`)) {
		objectToParse = objectToParse
			.split(`"{${variableName}}"`)
			.join(`${JSON.stringify(variableValue)}`)
	} else if (objectToParse.includes(`{${variableName}}`)) {
		objectToParse = objectToParse
			.split(`{${variableName}}`)
			.join(`${JSON.stringify(variableValue)}`)
	}

	return objectToParse
}


/**
 * Replace the available placeholders with the value of the corresponding variables
 *
 * @param {any} objectToBeParsed A String/Object that contains placeholder variables that needs to be replaced
 * @param {object} variables Available variables
 */
const replacePlaceholderInString = (objectToBeParsed, variables, useRegex = true) => {
	let stringToBeReplaced = objectToBeParsed, isInputAnObject = typeof objectToBeParsed === 'object'
	if (typeof stringToBeReplaced === 'string' || typeof stringToBeReplaced === 'object') {
		if (isInputAnObject) {
			stringToBeReplaced = JSON.stringify(objectToBeParsed);
		}

		for (const variableName of Object.keys(variables)) {
			if (typeof variables[variableName] === 'function') {
				// variables that vibranium provides
				stringToBeReplaced = stringToBeReplaced.split(`{${variableName}}`).join(variables[variableName]());
			} else if (typeof variables[variableName] === 'object') {
				// The variable value is an object
				stringToBeReplaced = replacePlaceholderWhenValueIsAnObject(stringToBeReplaced, variableName,
					variables[variableName], useRegex = false)
			} else if (stringToBeReplaced.includes(`{${variableName}}`)) {
				stringToBeReplaced = stringToBeReplaced
					.split(`{${variableName}}`)
					.join(variables[variableName]);
			}
		}

		stringToBeReplaced = replaceDataSetPlaceHolders(stringToBeReplaced)

		for (const loremMatches of stringToBeReplaced.matchAll('{(lorem_[0-9]+)}')) {
			const loremVariable = loremMatches[1];
			stringToBeReplaced = stringToBeReplaced
				.split(`{${loremVariable}}`)
				.join(loremGenerator(parseInt(loremVariable.split('_')[1])));
		}

		if (useRegex && !isInputAnObject && stringToBeReplaced !== '{}' && stringToBeReplaced.length < 99) {
			stringToBeReplaced = new RandExp(stringToBeReplaced).gen();
		}
	}

	return isInputAnObject ?
		JSON.parse(stringToBeReplaced) :
		stringToBeReplaced;
}


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

	// escape url specifi characters so that they are not replaced by regex string generator
	['?', '$', '&', '(', ')'].forEach(char =>
		api.url = api.url.split(char).join('\\' + char))

	api.url = replacePlaceholderInString(api.url, variables);
	api.payload = replacePlaceholderInString(api.payload, variables);

	return api;
};


/**
 * Convert list of scenarios to cache
 *
 * @param {array} scenarios List of all scenarios
 */
const createScenarioCache = async (db, scenariosToAdd) => {
	if (!!scenariosToAdd && scenariosToAdd.length > 0) {
		await Promise.all(scenariosToAdd.map(sc => {
			let endpointsLength = sc.endpoints.length, endpoints = [];
			for (let endpointIndex = 0; endpointIndex < endpointsLength; endpointIndex++) {
				endpoints.push({
					scenarioData: {
						generate: sc.generate,
						scripts: sc.scripts,
						scenario: sc.name,
						collection: sc.collection,
						fileName: sc.file, // path name of scenario
						scenarioFile: sc.scenarioFile, // scenario file name without path and extension
					},
					...sc.endpoints[endpointIndex]
				})
			}
			return updateApiCache(db, endpoints)
		}))
	}
}


/**
 * Search for the api in the cache and if not found, find the file in local and update cache
 *
 * @param {string} collection Collection name
 * @param {string} scenario Scenario name
 * @param {string} api Api name
 */
const searchForEndpointInCache = async (collection, scenario, api) => {
	try {
		let result = await findApiDetailsFromCache(db, collection, scenario, api)
		return {
			scenario: {
				...result.scenarioData,
				endpoints: [result]
			},
			api: result
		}

	} catch (error) {
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
	}
}


/**
 * Parse the endpoint response object and get the element that is availabe in the given path 
 * to get value for the variable
 * 
 * @param {array} endpointResult Result of the execution
 * @param {string} dependencyPath Path to the key in the response tha needs to be parsed and stored as a variable
 */
const parseResponseVariableFromPath = (endpointResult, dependencyPath) => {
	let parsedResponse = endpointResult;
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
			else if (key.toUpperCase().startsWith('ANY_') && !isNaN(key.split('_')[1])) {
				let numberOfItems = parseInt(key.split('_')[1])
				if (numberOfItems > Object.values(parsedResponse).length) numberOfItems = Object.values(parsedResponse).length

				parsedResponse = utils.shuffleArray([...numberOfItems]
					.map(key => parsedResponse[Math.abs(parseInt(key))]))
			}

			else if (key.toLocaleUpperCase() === 'ALL') {
				++index
				parsedResponse = Object.values(parsedResponse).map(r => r[path[index]])
			}

			else if (key.toLowerCase() === 'length' && !Object.keys(parsedResponse).includes(key)) {
				parsedResponse = Object.values(parsedResponse).length
			}

			else if (key.toLowerCase() === 'keys' && !Object.keys(parsedResponse).includes(key)) {
				parsedResponse = Object.keys(parsedResponse)
			}

			else if (key.toLowerCase() === 'values' && !Object.keys(parsedResponse).includes(key)) {
				parsedResponse = Object.values(parsedResponse)
			}

			else if (!isNaN(key)) {
				let responseLength = Object.values(parsedResponse).length
				if (Math.abs(parseInt(key)) >= responseLength) key = responseLength - 1
				else key = Math.abs(parseInt(key))
				parsedResponse = parsedResponse[key]
			}

			else if (Object.keys(parsedResponse).includes(key)) {
				parsedResponse = parsedResponse[key]
			}

			else {
				logger.error(`Could not find key ${yellow(key)} in ${yellow(typeof (parsedResponse) === 'object' ? JSON.stringify(parsedResponse) : parsedResponse)}. Setting value to ${red('undefined')}`)
				return undefined
			}
		}
		logger.debug(`Parsed ${yellow(path.join('.'))} as ${green(typeof (parsedResponse) === 'object' ? JSON.stringify(parsedResponse) : parsedResponse)}`)
	} catch (error) {
		logger.error(`Could not parse ${yellow(path.join('.'))} from ${green(typeof (parsedResponse) === 'object' ? JSON.stringify(parsedResponse) : parsedResponse)}`, error)
	}


	return parsedResponse;
}


/**
 * Get the endpoint name as collectionName.scenarioName.endpointName
 * 
 * @param {string} collection Collection name
 * @param {string } scenario Scenario Name
 * @param {string} endpoint Endpoint name
 */
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
	let searchResult = await searchForEndpointInCache(dependency.collection || endpoint.collection, dependency.scenario || endpoint.scenario, dependency.api);
	let dependencyVariables = !!dependency.variables && typeof (dependency.variables) === 'object' ? { ...endpointVariables, ...dependency.variables } : endpointVariables

	if (searchResult === undefined || !searchResult.scenario || !searchResult.api) {
		throw { message: `Endpoint ${dependency.collection}.${dependency.scenario}.${dependency.api} not found` };
	}
	searchResult = JSON.parse(JSON.stringify(searchResult))
	searchResult.scenario.endpoints[0].dependencyLevel = endpoint.dependencyLevel + 1

	if (endpoint.name) {
		logger.info(`Executing dependency ${getFormattedEndpointName(dependency.collection, dependency.scenario, dependency.api)} ` +
			`for endpoint ${getFormattedEndpointName(endpoint.collection, endpoint.scenario, endpoint.name)}`)
	} else {
		logger.info(`Executing dependency ${getFormattedEndpointName(dependency.collection, dependency.scenario, dependency.api)} for globals`)
	}

	// filter dependencies whose vales have been passed on as variables by removing them from the endpoint
	if (!!dependency.variables && !!searchResult.scenario.endpoints[0].dependencies &&
		searchResult.scenario.endpoints[0].dependencies.length > 0) {
		let filteredDependencies = []
		for (const dep of searchResult.scenario.endpoints[0].dependencies) {
			if (!!dependency.variables && typeof (dep.variable) === 'string' &&
				!Object.keys(dependency.variables).includes(dep.variable)) {
				filteredDependencies.push(dep)
			}
		}
		searchResult.scenario.endpoints[0].dependencies = filteredDependencies
	}
	if (!!dependency.repeat && dependency.repeat > 0) searchResult.scenario.endpoints[0].repeat = dependency.repeat
	searchResult.scenario.endpoints[0].variables = { ...searchResult.scenario.endpoints[0].variables, ...dependencyVariables }
	if (dependency.cache !== undefined && typeof dependency.cache === 'boolean') searchResult.scenario.endpoints[0].cache = dependency.cache

	let response = await performScenarioExecutionSteps(searchResult.scenario, dependencyVariables, true, true)
	const scenarioResponse = response.scenarioResponse;
	// eslint-disable-next-line require-atomic-updates
	dependency._result = scenarioResponse.endpoints[0]

	if (scenarioResponse.endpoints.filter(endpoint => !endpoint._status).length > 0) {
		logger.error(`Executing dependency ${getFormattedEndpointName(dependency.collection, dependency.scenario, dependency.api)} : ${red('FAIL')}`)
		throw { message: `Endpoint ${dependency.collection}.${dependency.scenario}.${dependency.api} execution failed` };
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
			logger.error(`Dependency execution failed: ${error.message}`, error)

			endpoint._status = false;
			resolveEndpoint(endpoint);
		});
})


/**
 * Resolve with the results set in the endpoint
 *
 * @param {object} endpoint endpoint object
 * @param {array} results List of results of API execution
 * @param {function} resolve Promise resolve function
 */
const resolveEndpointResponses = (endpoint, results) => {
	endpoint._result = results.map(endpoint => endpoint._result)
	endpoint._status = results.every(endpoint => !!endpoint._status)
	endpoint._variables = results.map(endpoint => endpoint._variables)
	endpoint._expect = results.length === 1 ? results[0]._expect : results.map(endpoint => endpoint._expect)
	return endpoint;
};


/**
 * execute the endpoint lifecycle
 * 
 * @param {object} scenarioVariables Scenario level variables
 * @param {object} endpoint The Endpoint object
 * @param {string} scenarioName scenario name
 * @param {string} collection collection name
 */
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
	return resolveEndpointResponses(endpoint, results)
}


/**
 * Perform all the tasks needed to run a scenario and endpoint
 *
 * @param {object} scenario The scenario to be executed.
 * @param {object} variables List of global and user variables provided
 * @param {boolean} overrideIgnoreFlag Consider ignore flag in endpoint or not
 */
const performScenarioExecutionSteps = async (scenario, variables, overrideIgnoreFlag = false, isDependency = false) => {
	try {
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
			.map(endpoint => processEndpoint(scenarioVariables, endpoint, scenario.name, scenario.collection)))

		return {
			scenarioResponse: scenario,
			scenarioVariables
		}
	} catch (error) {
		return {
			scenarioResponse: {
				_result: {
					endpoints: scenario.endpoints.map(e => {
						e._result = {}
						e._status = false
						return e
					})
				},
				_error: error,
				_status: false,
				...scenario
			},
			scenarioVariables: {}
		}
	}

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
		_status: scenarioResult._result.status === executionStatus.SUCESS,
		_error: scenarioResponse._error
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
			let tempSentence = lorem.generateSentences(10);

			['"', '{', '}', '[', ']'].forEach(char =>
				tempSentence = tempSentence.split(char).join('\''))

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
const savePostExecutionData = async (jobId, scenarios, executionOptions) => {
	let jobDirPath = join(vibPath.jobs, jobId), latestDirPath = join(vibPath.jobs, 'latest')
	let scenarioExecutionData = {
		scenarios,
		meta: {
			totalEndpointsExecuted,
			totalEndpointsSuccessful,
			jobId,
			status: totalEndpointsExecuted === totalEndpointsSuccessful,
			time: new Date(parseInt(jobId)).toLocaleString(),
			executionOptions
		}
	}
	let scenariosJson = JSON.stringify(scenarioExecutionData, null, 2)

	if (!existsSync(vibPath.jobs)) await mkdir(vibPath.jobs)
	if (!existsSync(jobDirPath)) await mkdir(jobDirPath)
	if (!existsSync(latestDirPath)) await mkdir(latestDirPath)

	let tasks = [
		insertJobHistory(db, scenarioExecutionData.meta),
		writeFile(join(jobDirPath, 'scenarios_result_all.json'), scenariosJson),
		writeFile(join(latestDirPath, 'scenarios_result_all.json'), scenariosJson),
		...scenarios.map(sc => writeFile(join(jobDirPath, `scenarios_result_${sc.id}.json`), JSON.stringify(sc)))
	]
	return await Promise.all(tasks)
}


/**
 * Update the scenario results, log them and then generate reports
 * 
 * @param {string} jobId Job Id
 * @param {object} result Scenario result
 * @param {object} executionOptions Job execution options
 */
const updateScenarioResultsAndSaveReports = async (jobId, result, executionOptions) => {
	result._result = {
		total: result.endpoints && result.endpoints.filter(e => !!e).length,
		success: result.endpoints && result.endpoints.filter(e => e._status).length
	}

	result._status = result.endpoints && result.endpoints.every(e => e._status)
	await logHandler.processScenarioResult(jobId, result, executionOptions.report, vibPath.jobs)
}


/**
 * Trigger point for all scenario executions
 *
 * @param {array} scenarios List of scenarios
 * @returns {boolean} Execution status
 */
const runTests = async (scenarios, executionOptions) => {
	if (scenarios.length === 0) {
		logger.error('No tests found')
		process.exit(1)
	}
	const jobId = Date.now().toString();
	db = await initializeDatabase()
	logHandler.logExecutionStart(logger, jobId, scenarios, utils.getParallelExecutorLimit());
	savePreExecutionData(jobId, scenarios)
	setSystemDetails(executionOptions.systems, executionOptions.cred);
	this.executionOptions = executionOptions;

	this.scenarioCache = createScenarioCache(db, scenarios);

	let globalVariables = loadGlobalVariables(jobId);
	let userVariables = processUserVariables(executionOptions.variables);

	// Select the scenarios that don't have an ignore flag
	let scenariosToExecute = scenarios.filter(scenario => !!scenario && !scenario.ignore);
	scenarios.filter(scenario => !!scenario && !!scenario.ignore)
		.map(scenario => markAsIgnored(scenario));

	// Run the tests
	const scenarioResults = await Promise.all(scenariosToExecute.map(scenario =>
		processScenario(scenario, jobId, { ...globalVariables, ...userVariables })
	))

	await Promise.all([
		logHandler.logExecutionEnd(logger, jobId, scenarioResults, totalEndpointsExecuted, totalEndpointsSuccessful),
		savePostExecutionData(jobId, scenarioResults, executionOptions),
		...scenarioResults.map(result =>
			updateScenarioResultsAndSaveReports(jobId, result, executionOptions))
	])


	return scenarioResults;
};


module.exports = {
	runTests
};

