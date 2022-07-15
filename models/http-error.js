class HttpError extends Error {
	constructor(message, errorCode) {
		super(message)
		errorCode = this.errorCode
	}
}

module.exports = HttpError
