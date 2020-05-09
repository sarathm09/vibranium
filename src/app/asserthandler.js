const Ajv = require('ajv')
const { VM } = require('vm2')
const { join } = require('path')
const { cyan } = require('chalk')
const { readFile } = require('fs').promises

const { SCHEMA_SPECIFICATION_V6, vibPath } = require('./constants')
const logger = require('./logger')('assert');


/**
 * Convert the parameters to a common Object for all tests
 * 
 * @param {string} testName Test name
 * @param {object} expected expected vlue for the test
 * @param {object} obtained obtained value for the test
 * @param {boolean} result Test status
 */
const getAssertResponse = (testName, expected, obtained, result) => {
    return {
        test: testName,
        expected,
        obtained,
        result
    }
}

/**
 * Load the schema json from the given path
 * 
 * @param {string} pathVariable The string in the schema key, denoting the path to the schema file
 */
const getSchemaFileFromPath = async pathVariable => {
    try {
        ['!', '.json'].forEach(item => {
            pathVariable = pathVariable.split(item).join('')
        });
        ['/', '\\'].forEach(item => {
            pathVariable = pathVariable.split(item).join('.')
        });

        let pathToSchema = join(vibPath.schemas, ...pathVariable.split('.'))
        let jsonSchema = await readFile(pathToSchema + '.json', 'utf-8')

        return { status: true, data: JSON.parse(jsonSchema) }
    } catch (error) {
        logger.error(`Could not load schema file, error: ${error}`)
        return { status: false, error }
    }
}

/**
 * Validate all assertions in the response body
 * 
 * @param {object} endpoint The endpoint object
 * @param {object} response The response object
 * @param {function} replacePlaceholderInString THe utility function to replace variables in the assertion statements
 * @param {object} variables Endpoint Variables
 */
const responseBodyCheck = async (endpoint, response, replacePlaceholderInString, variables) => {
    let assertResponse = []
    const vm = new VM({
        external: true,
        sandbox: {}
    });
    if (!!endpoint.expect && !!endpoint.expect.response) {
        if (!Array.isArray(endpoint.expect.response)) {
            // eslint-disable-next-line no-unused-vars
            let { schema, ...asserts } = endpoint.expect.response
            try {
                for (let [testName, testString] of Object.entries(asserts)) {
                    testString = replacePlaceholderInString(testString, { ...variables, response: response.response }, false)
                    logger.info(`Running comparison ${cyan(testString)}`)
                    let scriptResponse = vm.run(testString)
                    assertResponse.push(getAssertResponse(testName, testString, scriptResponse, scriptResponse === true))
                }
            } catch (err) {
                console.error(`Error comparing response: ${err}`)
            }
        }

    }
    return assertResponse
}


/**
 * Parse AJV validation object to get response errors
 * 
 * @param {array} errors AJV validation errors
 */
const ajvResponseParser = (errors) => {
    return errors.map(err => {
        if (err.keyword === 'additionalProperties') {
            return getAssertResponse(`Response schema [${err.message} '${err.params.additionalProperty}']`, `${err.message} '${err.params.additionalProperty}'`, '', false)
        } if (err.keyword === 'required') {
            return getAssertResponse(`Response schema [${err.message}]`, `${err.message}`, '', false)
        }
        return getAssertResponse(`Response schema [${err.message}]`, `${err.message}`, '', false)
    })

}


/**
 * Handle all asserts in endpoint status
 * 
 * @param {object} endpoint The api object
 * @param {object} response API execution response
 */
const responseStatusCheck = async (endpoint, response) => {
    let expectedStatus = 200;
    if (!!endpoint.expect && !!endpoint.expect.status) expectedStatus = endpoint.expect.status;
    return [
        getAssertResponse('Response status', expectedStatus, response.status, response.status === expectedStatus)
    ]
}

/**
 * Handle all asserts in endpoint response header
 * 
 * @param {object} endpoint The api object
 * @param {object} response API execution response
 */
const responseHeaderCheck = async (endpoint, response) => {
    let assertResponse = []
    if (!!endpoint.expect && !!endpoint.expect.header) {
        for (const [key, value] of Object.entries(endpoint.expect.header)) {
            assertResponse.push(getAssertResponse(`Response header [${key.toLowerCase()}]`,
                value, response.headers[key.toLowerCase()], response.headers[key.toLowerCase()] && response.headers[key.toLowerCase()].includes(value)))
        }
    }
    return assertResponse
}

/**
 * Handle all checks based on endpoint response schema
 * 
 * @param {object} endpoint The api object
 * @param {object} response API execution response
 */
const responseSchemaCheck = async (endpoint, response) => {
    let assertResponse = []
    if (!!endpoint.expect && !!endpoint.expect.response && !!endpoint.expect.response.schema) {

        const ajv = new Ajv({ allErrors: true })
        ajv.addMetaSchema(SCHEMA_SPECIFICATION_V6)
        let schema = await getSchemaFileFromPath(endpoint.expect.response.schema)
        if (schema && schema.status) {
            if (!ajv.validate(schema.data, response.response)) {
                assertResponse.push(...ajvResponseParser(ajv.errors))
            } else {
                assertResponse.push(getAssertResponse('Response schema', endpoint.expect.response.schema, [], true))
            }
        } else {
            assertResponse.push(getAssertResponse('Response schema', endpoint.expect.response.schema, ['Could not load schema'], false))
        }
    }
    return assertResponse
}

/**
 * Handle all asserts in endpoint response timing
 * 
 * @param {object} endpoint The api object
 * @param {object} response API execution response
 */
const responseTimingCheck = async (endpoint, response) => {
    let assertResponse = []
    if (!!endpoint.expect && !!endpoint.expect.timing) {
        for (const [key, value] of Object.entries(endpoint.expect.timing)) {
            let status = response.timing[key] === value
            if (isNaN(value)) {
                status = new VM({ external: true, sandbox: {} }).run(`${response.timing[key]} ${value}`)
            }
            assertResponse.push(getAssertResponse(`Response header [${key}]`,
                value, response.timing[key], status))
        }
    }
    return assertResponse
}


/**
 * @public
 * Use the endpoint.expect object to prossess assertions on endpoint response status, header, body and timing
 * 
 * @param {object} endpoint The endpoint object in the scenario
 * @param {object} response Endpoint response
 * @param {function} replacePlaceholderInString Function to replace all endpoint placeholder variables
 * @param {object} variables Endpoint variables
 * @returns {array} assertion results
 */
const processAssertionsInResponse = async (endpoint, response, replacePlaceholderInString, variables) => {
    let assertionChecks = [
        responseStatusCheck(endpoint, response),
        responseHeaderCheck(endpoint, response),
        responseBodyCheck(endpoint, response, replacePlaceholderInString, variables),
        responseSchemaCheck(endpoint, response),
        responseTimingCheck(endpoint, response)
    ]

    let results = await Promise.all(assertionChecks)
    return results.reduce((a, c) => [...a, ...c], [])
}


module.exports = {
    processAssertionsInResponse
}