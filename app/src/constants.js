const Ajv = require('ajv');
const { join } = require('path');
const { homedir } = require('os');
const { env } = require('process');
const { readFileSync } = require('fs');

const validateConfigSchema = config => {
	const ajv = new Ajv({allErrors: true})
	ajv.addMetaSchema(JSON.parse(readFileSync(join(__dirname, '..', 'res', 'schemas', 'draft-06-schema.json'))))
	let schema = JSON.parse(readFileSync(join(__dirname, '..', 'res', 'schemas', 'config_schema.json')))

	if (!ajv.validate(schema, config)) {
		console.log('Following errors were found in the config file. Please fix them.')
		console.log(ajv.errors)
		process.exit(1)
	}
}


let workspace = '', systemConfig = {}, userConfig = {}, testsDirectory = '';
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

module.exports = {
	userConfig,

	vibPath: {
		workspace,
		scenarios: workspace ? join(workspace, testsDirectory, 'scenarios') : '',
		jobs: workspace ? join(workspace, 'jobs') : '',
		logs: workspace ? join(workspace, 'logs') : '',
		payloads: workspace ? join(workspace, testsDirectory, 'payloads') : '',
		cache: workspace ? join(workspace, '.cache') : '',
		cachedScenarios: workspace ? join(workspace, '.cache', 'scenarios.json') : ''
	},

	authTypes: {
		oauth2: ['jwt', 'cf-jwt', 'client-credentials', 'oauth2', 'jwt-token'],
		basic: ['basic', 'username-password', 'basic-authentication'],
		none: ['none']
	},

	executionStatus: {
		SUCESS: Symbol('SUCCESS'),
		FAIL: Symbol('FAIL'),
		ERROR: Symbol('ERROR')
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
		INFO: Symbol('INFO'),
		WARN: Symbol('WARNING'),
		DEBUG: Symbol('DEBUG'),
		ERROR: Symbol('ERROR')
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
		h: 60 * 60 * 1000,
		d: 24 * 60 * 60 * 1000,
		y: 365 * 24 * 60 * 60 * 1000
	}

};
