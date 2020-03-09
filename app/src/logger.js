const { join } = require('path');
const { env } = require('process');
const winston = require('winston');
const { createLogger, format, transports } = winston;

const logHandler = require('./loghandler');
const { userConfig, vibPath } = require('./constants');

const colorCodeRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

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
	info => `[${info.level}] [${moduleName}] ${new Date().toLocaleString('en-IN')}: \
			${info.message.replace(colorCodeRegex, '')}`
);

const getConsoleFormat = moduleName => format.printf(
	info => `[${logHandler.prettyPrint('loglevel', info.level)}] [${moduleName}]: ${info.message}`
);

/**
 * Create the logger object to print logs.
 * Contains three transports: console, error file and a combined log file
 * @returns logger object
 */
module.exports = (moduleName, level = getDefaultLogLevel(), silent = false) => {
	const logger = createLogger({
		level: level,
		label: moduleName,
		silent: silent,
		transports: [
			new transports.File({
				filename: join(vibPath.logs, 'error.log'),
				level: 'error',
				format: format.errors({ stack: true }),
				maxsize: 1000
			}),
			new transports.File({
				filename: join(vibPath.logs, 'combined.log'),
				maxsize: 1000,
				format: getCombinedLogFormat(moduleName)
			}),
			new transports.Console({
				format: getConsoleFormat(moduleName)
			})
		]
	});

	logger.on('data', () => !!env.LOG_LEVEL && logger.level !== env.LOG_LEVEL ? logger.level = env.LOG_LEVEL : null);

	return logger;
};
