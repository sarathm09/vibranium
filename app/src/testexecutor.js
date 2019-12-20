const uuid4 = require('uuid/v4')
const process = require('process')

const utils = require('./utils')
const { executionStatus, userConfig } = require('./constants')
const { callApi, setAvailableSystems } = require('./servicehandler')
const logHandler = require('./loghandler')


const MAX_PARALLEL_EXECUTORS = (!!userConfig.executor && !!userConfig.executor.max_parallel_executors) ?
    userConfig.executor.max_parallel_executors : 10
const logger = logHandler.moduleLogger('executor')
let ACTIVE_PARALLEL_EXECUTORS = 0
let allScenarios = []


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
        console.log("Waiting..")
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


// TODO: start and end scripts for scenarios 
const executePreScenarioScripts = (variables, scenario) => new Promise(resolve => {
    if (!!scenario.scripts && !!scenario.scripts.pre_scenario) {
        const vm = new VM({
            sandbox: {
                scenario,
                variables,
                getApiResponse,
                console
            }
        });
        vm.run(scenario.scripts.pre_scenario)
    }
    resolve(variables)
})

const executeEndpointPostDependencyScripts = (endPointVariables, scripts) => {
    return endPointVariables;
}



const executeEndpointPreScripts = (scenarioVariables, scripts) => {
    return scenarioVariables;
}


// TODO: start and end scripts for scenarios 
const executePostScenarioScripts = (variables, scenario) => new Promise(resolve => {
    resolve()
})


// TODO: start and end scripts for scenarios 
const executePostGeneratorScripts = (variables, scenario) => new Promise(resolve => {
    resolve(variables)
})


// TODO: log scenario timing
// TODO: collect and print results
const printScenarioSummary = (scenario, jobId) => new Promise(resolve => {
    resolve()
})


const replaceVariablesInApi = (api, variables) => {
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
    let api = JSON.parse(JSON.stringify(replaceVariablesInApi(endpoint, endpointVaribles)))
    let expectedStatus = 200

    if (!!api.expect && !!api.expect.status) expectedStatus = api.expect.status

    waitForExecutors()
        .then(() => { }) // TODO: log api start
        .then(() => callApi(api.url, api.method, api.payload, api.system, api.language))
        .then(endpointResponse => {
            api._result = endpointResponse
            api._status = endpointResponse.status === expectedStatus
            ACTIVE_PARALLEL_EXECUTORS -= 1
            resolve(api)
        })
})


const loadDependendentEndpoint = (endpointName, dependency, endpointVariables, loadDependenciesFromMemory) => new Promise(resolve => {
    let wait = Math.random(10)
    console.log(ACTIVE_PARALLEL_EXECUTORS + "\t\tdepstart: " + endpoint + ": " + dependency.api + "  " + wait)
    executeAPI(wait)
        .then(res => {
            console.log(ACTIVE_PARALLEL_EXECUTORS + "\t\tdepend: " + endpoint + ": " + dependency.api + "  " + wait)
            resolve()
        });
})


const setRangeIndexForEndpoint = (endpoint, index) => {
    let variables = !!endpoint.variables ? endpoint.variables : {}
    variables["_range_index"] = index + 1
    endpoint.variables = variables
    return endpoint
}


const getApiExecuterPromise = (scenarioVariables, endpoint, loadDependenciesFromMemory, repeatIndex) => new Promise(resolveEndpoint => {
    let endpointVaribles = executeEndpointPreScripts(scenarioVariables, endpoint.scripts)
    let dependencyResolver = Promise.resolve();

    endpoint = setRangeIndexForEndpoint(endpoint, repeatIndex)

    if (!!endpoint.dependencies && endpoint.dependencies.length > 0) {
        endpoint.dependencies.forEach(dependency => {
            dependencyResolver = dependencyResolver.then(() =>
                endPointVariables = loadDependendentEndpoint(endpoint.name, dependency, endpointVariables, loadDependenciesFromMemory))
        });
    }

    dependencyResolver.then(() => {
        endpointVaribles = executeEndpointPostDependencyScripts(endpointVaribles, endpoint.scripts)
        //TODO depenedcy start
        executeAPI(endpoint, endpointVaribles)
            .then(result => resolveEndpoint(result));
    })
})


