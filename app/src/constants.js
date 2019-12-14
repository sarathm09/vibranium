const { join } = require('path')

module.exports = {
    scenariosPath: '/Users/t90/dev/projects/personal/tests/vib/scenarios',

    vibPath: {
        workspace: '/Users/t90/dev/projects/personal/tests/vib',
        scenarios: join('/Users/t90/dev/projects/personal/tests/vib', 'scenarios'),
        logs: join('/Users/t90/dev/projects/personal/tests/vib', 'logs'),
    },

    logLevel: {
        INFO: [],
        DEBUG: [],
        ERROR: []
    },

    authTypes: {
        oauth2: [ 'jwt', 'cf-jwt', 'client-credentials', 'oauth2', 'jwt-token'],
        basic: ['basic', 'username-password', 'basic-authentication'],
        none: ['none']
    }
}