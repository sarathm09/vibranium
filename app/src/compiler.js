const { join, sep } = require('path');
const { env } = require('process')
const { readdirSync } = require('fs')

const utils = require('./utils');
const { vibPath } = require('./constants');
const logger = require('./logger')('compiler');


/**
 * Read all the files in a directory recursively
 * 
 * @param {string} directoryPath The starting directory path
 */
const readFilesInDirectory = directoryPath => readdirSync(directoryPath, { withFileTypes: true })
	.reduce((files, file) => {
		const name = join(directoryPath, file.name)
		return file.isDirectory() ? [...files, ...readFilesInDirectory(name)] : [...files, name]
	}, [])


/**
 * Read the payload files corresponding to each endpoint
 * 
 * @param {object} endpoint the endpoint object
 * @param {string} scenarioName Scenario name
 */
const loadPayloadFiles = async (endpoint, scenarioName) => {
	let endpointWithPayloadData = endpoint;

	if (!!endpoint.payload && typeof endpoint.payload == 'string' && endpoint.payload.startsWith('!')) {
		let payloadFilePath = join(vibPath.payloads, endpoint.payload.replace('!', '').split('/').join(sep)) + '.json';
		try {
			let payloadJsonResponse = await utils.readJsonFile(payloadFilePath, true);
			endpointWithPayloadData.payloadKey = endpointWithPayloadData.payload
			endpointWithPayloadData.payload = payloadJsonResponse.status ? payloadJsonResponse.data : {};
		} catch (error) {
			logger.error(`Error loading payload for ${scenarioName}.${endpoint.name} [${endpoint.payload}]: ${error}`)
		}
		return endpointWithPayloadData;
	} else {
		return endpointWithPayloadData;
	}
}


/**
 * Parse the scenario file and load all the endpoints from it.
 * 
 * @param {object} scenario The scenario file json
 * @param {string} apis csv of apis to filter
 * @param {boolean} searchMode If search mode is true, the filter is based on regex and else it is based on full match
 */
const loadEndpoinsForScenario = (scenario, apis, searchMode = false) => new Promise(resolve => {
	if (scenario.endpoints) {
		let payloadReaders = [];
		if (searchMode) {
			payloadReaders = scenario.endpoints
				.filter(endpoint =>
					utils.isAll(apis) ? true : utils.includesRegex(utils.splitAndTrimInput(apis), endpoint.name)
				)
				.map(endpoint => new Promise(resolve => resolve(loadPayloadFiles(endpoint, scenario.name))));
		} else {
			payloadReaders = scenario.endpoints
				.filter(endpoint => (utils.isAll(apis) ? true : utils.splitAndTrimInput(apis).includes(endpoint.name)))
				.map(endpoint => new Promise(resolve => resolve(loadPayloadFiles(endpoint, scenario.name))));
		}

		Promise.all(payloadReaders).then(endpoints => {
			scenario.endpoints = endpoints;
			resolve(scenario);
		});
	} else {
		resolve(scenario);
	}
})


/**
 * Transform the scenario list to an API list
 * 
 * @param {object} scenarios list of scenarios
 */
const convertScenarioListToApiList = scenarios => {
	return new Promise(resolve => {
		let apis = [];
		for (const scenario of scenarios) {
			let endpointsInScenario = scenario.endpoints.map(endpoint => {
				return {
					...endpoint,
					scenario: scenario.name,
					scenarioFile: scenario.file,
					collection: scenario.collection
				};
			});

			apis.push(...endpointsInScenario);
		}
		resolve(apis);
	});
};


/**
 * Load the dependent apis as a nested object
 *
 * @param {array} apis List of APIs
 * @returns {object} api hierarchy
 */
const loadApiHierarchy = async apis => {
	let treeStructureProcessor = apis.map(
		api =>
			new Promise(resolve => {
				let apiName = `${api.collection}.${api.scenario}.${api.name}`;
				fetchDependentApis(apis, api).then(dependency => {
					resolve({ [apiName]: dependency });
				});
			})
	);

	const results = await Promise.all(treeStructureProcessor);
	let treeStructure = {};
	results.forEach((api_1, i) => {
		let key = `${i + 1}. ${Object.keys(api_1)[0]}`;
		treeStructure[key] = api_1[Object.keys(api_1)[0]];
	});
	return treeStructure;
};


/**
 * Transform the list f apis into a tree structure
 * 
 * @param {object} apis list of all apis
 */