// TODO: collect and print results
const processEndpoint = (scenarioVariables, endpoint, loadDependenciesFromMemory = false) => new Promise(resolve => {
    if (!endpoint.async) {
        let endpointExecutors = Array.from(Array(!!endpoint.repeat ? endpoint.repeat : 1).keys())
            .map(i => getApiExecuterPromise(scenarioVariables, endpoint, loadDependenciesFromMemory, i))
        Promise.all(endpointExecutors)
            .then(results => {
                endpoint._result = results;
                endpoint._status = results.every(endpoint => !!endpoint._status)
                resolve(endpoint)
            })
    } else {
        let endpointResolver = Promise.resolve(), results = [];
        Array.from(Array(!!endpoint.repeat ? endpoint.repeat : 1).keys())
            .forEach((_, i) => {
                endpointResolver = endpointResolver.then(result => {
                    if (!!result) results.push(result)
                    return getApiExecuterPromise(scenarioVariables, endpoint, loadDependenciesFromMemory, i)
                })
            })
        endpointResolver.then(result => {
            results.push(result)
            endpoint._result = results;
            endpoint._status = results.every(endpoint => !!endpoint._status)
            resolve(endpoint)
        })
    }
})




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
 * @param {boolean} loadDependenciesFromMemory Load the dependency details from memory or search for the corresponding file
 * @returns {Promise} Execution status
 */
const processScenario = async (scenario, jobId, variables, loadDependenciesFromMemory) => {
    const scenarioExecutionStartTime = new Date().getTime()
    logScenarioStart(scenario, jobId)

    // Process Generators and global variables
    let scenarioVariables = await executePreScenarioScripts(variables, scenario)

    // Process Generators and global variables
    scenarioVariables = await processGeneratorsAndGlobals(scenarioVariables, scenario)

    // Execute the pre scenario scripts
    scenarioVariables = await executePostGeneratorScripts(scenarioVariables, scenario)

    // Take the endpoints that have ignore flag as false and execute them
    let endpointsToBeProcessed = scenario.endpoints.filter(endpoint => !endpoint.ignore)
    await Promise.all(endpointsToBeProcessed
        .map(endpoint => processEndpoint(scenarioVariables, endpoint, loadDependenciesFromMemory)))

    let scenarioExecutionEndTime = new Date().getTime()
    // Summarize the results
    let scenarioResult = {
        ...scenario,
        _result: {
            scenarioVariables,
            status: scenario.endpoints.every(endpoint => endpoint._status) ? executionStatus.SUCESS : executionStatus.FAIL,
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
        message: "Scenario ignored"
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
        jobId
    }
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

    if (!!systems)
        for (const userProvidedSystem of systems.split(",")) {
            let sysInfo = userProvidedSystem.split("=")
            if (sysInfo.length < 2 || !Object.keys(availableSystems).includes(sysInfo[1])) {
                logger.error("Invalid user provided system")
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
    if (!!variables) {
        for (const userProvidedVariable of variables.split(",")) {
            let varInfo = userProvidedVariable.split("=")
            if (varInfo.length < 2) {
                logger.error("Invalid user provided variables")
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
const runTests = async (scenarios, executionOptions, loadDependenciesFromMemory = false) => {
    console.time("total")
    const jobId = uuid4()
    setSystemDetails(executionOptions.systems)

    if (loadDependenciesFromMemory) allScenarios = scenarios

    let globalVariables = loadGlobalVariables(jobId)
    let userVariables = processUserVariables(executionOptions.variables)

    let scenariosToExecute = scenarios.filter(scenario => !!scenario && !scenario.ignore)
    scenarios.filter(scenario => !!scenario && !!scenario.ignore).map(scenario => markAsIgnored(scenario))
    let scenarioExecutors = scenariosToExecute.map(scenario =>
        processScenario(scenario, jobId, { ...globalVariables, ...userVariables }, loadDependenciesFromMemory))

    const scenarioResults = await Promise.all(scenarioExecutors)



    // const processedResults = await Promise.all(scenarioResults.map(result => processScenarioResult(result)))
    console.timeEnd("total")
    return scenarioResults
}


module.exports = {
    runTests
}