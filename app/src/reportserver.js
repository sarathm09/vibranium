const open = require('open')
const { join } = require('path')
const express = require('express')
const { env } = require('process')
const { initializeDatabase, getJobHistory, getAPIExecutionHistory } = require('./dbhandler')

const app = express()
const port = env.PORT || 1234

const getApisExecutedInAJob = async (db, req, res) => {
	let top = req.query.top ? +req.query.top : 1000,
		skip = req.query.skip ? +req.query.skip : 0,
        keys = { name: 1, url: 1, '_result.timing': 1, _status: 1, scenario: 1, collection: 1 }
        
    let apisForJob = await getAPIExecutionHistory(db, { jobId: req.params.jobId }, keys, top, skip)
    res.json(apisForJob.map(api => {
        return {
            _id: api._id,
            name: api.name,
            url: api.url,
            status: api._status,
            scenario: api.scenario,
            collection: api.collection,
            time: api._result.timing.total
        }
    }))
}

const responseHandler = (db, req, res, handler) => {
	try {
		let query = req.query || {},
			top = req.query.top ? +req.query.top : 100,
			skip = req.query.skip ? +req.query.skip : 0,
			keys = req.query.select
				? req.query.select.split(',').reduce((a, c) => {
						a[c] = 1
						return a
				  }, {})
				: undefined

		delete query['select']
		query = req.method === 'POST' && Object.keys(req.body).length > 0 ? req.body : query
		if (query._id) query._id = +query._id

		handler(db, query, keys, top, skip).then(data => res.json(data))
	} catch (err) {
		res.status(400).json({ message: 'Invalid query. Error: ' + err })
	}
}

module.exports = async () => {
	const db = await initializeDatabase()
	const uiPage = join(__dirname, '..', 'res', 'ui', 'dist', 'index.html')
	app.use(express.json())
	app.use('/res', express.static(join(__dirname, '..', 'res', 'ui', 'dist')))

	app.get('/', (req, res) => res.json({}))
	app.get('/ui', (req, res) => res.sendFile(uiPage))
	app.get('/ui/jobs', (req, res) => res.sendFile(uiPage))
	app.get('/ui/jobs/:jobId', (req, res) => res.sendFile(uiPage))
	app.get('/ui/jobs/:jobId/apis/:apiId', (req, res) => res.sendFile(uiPage))

	app.get('/jobs', (req, res) => responseHandler(db, req, res, getJobHistory))
	app.get('/apis', (req, res) => responseHandler(db, req, res, getAPIExecutionHistory))
	app.get('/jobs/:jobId', (req, res) => getApisExecutedInAJob(db, req, res))

	app.listen(port, () => {
		console.log(`Server started port ${port}!`)
		//open('http://localhost:' + port)
	})
}
