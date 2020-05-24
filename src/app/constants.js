const Ajv = require('ajv')
const { join } = require('path')
const { homedir } = require('os')
const { env } = require('process')
const { readFileSync } = require('fs')
const { readFile } = require('fs').promises

const SCHEMA_SPECIFICATION_V6_PATH = join(__dirname, '..', 'res', 'schemas', 'draft-06-schema.json'),
	SCHEMA_SPECIFICATION_V6 = JSON.parse(readFileSync(SCHEMA_SPECIFICATION_V6_PATH))

let workspace = '', systemConfig = {}, userConfig = {}, testsDirectory = '', schemas = {}

const validateConfigSchema = config => {
	const ajv = new Ajv({ allErrors: true })
	ajv.addMetaSchema(SCHEMA_SPECIFICATION_V6)
	let schema = JSON.parse(readFileSync(join(__dirname, '..', 'res', 'schemas', 'config_schema.json')))

	if (!ajv.validate(schema, config)) {
		console.log('Following errors were found in the config file. Please fix them.')
		console.log(ajv.errors)
		process.exit(1)
	}
}


try {
	schemas = {
		scenario: JSON.parse(readFileSync(join(__dirname, '..', 'res', 'schemas', 'scenario.json'), 'utf-8')),
		endpoint: JSON.parse(readFileSync(join(__dirname, '..', 'res', 'schemas', 'endpoint.json'), 'utf-8'))
	}
	systemConfig = JSON.parse(readFileSync(join(homedir(), '.vib', 'config.json'), 'utf-8'));
	workspace = systemConfig.workspace;
	userConfig = JSON.parse(readFileSync(join(workspace, 'config.json'), 'utf-8'));

	validateConfigSchema(userConfig)

	userConfig = { ...systemConfig, ...userConfig };
	testsDirectory = userConfig.tests_directory ? userConfig.tests_directory : 'Vibranium-Tests';

} catch (err) {
	if (env.LOG_LEVEL === 'debug' || err instanceof SyntaxError) {
		console.log('Error reading config file: ' + err)
		process.exit(1)
	}
}


const loadDataLists = async () => {
	let data = await readFile(join(__dirname, '..', 'db', 'dataSets.json'))
	let dataSets = JSON.parse(data)
	module.exports.dataSets.names = ['names', ...Object.keys(dataSets)]
	module.exports.dataSets.data = dataSets
	module.exports.dataSets.data.names = [
		...dataSets.harrypotter,
		...dataSets.starWars,
		...dataSets.pokemon,
		...dataSets.got,
		...dataSets.marvel
	]
}


module.exports = {
	userConfig,
	vibSchemas: schemas,

	SCHEMA_SPECIFICATION_V6,

	vibPath: {
		systemVibPath: join(homedir(), '.vib'),
		workspace,
		jobs: workspace ? join(workspace, 'jobs') : '',
		logs: workspace ? join(workspace, 'logs') : '',
		scenarios: workspace ? join(workspace, testsDirectory, 'scenarios') : '',
		templates: workspace ? join(workspace, testsDirectory, 'templates') : '',
		payloads: workspace ? join(workspace, testsDirectory, 'payloads') : '',
		schemas: workspace ? join(workspace, testsDirectory, 'schemas') : '',
		scripts: workspace ? join(workspace, testsDirectory, 'scripts') : '',
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

	colorCodeRegex: new RegExp([
		'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
	].join('|'), 'g'),

	logRotationConstants: {
		h: 60 * 60,
		d: 24 * 60 * 60,
		y: 365 * 24 * 60 * 60
	},

	dataSets: { names: [] },

	loadDataLists
}