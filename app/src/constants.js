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
    }
}