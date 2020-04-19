const Datastore = require('nedb');
const { join } = require('path')


const logErrorInDatabaseIndexCreation = err => { if (err) console.log(err) }

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



const updateApiCache = (db, scenarios) => new Promise((resolve) => {
	db.apiCache.insert(scenarios, (err, docs) => {
		if (err) console.log(err)
		resolve(docs)
	})
})


const findApiDetailsFromCache = (db, collection, scenario, api) => new Promise((resolve, reject) => {
	db.apiCache.find({ name: api, collection: collection, scenario: scenario })
		.exec(async (err, values) => {
			if (err || values.length === 0) reject()
			else resolve(values[0])
		})
})

const insertJobHistory = (db, details) => new Promise(resolve => {
	db.jobs.insert(details, (err, docs) => {
		if (err) console.log(err)
		resolve(docs)
	})
})

const insertApiExecutionData = (db, details) => new Promise(resolve => {
	db.apis.insert(details, (err, docs) => {
		if (err) console.log(err)
		resolve(docs)
	})
})


const insertApiResponseCache = (db, details) => new Promise(resolve => {
	db.apiResponseCache.insert(details, (err, docs) => {
		if (err) console.log(err)
		resolve(docs)
	})
})


const findApiResponseFromCache = (db, collection, scenario, api) => new Promise((resolve, reject) => {
	db.apiResponseCache.find({ name: api, collection: collection, scenario: scenario })
		.exec(async (err, values) => {
			if (err || values.length === 0) reject()
			else resolve(values[0])
		})
})



module.exports = {
	initializeDatabase,
	updateApiCache,
	insertJobHistory,
	insertApiExecutionData,
	findApiDetailsFromCache,
	insertApiResponseCache,
	findApiResponseFromCache
}

