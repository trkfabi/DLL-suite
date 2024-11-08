/**
 * Object for any error in a request
 * @class Errors.requestEror
 */

const _ = require('lodash');

const RequestError = function (message = '', newCode = 400) {
	// +-------------------
	// | Private members.
	// +-------------------
	const name = 'RequestError';
	const error = new Error(message);
	let status = newCode;

	// +-------------------
	// | Public members.
	// +-------------------

	return _.extend(error, {
		name,
		message,
		status
	});
};

module.exports = RequestError;
