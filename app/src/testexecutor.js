const uuid4 = require('uuid/v4')
const process = require('process')

const utils = require('./utils')
const { executionStatus } = require('./constants')
const {callApi, setAvailableSystems} = require('./servicehandler')
const logHandler = require('./loghandler')


const MAX_PARALLEL_EXECUTORS = 7, logger = logHandler('executor')
let ACTIVE_PARALLEL_EXECUTORS = 0


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



/**
 * Execute the api endpoint when executors are available
 * 
 * @param {object} api The api to be executed
 */
const executeAPI = api => new Promise(resolve => {
    waitForExecutors()
        .then(() => {
            console.log("waiting for " + (1000 * api))
            utils.sleep(1000 * api)
                .then(() => {
                    console.log("done")
                    ACTIVE_PARALLEL_EXECUTORS -= 1
                    resolve()
                })
        })

})



const loadDependendentEndpoint = (endpoint, dependency) => new Promise(resolve => {
    let wait = Math.random(10)
    console.log(ACTIVE_PARALLEL_EXECUTORS + "\t\tdepstart: " + endpoint + ": " + dependency.api + "  " + wait)
    executeAPI(wait)
        .then(res => {
            console.log(ACTIVE_PARALLEL_EXECUTORS + "\t\tdepend: " + endpoint + ": " + dependency.api + "  " + wait)
            resolve()
        });
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

})


// TODO: process generators
// TODO: process variables
const processGeneratorsAndGlobals = (variables, scenario) => new Promise(resolve => {

})


// TODO: start and end scripts for scenarios 
const executePreScenarioScripts = (variables, scenario) => new Promise(resolve => {
    const vm = new VM({
        sandbox: {
            variables,
            getApiResponse,
            console
        }
    });
})

// TODO: collect and print results
const processEndpoint = endpoint => new Promise(resolve => {
    let wait = Math.random(10)
    let res = Promise.resolve();
    if (endpoint.dependencies) {
        endpoint.dependencies.forEach(dep => {
            res = res.then(() => loadDependendentEndpoint(endpoint.name, dep))
        });
    }

    res.then(() => {
        console.log(ACTIVE_PARALLEL_EXECUTORS + "\tstart: " + endpoint.name + "  " + wait)
        executeAPI(wait)
            .then(() => {
                console.log(ACTIVE_PARALLEL_EXECUTORS + "\tend: " + endpoint.name + "  " + wait)
                resolve()
            });
    })


})


// TODO: start and end scripts for scenarios 
const executePostScenarioScripts = (variables, scenario) => new Promise(resolve => {

})


// TODO: log scenario timing
// TODO: collect and print results
const printScenarioSummary = (scenario, jobId) => new Promise(resolve => {

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
    let scenarioVariables = await processGeneratorsAndGlobals(variables, scenario)

    // Execute the pre scenario scripts
    scenarioVariables = await executePreScenarioScripts(scenarioVariables, scenario)

    // Take the endpoints that have ignore flag as false and eecute them
    let endpointsToBeProcessed = scenario.endpoints.filter(endpoint => !endpoint.ignore)
    await Promise.all(endpointsToBeProcessed
        .map(endpoint => processEndpoint(scenarioVariables, endpoint, loadDependenciesFromMemory)))

    // Summarize the results
    let scenarioResult = scenario.extend({
        _result: {
            scenarioVariables,
            status: scenario.endpoints.every(endpoint => endpoint._status) ? executionStatus.SUCESS : executionStatus.FAIL,
            timing: {
                start: scenarioExecutionStartTime,
                end: new Date().getTime()
            }
        }
    })

    // Do post scenario tasks
    Promise.all([
        executePostScenarioScripts(scenarioVariables, scenarioResult),
        logScenarioEnd(scenarioResult, jobId, scenarioVariables),
        printScenarioSummary(scenarioResult, jobId)
    ]).then(() => {
        resolve({
            scenarioResult,
            status: scenarioResult._result.status
        })
    })
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
    let availableSystems = availableSystemDetails.systems.reduce((a, c) => a[c.name] = c, {})
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
    if (!!variables)
        for (const userProvidedVariable of variables.split(",")) {
            let varInfo = userProvidedVariable.split("=")
            if (varInfo.length < 2) {
                logger.error("Invalid user provided variables")
                process.exit(1)
            }
            parsedVariables[varInfo[0]] = varInfo[1]
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

    let globalVariables = loadGlobalVariables(jobId)
    let userVariables = processUserVariables(executionOptions.variables)

    let scenariosToExecute = scenarios.filter(scenario => !!scenario && !scenario.ignore)
    scenarios.filter(scenario => !!scenario && !!scenario.ignore).map(scenario => markAsIgnored(scenario))

    const scenarioResults = await Promise.all(scenariosToExecute.map(scenario =>
        processScenario(scenario, jobId, { ...globalVariables, ...userVariables }, loadDependenciesFromMemory)))

    // const processedResults = await Promise.all(scenarioResults.map(result => processScenarioResult(result)))
    console.timeEnd("total")
}


module.exports = {
    runTests
}