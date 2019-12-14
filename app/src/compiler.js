const { readdir, stat } = require('fs').promises;
const { join } = require('path');
const pathResolve = require('path').resolve;
const { scenariosPath } = require('./constants');
const { logger } = require('./loghandler')
const utils = require('./utils')


const readListOfTestScenarios = async (directoryPath) => {
    let results = [];
    let filesInDir = await readdir(directoryPath);
    let pending = filesInDir.length;

    return new Promise((resolve, reject) => {
        if (!pending) resolve(results);
        try {
            filesInDir.forEach(async file => {
                let absoluteFilePath = pathResolve(directoryPath, file);
                let fileStat = await stat(absoluteFilePath);

                if (fileStat && fileStat.isDirectory()) {
                    let scenarioFiles = await readListOfTestScenarios(absoluteFilePath);
                    results.push(...scenarioFiles);
                    if (!--pending) resolve(results);
                } else {
                    results.push(absoluteFilePath);
                    if (!--pending) resolve(results);
                }
            });
        } catch (error) {
            reject(error);
            logger.error(error);
        }
    })
}


const loadPayloadFiles = async endpoint => {
    let endpointWithPayloadData = endpoint;
    if (!!endpoint.payload && typeof (endpoint.payload) == 'string' && endpoint.payload.startsWith("!")) {
        let payloadFilePath = join(scenariosPath, '..', 'payloads', endpoint.payload.replace('!', '')) + ".json";
        try {
            let payloadJsonResponse = await utils.readJsonFile(payloadFilePath, true);
            endpointWithPayloadData.payload = payloadJsonResponse.status ? payloadJsonResponse.data : {};
        } catch (error) {
            logger.error(error)
        }
        return endpointWithPayloadData;
    } else {
        return endpointWithPayloadData;
    }
}

const loadEndpoinsForScenario = (scenario, apis, searchMode = false) => {
    return new Promise(resolve => {
        if (scenario.endpoints) {
            let payloadReaders = [];

            if (searchMode) {
                payloadReaders = scenario.endpoints
                    .filter(endpoint => utils.isAll(apis) ? true : utils.includesRegex(utils.splitAndTrimInput(apis), endpoint.name))
                    .map(endpoint => new Promise(resolve => resolve(loadPayloadFiles(endpoint))));
            } else {
                payloadReaders = scenario.endpoints
                    .filter(endpoint => utils.isAll(apis) ? true : utils.splitAndTrimInput(apis).includes(endpoint.name))
                    .map(endpoint => new Promise(resolve => resolve(loadPayloadFiles(endpoint))));
            }

            Promise.all(payloadReaders)
                .then(endpoints => {
                    scenario.endpoints = endpoints;
                    resolve(scenario);
                })
        } else {
            resolve(scenario);
        }
    })
}


const convertScenarioListToApiList = scenarios => {
    return new Promise(resolve => {
        let apis = [];
        for (const scenario of scenarios) {
            let endpointsInScenario = scenario.endpoints.map(endpoint => {
                return {
                    ...endpoint,
                    scenario: scenario.name,
                    collection: scenario.collection
                }
            });

            apis.push(...endpointsInScenario);
        }
        resolve(apis);
    })
}

/**
 * Load the dependent apis as a nested object
 * 
 * @param {array} apis List of APIs
 * @returns {object} api hierarchy
 */
const loadApiHierarchy = async apis => {
    let treeStructureProcessor = apis.map(api => new Promise(resolve => {
        let apiName = `${api.collection}.${api.scenario}.${api.name}`;
        fetchDependentApis(apis, api)
            .then(dependency => {
                resolve({ [apiName]: dependency });
            })
    }));

    const results = await Promise.all(treeStructureProcessor);
    let treeStructure = {};
    results.forEach((api_1, i) => {
        let key = `${i + 1}. ${Object.keys(api_1)[0]}`;
        treeStructure[key] = api_1[Object.keys(api_1)[0]];
    });
    return treeStructure;
}


