const open = require('open')
const { join } = require('path')
const express = require('express')
const { env } = require('process')
const { initializeDatabase, getJobHistory, getAPIExecutionHistory, deleteJobHistory } = require('./dbhandler')

const app = express()
const port = env.PORT || 1234

/**
 * 404 reponse HTML
 */
const error404 = () => '<head><style>@import url(https://fonts.googleapis.com/css?family=Inconsolata);html{min-height:100%}body{box-sizing:border-box;height:100%;background-color:#000;background-image:radial-gradient(#11581e,#041607),url(https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif);background-repeat:no-repeat;background-size:cover;font-family:Inconsolata,Helvetica,sans-serif;font-size:1.5rem;color:rgba(128,255,128,.8);text-shadow:0 0 1ex #3f3,0 0 2px rgba(255,255,255,.8)}.noise{pointer-events:none;position:absolute;width:100%;height:100%;background-image:url(https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif);background-repeat:no-repeat;background-size:cover;z-index:-1;opacity:.02}.overlay{pointer-events:none;position:absolute;width:100%;height:100%;background:repeating-linear-gradient(180deg,rgba(0,0,0,0) 0,rgba(0,0,0,.3) 50%,rgba(0,0,0,0) 100%);background-size:auto 4px;z-index:1}.overlay::before{content:"";pointer-events:none;position:absolute;display:block;top:0;left:0;right:0;bottom:0;width:100%;height:100%;background-image:-webkit-gradient(linear,left bottom,left top,from(transparent),color-stop(2%,rgba(32,128,32,.2)),color-stop(3%,rgba(32,128,32,.8)),color-stop(3%,rgba(32,128,32,.2)),to(transparent));background-image:linear-gradient(0deg,transparent 0,rgba(32,128,32,.2) 2%,rgba(32,128,32,.8) 3%,rgba(32,128,32,.2) 3%,transparent 100%);background-repeat:no-repeat;-webkit-animation:scan 7.5s linear 0s infinite;animation:scan 7.5s linear 0s infinite}@-webkit-keyframes scan{0%{background-position:0 -100vh}100%,35%{background-position:0 100vh}}@keyframes scan{0%{background-position:0 -100vh}100%,35%{background-position:0 100vh}}.terminal{box-sizing:inherit;position:absolute;height:100%;width:1000px;max-width:100%;padding:4rem;text-transform:uppercase}.output{color:rgba(128,255,128,.8);text-shadow:0 0 1px rgba(51,255,51,.4),0 0 2px rgba(255,255,255,.8)}.output::before{content:"> "}a{color:#fff;text-decoration:none}a::before{content:"["}a::after{content:"]"}.errorcode{color:#fff}</style><body><div class="noise"></div><div class="overlay"></div><div class="terminal"> <h1>Error <span class="errorcode">404</span></h1> <p class="output">The page you are looking for might have been removed, had its name changed or is temporarily unavailable.</p><p class="output">Please try to <a href="/ui">return to the homepage</a>.</p><p class="output">Good luck.</p></div></body>'


/**
 * Get all APIs executed in a given Job Id
 * 
 * @param {DataStore} db The Database Object
 * @param {Request} req Express Js requiest object
 * @param {Response} res Express JS Response object
 */
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


/**
 * Common response handler to handle inital tasks
 * 
 * @param {DataStore} db The Database Object
 * @param {Request} req Express Js requiest object
 * @param {Response} res Express JS Response object
 * @param {function} handler The Handler function to be called after the inital tasks are done
 */
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
        delete query['top']
        delete query['skip']
        query = req.method === 'POST' && Object.keys(req.body).length > 0 ? req.body : query
        if (query._id) query._id = +query._id

        handler(db, query, keys, top, skip).then(data => res.json(data))
    } catch (err) {
        res.status(400).json({ message: 'Invalid query. Error: ' + err })
    }
}

/**
 * All methods are initialized here as the server needs to be started only on certain commands
 * In all other cases, this node should not be executed.
 * 
 */
module.exports = async () => {
    let db = await initializeDatabase()

    const uiPage = join(__dirname, '..', 'res', 'ui', 'index.html')
    app.use(express.json())
    app.use('/res', express.static(join(__dirname, '..', 'res', 'ui')))

    app.get('/', (_, res) => res.redirect('/ui'))
    app.get('/ui', (req, res) => res.sendFile(uiPage))
    app.get('/ui/jobs', (req, res) => res.sendFile(uiPage))
    app.get('/ui/jobs/:jobId', (req, res) => res.sendFile(uiPage))
    app.get('/ui/jobs/:jobId/apis/:apiId', (req, res) => res.sendFile(uiPage))

    app.get('/jobs', (req, res) => responseHandler(db, req, res, getJobHistory))
    app.delete('/jobs', (req, res) => responseHandler(db, req, res, deleteJobHistory))
    app.get('/apis', (req, res) => responseHandler(db, req, res, getAPIExecutionHistory))
    app.get('/jobs/:jobId', (req, res) => getApisExecutedInAJob(db, req, res))

    app.get('*', (req, res) => res.send(error404()))

    app.listen(port, () => {
        console.log(`Server started port ${port}!`)
        open('http://localhost:' + port)
    })
}
