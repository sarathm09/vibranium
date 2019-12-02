const Datastore = require('nedb');
let db;

const initializeDatabase = () => {
    db = {
        scenarios: new Datastore(),
        apis: new Datastore(),
        jobs: new Datastore({ filename: 'jobs', autoload: true })
    }

    db.scenarios.ensureIndex({ fieldName: 'sid', unique: true }, function (err) { if (err) console.log(err) });
    db.scenarios.ensureIndex({ fieldName: 'name' }, function (err) { if (err) console.log(err) });
    db.scenarios.ensureIndex({ fieldName: 'scenario' }, function (err) { if (err) console.log(err) });
    db.scenarios.ensureIndex({ fieldName: 'collection' }, function (err) { if (err) console.log(err) });

    db.apis.ensureIndex({ fieldName: 'name' }, function (err) { if (err) console.log(err) });
    db.apis.ensureIndex({ fieldName: 'scenario' }, function (err) { if (err) console.log(err) });
    db.apis.ensureIndex({ fieldName: 'collection' }, function (err) { if (err) console.log(err) });

    return db;
}

const insertScenariosIntoDatabase = (db, scenarios) => {
    return new Promise((resolve, reject) => {
        db.scenarios.insert(scenarios, (err, newDoc) => {
            // if (err) reject(err)
            if (err) console.log(err)
            // db.scenarios.find({}).sort({ scenario: 1, name: -1 }).exec((err, values) => {
            //     values.map(v => console.log(v.scenario, v.name))
            // })

            resolve()
        })
    })
}

const findApiInDb = db => {
    db.scenarios.find({}, (err, docs) => {
        scenarios = docs.sort((a, b) =>
            a.name.toLowerCase() < b.name.toLowerCase() ? -1 :
                a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0)
        let count = 0;
        scenarios.forEach(doc => {
            count += doc.endpoints.length;
            console.log(doc.name, doc.endpoints.length)
        })
        console.log(`${count} APIs in ${scenarios.length} scenarios`)
    })
}

/**
 * Load all the APIs into database
 * 
 * @param {array} apis List of APIs
 * @returns promise object
 */
const insertApisIntoDatabase = apis => {
    return new Promise(resolve => {
        db.apis.insert(apis, (err, newDoc) => {
            if (err) logger.error(err)
            resolve(newDoc)
        })
    })
}

const findApiDetails = (collection, scenario, api) => {
    return new Promise(resolve => {
        db.apis.find({ name: api, collection: collection, scenario: scenario })
            .exec(async (err, values) => {
                if (err || values.length === 0) resolve({})
                else {
                    values[0]['_apiId'] = `${values[0].collection}.${values[0].scenario}.${values[0].name}`
                    resolve(values[0])
                }
            })
    });
}


db = initializeDatabase();

module.exports = {
    find: findApiInDb,
    insertScenarios: insertScenariosIntoDatabase,
    insertApis: insertApisIntoDatabase,
    findApiDetails
}