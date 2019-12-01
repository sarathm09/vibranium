const { readFile, readdir, stat } = require('fs').promises;
const { join, sep } = require('path');
const pathResolve = require('path').resolve;
const { scenariosPath } = require('./constants');
const { logger } = require('./loghandler')
// const db = require('./dbhandler');


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


const parseJsonFile = (fileToParse, fileData, payload) => {
    let fileParseStatus = {};
    try {
        let obj = JSON.parse(fileData);
        // If the file is a scenario file, add filepath and scenario name to the json
        if (!payload) {
            obj = {
                ...obj,
                file: fileToParse.replace(scenariosPath, ''),
                collection: getCollectionNameForScenario(fileToParse),
                sid: `${fileToParse.replace(scenariosPath, '').split(sep)[1]}_${obj.name}`
            }
        }
        fileParseStatus = { status: true, data: obj };
    } catch (error) {
        fileParseStatus = { status: false, message: `Parsing file ${fileToParse} failed with the error ${error}` };
    }
    return fileParseStatus;
}


const readJsonFile = async (fileToParse, payload = false) => {
    if (!fileToParse) return { status: false, message: `The filename is not valid.` };

    if (!!fileToParse && fileToParse.split(".").pop() != 'json')
        return { status: false, message: `The file ${fileToParse} does not have the extension '.json'` };

    else {
        let fileData = await readFile(fileToParse, 'utf8');
        return parseJsonFile(fileToParse, fileData, payload);
    }
}


const loadPayloadFiles = async endpoint => {
    let endpointWithPayloadData = endpoint;
    if (!!endpoint.payload && typeof (endpoint.payload) == 'string' && endpoint.payload.startsWith("!")) {
        let payloadFilePath = join(scenariosPath, '..', 'payloads', endpoint.payload.replace('!', '')) + ".json";
        try {
            let payloadJsonResponse = await readJsonFile(payloadFilePath, true);
            endpointWithPayloadData.payload = payloadJsonResponse.status ? payloadJsonResponse.data : {};
        } catch (error) {
            logger.error(error)
        }
        return endpointWithPayloadData;
    } else {
        return endpointWithPayloadData;
    }

    // return new Promise(async (resolve, reject) => {
    //     if (!!endpoint.payload && typeof (endpoint.payload) == 'string' && endpoint.payload.startsWith("!")) {
    //         let payloadFile = join(scenariosPath, '..', 'payloads', endpoint.payload.replace('!', '')) + ".json";

    //         try {
    //             let payloadJsonResponse = await readJsonFile(payloadFile, true);
    //             endpoint.payload = payloadJsonResponse.status ? payloadJsonResponse.data : {};
    //         } catch (error) {
    //             logger.error(error)
    //         }
    //         resolve(endpoint);
    //     } else {
    //         resolve(endpoint);
    //     }
    // })
}