const convertApiListToTreeStructure = apis => {
    const collections = Array.from(new Set(apis.map(_ => _.collection)));

    return collections.map(collection => {
        const scenarios = Array.from(new Set(apis.filter(_ => _.collection === collection).map(_ => _.scenario)));
        return {
            collection,
            scenarios: scenarios.reduce((acc, sc) => {
                acc[sc] = apis
                    .filter(_ => _.collection === collection && _.scenario === sc)
                    .map(e => e.name)
                    .reduce((acc, e) => { acc[e] = {}; return acc; }, {})
                return acc;
            }, {})
        }
    }).reduce((acc, _) => {
        acc[_.collection] = _.scenarios
        return acc;
    }, {})
}


const findApiDetails = (apis, collection, scenario, api) => {
    let dependentApi = apis.find(_ => _.name === api && _.scenario === scenario && _.collection === collection);
    return !!dependentApi ? dependentApi : {}
}


const fetchDependentApis = (apis, api) => {
    return new Promise(resolve => {
        if (api.dependencies) {
            const dependenciesMap = api.dependencies.map(dependency => {
                const dependentApi = findApiDetails(apis, dependency.collection, dependency.scenario, dependency.api);
                return fetchDependentApis(apis, dependentApi);
            });

            Promise.all(dependenciesMap)
                .then(d => {
                    let deps = {};
                    d.forEach((_, i) => {
                        let key = `${(i + 1)}. ${Object.keys(_)[0]}`
                        deps = {
                            ...deps,
                            [key]: _[Object.keys(_)[0]]
                        }
                    })
                    resolve(deps)
                })

        } else {
            resolve({})
        }
    })
}


const processScenarioFiles = (scenarioFiles, apis, searchMode) => {
    return new Promise((resolve, reject) => {
        Promise.all(scenarioFiles)
            .then(result => {
                result.filter(obj => !obj.status).map(obj => logger.warn(`${obj.message}`, { ignored: true }))
                let scenarios = result.filter(obj => obj.status).map(obj => obj.data);
                let scenariosToBeProcessed = scenarios
                    .filter(scenario => !!scenario)
                    .map(scenario => loadEndpoinsForScenario(scenario, apis, searchMode));

                return Promise.all(scenariosToBeProcessed)
            })
            .then(processedScenarios => resolve(processedScenarios))
            .catch(error => logger.error(error));
    })
}


const loadAllScenarios = async (collections, scenarios, apis) => {
    const scenarioFiles = await readListOfTestScenarios(scenariosPath);
    let filteredScenarios = scenarioFiles
        .filter(scenarioFile => utils.isAll(collections) ? true : utils.splitAndTrimInput(collections).includes(utils.getCollectionNameForScenario(scenarioFile)))
        .map(file => new Promise(async (resolve, reject) => resolve(await utils.readJsonFile(file))));

    filteredScenarios = await processScenarioFiles(filteredScenarios, apis);
    filteredScenarios = filteredScenarios
        .filter(scenarioFile => utils.isAll(scenarios) ? true : (utils.splitAndTrimInput(scenarios).includes(scenarioFile.name) ||
            utils.splitAndTrimInput(scenarios).includes(utils.getScenarioFileNameFromPath(scenarioFile.file))));

    return filteredScenarios;
}


const searchForApi = async (collections, scenarios, apis) => {
    const scenarioFiles = await readListOfTestScenarios(scenariosPath);
    let filteredScenarios = scenarioFiles
        .filter(scenarioFile => utils.isAll(collections) ? true : utils.includesRegex(utils.splitAndTrimInput(collections), utils.getCollectionNameForScenario(scenarioFile)))
        .map(file => new Promise(async (resolve, reject) => resolve(await utils.readJsonFile(file))));

    filteredScenarios = await processScenarioFiles(filteredScenarios, apis, searchMode = true);
    filteredScenarios = filteredScenarios
        .filter(scenarioFile => utils.isAll(scenarios) ? true : (utils.includesRegex(utils.splitAndTrimInput(scenarios), scenarioFile.name) ||
            utils.includesRegex(utils.splitAndTrimInput(scenarios), utils.getScenarioFileNameFromPath(scenarioFile.file))));

    return filteredScenarios;
}



module.exports = {
    compile: loadAllScenarios,
    search: searchForApi,
    convertScenarios: convertScenarioListToApiList,
    convertApiListToTreeStructure,
    loadApiHierarchy
}