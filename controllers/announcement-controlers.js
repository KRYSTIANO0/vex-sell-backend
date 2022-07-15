const fs = require('fs')

const { validationResult } = require('express-validator')
const HttpError = require('../models/http-error')
const mongoose = require('mongoose')

const Announcement = require('../models/announcementSchema')
const User = require('../models/userSchema')

const get20Announcements = async (req, res, next) => {
	let announcements
	try {
		announcements = await Announcement.find({}).limit(20)
	} catch (err) {
		const error = new HttpError('Something goes wrong, please try later.', 500)
		return next(error)
	}
	if (!announcements || announcements.length === 0) {
		const error = new HttpError('Cannot find announcements.')
		next(error)
	}
	res.json({ announcements })
}
const getAnnouncementsByCategory = async (req, res, next) => {
	const categoryName = req.params.category
	let announcements
	try {
		announcements = await Announcement.find({ category: categoryName })
	} catch (err) {
		const error = new HttpError('Fetch announcements failed, plase try again later.', 500)
		return next(error)
	}
	if (!announcements || announcements.length === 0) {
		const error = new HttpError('Cannot find announcements for provided category.', 404)
		return next(error)
	}

	res.json({
		announcements: announcements.map(announcement => {
			return announcement.toObject({ getters: true })
		}),
	})
}

const getAnnouncementsById = async (req, res, next) => {
	const announcementId = req.params.aid
	let announcement
	try {
		announcement = await Announcement.findOne({ _id: announcementId }).populate('creator')
	} catch (err) {
		const error = new HttpError('Fetch announcements failed, plase try again later.', 500)
		return next(error)
	}
	if (!announcement || announcement.length === 0) {
		const error = new HttpError('Cannot find announcements for provided ID.', 404)
		return next(error)
	}
	res.json({ announcement: announcement.toObject({ getters: true }) })
}

const getAnnouncementsByUserId = async (req, res, next) => {
	const userId = req.params.uid
	let announcements
	try {
		announcements = await Announcement.find({ creator: userId })
	} catch (err) {
		const error = new HttpError('Fetch announcements failed, plase try again later.', 500)
		return next(error)
	}
	if (!announcements || announcements.length === 0) {
		const error = new HttpError('Cannot find announcements for provided user ID.', 404)
		return next(error)
	}
	res.json({
		announcements: announcements.map(announcement => {
			return announcement.toObject({ getters: true })
		}),
	})
}

const getAnnouncementsByQuery = async (req, res, next) => {
	const { title } = req.query

	const regex = new RegExp(title, 'i')

	let announcements

	try {
		announcements = await Announcement.find({ title: { $regex: regex } })
	} catch (err) {
		const error = new HttpError('Fetch announcements failed, plase try again later.', 500)
		return next(error)
	}
	res.json({
		announcements: announcements.map(announcement => {
			return announcement.toObject({ getters: true })
		}),
	})
}

const createAnnouncement = async (req, res, next) => {
	const errors = validationResult(req)
	if (!errors.isEmpty()) {
		const error = new HttpError('Invalid inputs passed, please check your data.', 422)
		return next(error)
	}

	const { title, description, price, address, category, creator } = req.body

	const newAnnouncement = new Announcement({
		title,
		description,
		image: req.file.path,
		price,
		address,
		category,
		creator,
	})
	let user
	try {
		user = await User.findById(creator)
	} catch (err) {
		const error = new HttpError('Something goes wrong, plase try again later.', 500)
		return next(error)
	}

	try {
		const session = await mongoose.startSession()
		session.startTransaction()
		await newAnnouncement.save({ session: session })
		user.announcements.push(newAnnouncement)
		await user.save({ session: session })
		await session.commitTransaction()
	} catch (err) {
		const error = new HttpError('Ad creation failed, plase try again later.', 500)
		console.log(err.message)
		return next(error)
	}
	res.json({ newAnnouncement })
}

const deleteAnnouncement = async (req, res, next) => {
	const announcementId = req.params.aid

	let announcement
	try {
		announcement = await Announcement.findById({ _id: announcementId }).populate('creator')
	} catch (err) {
		const error = new HttpError('Something goes wrong, plase try again later.', 500)
		return next(error)
	}

	if (!announcement) {
		const error = new HttpError('Cannot find accouncement for provided ID.', 404)
		return next(error)
	}

	if (announcement.creator.id !== req.userData.userId) {
		const error = new HttpError('You are not allowed to delete this place.', 401)
		return next(error)
	}

	const imagePath = announcement.image

	try {
		const session = await mongoose.startSession()
		session.startTransaction({ session: session })
		await Announcement.deleteOne(announcement)
		announcement.creator.announcements.pull(announcement)
		await announcement.creator.save({ session: session })
		await session.commitTransaction()
	} catch (err) {
		const error = new HttpError('Something goes wrong, plase try again later.', 500)
		return next(error)
	}

	fs.unlink(imagePath, err => {
		console.log(err)
	})

	res.json({ message: 'Deleted !' })
}

exports.get20Announcements = get20Announcements
exports.getAnnouncementsByCategory = getAnnouncementsByCategory
exports.getAnnouncementsById = getAnnouncementsById
exports.getAnnouncementsByUserId = getAnnouncementsByUserId
exports.getAnnouncementsByQuery = getAnnouncementsByQuery
exports.createAnnouncement = createAnnouncement
exports.deleteAnnouncement = deleteAnnouncement