const convertApiListToTreeStructure = apis => {
	const collections = Array.from(new Set(apis.map(_ => _.collection)));

	return collections
		.map(collection => {
			const scenarios = Array.from(new Set(apis.filter(_ => _.collection === collection).map(_ => `${_.scenario} [${_.scenarioFile}]`)));
			return {
				collection,
				scenarios: scenarios.reduce((acc, sc) => {
					acc[sc] = apis
						.filter(_ => _.collection === collection && _.scenario === sc.split(' ')[0])
						.map(e => e.name)
						.reduce((acc, e) => {
							acc[e] = {};
							return acc;
						}, {});
					return acc;
				}, {})
			};
		})
		.reduce((acc, _) => {
			acc[_.collection] = _.scenarios;
			return acc;
		}, {});
};


/**
 * Check if the dependent api is available in the already loaded apis.
 * 
 * @param {object} apis list of apis
 * @param {string} collection collection name
 * @param {string} scenario scenario name
 * @param {string} api api name
 */
const findApiDetails = (apis, collection, scenario, api) => {
	let dependentApi = apis.find(_ => _.name === api && _.scenario === scenario && _.collection === collection);
	return dependentApi ? dependentApi : {};
};

/**
 * Fetch the dependent apis from the list of already loaded apis
 * 
 * @param {object} apis List of APIs
 * @param {string} api API object
 */
const fetchDependentApis = (apis, api) => {
	return new Promise(resolve => {
		if (api.dependencies) {
			const dependenciesMap = api.dependencies.map(dependency => {
				const dependentApi = findApiDetails(apis, dependency.collection, dependency.scenario, dependency.api);
				return fetchDependentApis(apis, dependentApi);
			});

			Promise.all(dependenciesMap).then(d => {
				let deps = {};
				d.forEach((_, i) => {
					let key = `${i + 1}. ${Object.keys(_)[0]}`;
					deps = {
						...deps,
						[key]: _[Object.keys(_)[0]]
					};
				});
				resolve(deps);
			});
		} else {
			resolve({});
		}
	});
};


/**
 * Load the scenario files from the list of scenario file paths and load the endpoint/payload details
 * 
 * @param {object} scenarioFiles List of scenario file names
 * @param {string} apis csv containing api names to be filtered
 * @param {boolean} searchMode If search mode is true, the filter is based on regex and else it is based on full match
 */
const processScenarioFiles = (scenarioFiles, apis, searchMode) => new Promise(resolve => {
	Promise.all(scenarioFiles)
		.then(result => {
			if (!env.SILENT) {
				result.filter(obj => !obj.status)
					.map(obj => logger.warn(`${obj.message}`, { ignored: true }));
			}

			let scenarios = result.filter(obj => obj.status).map(obj => obj.data);
			let scenariosToBeProcessed = scenarios
				.filter(scenario => !!scenario)
				.map(scenario => loadEndpoinsForScenario(scenario, apis, searchMode));
			return Promise.all(scenariosToBeProcessed);
		})
		.then(processedScenarios => resolve(processedScenarios))
		.catch(error => logger.error(error.message));
});


/**
 * Load all the scenario files and theie details from cache (if --freeze command was executed before)
 * 
 * @param {string} collections csv of collection names to filter
 * @param {string} scenarios csv of scenario names to filter
 * @param {string} apis csv of api names to filter
 */
const loadAllScenariosFromCache = async (collections, scenarios, apis) => {
	let cachedScenarios = await utils.loadCachedScenarios();
	let filteredScenarios = cachedScenarios
		.filter(scenario =>
			utils.isAll(collections)
				? true
				: utils.splitAndTrimInput(collections).includes(utils.getCollectionNameForScenario(scenario.collection))
		)
		.filter(scenario =>
			utils.isAll(scenarios)
				? true
				: utils.splitAndTrimInput(scenarios).includes(scenario.name) ||
				utils.splitAndTrimInput(scenarios).includes(utils.getScenarioFileNameFromPath(scenario.file))
		);

	return filteredScenarios
		.map(scenario => {
			let filteredApis = scenario.endpoints.filter(e => utils.splitAndTrimInput(apis).includes(e.name));
			scenario.endpoints = filteredApis;
			return scenario;
		})
		.filter(scenario => scenario.endpoints.length > 0);
};


/**
 * Load all the scenario files and theie details from disk
 * 
 * @param {string} collections csv of collection names to filter
 * @param {string} scenarios csv of scenario names to filter
 * @param {string} apis csv of api names to filter
 */
const loadAllScenariosFromSystem = async (collections, scenarios, apis) => {
	const scenarioFiles = await readFilesInDirectory(vibPath.scenarios)

	let filteredScenarios = scenarioFiles
		.filter(scenarioFile =>
			utils.isAll(collections)
				? true
				: utils.splitAndTrimInput(collections).includes(utils.getCollectionNameForScenario(scenarioFile))
		)
		.map(file => new Promise(resolve => utils.readJsonFile(file).then(() => resolve())));

	filteredScenarios = await processScenarioFiles(filteredScenarios, apis);
	filteredScenarios = filteredScenarios.filter(scenarioFile =>
		utils.isAll(scenarios)
			? true
			: utils.splitAndTrimInput(scenarios).includes(scenarioFile.name) ||
			utils.splitAndTrimInput(scenarios).includes(utils.getScenarioFileNameFromPath(scenarioFile.file))
	);

	return filteredScenarios;
};


