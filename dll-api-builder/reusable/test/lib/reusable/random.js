const _ = require('lodash');
const moment = require('moment');

/**
 * Collection of function to generate random values
 * Usable in tests generating mock data
 * @class Helpers.random
 * @singleton
 */

// const LOG_TAG = '\x1b[36m' + '[helpers/random]' + '\x1b[39;49m ';

const Random = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	/**
	 * @method ascii
	 * @private
	 * returns the list of ascii values in the given range
	 * @param {number} start Starting index in the ascii list
	 * @param {number} end Ending index in the ascii list
	 * @return {string[]}
	 */
	const ascii = (start, end) => {
		return _.range(start, end)
			.map(number => String.fromCharCode(number));
	};

	/**
	 * @method alphabet
	 * @private
	 * returns the letters a-z, A-Z, 0-9
	 * @return {string[]}
	 */
	const alphabet = () => {

		const numbers = ascii(48, 57);
		const uppercase = ascii(65, 90);
		const lowercase = ascii(97, 122);

		return [...numbers, ...uppercase, ...lowercase];
	};

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method pick
	 * Selects 1 random item from the given list
	 * @param {any[]} list List of items to select from
	 * @return {*}
	 */
	const pick = (list) => {
		return _.sample(list);
	};

	/**
	 * @method collection
	 * Calls the given function a random amount of times. 
	 * Returns an array with all the results
	 * @param {Function} fn Function to call
	 * @param {number} min Minumun amount of time to call the function
	 * @param {number} max Maximum amount of time to call the function
	 * @return {any[]}
	 */
	const collection = (fn, min, max) => {
		const amount = int(min, max);
		return _.chain()
			.range(amount)
			.map(() => fn())
			.value();
	};

	/**
	 * @method int
	 * Returns a random integer between the given min and max numbers
	 * @param {number} min Lowest number to return
	 * @param {number} max Largest number to return
	 * @return {number}
	 */
	const int = (min = 0, max = 10) => {
		return _.random(min, max);
	};

	/**
	 * @method float
	 * Returns a random float between the given min and max numbers
	 * @param {number} min Lowest number to return
	 * @param {number} max Largest number to return
	 * @return {number}
	 */
	const float = (min = 0, max = 1) => {
		return _.random(min, max, true);
	};

	/**
	 * @method string
	 * Returns a random string with the given amount of characters
	 * @param {number} min Lowest number of characters
	 * @param {number} max Largest number of characters
	 * @return {string}
	 */
	const string = (min = 0, max = 10, alphabet = []) => {
		const length = int(min, max);

		const chars = _.chain()
			.range(length)
			.map(() => pick(alphabet))
			.value();

		return chars.join('');
	};

	/**
	 * @method word
	 * Generates a random word (/[a-zA-Z0-9]/) with a max characters
	 * @param {number} max=20 Maximum possible number of characters
	 * @return {string}
	 */
	const word = (max = 20) => {
		return string(1, max, alphabet());
	};

	/**
	 * @method words
	 * Generates a random name (/[a-zA-Z0-9\s]/) with a max characters
	 * @param {number} max=20 Maximum possible number of characters
	 * @return {string}
	 */
	const words = (max = 20) => {
		return string(1, max, [...alphabet(), ' ']);
	};

	/**
	 * @method date
	 * Returns a random date between the given range
	 * @param {moment|date} min Lowest date to return
	 * @param {moment|date} max Largest date to return
	 * @param {string} format Format to return the date
	 * @return {string}
	 */
	const date = (min = new Date(), max = new Date(), format = 'YYYY-MM-DD') => {
		min = moment.isMoment(min) ? min.valueOf() : min.getTime();
		max = moment.isMoment(max) ? max.valueOf() : max.getTime();

		const value = int(min, max);

		return moment(value).format(format);
	};

	/**
	 * @method boolean
	 * Returns a random boolean
	 * @return {boolean}
	 */
	const boolean = () => {
		return !!int(0, 1);
	};

	/**
	 * @method id
	 * Generates a random id from arrowDB
	 * @return {string}
	 */
	const id = () => {
		let letters = '';
		for (let i = 0; i < 15; i++) {
			letters += int(0, 15).toString(16);
		}
		return letters;
	};

	return {
		pick,
		collection,
		int,
		float,
		string,
		date,
		boolean,
		id,
		word,
		words,
	};
})();

module.exports = Random;
