/**
 * @class Helpers.dataHelpers
 * Utility functions for managing JS data types (Arrays or Dictionary-like Object)
 * Extra functions that are missing from Underscore.js
 * ##version 1.0.0
 * @singleton
 * @uses Helpers.parser
 */

var dataHelpers = (function () {

	/**
	 * @method defaults
	 * Similar to `_.defaults()`, but will replace all the _falsy_ values instead of looking only for `undefined` values
	 * @param {Object} _base JS Object to use as base
	 * @param {Object[]} [_objects] JS Objects to replace the object's base properties
	 * @return {Object} JS Object with the replaced properties
	 */
	var defaults = function (_base) {
		var args = Array.prototype.slice.call(arguments);
		var result = JSON.parse(JSON.stringify(args[0]));

		_.each(args, function (_arg) {
			_.each(_arg, function (_value, _key) {
				result[_key] = result[_key] || _value;
			});
		});

		return result;
	};

	return {
		defaults: defaults
	};

})();

module.exports = dataHelpers;