/**
 * Search for apis from the previously saved cache file
 * 
 * @param {string} collections csv of collection names to filter
 * @param {string} scenarios csv of scenario names to filter
 * @param {string} apis csv of api names to filter
 */
const searchForApiFromCache = async (collections, scenarios, apis) => {
	let cachedScenarios = await utils.loadCachedScenarios();
	let filteredScenarios = cachedScenarios
		.filter(scenario =>
			utils.isAll(collections) ? true : utils.includesRegex(utils.splitAndTrimInput(collections), scenario.collection)
		)
		.filter(scenario =>
			utils.isAll(scenarios)
				? true
				: utils.includesRegex(utils.splitAndTrimInput(scenarios), scenario.name) ||
				utils.includesRegex(utils.splitAndTrimInput(scenarios), utils.getScenarioFileNameFromPath(scenario.file))
		);

	return filteredScenarios
		.map(scenario => {
			let filteredApis = scenario.endpoints.filter(e =>
				utils.isAll(apis) ? true : utils.includesRegex(utils.splitAndTrimInput(apis), e.name)
			);
			scenario.endpoints = filteredApis;
			return scenario;
		})
		.filter(scenario => scenario.endpoints.length > 0);
};

/**
 * Search for scenario files and their details from disk
 * 
 * @param {string} collections csv of collection names to filter
 * @param {string} scenarios csv of scenario names to filter
 * @param {string} apis csv of api names to filter
 */
const searchForApiFromSystem = async (collections, scenarios, apis) => {
	const scenarioFiles = await readFilesInDirectory(vibPath.scenarios)

	let filteredScenarios = scenarioFiles
		.filter(scenarioFile =>
			utils.isAll(collections)
				? true
				: utils.includesRegex(utils.splitAndTrimInput(collections), utils.getCollectionNameForScenario(scenarioFile))
		)
		.map(file => new Promise(resolve => utils.readJsonFile(file).then(data => resolve(data))));

	filteredScenarios = await processScenarioFiles(filteredScenarios, apis, true);
	filteredScenarios = filteredScenarios.filter(scenarioFile =>
		utils.isAll(scenarios)
			? true
			: utils.includesRegex(utils.splitAndTrimInput(scenarios), scenarioFile.name) ||
			utils.includesRegex(utils.splitAndTrimInput(scenarios), utils.getScenarioFileNameFromPath(scenarioFile.file))
	);

	return filteredScenarios;
};

/**
 * Load all the scenario files and their details.
 * Navigates to cache of disk based on the availability of cache files
 * 
 * @param {string} collections csv of collection names to filter
 * @param {string} scenarios csv of scenario names to filter
 * @param {string} apis csv of api names to filter
 */
const loadAllScenarios = async (collections, scenarios, apis) => {
	let details;
	utils.isVibraniumInitialized();

	if (utils.cacheExists()) {
		details = await loadAllScenariosFromCache(collections, scenarios, apis);
	} else {
		details = await loadAllScenariosFromSystem(collections, scenarios, apis);
	}
	return details;
};

/**
 * Search for an api
 * Navigates to cache of disk based on the availability of cache files
 * 
 * @param {string} collections csv of collection names to filter
 * @param {string} scenarios csv of scenario names to filter
 * @param {string} apis csv of api names to filter
 */
const searchForApi = async (collections, scenarios, apis) => {
	let details;
	utils.isVibraniumInitialized();

	if (utils.cacheExists()) {
		details = await searchForApiFromCache(collections, scenarios, apis);
	} else {
		details = await searchForApiFromSystem(collections, scenarios, apis);
	}
	return details;
};


/**
 * Traverse the given path and load the value from the object at the given path
 * 
 * @param {object} hierarchy the object to be parsed
 * @param {string} path The path to traverse
 */
const findObjectFromKeyHierarchy = (hierarchy, path) => {
	let hierarchyLength = path.length, parsedObject = { ...hierarchy }
	for (let hierarchyIndex = 1; hierarchyIndex < hierarchyLength; hierarchyIndex++) {
		if (path[hierarchyIndex] === 'payload') path[hierarchyIndex] = 'payloadKey'
		if (path[hierarchyIndex] === 'length') parsedObject = parsedObject.length

		if (!!parsedObject && typeof (parsedObject) === 'object') {
			parsedObject = parsedObject[path[hierarchyIndex]]
		}
	}
	return parsedObject
}


