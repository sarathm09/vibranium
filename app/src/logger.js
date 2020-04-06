const { join } = require('path')
const { env } = require('process')
const { readdir, unlink, rmdir } = require('fs').promises
const { createWriteStream } = require('fs')

const logHandler = require('./loghandler');
const { userConfig, vibPath, colorCodeRegex, logRotationConstants, 
	logLevels} = require('./constants');

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

const rotateOldJobLogs = async () => {
	try {
		let jobFiles = await readdir(vibPath.jobs)
		if (jobFiles.length > 10) {
			let filesToDelete = jobFiles
				.filter(f => !isNaN(f))
				.sort()
				.slice(0, jobFiles.length - 10)

			await Promise.all(filesToDelete
				.map(f => rmdir(join(vibPath.jobs, f), { recursive: true })))
		}
		return
	} catch (error) {
		console.error(error)
		return
	}
}


const logData = (moduleName, level, logStream) => async (message, error) => {
	let consoleLevel = level, consoleModule = moduleName
	if (![logLevels.error, logLevels.warn, logLevels.debug].includes(logLevels[env.LOG_LEVEL])) {
		consoleLevel = level[0]
		consoleModule = moduleName[0]
	}
	if (logLevels[env.LOG_LEVEL] >= logLevels[level] && !env.SILENT)
		console.log(`[${logHandler.prettyPrint('loglevel', consoleLevel)}] [${consoleModule}]: ${message || ''}`)
	logStream.write(`[${consoleLevel}] [${moduleName}] ${Date.now()}: ${message && typeof message === 'string' ? message.replace(colorCodeRegex, '') : ''}\n`)
	if (error) {
		if ([logLevels.error, logLevels.warn, logLevels.debug].includes(logLevels[env.LOG_LEVEL]))
			console.log(`[${consoleLevel}] [${consoleModule}]: ${error.stack || 'no stack trace'} `)
		logStream.write(error.stack ? error.stack : 'no_stack_trace')
	}
}

/**
 * Create the logger object to print logs.
 * @returns logger object
 */
module.exports = (moduleName) => {
	getDefaultLogLevel()
	rotateOldLogFiles()
	rotateOldJobLogs()
	const today = new Date()
	const logFileTimeStamp = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() / 1000
	const logFileName = join(vibPath.logs, `log_${logFileTimeStamp}_.log`)
	const logStream = createWriteStream(logFileName)

	return {
		log: logData(moduleName, 'log', logStream),
		info: logData(moduleName, 'info', logStream),
		warn: logData(moduleName, 'warn', logStream),
		debug: logData(moduleName, 'debug', logStream),
		error: logData(moduleName, 'error', logStream),
		success: logData(moduleName, 'success', logStream)
	}
}
