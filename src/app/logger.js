const { join } = require('path')
const { env } = require('process')
const { createWriteStream } = require('fs')
const { readdir, unlink, rmdir, writeFile } = require('fs').promises

const utils = require('./utils')
const { prettyPrint } = require('./loghandler')
const { userConfig, vibPath, colorCodeRegex, logRotationConstants,
	logLevels } = require('./constants')

const today = new Date(),
	logFileTimeStamp = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() / 1000,
	logFileName = join(vibPath.logs, `log_${logFileTimeStamp}_.log`),
	logStream = createWriteStream(logFileName), logStore = []

const consoleLogTypes = {
	log: console.log,
	info: console.info,
	warn: console.warn,
	debug: console.debug,
	error: console.error,
	success: console.log
}


/**
 * Get the default log level
 * Checks the config file and env vars
 */
const getDefaultLogLevel = () => {
	let logLevel = 'info';
	if (!!userConfig.logger && !!userConfig.logger.default_log_level) {
		logLevel = userConfig.logger.default_log_level;
	}
	if (!env.LOG_LEVEL) {
		env.LOG_LEVEL = logLevel.toLowerCase()
	}
	return logLevel.toLocaleLowerCase()
};


/**
 * Delete old log files based on the value specified in the config.json
 * based on max_log_history_to_keep key
 */
const rotateOldLogFiles = async () => {
	try {
		let rotationMills = 10 * 24 * 60 * 60; // 10 days
		const today = new Date()
		const logFileTimeStamp = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() / 1000

		if (!!userConfig.logger && !!userConfig.logger.max_log_history_to_keep) {
			const rotationTime = userConfig.logger.max_log_history_to_keep;
			for (const key in Object.keys(logRotationConstants)) {
				if (rotationTime.includes(key) && !isNaN(rotationTime.replace(key, ''))) {
					rotationMills = parseInt(rotationTime.replace(key, '')) * logRotationConstants[key]
					break
				}
			}
		}

		let logFiles = await readdir(vibPath.logs)
		const lastLogFileToKeep = logFileTimeStamp - rotationMills

		for (const fileName of logFiles) {
			const filePaths = fileName.split('_')
			if (filePaths.length > 2 && filePaths[0] === 'log' &&
				!isNaN(filePaths[1]) && parseInt(filePaths[1]) < lastLogFileToKeep) {
				await unlink(join(vibPath.logs, fileName))
			}
		}
	} catch (error) {
		console.error(error)
	}
	return
}


/**
 * Rotate old Job execution data
 * based on max_job_history_to_keep key
 */
const rotateOldJobLogs = async () => {
	try {
		let maxLimit = 30
		if (!!userConfig.logger && !!userConfig.logger.max_job_history_to_keep) {
			if (!isNaN(userConfig.logger.max_job_history_to_keep)) {
				maxLimit = +userConfig.logger.max_job_history_to_keep
			} else if (userConfig.logger.max_job_history_to_keep === 'all') {
				return
			}
		}
		let jobFiles = await readdir(vibPath.jobs)
		if (jobFiles.length > maxLimit) {
			let filesToDelete = jobFiles
				.filter(f => !isNaN(f))
				.sort()
				.slice(0, jobFiles.length - maxLimit)

			await Promise.all(filesToDelete
				.map(f => rmdir(join(vibPath.jobs, f), { recursive: true })))
		}
		return
	} catch (error) {
		console.error(error)
		return
	}
}


/**
 * Log the given details into a log file
 * 
 * @param {string} level Log Level
 * @param {string} moduleName Name of the module that inititated the log
 * @param {string} jobId Job execution Id
 * @param {string} message The message to be printed
 * @param {Error} error Error to be logged, if any
 * @param {object} data Data (payload/response or other JSON) to be logged
 */
const fileTransport = async (level, moduleName, jobId, message, error, data) => {
	if (message && typeof message === 'string') {
		message = message
			.split(utils.printSpaces('', process.env.LOG_LEVEL === 'debug' ? 38 : 28)).join('')
			.replace(colorCodeRegex, '')
			.split('\n').join(' ')
	} else if (message && typeof message === 'object') {
		message = JSON.stringify(message)
	}
	if (!!data && typeof data === 'object') message += JSON.stringify(data)
	else if (data) message += data

	logStream.write(`[${level}] [${jobId}] [${moduleName}] ${Date.now()}: ${message || ''}\n`)
	// Write stack trace
	if (error) {
		logStream.write(error.stack ? error.stack : 'no_stack_trace')
		logStream.write('\n')
	}
	return
}