/**
 * Compare two objects
 * 
 * @param {object} o1 Object 1
 * @param {object} o2 Object 2
 * @param {string} comparator Comparator. Can be <, >,˜ , != or =
 */
const compareObjects = (o1, o2, comparator) => {
	if (!o1) {
		return false
	} else if (comparator === '=' && !o2) {
		return !!o1
	} else if (comparator === '=') {
		return o1 == o2
	} else if (comparator === '<') {
		return o1 < o2
	} else if (comparator === '>') {
		return o1 > o2
	} else if (comparator === '˜') {
		return o1.includes(o2)
	} else if (comparator === '!=') {
		return o1 != o2
	} else {
		return !!o1
	}
}

/**
 * Filter the scenarios based on the given path.
 * 
 * @param {object} scenarios list of all scenarios
 * @param {string} keyFilter The path to the key which needs to be filtered
 * @param {string} keyValue The expected value at the path
 * @param {string} comparator The comparision operator
 */
const filterScenariosMatchingScenarioKeys = (scenarios, keyFilter, keyValue = '', comparator = '') => {
	let filteredScenarios = []
	for (let scenario of scenarios) {
		let parsedObject = findObjectFromKeyHierarchy(scenario, keyFilter.split('.'))
		if (compareObjects(parsedObject, keyValue.split('\'').join(), comparator)) {
			filteredScenarios.push(scenario)
		}
	}
	return filteredScenarios
}

/**
 * Filter the scenarios based on the given path to the endpoint object.
 * 
 * @param {object} scenarios list of all scenarios
 * @param {string} keyFilter The path to the key which needs to be filtered
 * @param {string} keyValue The expected value at the path
 * @param {string} comparator The comparision operator
 */
const filterScenariosMatchingEndpointKeys = (scenarios, keyFilter, keyValue = '', comparator = '') => {
	let filteredScenarios = []
	for (let scenario of scenarios) {
		let filteredEndpoints = []
		for (let endpoint of scenario.endpoints) {
			let parsedObject = findObjectFromKeyHierarchy(endpoint, keyFilter.split('.'))
			if (compareObjects(parsedObject, keyValue.split('\'').join(), comparator)) {
				filteredEndpoints.push(endpoint)
			}
		}
		if (filteredEndpoints.length > 0) {
			scenario.endpoints = filteredEndpoints
			filteredScenarios.push(scenario)
		}
	}
	return filteredScenarios
}

/**
 * Filter the scenarios based on the given path to the dependency object.
 * 
 * @param {object} scenarios list of all scenarios
 * @param {string} keyFilter The path to the key which needs to be filtered
 * @param {string} keyValue The expected value at the path
 * @param {string} comparator The comparision operator
 */
const filterScenariosMatchingDependencyKeys = (scenarios, keyFilter, keyValue = '', comparator = '') => {
	let filteredScenarios = []
	for (let scenario of scenarios) {
		let filteredEndpoints = []
		for (let endpoint of scenario.endpoints) {
			if (!!endpoint.dependencies && endpoint.dependencies.length > 0) {
				for (let dependency of endpoint.dependencies) {
					let parsedObject = findObjectFromKeyHierarchy(dependency, keyFilter.split('.'))
					if (compareObjects(parsedObject, keyValue.split('\'').join(), comparator)) {
						filteredEndpoints.push(endpoint)
						break
					}
				}
			}
		}
		if (filteredEndpoints.length > 0) {
			scenario.endpoints = filteredEndpoints
			filteredScenarios.push(scenario)
		}
	}
	return filteredScenarios
}


/**
 * Filter the scenarios based on the scenario keys. invoked by using the `--key` cli option
 * 
 * @param {object} scenarios list of all scenario
 * @param {string} keys keys used to filter scenarios
 */
const filterScenariosMatchingKeys = (scenarios, keys) => {
	let filters = {
		scenario: filterScenariosMatchingScenarioKeys,
		endpoint: filterScenariosMatchingEndpointKeys,
		dependency: filterScenariosMatchingDependencyKeys
	}, comparators = ['<', '>', '˜', '!=', '=']

	let comparator = comparators.filter(c => keys.includes(c))
	if (comparator.length >= 1) {
		let [keyFilter, keyValue] = keys.split(comparator[0])

		for (let filter of Object.keys(filters)) {
			if (keyFilter.startsWith(filter)) {
				return filters[filter](scenarios, keyFilter, keyValue, comparator[0])
			}
		}
	} else {
		for (let filter of Object.keys(filters)) {
			if (keys.startsWith(filter)) {
				return filters[filter](scenarios, keys)
			}
		}
	}

	return []
}


module.exports = {
	compile: loadAllScenarios,
	search: searchForApi,
	convertScenarios: convertScenarioListToApiList,
	convertApiListToTreeStructure,
	loadApiHierarchy,
	filterScenariosMatchingKeys
};
