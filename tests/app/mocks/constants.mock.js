const { join } = require('path')
const { homedir } = require('os')
const { readFileSync } = require('fs')

let workspace = __dirname, testsDirectory = 'Vibranium-Tests'

module.exports = {
    userConfig: JSON.parse(readFileSync(join(__dirname, 'config.json'))),
    vibSchemas: {
        scenario: JSON.parse(readFileSync(join(__dirname, '..', '..', '..', 'src', 'res', 'schemas', 'scenario.json'), 'utf-8')),
        endpoint: JSON.parse(readFileSync(join(__dirname, '..', '..', '..', 'src', 'res', 'schemas', 'endpoint.json'), 'utf-8'))
    },

    SCHEMA_SPECIFICATION_V6: {},

    vibPath: {
        systemVibPath: join(homedir(), '.vib'),
        workspace,
        jobs: workspace ? join(workspace, 'jobs') : '',
        logs: workspace ? join(workspace, 'logs') : '',
        scenarios: workspace ? join(workspace, testsDirectory, 'scenarios') : '',
        templates: workspace ? join(workspace, testsDirectory, 'templates') : '',
        payloads: workspace ? join(workspace, testsDirectory, 'payloads') : '',
        schemas: workspace ? join(workspace, testsDirectory, 'schemas') : '',
        cache: workspace ? join(workspace, '.cache') : '',
        cachedScenarios: workspace ? join(workspace, '.cache', 'scenarios.json') : ''
    },

    authTypes: {
        oauth2: ['jwt', 'cf-jwt', 'client-credentials', 'oauth2', 'jwt-token'],
        basic: ['basic', 'username-password', 'basic-authentication'],
        none: ['none']
    },

    executionStatus: {
        SUCESS: 'SUCCESS',
        FAIL: 'FAIL',
        ERROR: 'ERROR'
    },

    scriptTypes: {
        // Scenario level scripts
        beforeScenario: 'before-scenario',
        afterScenario: 'after-scenario',

        beforeEach: 'before-each',
        afterEach: 'after-each',
        afterGlobals: 'after-globals',

        // Endpoint level scripts
        beforeEndpoint: 'before-endpoint',
        afterEndpoint: 'after-endpoint',

        afterDependencies: 'after-dependencies'
    },

    logLevels: {
        error: 0,
        warn: 1,
        log: 2,
        success: 3,
        info: 4,
        debug: 5
    },


    loremGeneratorConfig: {
        sentencesPerParagraph: {
            max: 8,
            min: 4
        },
        wordsPerSentence: {
            max: 16,
            min: 4
        }
    },

    timeVariables: {
        timestamp_n: () => new Date().getTime(),
        timestamp: () => new Date().toISOString(),
        time: () => new Date().toLocaleTimeString(),
        time_ms: () => new Date().getMilliseconds(),
        time_sec: () => new Date().getSeconds(),
        time_min: () => new Date().getMinutes(),
        time_hours: () => new Date().getHours(),

        date: () => new Date().toLocaleDateString(),
        date_date: () => new Date().getDate(),
        date_month: () => new Date().getMonth(),
        date_month_name_long: () => new Date().toLocaleString('default', { month: 'long' }),
        date_month_name: () => new Date().toLocaleString('default', { month: 'short' }),
        date_year: () => new Date().getFullYear(),
    },

    colorCodeRegex: /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,

    logRotationConstants: {
        h: 60 * 60,
        d: 24 * 60 * 60,
        y: 365 * 24 * 60 * 60
    },

    dataSets: { names: [] },

    loadDataLists: async () => {
        module.exports.dataSets.data = {
            names: [],
            harrypotter: [],
            starWars: [],
            pokemon: [],
            got: [],
            marvel: []
        }
        return
    }
}