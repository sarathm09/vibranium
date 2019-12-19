const { join } = require('path')
const { homedir } = require('os')
const { readFileSync } = require('fs')


let workspace, systemConfig, userConfig;
try {
    systemConfig = JSON.parse(readFileSync(join(homedir(), '.vib', 'config.json'), 'utf-8'))
    workspace = systemConfig.workspace
    userConfig = JSON.parse(readFileSync(join(workspace, 'config.json'), 'utf-8'))
    userConfig = { ...systemConfig, ...userConfig }
} catch (err) {
    console.log("Error reading config file: " + err)
}


module.exports = {

    userConfig,

    vibPath: {
        workspace,
        scenarios: join(workspace, 'scenarios'),
        logs: join(workspace, 'logs'),
        payloads: join(workspace, 'payloads'),
        cache: join(workspace, '.cache'),
        cachedScenarios: join(workspace, '.cache', 'scenarios.json')
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
    }
}