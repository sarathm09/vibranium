var { isNode } = require('browser-or-node');
const request = require('request')
const { red } = require('chalk')
const axios = require('axios')

const constants = require('./constants');
const logger = require('./logger')('service');

var availableSystems = {};


/**
 * Set the available systems
 *
 * @param {array} systems Availavle systems
 */
const setAvailableSystems = systems => (availableSystems = systems);


/**
 * Parse the response and form the return structure with all the details
 * 
 * @param {string} url url that was invoked
 * @param {string} method HTTP request method
 * @param {object} payload request payload
 * @param {string} auth Authorization header
 * @param {obejct} response Response object
 * @param {string} body Response data
 */
const parseAndSendResponse = (fullUrl, url, method, payload, auth, response, body) => {
	let apiResponse = body;
	if (response.statusCode != 204 && !!response.headers['content-type'] &&
		response.headers['content-type'].toLowerCase().includes('json')) {
		apiResponse = JSON.parse(body);
	}
	return {
		fullUrl,
		url,
		method,
		payload,
		auth,
		timing: response.timingPhases,
		response: apiResponse,
		status: response.statusCode,
		contentType: response.headers['content-type'],
		headers: response.headers
	}
}


/**
 * Execute the API endpoint. Select the framework to use based on the type of environment
 *
 * @private
 * @param {string} url The url to be called
 * @param {string} method REST method
 * @param {object} payload The payload for the api call
 * @param {string} auth Authentication header data
 */
const getResponse = (system, url, method, payload, auth, language = 'en', headers) =>
	isNode
		? getResponseWithRequest(system, url, method, payload, auth, language, headers)
		: getResponseWithAxios(system, url, method, payload, auth, language, headers);


/**
 * Execute the API endpoint and return a promise with the response. (Uses Axios)
 * TODO: USE another library that supports timing
 * 
 * @private
 * @deprecated
 * @param {string} url The url to be called
 * @param {string} method REST method
 * @param {object} payload The payload for the api call
 * @param {string} auth Authentication header data
 */
const getResponseWithAxios = async (system, url, method, payload, auth, language = 'en') => {
	if (system.api_url.endsWith('/')) system.api_url = system.api_url.slice(0, -1);
	if (!url.startsWith('/')) url = `/${url}`

	let timing = new Date().getTime();

	const response = await axios({
		method: method.toLowerCase(),
		url: system.api_url + url,
		data: payload,
		headers: {
			Authorization: auth,
			'Accept-Language': language,
			'Content-Type': 'application/json'
		}
	})
	timing = new Date().getTime() - timing;
	return {
		url,
		method,
		payload,
		auth,
		timing,
		response: response.data,
		status: response.status,
		contentType: response.headers['content-type']
	}
}


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
const getResponseWithRequest = (system, url, method, payload, auth, language = 'en', headers = {}) => new Promise((resolve, reject) => {
	if (system.api_url.endsWith('/')) system.api_url = system.api_url.slice(0, -1);
	if (!url.startsWith('/')) url = `/${url}`

	let requestOptions = {
		method: method ? method.toUpperCase() : 'GET',
		uri: system.api_url + url,
		body: JSON.stringify(payload),
		headers: {
			'Authorization': auth,
			'Accept-Language': language,
			'Content-Type': 'application/json',
			...headers
		},
		time: true,
		rejectUnauthorized: false
	};

	request(requestOptions, function (error, response, body) {
		if (error) printErrorAndExit(error)

		if (!!response && !!response.statusCode) {
			resolve(parseAndSendResponse(system.api_url + url, url, method, payload, auth, response, body))
		} else {
			reject({ response, error });
		}
	});
})


/**
 * Some error occured while connecting to server, so print error and exit
 * 
 * @param {Error} error The error object
 */
