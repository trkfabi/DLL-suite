/**
 * Utility function for parse values and return default invalid valud instead of NaN
 * @version 1.0.0
 * @class Lib.helpers.parser
 * @singleton
 */
var doLog = Alloy.Globals.doLog;

var parser = (function () {

	/**
	 * @method
	 * Parses any value to number, returning 0 if invalid.
	 * @param {String} _value Number to be parsed
	 * @return {Number} Number parsed
	 */
	var parseToNumber = function (_value) {
		_value = '' + (_value || '');
		var replaceRegex = new RegExp('\\' + Alloy.Globals.decimalSeparator, 'g');

		return Number(_value.replace(replaceRegex, '.').replace(/[^\d\.\-]/g, '')) || 0;
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
