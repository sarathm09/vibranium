const Datastore = require('nedb');
const { join } = require('path')


/**
 * Log if there are any error on database index creation
 * @param {Error} err error to be logged
 */
const logErrorInDatabaseIndexCreation = err => { if (err) console.error(err) }


/**
 * Initialize the database objects.
 * TODO: Add support for mongo if found in env vars
 */
const initializeDatabase = async () => {
	let db = {
		apiCache: new Datastore({ inMemoryOnly: true, autoload: true }),
		apiResponseCache: new Datastore({ inMemoryOnly: true, autoload: true }),

		apis: new Datastore({ filename: join(__dirname, '..', 'db', 'apis.db'), autoload: true }),
		jobs: new Datastore({ filename: join(__dirname, '..', 'db', 'jobs.db'), autoload: true })
	};

	['name', 'scenario', 'collection'].forEach(key => {
		db.apiResponseCache.ensureIndex({ fieldName: key }, logErrorInDatabaseIndexCreation)
		db.apiCache.ensureIndex({ fieldName: key }, logErrorInDatabaseIndexCreation)
	});

	['name', 'scenario', 'collection', 'jobId'].forEach(key =>
		db.apis.ensureIndex({ fieldName: key }, logErrorInDatabaseIndexCreation));

	return db;
}


/**
 * API/SCENARIO caching
 */

/**
 * Store scenario/api raw data in cache 
 * 
 * @param {Datastore} db The Nedb datastore object
 * @param {object} scenarios Details to be stored in cache
 */
const updateApiCache = (db, scenarios) => new Promise((resolve) => {
	if (db === '') resolve()
	db.apiCache.insert(scenarios, (err, docs) => {
		if (err) console.error(err)
		resolve(docs)
	})
})


/**
 * Find the dependent api from cache
 * 
 * @param {Datastore} db Nedb datastore object
 * @param {string} collection collection name
 * @param {string} scenario Scenario name
 * @param {string} api API name
 */
const findApiDetailsFromCache = (db, collection, scenario, api) => new Promise((resolve, reject) => {
	db.apiCache.find({ name: api, collection: collection, $or: [{ scenario: scenario }, { scenarioFile: scenario }] })
		.exec(async (err, values) => {
			if (err || values.length === 0) reject()
			else resolve(values[0])
		})
})


/**
 * JOB EXECUTION DATA
 */

/**
 * Store job execution data in cache
 * 
 * @param {Datastore} db The Nedb datastore object
 * @param {object} details Details to be stored in cache
 */
const insertJobHistory = (db, details) => new Promise(resolve => {
	if (!db || db === '') resolve()
	db.jobs.insert(details, (err, docs) => {
		if (err) console.error(err)
		resolve(docs)
	})
})

/**
 * Get the list of jobs matching the query
 * 
 * @param {Datastore} db The Nedb datastore object
 * @param {object} query The query object
 */
const getJobHistory = (db, query = {}, keys, top = 100, skip = 0) => new Promise(resolve => {
	db.jobs.find(query, keys).skip(skip).limit(top).sort({ jobId: -1 }).exec((err, docs) => {
		if (err) console.error(err)
		resolve(docs)
	})
})


/**
 * Remove entries from job history table
 * 
 * @param {Datastore} db The Nedb datastore object
 * @param {object} query The query object
 */
const deleteJobHistory = (db, query = {}) => new Promise(resolve => {
	db.remove(query, {}, function (err, numRemoved) {
		if (err) console.error(err)
		deleteApiExecutionData(db, query)
			.then(resolve(numRemoved))
	})
})

/**
 * API EXECUTION DATA
 */

/**
 * Store API execution data in db
 * 
 * @param {Datastore} db The Nedb datastore object
 * @param {object} details Details to be stored in cache
 */
const insertApiExecutionData = (db, details) => new Promise(resolve => {
	if (!db || db === '') resolve()
	let data = { ...details }
	if (!!details._result && !!details._result.response && typeof details._result.response === 'object') {
		if (Object.values(details._result.response) > 10) {
			data._result.response = { truncatedData: data._result.response.slice(0, 10) }
		}
	} else {
		let size = JSON.stringify(details._result.response).length;
		if (size > 1000) {
			data._result.response = { truncatedData: data._result.response.slice(0, 1000) }
		}
	}
	db.apis.insert(details, (err, docs) => {
		if (err) console.error(err)
		resolve(docs)
	})
})

/**
 * Remove entries from api execution data table
 * 
 * @param {Datastore} db The Nedb datastore object
 * @param {object} query The query object
 */
const deleteApiExecutionData = (db, query = {}) => new Promise(resolve => {
	db.remove(query, {}, function (err, numRemoved) {
		if (err) console.error(err)
		resolve(numRemoved)
	});
})

/**
 * Get the list of api history matching the query
 * 
 * @param {Datastore} db The Nedb datastore object
 * @param {object} query The query object
 */
const getAPIExecutionHistory = (db, query = {}, keys, top = 20, skip = 0) => new Promise(resolve => {
	db.apis.find(query, keys).skip(skip).limit(top).sort({ jobId: -1 }).exec((err, docs) => {
		if (err) console.error(err)
		resolve(docs)
	})
})

/**
 * API RESPONSE CACHING
 */

/**
 * Store API response data in cache
 * 
 * @param {Datastore} db The Nedb datastore object
 * @param {object} details Details to be stored in cache
 */
const insertApiResponseCache = (db, details) => new Promise(resolve => {
	db.apiResponseCache.insert(details, (err, docs) => {
		if (err) console.error(err)
		resolve(docs)
	})
})

/**
 * Store API response data in cache
 * 
 * @param {Datastore} db The Nedb datastore object
 * @param {object} details Details to be stored in cache
 */
const findApiResponseFromCache = (db, collection, scenario, api) => new Promise((resolve, reject) => {
	db.apiResponseCache.find({ name: api, collection: collection, scenario: scenario })
		.exec(async (err, values) => {
			if (err || values.length === 0) reject()
			else resolve(values[0])
		})
})



module.exports = {
	getJobHistory,
	updateApiCache,
	deleteJobHistory,
	insertJobHistory,
	initializeDatabase,
	deleteApiExecutionData,
	getAPIExecutionHistory,
	insertApiResponseCache,
	insertApiExecutionData,
	findApiDetailsFromCache,
	findApiResponseFromCache
}

