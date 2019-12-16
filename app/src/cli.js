#!/usr/bin/env node

const vibranium = require('commander');
const { readFileSync } = require('fs')
const requestHandler = require('./requesthandler')

const version = readFileSync(__dirname + '/../config/version.txt', 'utf8');


vibranium
    .command('run')
    .alias('r')
    .description('Run the vibranium tests')
    .option('-c --collections [collections]', 'Collections to run, separated by comma(,)', 'all')
    .option('-s --scenarios [scenarios]', 'Scenarios to run, separated by comma(,)', 'all')
    .option('-a --apis [apis]', 'API endpoints to run, separated by comma(,)', 'all')
    .option('-l --log [loglevel]', 'Logging level [info, debug, error], default is info')
    .option('-v --variables [variables]', 'Variables to be used for executions. usage: var1=value1,var2=value2...')
    .option('--system [systems]', 'The system on which the apis need to be executed. The sytem name should be defined in the config file')
    .option('--no-color', 'Plain text output without colors')
    .action(options => requestHandler.handleRunCommand(options));



vibranium
    .command('list')
    .alias('l')
    .description('List all the vibranium tests')
    .option('-c --collections [collections]', 'Collections to list, separated by comma(,)', 'all')
    .option('-s --scenarios [scenarios]', 'Scenarios to list, separated by comma(,)', 'all')
    .option('-a --apis [apis]', 'API endpoints to list, separated by comma(,)', 'all')
    .option('-f --format [format]', 'Format to print the output in, default is tree. [tree, csv, json]', 'tree')
    .option('--freeze', 'Freeze the current list of scenarios into a file so that the files are not scanned again and again')
    .option('--unfreeze', 'Start scanning for all file changes')
    .option('--no-color', 'Plain text output without colors')
    .action(options => requestHandler.handleListCommand(options))


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
    .option('-u --user <user>', 'User name')
    .option('-e --email <email>', 'User email')
    .option('-i --userid [id]', 'User Id')
    .description(`Setup Vibranium with the current directory (${process.cwd()}) as the workspace`)
    .action(options => requestHandler.handleVibraniumSetup(options, process.cwd()));


vibranium
    .command('ui')
    .action(options => {
        console.log(options.opts())
    });


vibranium
    .version(`${version}`);


vibranium.parse(process.argv);

if (process.argv.length == 2) console.log(vibranium.help());