const loadEndpoinsForScenario = (scenario, apis, searchMode = false) => {
    return new Promise(resolve=> {
        if (scenario.endpoints) {
            let payloadReaders = [];

            if (searchMode) {
                payloadReaders = scenario.endpoints
                    .filter(endpoint => isAll(apis) ? true : includesRegex(splitAndTrimInput(apis), endpoint.name))
                    .map(endpoint => new Promise(resolve => resolve(loadPayloadFiles(endpoint))));
            } else {
                payloadReaders = scenario.endpoints
                    .filter(endpoint => isAll(apis) ? true : splitAndTrimInput(apis).includes(endpoint.name))
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

// const loadEndpoinsForScenario = (scenario, apis, searchMode = false) => {
//     return new Promise((resolve, reject) => {
//         if (scenario.endpoints) {
//             let payloadReaders = [];

//             if (searchMode) {
//                 payloadReaders = scenario.endpoints
//                     .filter(endpoint => isAll(apis) ? true : includesRegex(splitAndTrimInput(apis), endpoint.name))
//                     .map(endpoint => loadPayloadFiles(endpoint));
//             } else {
//                 payloadReaders = scenario.endpoints
//                     .filter(endpoint => isAll(apis) ? true : splitAndTrimInput(apis).includes(endpoint.name))
//                     .map(endpoint => loadPayloadFiles(endpoint));
//             }

//             Promise.all(payloadReaders)
//                 .then(endpoints => {
//                     scenario.endpoints = endpoints;
//                     resolve(scenario);
//                 })
//         } else {
//             resolve(scenario);
//         }
//     })
// }


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


const convertApiListToTreeStrcture = apis => {
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


const fetchDependentApis = (db, api) => {
    return new Promise(resolve => {
        if (api.dependencies) {
            let dependenciesMap = api.dependencies.map(dependency => new Promise(res=> {
                db.apis.find({ name: dependency.api, collection: dependency.collection, scenario: dependency.scenario })
                    .exec(async (err, values) => {
                        if (err || values.length === 0) {
                            res({})
                        }
                        else {
                            let depName = `${values[0].collection}.${values[0].scenario}.${values[0].name}`,
                                deps = await fetchDependentApis(db, values[0]);
                            res({ [depName]: deps })
                        }
                    })
            }));

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


const getCollectionNameForScenario = fileToParse => fileToParse.replace(scenariosPath, '').split(sep)[1]
const getScenarioFileNameFromPath = fileToParse => fileToParse.replace(scenariosPath, '').split(sep).pop().split('.')[0]
const splitAndTrimInput = input => input ? input.split(',').map(_ => _.trim()) : []
const isAll = input => input ? input === 'all' : true
const includesRegex = (arr, input) => arr.filter(_ => input.toLowerCase().match(_.toLowerCase())).length > 0


module.exports = {
    compile: async (collections, scenarios, apis) => {
        const scenarioFiles = await readListOfTestScenarios(scenariosPath);
        let filteredScenarios = scenarioFiles
            .filter(scenarioFile => isAll(collections) ? true : splitAndTrimInput(collections).includes(getCollectionNameForScenario(scenarioFile)))
            .map(file => new Promise(async (resolve, reject) => resolve(await readJsonFile(file))));

        filteredScenarios = await processScenarioFiles(filteredScenarios, apis);
        filteredScenarios = filteredScenarios
            .filter(scenarioFile => isAll(scenarios) ? true : (splitAndTrimInput(scenarios).includes(scenarioFile.name) ||
                splitAndTrimInput(scenarios).includes(getScenarioFileNameFromPath(scenarioFile.file))));

        return filteredScenarios;
    },
    search: async (collections, scenarios, apis) => {
        const scenarioFiles = await readListOfTestScenarios(scenariosPath);
        let filteredScenarios = scenarioFiles
            .filter(scenarioFile => isAll(collections) ? true : includesRegex(splitAndTrimInput(collections), getCollectionNameForScenario(scenarioFile)))
            .map(file => new Promise(async (resolve, reject) => resolve(await readJsonFile(file))));

        filteredScenarios = await processScenarioFiles(filteredScenarios, apis, searchMode = true);
        filteredScenarios = filteredScenarios
            .filter(scenarioFile => isAll(scenarios) ? true : (includesRegex(splitAndTrimInput(scenarios), scenarioFile.name) ||
                includesRegex(splitAndTrimInput(scenarios), getScenarioFileNameFromPath(scenarioFile.file))));

        return filteredScenarios;
    },
    convertScenarios: scenarios => convertScenarioListToApiList(scenarios),
    convertApiListToTreeStructure: apis => convertApiListToTreeStrcture(apis)

}

// const m = async () => {
//     let collections = 'all', scenarios = 'matrix_crud', apis = 'all';


//     const scenarioFiles = await readListOfTestScenarios(scenariosPath);
//     let filteredScenarios = scenarioFiles
//         .filter(scenarioFile => isAll(collections) ? true : splitAndTrimInput(collections).includes(getCollectionNameForScenario(scenarioFile)))
//         .map(file => new Promise(async (resolve, reject) => resolve(await readJsonFile(file))));

//     filteredScenarios = await processScenarioFiles(filteredScenarios, apis);
//     filteredScenarios = filteredScenarios
//         .filter(scenarioFile => isAll(scenarios) ? true : (splitAndTrimInput(scenarios).includes(scenarioFile.name) ||
//             splitAndTrimInput(scenarios).includes(getScenarioFileNameFromPath(scenarioFile.file))));

//     console.log(filteredScenarios)
//     return filteredScenarios;
// }

// m()
