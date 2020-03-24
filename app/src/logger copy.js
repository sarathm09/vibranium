const { join } = require('path')
const { unlink } = require('os')
const { env } = require('process')
const { readdir } = require('fs').promises
const { createLogger, format, transports } = require('winston')

const logHandler = require('./loghandler');
const { userConfig, vibPath, colorCodeRegex, logRotationConstants } = require('./constants');


const getDefaultLogLevel = () => {
	let logLevel = 'info';
	if (!!userConfig.logger && !!userConfig.logger.default_log_level) {
		logLevel = userConfig.logger.default_log_level;
	}
	if (env.LOG_LEVEL) {
		logLevel = env.LOG_LEVEL.toLocaleLowerCase();
	}
	return logLevel.toLocaleLowerCase();
};

const getCombinedLogFormat = moduleName => format.printf(
	({ level, message, timestamp }) => `[${level}] [${moduleName}] ${timestamp}: ${message.replace(colorCodeRegex, '')}`
)

const getConsoleFormat = moduleName => format.printf(
	({ level, message }) => `[${logHandler.prettyPrint('loglevel', level)}] [${moduleName}]: ${message}`
);

const rotateOldLogFiles = async () => {
	let rotationMills = 10 * 24 * 60 * 60 * 1000; // 10 days

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
	const lastLogFileToKeep = Date.now() - rotationMills

	for (const fileName of logFiles) {
		const filePaths = fileName.split('_')
		if (filePaths.length > 2 && filePaths[0] === 'log' &&
			!isNaN(filePaths[1]) && parseInt(filePaths[1]) < lastLogFileToKeep) {
			unlink(join(vibPath.logs, fileName))
		}
	}
	return
}

/**
 * Create the logger object to print logs.
 * Contains three transports: console, error file and a combined log file
 * @returns logger object
 */
module.exports = (moduleName, level = getDefaultLogLevel(), silent = false) => {
	rotateOldLogFiles()
	const logger = createLogger({
		level: level,
		label: moduleName,
		silent:  silent || env.SILENT,
		transports: [
			new transports.Console({
				format: getConsoleFormat(moduleName)
			}),
			new transports.File({
				filename: join(vibPath.logs, `log_${Date.now()}_.log`),
				format: getCombinedLogFormat(moduleName)
			})
		]
	});

	logger.on('data', () => !!env.LOG_LEVEL && logger.level !== env.LOG_LEVEL ? logger.level = env.LOG_LEVEL : null);

	return logger;
};
