const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const HttpError = require('../models/http-error')

const User = require('../models/userSchema')

const signUp = async (req, res, next) => {
	const errors = validationResult(req)
	if (!errors.isEmpty()) {
		const error = new HttpError('Invalid inputs passed, please check your data.', 422)
		return next(error)
	}

	const { email, name, password } = req.body

	//email check
	let existingEmail
	try {
		existingEmail = await User.findOne({ email: email })
	} catch (err) {
		const error = new HttpError('Something goes wrong, please try later.', 500)
		return next(error)
	}
	if (existingEmail) {
		const error = new HttpError('Email is used, please try with another.', 422)
		return next(error)
	}
	//

	// hashing password
	let hashedPassword
	try {
		hashedPassword = await bcrypt.hash(password, 12)
	} catch (err) {
		const error = new HttpError('Could not create user, please try again.', 500)
		return next(error)
	}
	//

	const newUser = new User({
		email,
		name,
		password: hashedPassword,
		announcaments: [],
	})

	try {
		await newUser.save()
	} catch (err) {
		const error = new HttpError('Signing up failed, please try later.', 500)
		return next(error)
	}

	let token
	try {
		token = jwt.sign({ userId: newUser.id, email: newUser.email }, process.env.JWT_KEY, { expiresIn: '1h' })
	} catch (err) {
		const error = new HttpError('Singing up failed, please try later.', 500)
		return next(error)
	}

	res.json({ userId: newUser.id, email: newUser.email, name: newUser.name, token: token })
}

const login = async (req, res, next) => {
	const { email, password } = req.body

	let identifiedUser
	try {
		identifiedUser = await User.findOne({ email: email })
	} catch (err) {
		const error = new HttpError('Something goes wrong, please try later.', 500)
		return next(error)
	}

	if (!identifiedUser) {
		const error = new HttpError('Wrond credentials, please check your email and password.', 401)
		return next(error)
	}

	let isValidPassword = false
	try {
		isValidPassword = await bcrypt.compare(password, identifiedUser.password)
	} catch (err) {
		const error = new HttpError('Could not log you in, please try again.', 500)
		return next(error)
	}

	if (!isValidPassword) {
		const error = new HttpError('Wrond credentials, please check your email and password.', 401)
		return next(error)
	}

	let token
	try {
		token = jwt.sign({ userId: identifiedUser.id, email: identifiedUser.email }, process.env.JWT_KEY, {
			expiresIn: '1h',
		})
	} catch (err) {
		const error = new HttpError('Could not log you in, please try again.', 500)
		console.log(err.message)
		return next(error)
	}

	res.json({ userId: identifiedUser.id, email: identifiedUser.email, name: identifiedUser.name, token: token })
}
exports.signUp = signUp
exports.login = login
