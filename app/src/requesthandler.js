const readline = require('readline')
const { mkdirSync, readFileSync, writeFileSync, existsSync, createReadStream, createWriteStream } = require('fs')
const { join } = require('path')
const { hostname, homedir } = require('os')

const utils = require('./utils')
const compiler = require('./compiler')
const testexecutor = require('./testexecutor')
const logHandler = require('./loghandler')


const logger = logHandler.moduleLogger('handler')


const handleRunCommand = async options => {
    console.time()
    const scenarioList = await compiler.search(options.collections, options.scenarios, options.apis)
    const loadDependenciesFromMemory = (options.collections === 'all' && options.scenarios === 'all' && options.apis === 'all')
    const executionOptions = {
        variables: options.variables,
        systems: options.systems,
        color: options.color,
        log: options.log
    }
    const result = await testexecutor.runTests(scenarioList, executionOptions, loadDependenciesFromMemory);
    console.log(result)
    console.timeEnd()
}


const handleListCommand = async options => {
    console.time()
    if (options.unfreeze || options.freeze) {
        utils.unfreezeScenarios()
    }

    const scenarios = await compiler.search(options.collections, options.scenarios, options.apis)
    let apiList = await compiler.convertScenarios(scenarios);

    if (options.format == 'tree' || options.format == 'csv') {
        apiList = compiler.convertApiListToTreeStructure(apiList)
    }
    logHandler.printApiList(apiList, options.format, options.color)

    if (options.freeze) {
        utils.freezeScenarios(scenarios)
    }

    console.timeEnd()
}


const handleVibraniumSetup = async (options, workspacePath) => {
    const userDetails = (!!options.email && !!options.name) ? options : await getUserDetailsFromConsole()
    createWorksaceAndUserConfig(userDetails, workspacePath)
    createVibraniumDirectories(workspacePath)

    createReadStream(join(__dirname, '..', 'config', '_config.json'))
        .pipe(createWriteStream(join(workspacePath, 'config.json')));

    logger.info(`Please clone your repo in the directory: ${workspacePath}`)

}


const createVibraniumDirectories = workspace => {
    if (!existsSync(workspace)) mkdirSync(workspace)
    if (!existsSync(join(workspace, 'jobs'))) mkdirSync(join(workspace, 'jobs'))
    if (!existsSync(join(workspace, 'logs'))) mkdirSync(join(workspace, 'logs'))
}


const createWorksaceAndUserConfig = (userDetails, workspace) => {
    const systemConfigDirectory = join(homedir(), '.vib')
    if (!existsSync(systemConfigDirectory)) {
        mkdirSync(systemConfigDirectory)
    }

    let sysConfig = {
        id: hostname(),
        workspace,
        ...userDetails
    }
    writeFileSync(join(systemConfigDirectory, 'config.json'), JSON.stringify(sysConfig, null, 4))
}


const getUserDetailsFromConsole = () => new Promise(resolve => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Please enter your user id: ', userid => {
        rl.question('Please enter your email id: ', email => {
            rl.question('Please enter your name: ', name => {
                rl.close();
                resolve({ userid, email, name })
            });
        });
    });
})


module.exports = {
    handleRunCommand,
    handleListCommand,
    handleVibraniumSetup
}