/**
 * Utility function for parse values and return default invalid valud instead of NaN
 * ##version 1.0.0
 * @class Helpers.parser
 * @singleton
 */

var parser = (function () {

	/**
	 * @method
	 * Parses any value to number, returning 0 if invalid.
	 * @param {String} _value Number to be parsed
	 * @param {Number} [_decimals] Number of decimals to parse.
	 * @return {Number} Number parsed
	 */
	var parseToNumber = function (_value, _decimals) {
		_value = '' + (_value || '');
		var replaceRegex = new RegExp('\\' + Alloy.Globals.decimalSeparator, 'g');
		var number = parseFloat(_value.replace(replaceRegex, '.').replace(/[^\d\.\-]/g, '')) || 0;

		if (_decimals == null) {
			return number;
		} else {
			return parseFloat(number.toFixed(_decimals));
		}

	};

	/**
	 * @method
	 * Parses any value to boolean, including strings such as 'true' or 'false'
	 * @param {String} _value Number to be parsed
	 * @return {Boolean} True/False parsed
	 */
	var parseToBoolean = function (_value) {
		return !!JSON.parse(String(_value || 0).toLowerCase());
	};

	return {
		parseToNumber: parseToNumber,
		parseToBoolean: parseToBoolean
	};
})();

module.exports = parser;
