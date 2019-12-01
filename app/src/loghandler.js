const treeify = require('treeify')
const { logLevel, vibPath } = require('./constants')
const { createLogger, format, transports } = require('winston')
const chalk = require('chalk')
const { join } = require('path')


const prettyPrint = (type, text = '', color = true) => {
    if (type == 'collection') return color ? `📂 ${chalk.cyan(text)}` : text;
    if (type == 'scenario') return color ? `📄 ${chalk.cyanBright(text)}` : text;
    if (type == 'api') return color ? `🌐 ${chalk.greenBright(text)}` : text;
    if (type == 'date') return color ? `${chalk.grey(new Date().toLocaleString('en-IN'))}` : text;
    if (type == 'loglevel' && text == 'info') return color ? chalk.whiteBright(text) : text;
    if (type == 'loglevel' && text == 'debug') return color ? chalk.yellow(text) : text;
    if (type == 'loglevel' && text == 'warn') return color ? chalk.keyword('orange')(text) : text;
    if (type == 'loglevel' && text == 'error') return color ? chalk.redBright(text) : text;
    if (type == 'loglevel' && text == 'success') return color ? chalk.greenBright(text) : text;
}


const logger = createLogger({
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

const printApiListAsJson = (apis, color = true) => {
    logger.info("")
    logger.info("API list: \n" + JSON.stringify(apis, null, 4));
}


const printApiListAsCSV = (apis, color = true) => {
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


module.exports = {
    logger: logger,
    printApiDependencyTree: (db, apis) => {
        return new Promise((resolve, reject) => {
            let treeStructureProcessor = apis.map(api => new Promise(async (resolve, reject) => {
                let apiName = `${api.collection}.${api.scenario}.${api.name}`
                let dependency = await fetchDependentApis(db, api)
                resolve({
                    [apiName]: dependency
                })
            }));

            Promise.all(treeStructureProcessor)
                .then(results => {
                    let treeStructure = {}
                    results.forEach((api, i, results) => {
                        let key = `${i + 1}. ${Object.keys(api)[0]}`
                        treeStructure[key] = api[Object.keys(api)[0]]
                    })
                    console.log(treeify.asTree(treeStructure));
                })
        })
    },
    printApiList: (apis, format = 'tree', color = true) => {
        return new Promise((resolve, reject) => {
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
}