/**
 * Log the given details into console
 * 
 * @param {string} level Log Level
 * @param {string} moduleName Name of the module that inititated the log
 * @param {string} message The message to be printed
 * @param {Error} error Error to be logged, if any
 * @param {object} data Data (payload/response or other JSON) to be logged
 */
const consoleTransport = async (level, moduleName, message, error, data) => {
	let consoleLevel = level, consoleModule = moduleName
	// Simplify the module name to show only first character of the module name
	if (![logLevels.error, logLevels.warn, logLevels.debug].includes(logLevels[env.LOG_LEVEL])) {
		consoleLevel = level[0]
		consoleModule = moduleName[0]
	}

	// write to console only on these conditions
	if (logLevels[env.LOG_LEVEL] >= logLevels[level] && !env.SILENT && !(level === 'warn' && env.NO_WARNING_MESSAGES)) {
		let log = `[${prettyPrint('loglevel', consoleLevel)}] [${consoleModule}]: ${message || ''}`
		log += (data && typeof data === 'object') ? JSON.stringify(data) : ''

		consoleLogTypes[level](log)
	}

	// Write stack trace
	if (error && [logLevels.error, logLevels.warn, logLevels.debug].includes(logLevels[env.LOG_LEVEL])) {
		console.error(`[${consoleLevel}] [${consoleModule}]: ${error.stack || 'no stack trace'} `)
	}
	return
}


/**
 * Log the given details into a JSON
 * 
 * @param {string} level Log Level
 * @param {string} moduleName Name of the module that inititated the log
 * @param {string} jobId Job execution Id
 * @param {string} message The message to be printed
 * @param {Error} error Error to be logged, if any
 * @param {object} data Data (payload/response or other JSON) to be logged
 */
const dbTransport = async (level, moduleName, jobId, message, error, data) => {
	if (!message) return
	logStore.push({
		level,
		message: typeof message === 'string' ? message.replace(colorCodeRegex, '') : message,
		jobId,
		data,
		time: Date.now(),
		module: moduleName,
		stack: error ? error.stack : ''
	})
	return
}


/**
 * Log the data into all the transports
 * 
 * @param {array} transports List of transports to write to
 * @param {string} moduleName Module name which initiated the log
 * @param {string} jobId Job execution Id
 * @param {string} level Log Level
 */
const logData = (transports, moduleName, jobId, level) => async (message, error, data) => {
	if (!!jobId && !!message && typeof message === 'object' && !!message.status &&
		message.status === '_VIBRANIUM_SESSION_END_') {
		await writeFile(join(vibPath.jobs, jobId, 'logs.json'), JSON.stringify(logStore.map(l => {
			l.jobId = jobId;
			return l
		}), null, 1))
		return
	}
	return await Promise.all([
		transports.console(level, moduleName, message, error, data),
		transports.file(level, moduleName, jobId, message, error, data),
		transports.db(level, moduleName, jobId, message, error, data)
	])
}


/**
 *  Create the logger object to print logs.
 * 
 * @param {string} moduleName The module that initiated the logger
 * @param {string} jobId The job execution Id
 */
module.exports = (moduleName, jobId) => {
	setImmediate(() => {
		getDefaultLogLevel()
		rotateOldLogFiles()
		rotateOldJobLogs()
	})

	let logTransports = {
		file: fileTransport,
		console: consoleTransport,
		db: dbTransport
	}

	return {
		log: logData(logTransports, moduleName, jobId, 'log'),
		info: logData(logTransports, moduleName, jobId, 'info'),
		warn: logData(logTransports, moduleName, jobId, 'warn'),
		debug: logData(logTransports, moduleName, jobId, 'debug'),
		error: logData(logTransports, moduleName, jobId, 'error'),
		success: logData(logTransports, moduleName, jobId, 'success')
	}
}

