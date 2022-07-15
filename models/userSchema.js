const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema({
	name: { type: String, required: true },
	email: { type: String, required: true },
	password: { type: String, required: true },
	announcements: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Announcement' }],
})

module.exports = mongoose.model('User', userSchema)
