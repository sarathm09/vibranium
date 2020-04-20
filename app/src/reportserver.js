const open = require('open')
const { join } = require('path')
const express = require('express')
const { env } = require('process')
const { initializeDatabase, getJobHistory, getAPIExecutionHistory } = require('./dbhandler')

const app = express()
const port = env.PORT || 1234


const getAllApis = async () => Object.keys(endpoints)

const endpoints = {
    '/': getAllApis,
    '/jobs': getJobHistory,
    '/apis': getAPIExecutionHistory,
    '/ui': join(__dirname, '..', 'res', 'ui', 'dist', 'index.html')
}

const responseHandler = (db, req, res, handler) => {
    try {
        let query = req.query.query ? JSON.parse(req.query.query) : {}
        let top = req.query.top ? +req.query.top : 20
        let skip = req.query.skip ? +req.query.skip : 0
        
        query = req.body && typeof(req.body) ? req.body : query
        handler(db, query, top, skip).then(data => res.json(data))
    } catch (err) {
        res.status(400).json({ message: 'Invalid query. Error: ' + err })
    }
}


module.exports = async () => {
    const db = await initializeDatabase()
    app.use(express.json())
    app.use('/res', express.static(join(__dirname, '..', 'res', 'ui', 'dist')))

    Object.entries(endpoints).forEach(([url, handler]) => {
        if (typeof (handler) === 'string') {
            app.get(url, (req, res) => res.sendFile(handler))
        }
        app.get(url, (req, res) => responseHandler(db, req, res, handler))
    })

    app.listen(port, () => {
        console.log(`Server started port ${port}!`)
        open('http://localhost:' + port)
    })
}