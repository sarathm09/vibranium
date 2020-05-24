const rh = require('./app/requesthandler');

module.exports = {
    createScenario: rh.handleCreateCommand,
    listTests: rh.handleListCommand,
    runTests: rh.handleRunCommand
}
