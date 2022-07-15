require('dotenv').config()

const path = require('path')
const fs = require('fs')

const express = require('express')
const mongoose = require('mongoose')
const HttpError = require('./models/http-error')

const bodyParser = require('body-parser')

const app = express()
const port = 5000

app.use(bodyParser.json())

app.use('/uploads/images', express.static(path.join('uploads', 'images')))

//CORS politycy
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
	next()
})

//routes
const announcementRoutes = require('./routes/announcement-routes')
const userRotes = require('./routes/user-routes')

app.use('/api/announcement', announcementRoutes)
app.use('/api/user', userRotes)

//errors handling
app.use(() => {
	const error = new HttpError('Could not find this route.', 404)
	throw error
})
app.use((error, req, res, next) => {
	if (req.file) {
		fs.unlink(req.file.path, err => {
			console.log(err)
		})
	}
	if (res.headerSent) {
		return next(error)
	}
	res.status(error.code || 500)
	res.json({ message: error.message || 'An unknow error occurred!' })
})
//

mongoose
	.connect(
		`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@nextjs.dakai.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
	)
	.then(() => {
		app.listen(process.env.PORT || 5000, () => {
			console.log(`App listening on port ${process.env.PORT || 5000}...`)
		})
	})
	.catch(error => {
		console.log(error)
	})
