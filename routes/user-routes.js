const express = require('express')
const { check } = require('express-validator')

const router = express.Router()

const userControllers = require('../controllers/user-controlers')

router.post(
	'/signup',
	[check('email').normalizeEmail().isEmail(), check('password').isLength({ min: 6 }), check('name').not().isEmpty()],
	userControllers.signUp
)
router.post('/login', userControllers.login)

module.exports = router
