/* eslint-disable */
const should = require('chai').should()
let { platform } = require('process')
const { stub, mock } = require('sinon')
const mockConstants = require('./mocks/constants.mock')
const { join } = require('path')
const constants = require('../../src/app/constants')
const { unlinkSync, existsSync, writeFileSync } = require('fs')
const fs = require('fs')
Object.keys(mockConstants).forEach(key => {
    stub(constants, key).value(mockConstants[key])
})

const utils = require('../../src/app/utils')




describe('Utils', function () {

    describe('isMac', function () {
        it('should return platform data', function () {
            let isMac = platform === 'darwin'
            utils.isMac.should.equal(isMac)
        })
    })

    describe('getLogLevel', function () {
        it('should return value for info log', function () {
            utils.getLogLevel('Info').should.equal(constants.logLevels.info)
            utils.getLogLevel('INFO').should.equal(constants.logLevels.info)
            utils.getLogLevel('info').should.equal(constants.logLevels.info)
        })
        it('should return value for debug log', function () {
            utils.getLogLevel('debug').should.equal(constants.logLevels.debug)
            utils.getLogLevel('Debug').should.equal(constants.logLevels.debug)
            utils.getLogLevel('DEBUG').should.equal(constants.logLevels.debug)
        })
        it('should return value for warn log', function () {
            utils.getLogLevel('Warn').should.equal(constants.logLevels.warn)
            utils.getLogLevel('warn').should.equal(constants.logLevels.warn)
            utils.getLogLevel('Warn').should.equal(constants.logLevels.warn)
        })
        it('should return value for error log', function () {
            utils.getLogLevel('error').should.equal(constants.logLevels.error)
            utils.getLogLevel('Error').should.equal(constants.logLevels.error)
            utils.getLogLevel('ERROR').should.equal(constants.logLevels.error)
        })
    })

    describe('getCollectionNameForScenario', function () {
        it('should return collection name from file', function () {
            utils.getCollectionNameForScenario(join(constants.vibPath.scenarios, 'module')).should.equal('module')
            utils.getCollectionNameForScenario(join(constants.vibPath.scenarios, 'module', 'module2')).should.equal('module')
            utils.getCollectionNameForScenario(join(constants.vibPath.scenarios, 'module', 'scenario.json')).should.equal('module')
        })
        it('should return empty if collection is empty', function () {
            utils.getCollectionNameForScenario(constants.vibPath.scenarios).should.be.empty
            utils.getCollectionNameForScenario('').should.be.empty
        })
    })
    describe('getScenarioFileNameFromPath', function () {
        it('should return scenario name', function () {
            utils.getScenarioFileNameFromPath(join(constants.vibPath.scenarios, 'module', 'scenario.json')).should.equal('scenario')
        })
        it('should return empty if scenario name is not available', function () {
            utils.getScenarioFileNameFromPath(constants.vibPath.scenarios).should.be.empty
            utils.getScenarioFileNameFromPath(join(constants.vibPath.scenarios, 'module')).should.be.empty
            utils.getScenarioFileNameFromPath(join(constants.vibPath.scenarios, 'module', 'module2')).should.be.empty
            utils.getScenarioFileNameFromPath('').should.be.empty
        })
    })
    describe('splitAndTrimInput', function () {
        it('should return empty array for empty input', function () {
            utils.splitAndTrimInput('').should.be.empty
        })
        it('should return trimmed input array when proper input', function () {
            utils.splitAndTrimInput('a,b,c').should.deep.equal(['a', 'b', 'c'])
        })
        it('should return trimmed input array when input is non trimmed', function () {
            utils.splitAndTrimInput('a, b ,    c').should.deep.equal(['a', 'b', 'c'])
        })
    })
    describe('isAll', function () {
        it('should return whether the input is all', function () {
            utils.isAll('all').should.be.true
            utils.isAll('abc').should.be.false
            utils.isAll('All').should.be.true
            utils.isAll('allTest').should.be.false
        })
    })
    describe('sleep', function () {
        it('should return response after 10 ms', async function () {
            let startTime = Date.now()
            await utils.sleep(10)
            let timeTaken = Date.now() - startTime
            timeTaken.should.be.greaterThan(9)
        })
        it('should return response after 123 ms', async function () {
            let startTime = Date.now()
            await utils.sleep(123)
            let timeTaken = Date.now() - startTime
            timeTaken.should.be.greaterThan(122)
        })
    })
    describe('includesRegex', function () {
        it('should return true is match is found', function () {
            utils.includesRegex(['hello', 'wor'], 'world').should.be.true
        })
        it('should return false is match is not found', function () {
            utils.includesRegex(['hello', 'world'], 'something').should.be.false
        })
        it('should return false if anyting is null', function () {
            utils.includesRegex(undefined, 'wor').should.be.false
            utils.includesRegex(['hello', 'world'], undefined).should.be.false
        })
        it('should return false if array is empty', function () {
            utils.includesRegex([], 'wor').should.be.false
        })
        it('should return false if input is empty', function () {
            utils.includesRegex(['hello', 'world'], '').should.be.false
        })
    })
    describe('parseJsonFile', function () {
        it('should return parsed file on success')
        it('should return status false on invalid json')
        it('should return parsed file without $shema key')
        it('should return payload without additional keys')
        it('should return parsed collection name for scenario file')
    })
    describe('readJsonFile', function () {
        it('should return parsed file on success')
        it('should return error if the extension is not json')
        it('should return error if JSON is invalid')
    })
    describe('freezeScenarios', function () {
        it('should write file when called', function () {
            try {
                if (existsSync(constants.vibPath.cache)) unlinkSync(constants.vibPath.cache)
            } catch (error) { }

            utils.freezeScenarios({})
            existsSync(constants.vibPath.cachedScenarios).should.be.true
        })
        it('should create a directory if not exists', function () {
            try {
                if (existsSync(constants.vibPath.cache)) unlinkSync(constants.vibPath.cache)
            } catch (error) { }
            utils.freezeScenarios({})
            existsSync(constants.vibPath.cachedScenarios).should.be.true
        })
    })
    describe('unfreezeScenarios', function () {
        it('should delete file if exists', async function () {
            writeFileSync(constants.vibPath.cachedScenarios, "{}")
            await utils.unfreezeScenarios()
            existsSync(constants.vibPath.cachedScenarios).should.be.false
        })
        it('should ignore if file is not there', async function () {
            try {
                if (existsSync(constants.vibPath.cache)) unlinkSync(constants.vibPath.cache)
            } catch (error) { }
            await utils.unfreezeScenarios()
            existsSync(constants.vibPath.cachedScenarios).should.be.false
        })
    })
    describe('cacheExists', function () {
        it('should return true if cache exists', function () {
            utils.freezeScenarios({})
            utils.cacheExists().should.be.true
        })
        it('should return false if cache does\'t exist', function () {
            try {
                if (existsSync(constants.vibPath.cachedScenarios)) unlinkSync(constants.vibPath.cachedScenarios)
            } catch (error) { }
            utils.cacheExists().should.be.false
        })
    })
    describe('loadCachedScenarios', function () {
        it('should return cached object if it exists', async function () {
            let data = {
                hello: "world"
            }
            writeFileSync(constants.vibPath.cachedScenarios, JSON.stringify(data))
            let readData = await utils.loadCachedScenarios()
            readData.should.deep.equal(data)
        })
        it('should return cached object if it exists', async function () {
            try {
                if (existsSync(constants.vibPath.cachedScenarios)) unlinkSync(constants.vibPath.cachedScenarios)
            } catch (error) { }
            let readData = await utils.loadCachedScenarios()
            should.not.exist(readData)
        })
    })
    describe('getAvailableSystemsFromConfig', function () {
        it('should return available systems and default system', function () {
            let data = utils.getAvailableSystemsFromConfig()
            data.systems.should.deep.equal(constants.userConfig.accounts)
            data.default.should.deep.equal(constants.userConfig.default_account)
        })
    })
    describe('isVibraniumInitialized', function () {
        it('should return true if vibranium setup is done', function () {
            stub(fs, 'existsSync').value(true)
            stub(fs, 'readFileSync').value({})

            let exitCall = stub(process, 'exit').value(true)
            utils.isVibraniumInitialized()
            exitCall.called.should.be.false
        })
        it.skip('should return false if vibranium setup is not done', function () {
            stub(fs, 'existsSync').value(false)
            let exitCall = stub(process, 'exit').value(true)
            utils.isVibraniumInitialized()
            exitCall.called.should.be.true
        })
    })
    describe('executeScript', function () {
        it('should return variables after script execution')
    })
    describe('getValidJSVariableName', function () {
        it('should return name without -, ~ or .')
    })
    describe('executeScenarioScript', function () {
        it('should return variables after script execution')
    })
    describe('executeEndpointScript', function () {
        it('should return variables after script execution')
    })
    describe('isValidName', function () {
        it('should return true if name is valid')
    })
    describe('getParallelExecutorLimit', function () {
        it('should return max executor limit')
    })
    describe('printSpaces', function () {
        it('should return spaces based on input')
    })
    describe('readlinePromise', function () {
        it('return a promise for readline')
    })
    describe('shuffleArray', function () {
        it('should return a shuffled array')
    })
})