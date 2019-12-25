const uuid4 = require('uuid/v4')
const process = require('process')
const RandExp = require('randexp');
const { LoremIpsum } = require('lorem-ipsum')

const utils = require('./utils')
const compiler = require('./compiler')
const logHandler = require('./loghandler')
const { executionStatus, scriptTypes } = require('./constants')
const { callApi, setAvailableSystems } = require('./servicehandler')


const MAX_PARALLEL_EXECUTORS = utils.getParallelExecutorLimit(),
    logger = logHandler.moduleLogger('executor')
let ACTIVE_PARALLEL_EXECUTORS = 0,
    scenarioCache = {}
const lorem = new LoremIpsum({
    sentencesPerParagraph: {
        max: 8,
        min: 4
    },
    wordsPerSentence: {
        max: 16,
        min: 4
    }
});


/**
 * Utility method to wait for executors to handle requests.
 * This method limits the number of cuncurrent requests that can be made so that server is not overloaded.
 * The max number of executors is controlled by the MAX_PARALLEL_EXECUTORS variable (default is 10)
 */
const waitForExecutors = () => new Promise(resolve => {
    if (ACTIVE_PARALLEL_EXECUTORS < MAX_PARALLEL_EXECUTORS) {
        ACTIVE_PARALLEL_EXECUTORS++
        resolve()
    } else {
        setTimeout(() => {
            waitForExecutors().then(() => resolve())
        }, 300)
    }
})


const processScenarioResult = result => new Promise(resolve => {
    resolve()
})


// TODO: log scenario timing
/**
 * Log the start of execution for the scenario in the given job id
 * 
 * @param {object} scenario Scenario details
 * @param {string} jobId Job execution Id
 */
const logScenarioStart = (scenario, jobId) => {

}


// TODO: log scenario timing
const logScenarioEnd = (scenario, jobId, variables) => new Promise(resolve => {
    resolve()
})


// TODO: process generators
// TODO: process variables
const processGeneratorsAndGlobals = (variables, scenario) => new Promise(resolve => {
    resolve(variables)
})

/**
 * Execute an api from a script
 * 
 * @param {object} variables Variables to be used for executing
 * @param {string} parentScenario Scenario from whcich the script is executed
 */
const customApiExecutor = (variables, parentScenario) => {
    return async (collection, scenario, api) => {
        try {
            const scenarioList = await compiler.search(collection, scenario, api)
            const executionOptions = {
                ...this.executionOptions,
                variables
            }
            const response = await runTests(scenarioList, executionOptions)
            const results = response[0].endpoints[0]._result.map(res => res.response)
            return results.length == 1 ? results[0] : results
        } catch (error) {
            logger.error(`Error executing api [${collection}, ${scenario}, ${api}] from ${parentScenario}: ${error}`)
            return {}
        }

    }
}


/**
 * Execute the custom js script before scenario execution starts
 * 
 * @param {object} variables Variables to be used for executing the script
 * @param {object} scenario scenaio from which the api is executed.
 */
const executePreScenarioScripts = (variables, scenario) => new Promise(resolve => {
    if (!!scenario.scripts && !!scenario.scripts.pre_scenario) {
        utils.executeScript(scenario.scripts.pre_scenario, customApiExecutor(variables, scenario), variables, scenario.name, scriptTypes.preScenario)
    }
    resolve(variables)
})


/**
 * Execute the custom js script after all dependent endpoints are executed
 * 
 * @param {object} endPointVariables Variables at the endpoint level
 * @param {object} endpoint endpoint details
 */
const executeEndpointPostDependencyScripts = (endPointVariables, endpoint) => {
    if (!!endpoint.scripts && !!endpoint.scripts.post_dependency) {
        utils.executeScript(endpoint.scripts.post_dependency, customApiExecutor(endPointVariables, endpoint.name),
            endPointVariables, endpoint.name, scriptTypes.postDependency)
    }
    return endPointVariables;
}


/**
 * Execute the custom js script before the endpoint execution starts
 * 
 * @param {object} endPointVariables Variables at the endpoint level
 * @param {object} endpoint endpoint details
 */
const executeEndpointPreScripts = (scenarioVariables, endpoint) => {
    if (!!endpoint.scripts && !!endpoint.scripts.pre_endpoint) {
        utils.executeScript(endpoint.scripts.pre_endpoint, customApiExecutor(scenarioVariables, endpoint.name),
            scenarioVariables, endpoint.name, scriptTypes.preApi)
    }
    return scenarioVariables;
}


