const Datastore = require('nedb')
const uuidv4 = require('uuid/v4')
const express = require('express')
const mocks = require('./mocks.json')
const bodyParser = require('body-parser')

const app = express()
const port = 3001
const db = {
	users: new Datastore({ filename: 'users', inMemoryOnly: false, autoload: true }),
	sessions: new Datastore({ filename: 'sessions', inMemoryOnly: false, autoload: true })
}

app.use(bodyParser.json())

let roomsAvailable = ['R01', 'R02', 'R07', 'R14', 'R15', 'R17', 'R19', 'R21', 'R36'].map(name => {return { id: uuidv4(), name, available: true }})
let sessionTypes = ['DEMO', 'INTERACTIVE', 'LECTURE'].map(type => {
	return { code: type, text: type }
})

const createNewUser = (user, res) => {
	if (!user) {
		res.status(400).json({ error: 'User details is invalid' })
	} else if (!user.name || user.name.length === 0) {
		res.status(400).json({ error: 'Name is invalid' })
	} else if (!user.country || user.country.length === 0) {
		res.status(400).json({ error: 'Country is invalid' })
	} else {
		let userId = uuidv4()
		db.users.insert({ id: userId, ...user }, () => res.status(201).json({ id: userId }))
	}
}

const createNewSession = (session, res) => {
	console.log(session)
	if (!session) {
		res.status(400).json({ error: 'Invalid session' })
	} else if (!session.name || session.name.length === 0) {
		res.status(400).json({ error: 'Invalid session name' })
	} else if (!session.description || !session.description.short || session.description.short.length === 0 || session.description.short.length > 255) {
		res.status(400).json({ error: 'Invalid session description' })
	} else if (!session.type || !sessionTypes.map(s => s.code).includes(session.type)) {
		res.status(400).json({ error: 'Invalid session type' })
	} else if (
		!session.room ||
		!roomsAvailable
			.filter(r => r.available)
			.map(r => r.id)
			.includes(session.room)
	) {
		res.status(400).json({ error: 'Invalid session room' })
	} else if (!session.speakers || !session.speakers.length === 0) {
		res.status(400).json({ error: 'Invalid session speakers' })
	} else {
		db.users.find({}, (err, data) => {
			if (session.speakers.every(user => data.map(d => d.id).includes(user))) {
				const sessionId = uuidv4()
				let sessionDetails = {
					...session,
					id: sessionId,
					type: {
						code: session.type,
						text: session.type
					}
				}
				roomsAvailable.filter(r => r.id === session.room)[0].available = false
				db.sessions.insert(sessionDetails, (err, data) => res.status(201).json({ id: sessionId }))
			} else {
				res.status(400).json({ error: 'Invalid session speakers' })
			}
		})
	}
}

const registerForSession = (users, res) => {
	if (!users || users.length === 0) {
		res.status(400).json({ error: 'Invalid session' })
	}
	db.users.find({}, (err, data) => {
		if (users.every(user => data.map(d => d.id).includes(user))) {
			res.status(204).send()
		} else {
			res.status(400).json({ error: 'Invalid session speakers' })
		}
	})
}

app.get('/', (req, res) => res.json({ baseUrl: '/demoapp/api/v1' }))

app.get('/demoapp/api/v1/users', (req, res) => db.users.find({}, (err, data) => res.json(data)))
app.get('/demoapp/api/v1/users/:userId', (req, res) => {
	console.log(req.params.userId)
	db.users.find({ id: req.params.userId }, (err, data) => {
		console.log(data)
		res.json(data)
	})
})
app.post('/demoapp/api/v1/users', (req, res) => createNewUser(req.body, res))

app.get('/demoapp/api/v1/rooms/available', (req, res) => res.json(roomsAvailable.filter(r => r.available)))
app.get('/demoapp/api/v1/rooms/booked', (req, res) => res.json(roomsAvailable.filter(r => !r.available)))

app.get('/demoapp/api/v1/sessions', (req, res) => db.sessions.find({}, (err, data) => res.json(data)))
app.get('/demoapp/api/v1/sessions/:sessionId', (req, res) => db.sessions.find({ id: req.params.sessionId }, (err, data) => res.json(data)))
app.get('/demoapp/api/v1/session/types', (req, res) => res.json(sessionTypes))
app.post('/demoapp/api/v1/sessions', (req, res) => createNewSession(req.body, res))
app.put('/demoapp/api/v1/sessions/:sessionId/register', (req, res) => registerForSession(req.body, res))

app.listen(port, () => console.log(`Conference app available at localhost:${port}!`))
