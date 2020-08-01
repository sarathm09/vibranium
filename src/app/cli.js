#!/usr/bin/env node

const { join } = require('path')
const { env } = require('process')
const vibranium = require('commander')
const { readFileSync } = require('fs')
const requestHandler = require('./requesthandler')

const version = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8')).version
const supportedTemplates = ['t1', 't2', 't3', 't4', 'e1_github']


/**
 * Set the environment variables according to user input
 * 
 * @param {object} options Command line options provided by uset
 */
const setEnvironmentVariables = options => {
	const optionsAndVariablesMap = {
		silent: 'SILENT',
		log: 'LOG_LEVEL',
		parallel: 'MAX_PARALLEL_EXECUTORS',
		skipWarn: 'NO_WARNING_MESSAGES',
		validate: 'VALIDATE_SCENARIOS',
		repeat: 'REPEAT_EXECUTION',
		ignoreNetworkFailure: 'IGNORE_NETWORK_FAILURE'
	}
	for (let option of Object.keys(optionsAndVariablesMap)) {
		if (options[option]) {
			env[optionsAndVariablesMap[option]] = option !== 'log' ?
				options[option] :
				options[option].toLowerCase()
		}
	}
	if (!env.LOG_LEVEL)
		env.LOG_LEVEL = 'info'
	if (options.log === 'minimal')
		env.LOG_MINIMAL = true
}


vibranium
	.command('run')
	.alias('r')
	.description('Run the vibranium tests')
	.option('-c --collections [collections]', 'Collections to run, separated by comma(,)', 'all')
	.option('-s --scenarios [scenarios]', 'Scenarios to run, separated by comma(,)', 'all')
	.option('-a --apis [apis]', 'API endpoints to run, separated by comma(,)', 'all')
	.option('-l --log [loglevel]', 'Logging level [info, debug, error, minimal]', 'info')
	.option('-r --report [reportType]', 'Generate reports for the execution. Values can be any of junit, csv and json', 'json')
	.option('-p --parallel [number_of_parallel_tasks]', 'Number of parallel tasks. Default is 10')
	.option('-v --variables [variables]', 'Variables to be used for executions. usage: var1=value1,var2=value2...')
	.option('--cred [cred]', 'Credentials provided in base64 format')
	.option('--sync', 'Run endpoints in synchronous mode')
	.option('--system [systems]',
		'The system on which the apis need to be executed. The sytem name should be defined in the config file')
	.option('--no-color', 'Plain text output without colors')
	.option('--skip-warn', 'Ignore all warning messages. Not recommended', true)
	.option('--silent', 'Print only the endpoint result')
	.option('--validate', 'Validate all files')
	.option('--repeat', 'Repeat the execution for each endpoint', 1)
	.option('--ignore-network-failure', 'Do not stop execution if there is some network issue or the app goes down in between', false)
	.action(options => {
		setEnvironmentVariables(options)
		requestHandler.handleRunCommand(options)
	})

vibranium
	.command('list')
	.alias('l')
	.description('List all the vibranium tests')
	.option('-c --collections [collections]', 'Collections to list, separated by comma(,)', 'all')
	.option('-s --scenarios [scenarios]', 'Scenarios to list, separated by comma(,)', 'all')
	.option('-a --apis [apis]', 'API endpoints to list, separated by comma(,)', 'all')
	.option('-k --keys [keys]', 'Search for specific keys. Example: scenario.tag=abc or endpoint.payload=\'!somePayload\'', 'all')
	.option('-f --format [format]', 'Format to print the output in, default is tree. [tree, csv, json]', 'tree')
	.option('--freeze',
		'Freeze the current list of scenarios into a file so that the files are not scanned again and again'
	)
	.option('--unfreeze', 'Start scanning for all file changes')
	.option('--no-color', 'Plain text output without colors')
	.option('--skip-warn', 'Ignore all warning messages. Not recommended', false)
	.option('--silent', 'Silent Mode')
	.option('--validate', 'Validate all files')
	.option('--open', 'Open the files (this option is ignored if the number of files exceeds 5)')
	.action(options => {
		setEnvironmentVariables(options)
		requestHandler.handleListCommand(options)
	})

vibranium
	.command('debug')
	.alias('d')
	.description('Enter debug mode')
	.option('-w --workspace', 'Open the vibranium workspace')
	.option('-s --src', 'Open the source directory for vibranium')
	.option('-v --vibconfig', 'Open the central configuration files for vibranium')
	.option('-c --config', 'Open the configuration files for vibranium')
	.option('-l --log', 'Open the log files for vibranium')
	.action(options => {
		setEnvironmentVariables(options)
		requestHandler.handleDebugCommand(options)
	})

vibranium
	.command('setup')
	.alias('s')
	.option('-u --user <user>', 'User name')
	.option('-e --email <email>', 'User email')
	.option('-i --userid [id]', 'User Id')
	.description(`Setup Vibranium with the current directory (${process.cwd()}) as the workspace`)
	.action(options => {
		setEnvironmentVariables(options)
		requestHandler.handleVibraniumSetup(options, process.cwd())
	})

vibranium
	.command('create')
	.alias('c')
	.option('-c --collection <collection>', 'Collection Name')
	.option('-s --scenario <scenario>', 'Scenario Name')
	.option('-t --template [template]', 'Create scenario with a template. [' + supportedTemplates.join('|') + ']', supportedTemplates[0])
	.description('Create a new scenario test file')
	.action(options => {
		if (!supportedTemplates.includes(options.template)) {
			console.error('Invalid template name. Supported values are: ' + supportedTemplates.join(','))
			process.exit(1)
		}
		requestHandler.handleCreateCommand(options)
	})


vibranium
	.command('ui')
	.action(options => {
		setEnvironmentVariables(options)
		require('./reportserver')()
	})

vibranium.version(`${version}`)
vibranium.parse(process.argv)

if (process.argv.length == 2) console.log(vibranium.help())