/**
 * Execute the custom js script after scenario execution ends
 * 
 * @param {object} variables Variables to be used for executing the script
 * @param {object} scenario scenaio from which the api is executed.
 */
const executePostScenarioScripts = (variables, scenario) => new Promise(resolve => {
    if (!!scenario.scripts && !!scenario.scripts.post_scenario) {
        utils.executeScript(scenario.scripts.post_scenario, customApiExecutor(variables, scenario), variables, scenario.name, scriptTypes.postScenario)
    }
    resolve(variables)
})


/**
 * Execute the custom js script after scenario globals and generator execution ends
 * 
 * @param {object} variables Variables to be used for executing the script
 * @param {object} scenario scenaio from which the api is executed.
 */
const executePostGeneratorScripts = (variables, scenario) => new Promise(resolve => {
    if (!!scenario.scripts && !!scenario.scripts.post_global) {
        utils.executeScript(scenario.scripts.post_global, customApiExecutor(variables, scenario), variables, scenario.name, scriptTypes.postGlobal)
    }
    resolve(variables)
})


// TODO: log scenario timing
// TODO: collect and print results
const printScenarioSummary = (scenario, jobId) => new Promise(resolve => {
    resolve()
})


/**
 * Replace the available placeholders with the value of the corresponding variables
 * 
 * @param {any} objectToBeParsed A String/Object that contains placeholder variables that needs to be replaced
 * @param {object} variables Available variables
 */
const replacePlaceholderInString = (objectToBeParsed, variables) => {
    let stringToBeReplaced = objectToBeParsed
    if (typeof stringToBeReplaced === 'string' || typeof stringToBeReplaced === 'object') {
        if (typeof objectToBeParsed === 'object') {
            stringToBeReplaced = JSON.stringify(objectToBeParsed)
        }

        for (const variableName of Object.keys(variables)) {
            if (typeof variables[variableName] === 'function') {
                stringToBeReplaced = stringToBeReplaced.split(`{${variableName}}`).join(variables[variableName]())
            } else if (typeof variables[variableName] === 'object' && stringToBeReplaced === `{${variableName}}`) {
                stringToBeReplaced = variables[variableName]
            } else if (typeof variables[variableName] === 'object' && typeof objectToBeParsed === 'object') {
                stringToBeReplaced = stringToBeReplaced.split(`"{${variableName}}"`).join(JSON.stringify(variables[variableName]))
            } else if (typeof variables[variableName] === 'object') {
                stringToBeReplaced = stringToBeReplaced.split(`{${variableName}}`).join(JSON.stringify(variables[variableName]))
            } else if (stringToBeReplaced.includes(`{${variableName}}`)) {
                stringToBeReplaced = stringToBeReplaced.split(`{${variableName}}`).join(variables[variableName])
            }
        }

        for (const loremMatches of stringToBeReplaced.matchAll('{(lorem_[0-9]+)}')) {
            const loremVariable = loremMatches[1]
            stringToBeReplaced = stringToBeReplaced.split(`{${loremVariable}}`).join(loremGenerator(parseInt(loremVariable.split('_')[1])))
        }
        if (typeof objectToBeParsed === 'string' && objectToBeParsed !== '{}')
            stringToBeReplaced = new RandExp(stringToBeReplaced).gen();
    }

    return typeof objectToBeParsed === 'object' ? JSON.parse(stringToBeReplaced) : stringToBeReplaced
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
            variables[variableAlias] = replacePlaceholderInString(api.variables[variableAlias], variables)
        }
    }

    api.url = replacePlaceholderInString(api.url, variables)
    api.payload = replacePlaceholderInString(api.payload, variables)

    return api
}


/**
 * Execute the api endpoint when executors are available
 * 
 * @param {object} api The api to be executed
 * callAPI response: 
 * { timing, response, status, contentType }
 */
