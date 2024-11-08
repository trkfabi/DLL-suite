const _ = require('lodash');
const DataError = require('./reusable/errors/dataError');

/**
 * @class Helpers
 * Utility class
 * ##version 1.0.0
 */
const helpers = (function () {

	/**
	 * @method updateObjectFromArray
	 * Receives an array and updates an object of type {Key1:Value1, Key2:Value2}
	 * Returns an object with keys equal to arrayValues, if key did not exist in object the value will be emptyValue
	 * @param _initialArray {Array}  base array
	 * @param _objectToUpdate {Object} object to update
	 * @param _emptyValue {String} empty value
	 * @return {Object} The object created
	 */
	const updateObjectFromArray = (_initialArray = [], _objectToUpdate = {}, _emptyValue = 0) => {
		let newObject = {};

		_initialArray.forEach(function (item) {
			newObject[item] = (_objectToUpdate.hasOwnProperty(item)) ? _objectToUpdate[item] : _emptyValue;
		});

		return newObject;
	};

	/**
	 * @method updateTermsOnArray
	 * Receives an array of objects with structure {term, value} and updates that array to have all terms 
	 * Returns the new array with all the terms, if term is found it keeps same object, if an object had a term that isn't 
	 * available anymore it deletes it and if the term is new it creates an object with empty value
	 * @param _terms {Array}  Terms to update
	 * @param _arrayToUpdate {Array[Object]} array to update of structure {term, value}
	 * @param _emptyValue {Number} empty value
	 * @return {Array[Object]} The updated Array of objects {term,value}
	 */
	const updateTermsOnArray = (_terms = [], _arrayToUpdate = [], _emptyValue = 0) => {
		let newArray = [];

		_.each(_terms, term => {
			const item = _.find(_arrayToUpdate, {
				term
			});

			if (item) {
				newArray.push(item);
			} else {
				newArray.push({
					term: '' + term,
					value: _emptyValue
				});
			}
		});
		return newArray;
	};

	/**
	 * @method sanitizeTerms
	 * Checks that all the terms in the array are integers
	 * Returns the new array with valid terms as strings ordered by ascending number
	 * @param _terms {Array}  Terms to validate
	 * @return {Array} The valid terms
	 */
	const sanitizeTerms = (_terms = []) => {

		return _.chain(_terms)
			.compact()
			.filter(term => parseInt(term, 10) > 0)
			.map(term => '' + parseInt(term, 10))
			.uniq()
			.sortBy((term) => {
				return parseInt(term)
			})
			.value();
	};
	/**
	 * @method validateName
	 * Receives a collection and a name and validates that the name doesn't exist in the collection
	 * Returns true if name doesn't exist in the collection
	 * @param {Object} _data Parameters to validate name
	 * @param {Array} _data.collection Collection to check
	 * @param {String} _data.name name to check
	 * @param {String} _data.uid If not empty, don't check this uid
	 * @param {Number} _data.maxAllowedCharacters=25 Max allowed characters
	 * @return {Boolean} Name does not exist
	 */
	const validateName = (_data) => {

		const {
			collection = [],
				uid = '',
				maxAllowedCharacters = 25
		} = _data
		let {
			name = ''
		} = _data;

		name = name
			.trim()
			.toLowerCase();

		if (name.length > maxAllowedCharacters) {
			throw DataError({
				code: 'name-too-long',
				variable: 'name',
				value: maxAllowedCharacters
			});
		}

		const nameUsed = _.some(collection, item => {
			return name === item.name.trim().toLowerCase() && (item.uid !== uid || uid.length === 0);
		});

		if (nameUsed) {
			throw DataError({
				code: 'duplicated',
				variable: 'name',
				value: name
			});
		}

		return !nameUsed;
	};

	/**
	 * @method jsonToCsv
	 * Coverts a json string to csv string
	 * @param {Object} _json Json data to be converted
	 * @param {Object} _options Options of the jsonexport module
	 * @return {Function} Promise 
	 */
	const jsonToCsv = (_json, _options) => {
		const jsonexport = require('jsonexport');
		const jsonArray = _.isArray(_json) ? _json : [_json];
		return new Promise((resolve, reject) => {
			jsonexport(jsonArray, _options, (_err, _csv) => {
				if (_err) {
					return reject(_err);
				}
				return resolve(_csv);
			});
		});
	};

	/**
	 * @method combine
	 * Given an Array of Arrays, generates all its possible combinations
	 * @param {any[][]} list Array of arrays to combine
	 * @param {any[]} [memo=[]] current iteration of combinations, used for the recursive function
	 * @param {any[]} [result=[]] current result of combinations, used for the recursive algorithm
	 * @return {any[]}  list of combinations for all items in the original list
	 */
	const combine = (list, memo = [], result = []) => {
		const [group, ...rest] = list;

		_.each(group, item => {
			const iteration = [...memo, item];
			if (rest && rest.length > 0) {
				combine(rest, iteration, result);
			} else {
				result.push(iteration);
			}
		});

		return result;
	};

	return {
		jsonToCsv,
		validateName,
		updateObjectFromArray,
		updateTermsOnArray,
		sanitizeTerms,
		combine,
	};
})();

module.exports = helpers;
