const Ajv = require('ajv')
const { join } = require('path')
const { homedir } = require('os')
const { env } = require('process')
const { readFileSync } = require('fs')
const { readFile } = require('fs').promises

const SCHEMA_SPECIFICATION_V6_PATH = join(__dirname, '..', 'res', 'schemas', 'draft-06-schema.json'),
	SCHEMA_SPECIFICATION_V6 = JSON.parse(readFileSync(SCHEMA_SPECIFICATION_V6_PATH))

let workspace = '', systemConfig = {}, userConfig = {}, testsDirectory = '';

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

	SCHEMA_SPECIFICATION_V6,

	vibPath: {
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
		preScenario: Symbol('preScenario'),
		postScenario: Symbol('postScenario'),
		postGlobal: Symbol('postGlobal'),
		preApi: Symbol('preApi'),
		postApi: Symbol('postApi'),
		postDependency: Symbol('postDependency')
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

	colorCodeRegex: /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,

	logRotationConstants: {
		h: 60 * 60,
		d: 24 * 60 * 60,
		y: 365 * 24 * 60 * 60
	},

	dataSets: { names: [] },

	loadDataLists
}