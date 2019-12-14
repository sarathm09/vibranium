#!/usr/bin/env node

const vibranium = require('commander');
const { readFileSync } = require('fs')
const compiler = require('./compiler')
const testexecutor = require('./testexecutor')
const logHandler = require('./loghandler')

const version = readFileSync(__dirname + '/../config/version.txt', 'utf8');


vibranium
    .command('run')
    .alias('r')
    .description('Run the vibranium tests')
    .option('-c --collections [collections]', 'Collections to run, separated by comma(,)')
    .option('-s --scenarios [scenarios]', 'Scenarios to run, separated by comma(,)')
    .option('-a --apis [apis]', 'API endpoints to run, separated by comma(,)')
    .option('-l --log [loglevel]', 'Logging level [info, debug, error], default is info')
    .option('--system [systems]', 'The system on which the apis need to be executed. The sytem name should be defined in the config file')
    .option('--no-color', 'Plain text output without colors')
    .action(async options => {
        console.time()
        const scenarioList = await compiler.search(options.collections, options.scenarios, options.apis)
        const result = await testexecutor.runTests(scenarioList);
        console.timeEnd()
    });



let listCommand = vibranium
    .command('list')
    .alias('l')
    .description('List all the vibranium tests')
    .option('-c --collections [collections]', 'Collections to list, separated by comma(,)', 'all')
    .option('-s --scenarios [scenarios]', 'Scenarios to list, separated by comma(,)', 'all')
    .option('-a --apis [apis]', 'API endpoints to list, separated by comma(,)', 'all')
    .option('-f --format [format]', 'Format to print the output in, default is tree. [tree, csv, json]', 'tree')
    .option('--no-color', 'Plain text output without colors')
    .action(async options => {
        console.time()
        const scenarios = await compiler.search(options.collections, options.scenarios, options.apis)
        let apiList = await compiler.convertScenarios(scenarios);

        if (options.format == 'tree' || options.format == 'csv') {
            apiList = compiler.convertApiListToTreeStructure(apiList)
        }
        logHandler.printApiList(apiList, options.format, options.color)

        console.timeEnd()
    })


listCommand
    .command('freeze')
    .alias('f')
    .description("Freeze the current list of scenarios into a file so that the files are not scanned again and again")


listCommand
    .command('unfreeze')
    .alias('u')
    .description("Start scanning for all file changes")


vibranium
    .command('debug')
    .alias('d')
    .description('Enter debug mode')
    .option('-w --workspace', 'Open the vibranium workspace')
    .option('-s --src', 'Open the source directory for vibranium')
    .option('-v --vib-config', 'Open the central configuration files for vibranium')
    .option('-c --config', 'Open the configuration files for vibranium')
    .option('-l --log', 'Open the log files for vibranium')
    .action(options => {
        console.log(options.opts())
    });


vibranium
    .command('setup')
    .alias('s')
    .description(`Setup Vibranium with the current directory (${process.cwd()}) as the workspace`)
    .action(options => {
        console.log(options.opts())
    });


vibranium
    .command('ui')
    .action(options => {
        console.log(options.opts())
    });


vibranium
    .version(`${version}`);


vibranium.parse(process.argv);

if (process.argv.length == 2) console.log(vibranium.help());