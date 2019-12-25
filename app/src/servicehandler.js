var { isNode } = require('browser-or-node');
const request = require('request')
const axios = require('axios')

const logHandler = require('./loghandler')
const constants = require('./constants')

var availableSystems = {}
const logger = logHandler.moduleLogger('servicehandler')


/**
 * Set the available systems
 * 
 * @param {array} systems Availavle systems
 */
const setAvailableSystems = systems => availableSystems = systems


/**
 * Execute the API endpoint. Select the framework to use based on the type of environment
 * 
 * @private
 * @param {string} url The url to be called
 * @param {string} method REST method
 * @param {object} payload The payload for the api call
 * @param {string} auth Authentication header data
 */
const getResponse = (system, url, method, payload, auth, language = 'en') => isNode ?
    getResponseWithRequest(system, url, method, payload, auth, language) : getResponseWithAxios(system, url, method, payload, auth, language)



/**
 * Execute the API endpoint and return a promise with the response. (Uses Axios)
 * 
 * @private
 * @param {string} url The url to be called
 * @param {string} method REST method
 * @param {object} payload The payload for the api call
 * @param {string} auth Authentication header data
 */
const getResponseWithAxios = async (system, url, method, payload, auth, language = 'en') => new Promise((resolve, reject) => {
    let timing = new Date().getTime();
    let request = {
        method: method.toLowerCase(),
        url: system.api_url + url,
        data: payload,
        headers: {
            'Authorization': auth,
            'Accept-Language': language
        }
    }
    axios(request)
        .then(response => {
            timing = new Date().getTime() - timing
            resolve({
                url,
                method,
                payload,
                auth,
                timing,
                response: response.data,
                status: response.status,
                contentType: response.headers['content-type']
            })
        })
        .catch(err => reject(err));
})


/**
 * Execute the API endpoint and return a promise with the response. (Uses Node request module)
 * 
 * @private
 * @param {string} url The url to be called
 * @param {string} method REST method
 * @param {object} payload The payload for the api call
 * @param {string} auth Authentication header data
 * 
 * timing info:
 * 'response.timingPhases' Contains the durations of each request phase. 
 * If there were redirects, the properties reflect the timings of the final request in the redirect chain:
 * 
 * wait: Duration of socket initialization (timings.socket)
 * dns: Duration of DNS lookup (timings.lookup - timings.socket)
 * tcp: Duration of TCP connection (timings.connect - timings.socket)
 * firstByte: Duration of HTTP server response (timings.response - timings.connect)
 * download: Duration of HTTP download (timings.end - timings.response)
 * total: Duration entire HTTP round-trip (timings.end)
 */
const getResponseWithRequest = async (system, url, method, payload, auth, language = 'en') => new Promise((resolve, reject) => {
    let requestOptions = {
        method: method.toUpperCase(),
        uri: system.api_url + url,
        body: JSON.stringify(payload),
        headers: {
            'Authorization': auth,
            'Accept-Language': language
        },
        time: true,
        rejectUnauthorized: false
    }

    request(requestOptions, function (error, response, body) {
        if (error) {
            if (error.code === 'ECONNREFUSED') {
                logger.error('Error connecting to server. Check if ')
                logger.error('\t1. You have a stable internet connection')
                logger.error('\t2. You have maintained the system configuration correctly')
                logger.error('\t3. The app is running in the server')
            }
            process.exit(1)
            reject(error)
        }

        if (!!response && !!response.statusCode) {
            let apiResponse = body
            if (response.headers['content-type'].includes('json')) {
                apiResponse = JSON.parse(body)
            }
            resolve({
                url,
                method,
                payload,
                auth,
                timing: response.timingPhases,
                response: apiResponse,
                status: response.statusCode,
                contentType: response.headers['content-type']
            })
        }
    });
})


/**
 * Get the outh2 credentials and fetch the token
 * 
 * @private
 * @param {object} system The system to be processed
 */
const processOauth2BasedSystemCredentials = (systemName, system) => new Promise((resolve, reject) => {
    if (!!system && !!system.credentials.client && !!system.credentials.secret && !!system.credentials.authUrl) {
        if (!!system.jwt && !!system.jwtTimeout && system.jwtTimeout > new Date().getTime()) {
            resolve(system)
        } else {
            fetchJwtToken(system.credentials.authUrl, system.credentials.client, system.credentials.secret)
                .then(authDetails => {
                    availableSystems[systemName].jwt = authDetails.jwt
                    availableSystems[systemName].jwtTimeout = authDetails.jwtTimeout + new Date().getTime()
                    resolve(availableSystems[systemName])
                })
        }
    } else {
        reject('Invalid system')
    }
})


/**
 * Get the basic auth credentials and fetch the token
 * 
 * @private
 * @param {object} system The system to be processed
 */
const processBasicAuthBasedSystemCredentials = system => new Promise((resolve, reject) => {
    if (!!system && !!system.credentials.username && !!system.credentials.password) {
        system.auth = `Basic ${new Buffer(system.credentials.username + ':' + system.credentials.password).toString('base64')}`
        resolve(system)
    } else {
        reject('Invalid system')
    }
})


/**
 * fetch the system/auth details and call the api endpoint
 * 
 * @param {string} url The url to be called
 * @param {string} method REST method
 * @param {object} payload The payload for the api call
 * @param {string} systemName The system on which the api needs to be executed
 */
const callApi = (url, method, payload, systemName, language = 'en') => new Promise((resolve, reject) => {
    let system = availableSystems.default

    if (!!systemName && !!availableSystems[systemName]) system = availableSystems[systemName]
    if (!system.method) system.method = constants.authTypes.oauth2[0]

    if (constants.authTypes.oauth2.includes(system.method)) {
        processOauth2BasedSystemCredentials(systemName, system)
            .then(systemWithAuth => getResponse(system, url, method, payload, `Bearer ${systemWithAuth.jwt}`, language))
            .then(responseWithTiming => resolve(responseWithTiming))
            .catch(err => reject(err))
    } else if (constants.authTypes.basic.includes(system.method)) {
        processBasicAuthBasedSystemCredentials
            .then(systemWithAuth => getResponse(system, url, method, payload, `Basic ${systemWithAuth.auth}`, language))
            .then(responseWithTiming => resolve(responseWithTiming))
            .catch(err => reject(err))
    } else if (constants.authTypes.none.includes(system.method)) {
        getResponse(system, url, method, payload, '', language)
            .then(responseWithTiming => resolve(responseWithTiming))
            .catch(err => reject(err))
    }
})


/**
 * Fetch the jwt token for the system with the client credentials flow.
 * 
 * @private
 * @param {string} url The auth url
 * @param {string} clientId client id for the system
 * @param {string} clientSecret client secret for the client id
 * @returns Promise object with token and jwt timeout
 */
const fetchJwtToken = (url, clientId, clientSecret) => new Promise((resolve, reject) => {
    if (!url.includes('grant_type')) {
        if (!url.includes('/oauth/token')) {
            if (!url.endsWith('/')) url += '/'
            url += 'oauth/token?grant_type=client_credentials'
        }
        url += '?grant_type=client_credentials'
    }
    getResponse(url, 'GET', undefined, `Basic ${new Buffer(clientId + ':' + clientSecret).toString('base64')}`)
        .then(resp => {
            resolve({
                jwt: resp.response.access_token,
                scopes: resp.response.scopes,
                jwtTimeout: resp.response.timeout // TODO
            })
        })
        .catch(err => reject(err))
})


module.exports = {
    callApi,
    setAvailableSystems
}
