const express = require('express')
const bodyParser = require("body-parser");
const uuidv4 = require('uuid/v4');
const mocks = require('./mocks.json')


const app = express()
const port = 3000
app.use(bodyParser.json());


const replaceVariables = (req, data) => {
    let stringResp = JSON.stringify(data)
    for (const param of Object.keys(req.params)) {
        stringResp = stringResp.replace(`{${param}}`, req.params[param])
    }
    
    stringResp = stringResp.replace('{uuid}', uuidv4())
    let response = JSON.parse(stringResp)

    response.query = req.query;
    response.payload = req.body;
    
    return response;
}

const getResponse = (req, res, mock) => {
    if (!!mock.response && typeof(mock.response) === 'object') {
        res.json(replaceVariables(req, mock.response))
    } else if (!!mock.response && typeof(mock.response) === 'number') {
        res.sendStatus(mock.response)
    } else {
        res.sendStatus(500)
    }
}

const response = (req, res, mock) => setTimeout(() => getResponse(req, res, mock), Math.random(100) * 1000)


for (const mock of mocks) {
    if (mock.method === 'GET') app.get(mock.url, (req, res) => response(req, res, mock))
    if (mock.method === 'POST') app.post(mock.url, (req, res) => response(req, res, mock))
    if (mock.method === 'PUT') app.put(mock.url, (req, res) => response(req, res, mock))
    if (mock.method === 'DELETE') app.delete(mock.url, (req, res) => response(req, res, mock))
}
app.get('/', (req, res) => res.json({}))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))