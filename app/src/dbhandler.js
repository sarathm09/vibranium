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


module.exports = {
    initialize: initializeDatabase,
    find: findApiInDb,
    insert: insertScenariosIntoDatabase
}