const executeAPI = (endpoint, endpointVaribles) => new Promise(resolve => {
    let api = replaceVariablesInApi(endpoint, endpointVaribles)
    let expectedStatus = 200
    if (!!api.expect && !!api.expect.status) expectedStatus = api.expect.status

    waitForExecutors()
        .then(() => { }) // TODO: log api start
        .then(() => callApi(api.url, api.method, api.payload, api.system, api.language))
        .then(endpointResponse => {
            api._result = endpointResponse
            api._status = endpointResponse.status === expectedStatus,
            api._variables = endpointVaribles
            ACTIVE_PARALLEL_EXECUTORS -= 1
            resolve(api)
        })
})


/**
 * Convert list of scenarios to cache
 * 
 * @param {array} scenarios List of all scenarios
 */
const createScenarioCache = scenarios => {
    scenarios.forEach(scenario => {
        if (!Object.keys(scenarioCache).includes(scenario.collection)) {
            scenarioCache[scenario.collection] = {
                [scenario.name]: scenario
            }
        }
        else if (scenarioCache[scenario.collection][scenario.name]) {
            scenarioCache[scenario.collection][scenario.name].endpoints =
                [...scenarioCache[scenario.collection][scenario.name].endpoints, scenario.enpoints]
        }
        else scenarioCache[scenario.collection][scenario.name] = scenario
    })
}


/**
 * Search for the api in the cache and if not found, find the file in local and update cache
 * 
 * @param {string} collection Collection name
 * @param {string} scenario Scenario name
 * @param {string} api Api name
 */
const searchForEndpointInCache = (collection, scenario, api) => {
    if (scenarioCache[collection]) {
        if (scenarioCache[collection][scenario]) {
            for (const endpoint of scenarioCache[collection][scenario].endpoints) {
                if (endpoint.name === api) {
                    let searchResult = { ...scenarioCache[collection][scenario] }
                    searchResult.endpoints = [endpoint]
                    return {
                        scenario: searchResult,
                        api: endpoint
                    }
                }
            }
        }
    }
    const searchResult = compiler.compile(collection, scenario, api)
    if (searchResult.length > 0) {
        createScenarioCache(searchResult)
        searchResult[0].endpoints = searchResult[0].endpoints.find(endpoint => endpoint.name === api)
        return {
            scenario: searchResult[0],
            api: searchResult[0].endpoints.find(endpoint => endpoint.name === api)
        }
    } else {
        return undefined
    }
}


const parseResponseVariableFromPath = (endpointResult, dependencyPath) => {
    return endpointResult.map(e => e.hello)
}


const loadDependendentEndpoint = (endpoint, dependency, endpointVariables) => new Promise((resolve, reject) => {
    const searchResult = searchForEndpointInCache(dependency.collection, dependency.scenario, dependency.api)
    if (searchResult === undefined) {
        reject({ message: `Endpoint ${dependency.collection}.${dependency.scenario}.${dependency.api} not found` })
    }

    performScenarioExecutionSteps(searchResult.scenario, endpointVariables, true)
        .then(response => {
            const scenarioResponse = response.scenarioResponse

            if ((scenarioResponse.endpoints.filter(endpoint => !endpoint._status).length) > 0) {
                reject({ message: `Endpoint ${dependency.collection}.${dependency.scenario}.${dependency.api} execution failed` })
            }
            let endpointResults = scenarioResponse.endpoints.find(_ => _.name === dependency.api)._result, endpointResponse
            if (endpointResults.length == 1) {
                endpointResponse = endpointResults[0].response
            } else {
                endpointResponse = endpointResults.map(res => res.response)
            }

            let parsedValue = parseResponseVariableFromPath(endpointResponse, dependency.path)
            endpointVariables[dependency.variable] = parsedValue

            resolve(endpointVariables)
        })
})


/**
 * Sets the repeat index as a variable available in the endpoint
 * 
 * @param {object} endpoint Endpoint object
 * @param {integer} index repeat index
 * @returns {object} endpoint eith the variable set
 */
const setRangeIndexForEndpoint = (endpoint, index) => {
    let variables = endpoint.variables ? endpoint.variables : {}
    variables['_range_index'] = index + 1
    endpoint.variables = variables
    return endpoint
}


/**
 * Return the promise that handles the api execution
 * 
 * @param {object} scenarioVariables variables set at the scenario level
 * @param {object} endpoint endpoint object
 * @param {integer} repeatIndex index if the endpoint is reunning in repeat
 */
