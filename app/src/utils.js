const { scenariosPath } = require('./constants')
const { sep } = require('path')
const { readFile } = require('fs').promises


/**
 * Get the collection name from the absolute file path
 * @param {string} fileToParse 
 * @returns {string}
 */
module.exports.getCollectionNameForScenario = fileToParse => fileToParse.replace(scenariosPath, '').split(sep)[1]


/**
 * Get the scenario name from the absolute file path
 * @param {string} fileToParse 
 * @returns {string}
 */
module.exports.getScenarioFileNameFromPath = fileToParse => fileToParse.replace(scenariosPath, '').split(sep).pop().split('.')[0]


/**
 * Split and trim user input string
 * @param {string} input 
 * @returns {array}
 */
module.exports.splitAndTrimInput = input => input ? input.split(',').map(_ => _.trim()) : []


/**
 * Check if the user has passed 'all' as the input. 
 * If the user hasn't given any input, it is still considered as 'all' as it's the default
 * @param {string} input 
 * @returns {boolean}
 */
module.exports.isAll = input => input ? input.toLocaleLowerCase() === 'all' : true


/**
 * Asynchronous sleep function.
 * Used for limiting the number of parallel executions
 * @param {integer} ms milliseconds to sleep 
 */
module.exports.sleep = ms => new Promise(resolve => setTimeout(resolve, ms))


/**
 * Split the given and input and see if any of the elements specified in the array match
 * the set of inputs
 * @param {array} arr 
 * @param {string} input 
 * @returns {boolean}
 */
module.exports.includesRegex = (arr, input) => arr.filter(_ => input.toLowerCase().match(_.toLowerCase())).length > 0


module.exports.parseJsonFile = (fileToParse, fileData, payload) => {
    let fileParseStatus = {};
    try {
        let obj = JSON.parse(fileData);
        // If the file is a scenario file, add filepath and scenario name to the json
        if (!payload) {
            obj = {
                ...obj,
                file: fileToParse.replace(scenariosPath, ''),
                collection: module.exports.getCollectionNameForScenario(fileToParse),
                sid: `${fileToParse.replace(scenariosPath, '').split(sep)[1]}_${obj.name}`
            }
        }
        fileParseStatus = { status: true, data: obj };
    } catch (error) {
        fileParseStatus = { status: false, message: `Parsing file ${fileToParse} failed with the error ${error}` };
    }
    return fileParseStatus;
}


/**
 * Read the json file (scenario/payload) from the filesystem, parse it as json 
 * and return the json object
 * 
 * @param {string} fileToParse The absolute path of the file to be read and parsed
 * @param {boolean} payload is the file a payload file or not. Used for file parsing
 */
module.exports.readJsonFile = async (fileToParse, payload = false) => {
    if (!fileToParse) return { status: false, message: `The filename is not valid.` };

    if (!!fileToParse && fileToParse.split(".").pop() != 'json')
        return { status: false, message: `The file ${fileToParse} does not have the extension '.json'` };

    else {
        let fileData = await readFile(fileToParse, 'utf8');
        return module.exports.parseJsonFile(fileToParse, fileData, payload);
    }
}