const printErrorAndExit = error => {
	if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
		logger.error(red('Error connecting to server') + ', Check if ');
		logger.error('\t1. You have a stable internet connection');
		logger.error('\t2. You have maintained the system configuration correctly');
		logger.error('\t3. The app is running in the server');
		process.exit(1);
	}
	return true
}


/**
 * Get the outh2 credentials and fetch the token
 *
 * @private
 * @param {object} system The system to be processed
 */
const processOauth2BasedSystemCredentials = async (systemName, system) => {
	if (!!system && !!system.credentials.clientid && !!system.credentials.secret && !!system.oauth_url) {
		if (!!system.jwt && !!system.jwtTimeout && system.jwtTimeout > new Date().getTime()) {
			return (system);
		} else {
			let authDetails = await fetchJwtToken(system.oauth_url, system.credentials.clientid, system.credentials.secret)
			return {
				...system,
				jwt: authDetails.jwt,
				jwtTimeout: authDetails.jwtTimeout + new Date().getTime()
			}
		}
	} else {
		throw ('Invalid system. System name in API: ' + systemName + ', System object: ' + JSON.stringify(system));
	}
}


/**
 * Get the basic auth credentials and fetch the token
 *
 * @private
 * @param {object} system The system to be processed
 */
const processBasicAuthBasedSystemCredentials = async system => {
	if (!!system && !!system.credentials.username && !!system.credentials.password) {
		system.auth = Buffer.from(system.credentials.username + ':' + system.credentials.password).toString('base64');
		return system;
	} else {
		throw ('Invalid system for basic auth: ' + JSON.stringify(system));
	}
}


/**
 * Get the system details from the config
 * 
 * @param {string} systemName name of the system from config.json
 */
const getSystemDetails = systemName => {
	let system = availableSystems.default;

	if (!!systemName && !!availableSystems[systemName]) system = availableSystems[systemName]
	else if (systemName) logger.error(`System ${systemName} not found`)

	if (!system.method) system.method = constants.authTypes.oauth2[0]

	return system
}

/**
 * fetch the system/auth details and call the api endpoint
 *
 * @param {string} url The url to be called
 * @param {string} method REST method
 * @param {object} payload The payload for the api call
 * @param {string} systemName The system on which the api needs to be executed
 */
const callApi = (url, method, payload, systemName, language = 'en', headers) => new Promise((resolve, reject) => {
	let system = getSystemDetails(systemName)

	if (constants.authTypes.oauth2.includes(system.method)) {
		processOauth2BasedSystemCredentials(systemName, system)
			.then(systemWithAuth => getResponse(system, url, method, payload, `Bearer ${systemWithAuth.jwt}`, language, headers))
			.then(resolve).catch(reject)

	} else if (constants.authTypes.basic.includes(system.method)) {
		processBasicAuthBasedSystemCredentials(system)
			.then(systemWithAuth => getResponse(system, url, method, payload, `Basic ${systemWithAuth.auth}`, language, headers))
			.then(resolve).catch(reject)

	} else if (constants.authTypes.none.includes(system.method)) {
		getResponse(system, url, method, payload, '', language)
			.then(resolve).catch(reject)
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
			if (!url.endsWith('/')) url += '/';
			url += 'oauth/token?grant_type=client_credentials';
		}
		url += '?grant_type=client_credentials';
	}

	let requestOptions = {
		method: 'get',
		uri: url,
		headers: {
			Authorization: `Basic ${Buffer.from(clientId + ':' + clientSecret).toString('base64')}`
		}
	}

	request(requestOptions, (error, response, body) => {
		if (error) {
			printErrorAndExit(error)
			reject(error)
		}

		if (!!response && response.statusCode < 400) {
			const resp = JSON.parse(body)
			resolve({
				jwt: resp.access_token,
				scopes: resp.scope,
				jwtTimeout: resp.expires_in
			});
		} else {
			reject(error)
		}
	})
})


module.exports = {
	callApi,
	getSystemDetails,
	setAvailableSystems
};
