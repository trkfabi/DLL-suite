/**
 * Object for any error in a request
 * @class Errors.requestEror
 */

const _ = require('lodash');
const CODES = {
	'not-found': {
		id: 1,
		message(variable, value) {
			return `${variable} not found with ID: ${value}`;
		}
	},
	'missing-data': {
		id: 2,
		message(variable) {
			return `Additional data is required: ${variable}`;
		}
	},
	'missmatch': {
		id: 3,
		message(variable, value) {
			return `The real value for ${variable} is not ${value}.`;
		}
	},
	'no-in-progress': {
		id: 4,
		message(variable, value) {
			return `Version ${value} is not in-progress.`;
		}
	},
	'missing-required-parameter': {
		id: 5,
		message(variable) {
			return `There is a missing required parameter: ${variable}.`;
		}
	},
	'name-too-long': {
		id: 10,
		message(variable, value) {
			return `The name has too many characters. Maximum allowed is ${value}.`;
		}
	},
	'duplicated': {
		id: 10,
		message(variable, value) {
			return `There is a duplicated ${variable} with value ${value}`;
		}
	},
	'duplicated-name': {
		id: 10,
		message(variable) {
			return `This ${variable} Name already exists.`;
		}
	},
	'vendor-published-other-ratecard': {
		id: 10,
		message() {
			return `One of the vendor codes on this rate card is already assigned to a different rate card.`;
		}
	},
	'version-still-publishing': {
		id: 10,
		message() {
			return `This version is still publishing. Please try again later.`;
		}
	},
	'duplicated-rateprogram': {
		id: 10,
		message(variable, value) {
			return `A Rate Program with the Description "${value}" already exists. Please enter a different Description.`;
		}
	},
};

const DataError = function (params = {}) {
	// +-------------------
	// | Private members.
	// +-------------------
	const name = 'DataError';
	const status = 400;
	const {
		code,
		variable,
		value
	} = params;

	const {
		id = -1,
			message = () => 'An error has occured.'
	} = CODES[code] || {};
	const error = new Error(message(variable, value));

	// +-------------------
	// | Public members.
	// +-------------------

	return _.extend(error, {
		name,
		status,
		code: id
	});
};

module.exports = DataError;