const getApiExecuterPromise = (scenarioVariables, endpoint, repeatIndex) => new Promise(resolveEndpoint => {
    let endPointVariables = executeEndpointPreScripts(scenarioVariables, endpoint)
    let dependencyResolver = Promise.resolve()

    endpoint = JSON.parse(JSON.stringify(setRangeIndexForEndpoint(endpoint, repeatIndex)))

    if (!!endpoint.dependencies && endpoint.dependencies.length > 0) {
        endpoint.dependencies.forEach(dependency => {
            dependencyResolver = dependencyResolver.then(response => {
                if (response) endPointVariables = { ...endPointVariables, ...response }
                return loadDependendentEndpoint(endpoint, dependency, endPointVariables)
            })
        });
    }

    dependencyResolver
        .then(response => {
            if (response) endPointVariables = { ...endPointVariables, ...response }
            endPointVariables = executeEndpointPostDependencyScripts(endPointVariables, endpoint)
            //TODO depenedcy start
            executeAPI(endpoint, endPointVariables)
                .then(result => resolveEndpoint(result));
        })
        .catch(error => {
            endpoint._result = {
                response: {},
                status: -1,
                message: error.message
            }
            endpoint._status = false
            resolveEndpoint(endpoint)
        })
})


/**
 * Resolve with the results set in the endpoint
 *  
 * @param {object} endpoint endpoint object
 * @param {array} results List of results of API execution
 * @param {function} resolve Promise resolve function
 */
const resolveEndpointResponses = (endpoint, results, resolve) => {
    endpoint._result = results.map(endpoint => endpoint._result);
    endpoint._status = results.every(endpoint => !!endpoint._status)
    resolve(endpoint)
}


// TODO: collect and print results
const processEndpoint = (scenarioVariables, endpoint) => new Promise(resolve => {
    if (!endpoint.async) {
        let endpointExecutors = Array.from(Array(endpoint.repeat ? endpoint.repeat : 1).keys())
            .map(i => getApiExecuterPromise(scenarioVariables, endpoint, i))

        Promise.all(endpointExecutors)
            .then(results => resolveEndpointResponses(endpoint, results, resolve))

    } else {
        let endpointResolver = Promise.resolve(), results = [];

        Array.from(Array(endpoint.repeat ? endpoint.repeat : 1).keys())
            .forEach((_, i) => {
                endpointResolver = endpointResolver.then(result => {
                    if (result) results.push(result)
                    return getApiExecuterPromise(scenarioVariables, endpoint, i)
                })
            })

        endpointResolver.then(result => {
            results.push(result)
            endpoint._result = results.map(endpoint => endpoint._result);
            endpoint._status = results.every(endpoint => !!endpoint._status)
            resolve(endpoint)
        })
    }
})


/**
 * Perform all the tasks needed to run a scenario and endpoint
 * 
 * @param {object} scenario The scenario to be executed.
 * @param {object} variables List of global and user variables provided
 * @param {boolean} overrideIgnoreFlag Consider ignore flag in endpoint or not
 */
const performScenarioExecutionSteps = async (scenario, variables, overrideIgnoreFlag = false) => {
    // Process Generators and global variables
    let preScriptVariables = await executePreScenarioScripts(variables, scenario)
    // Process Generators and global variables
    let globalVariables = await processGeneratorsAndGlobals(preScriptVariables, scenario)
    // Execute the pre scenario scripts
    let postScriptVariables = await executePostGeneratorScripts({ ...preScriptVariables, ...globalVariables }, scenario)
    // Combine the results
    let scenarioVariables = { ...preScriptVariables, ...globalVariables, ...postScriptVariables }

    // Take the endpoints that have ignore flag as false and execute them
    let endpointsToBeProcessed = overrideIgnoreFlag ? scenario.endpoints : scenario.endpoints.filter(endpoint => !endpoint.ignore)
    await Promise.all(endpointsToBeProcessed
        .map(endpoint => processEndpoint(scenarioVariables, endpoint)))

    return {
        scenarioResponse: scenario,
        scenarioVariables
    }
}


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
    const scenarioExecutionStartTime = new Date().getTime()
    logScenarioStart(scenario, jobId)

    const { scenarioResponse, scenarioVariables } = await performScenarioExecutionSteps(scenario, variables)

    let scenarioExecutionEndTime = new Date().getTime()
    // Summarize the results
    let scenarioResult = {
        ...scenarioResponse,
        _result: {
            scenarioVariables,
            status: scenarioResponse.endpoints.every(endpoint => endpoint._status) ? executionStatus.SUCESS : executionStatus.FAIL,
            timing: {
                start: scenarioExecutionStartTime,
                end: scenarioExecutionEndTime,
                delta: scenarioExecutionEndTime - scenarioExecutionStartTime
            }
        }
    }

    // Do post scenario tasks
    await Promise.all([
        executePostScenarioScripts(scenarioVariables, scenarioResult),
        logScenarioEnd(scenarioResult, jobId, scenarioVariables),
        printScenarioSummary(scenarioResult, jobId)
    ])

    return {
        ...scenarioResult,
        status: scenarioResult._result.status,
        _status: scenarioResult._result.status === executionStatus.SUCESS
    }

}


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
    }
    return scenario
}


