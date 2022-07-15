const express = require('express')
const { check } = require('express-validator')

const router = express.Router()

const announcementControllers = require('../controllers/announcement-controlers')
const fileUpload = require('../middleware/file-upload')

const authCheck = require('../middleware/auth-check')

router.get('/20-announcements', announcementControllers.get20Announcements)
router.get('/search', announcementControllers.getAnnouncementsByQuery)
router.get('/category/:category', announcementControllers.getAnnouncementsByCategory)
router.get('/user/:uid', announcementControllers.getAnnouncementsByUserId)
router.get('/:aid', announcementControllers.getAnnouncementsById)

router.use(authCheck)

router.post(
	'/new-announcement',
	fileUpload.single('image'),
	[
		check('title').not().isEmpty(),
		check('description').isLength({ min: 10 }),
		check('price').not().isEmpty(),
		check('address').not().isEmpty(),
		check('category').not().isEmpty(),
	],
	announcementControllers.createAnnouncement
)

router.delete('/delete/:aid', announcementControllers.deleteAnnouncement)

module.exports = router
