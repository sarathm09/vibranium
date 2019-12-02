const utils = require('./utils')
const MAX_PARALLEL_EXECUTORS = 10
let ACTIVE_PARALLEL_EXECUTORS = 0


const waitForExecutors = () => new Promise(resolve => {
    if (ACTIVE_PARALLEL_EXECUTORS < MAX_PARALLEL_EXECUTORS) {
        resolve()
    } else {
        setTimeout(waitForExecutors, 200)
    }
})


const executeAPI = api => new Promise(resolve => {
    waitForExecutors()
        .then(() => {
            ACTIVE_PARALLEL_EXECUTORS++
            utils.sleep(10000 * api)
                .then(() => {
                    --ACTIVE_PARALLEL_EXECUTORS
                    resolve()
                })
        })

})


const loadDependendentEndpoint = (endpoint, dependency) => new Promise(resolve => {
    let wait = Math.random(10) * 10
    console.log("depstart: " + endpoint + ": " + dependency.api + "  " + wait)
    executeAPI(wait)
        .then(res => {
            console.log("depend: " + endpoint + ": " + dependency.api + "  " + wait)
            resolve()
        });
})


const processEndpoint = endpoint => new Promise(resolve => {
    let wait = Math.random(10) * 10
    console.log("start: " + endpoint.name + "  " + wait)
    let res = Promise.resolve();
    if (endpoint.dependencies) {

        endpoint.dependencies.forEach(dep => {
            res = res.then(() => loadDependendentEndpoint(endpoint.name, dep))
        });
    }

    res.then(() => {
        executeAPI()
            .then(() => {
                console.log("end: " + endpoint.name + "  " + wait)
                resolve()
            });
    })


})


const processScenarioResult = result => new Promise(resolve => {
    resolve()
})


const processScenario = async scenario => new Promise(resolve => {
    console.log("scenario: " + scenario.name)

    if (scenario.endpoints) {
        Promise.all(scenario.endpoints.map(endpoint => processEndpoint(endpoint)))
            .then(results => {
                scenario.endpointsResult = results
                resolve(scenario)
            })
    }

})


const runTests = async scenarios => {
    console.time("total")
    const scenarioResults = await Promise.all(scenarios.map(scenario => processScenario(scenario)))
    const processedResults = await Promise.all(scenarioResults.map(result => processScenarioResult(result)))
    console.timeEnd("total")
}

module.exports = {
    runTests
}