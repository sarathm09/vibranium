const treeify = require('treeify')
const { vibPath } = require('./constants')
const { createLogger, format, transports } = require('winston')
const chalk = require('chalk')
const { join } = require('path')

const isMac = process.platform === 'darwin';

/**
 * Create the logger object to print logs.
 * Contains three transports: console, error file and a combined log file
 * @returns logger object
 */
const createLoggerObject = () => createLogger({
    level: 'info',
    transports: [
        new transports.File({
            filename: join(vibPath.logs, 'error.log'),
            level: 'error',
            format: format.errors({ stack: true }),
            maxsize: 1000000
        }),
        new transports.File({
            filename: join(vibPath.logs, 'combined.log'),
            maxsize: 1000000,
            format: format.combine(
                format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                format.errors({ stack: true }),
                format.splat(),
                format.json()
            )
        }),
        new transports.Console({
            format: format.printf(info => `[${prettyPrint('loglevel', info.level)}] ${prettyPrint('date')}: ${info.message}`)
        })
    ],
});


/**
 * Utility function to get a prettified string that contains colors and
 * ascii characters/smileys if the system supports them and else prints
 * plain text
 * 
 * @param {string} type The type of text to be prettyified
 * @param {string} text The text to be prettified
 * @param {boolean} color se colored text for printing
 * @returns {string} Pretty printed text
 */
const prettyPrint = (type, text = '', color = true) => {
    if (type == 'collection') return color ? (isMac ? '📂 ' : ' ') + chalk.cyan(text) : text;
    if (type == 'scenario') return color ? (isMac ? '📄 ' : ' ') + chalk.cyanBright(text) : text;
    if (type == 'api') return color ? (isMac ? '🌐 ' : ' ') + chalk.greenBright(text) : text;
    if (type == 'date') return color ? `${chalk.grey(new Date().toLocaleString('en-IN'))}` : text;
    if (type == 'loglevel' && text == 'info') return color ? chalk.whiteBright(text) : text;
    if (type == 'loglevel' && text == 'debug') return color ? chalk.yellow(text) : text;
    if (type == 'loglevel' && text == 'warn') return color ? chalk.keyword('orange')(text) : text;
    if (type == 'loglevel' && text == 'error') return color ? chalk.redBright(text) : text;
    if (type == 'loglevel' && text == 'success') return color ? chalk.greenBright(text) : text;
}


/**
 * Print the API tree in a formatted tree structure.
 * Only prints api list and not the dependency tree
 * 
 * @param {array} apis List of apis
 * @param {boolean} color Use colored text for printing
 */
const printApiListAsTree = (apis, color = true) => {
    let formattedTree = {};
    for (const collection in apis) {
        formattedTree[prettyPrint('collection', collection, color)] = {};
        for (const scenario in apis[collection]) {
            formattedTree[prettyPrint('collection', collection, color)][prettyPrint('scenario', scenario, color)] = {}
            for (const api in apis[collection][scenario]) {
                formattedTree[prettyPrint('collection', collection, color)][prettyPrint('scenario', scenario, color)][prettyPrint('api', api, color)] = {}
            }
        }
    }
    logger.info("")
    logger.info("API list: \n" + treeify.asTree(formattedTree));
}


/**
 * Print the API tree as a formatted json 
 * 
 * @param {array} apis List of apis
 */
const printApiListAsJson = apis => {
    logger.info("")
    logger.info("API list: \n" + JSON.stringify(apis, null, 4));
}


/**
 * Print the API names in a csv format
 * 
 * @param {array} apis List of apis
 */
const printApiListAsCSV = apis => {
    let apisList = [];
    for (const collection in apis) {
        for (const scenario in apis[collection]) {
            for (const api in apis[collection][scenario]) {
                apisList.push(api);
            }
        }
    }
    logger.info("")
    logger.info(apisList);
}


/**
 * Print the API tree in a formatted way.
 * The format can be json, tree or csv
 * 
 * @param {array} apis List of APis
 * @param {string} format The format in which the API tree is to be printed.
 * @param {boolean} color Use colored text for printing
 */
const printApiList = (apis, format = 'tree', color = true) => {
    return new Promise(resolve => {
        if (format === 'json') {
            printApiListAsJson(apis, color)
        } else if (format === 'csv') {
            printApiListAsCSV(apis, color)
        } else {
            printApiListAsTree(apis, color)
        }
        resolve()
    })
}


const logger = createLoggerObject();

module.exports = {
    logger,
    printApiList
}