/**
 * Get the list of globally available variables
 * TODO: Add variables from old code
 * 
 * @param {string} jobId Job execution id
 * @returns {object} containing all global variables
 */
const loadGlobalVariables = (jobId) => {
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

        short_des: loremGenerator(200),
        long_des: loremGenerator(500)
    }
}


/**
 * Generate Lorem texts upto a given length
 * 
 * @param {integer} limit number of characters in the lorem text
 */
const loremGenerator = limit => {
    let generatedString = ''

    if (limit < 0) generatedString = ''
    if (limit < 10) generatedString = Array.from(Array(limit).keys()).join()

    else {
        while (limit > 0) {
            let tempSentence = lorem.generateSentences(10).split('"').join('\'')

            if (limit - tempSentence.length > 0) generatedString += tempSentence
            else generatedString += tempSentence.slice(0, limit - generatedString.length - 1)

            limit -= tempSentence.length
        }
    }

    return generatedString + '.'
}


/**
 * Set the available system details
 * Combines the systems obtained from config file with the sytems that user provided for the execution
 * 
 * @param {string} systems User provided system variables
 */
const setSystemDetails = systems => {
    let availableSystemDetails = utils.getAvailableSystemsFromConfig()
    let availableSystems = availableSystemDetails.systems
    availableSystems.default = availableSystems[availableSystemDetails.default]

    if (systems)
        for (const userProvidedSystem of systems.split(',')) {
            let sysInfo = userProvidedSystem.split('=')
            if (sysInfo.length < 2 || !Object.keys(availableSystems).includes(sysInfo[1])) {
                logger.error('Invalid user provided system')
                process.exit(1)
            }
            availableSystems[sysInfo[0]] = availableSystems[sysInfo[1]]
        }
    setAvailableSystems(availableSystems)
}


/**
 * Parses the user provided variables
 * 
 * @param {string} variables User provided variables
 * @returns {object} parsed variables object 
 */
const processUserVariables = variables => {
    let parsedVariables = {}
    if (variables) {
        for (const userProvidedVariable of variables.split(',')) {
            let varInfo = userProvidedVariable.split('=')
            if (varInfo.length < 2) {
                logger.error('Invalid user provided variables')
                process.exit(1)
            }
            parsedVariables[varInfo[0]] = varInfo[1]
        }
    } else {
        variables = {}
    }

    return variables
}


/**
 * Trigger point for all scenario executions
 * 
 * @param {array} scenarios List of scenarios
 * @returns {boolean} Execution status
 */
const runTests = async (scenarios, executionOptions) => {
    console.time('total')
    const jobId = uuid4()

    setSystemDetails(executionOptions.systems)
    this.executionOptions = executionOptions

    this.scenarioCache = createScenarioCache(scenarios)


    let globalVariables = loadGlobalVariables(jobId)
    let userVariables = processUserVariables(executionOptions.variables)

    let scenariosToExecute = scenarios.filter(scenario => !!scenario && !scenario.ignore)
    scenarios.filter(scenario => !!scenario && !!scenario.ignore).map(scenario => markAsIgnored(scenario))
    let scenarioExecutors = scenariosToExecute.map(scenario =>
        processScenario(scenario, jobId, { ...globalVariables, ...userVariables }))

    const scenarioResults = await Promise.all(scenarioExecutors)

    // const processedResults = await Promise.all(scenarioResults.map(result => processScenarioResult(result)))
    console.timeEnd('total')
    return scenarioResults
}


module.exports = {
    runTests
}