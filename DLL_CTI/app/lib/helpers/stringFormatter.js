/**
 * Utility function for formatting strings.
 * @version 1.0.1
 * @class Lib.helpers.stringFormatter
 * @singleton
 * @uses Lib.helpers.parser
 */
var parser = require('/helpers/parser');

var stringFormatter = (function () {
	/**
	 * @method cleanNonNumericString
	 * Removes all the non-numeric values from a string
	 * @param {String} _value string to clean
	 * @return {String} string without any non-numeric characters
	 */
	var cleanNonNumericString = function (_value) {
		var value = '' + (_value || '');
		var replaceRegex = new RegExp('[^\\.\\d\\' + Alloy.Globals.decimalSeparator + '\\' + L('group_separator') + ']',
			'g');

		return value.replace(replaceRegex, '');
	};

	/**
	 * @method formatDecimal
	 * Applies a numeric format to a given value, based on the given Locale and Pattern
	 * @param {String/Number}  value to apply format
	 * @param {String} [_valueIfZero = '0.00'] value to return if _value is 0
	 * @param {String} [_pattern = '#,###.00'] pattern to apply format
	 * @param {String} [_locale = device's locale] Locale to use for applying the format
	 * @return {String} formatted value
	 */
	var formatDecimal = function (_value, _valueIfZero, _pattern, _locale) {
		_value = parser.parseToNumber(_value);
		_pattern = _pattern || '#,##0.00';

		if (_value || (!_value && _valueIfZero == null)) {
			return String.formatDecimal(_value, _locale, _pattern);
		} else {
			return _valueIfZero;
		}
	};

	/**
	 * @method formatPositiveDecimal
	 * Similar to formatDecimal, but it will only allow positive values and 0 (all negative values will be shown as 0)
	 * @param {String/Number}  value to apply format
	 * @param {String} [_valueIfZero = '0.00'] value to return if _value is 0
	 * @param {String} [_pattern = '#,###.00'] pattern to apply format
	 * @param {String} [_locale = device's locale] Locale to use for applying the format
	 * @return {String} formatted value
	 */
	var formatPositiveDecimal = function (_value, _valueIfZero, _pattern, _locale) {
		_value = parser.parseToNumber(_value);
		(_value < 0) && (_value = 0);

		return formatDecimal(_value, _valueIfZero, _pattern, _locale);
	};

	/**
	 * @method formatCurrency
	 * Applies a currency format to the given value, adding the locale's currency symbol and 2 decimals
	 * @param {Number} _value Number to be formated
	 * @return {String} Formated currency number
	 */
	var formatCurrency = function (_value) {
		// _value = parser.parseToNumber(_value);

		// return String.formatCurrency(_value);
		return formatDecimal(_value, undefined, '\'$\'#,##0.00');
	};

	/**
	 * @method formatPercentage
	 * Formats a number with percent value (DOES *NOT* MULTIPLY BY 100)
	 * @param {String/Number} _value Numeric value to apply format
	 * @param {String} [_valueIfZero=0.00] Value to return if the original _value is 0
	 * @return {String} Value with Percentage format
	 */
	var formatPercentage = function (_value, _valueIfZero) {
		return formatDecimal(_value, _valueIfZero, '#,##0.00\'%\'');
	};

	/**
	 * @method bigNumberFormat
	 * Cuts big numbers on small, human-readable format.
	 * Example: bigNumberFormat(188000000000) returns 188B
	 * Example: bigNumberFormat(8023123) returns 8,023K
	 * @param _value {Number} value to apply format
	 * @param _maxLength {Number} length to cut off the number, defaults to 4.
	 * Example: bigNumberFormat(188000000000, 6) returns "188,000M"
	 * Example: bigNumberFormat(188000000000, 3) returns "188B"
	 * @return {String} Number formated
	 */
	var bigNumberFormat = function (_value, _maxLength) {
		var value = '' + (_value || '');
		var maxLength = _maxLength || 4;
		var letters = ['', 'K', 'M', 'B', 'T'];
		var isNegative = false;
		var result = '';

		value = value.replace(/[^\d\.\-]/g, '');
		value = Number(value) || 0;
		if (value < 0) {
			isNegative = true;
			value = Math.abs(value);
			result = '-';
		}

		for (var i = 0, aux = value; aux > Math.pow(10, maxLength); aux /= 1000, i++);

		(aux / Math.pow(10, maxLength - 1) < 1) && (maxLength++);
		result += formatDecimal(('' + aux).substr(0, maxLength), -1) + letters[i]; //Use thousands format
		// result += ('' + aux).substr(0, maxLength) + letters[i]; //Avoid thousand formats
		return result;
	};

	/**
	 * method cutString
	 * Cuts a string to be lesser than or equal to the given length of characters
	 * @param str {String} String to cut.
	 * @param length {Number} Max character length for the string
	 * @return {String} String cuted
	 */
	var cutString = function (_value, _length) {
		var value = '' + (_value || '');
		var length = _length || 20;
		if (value.length > length) {
			return value.substr(0, length - 3) + '...';
		} else {
			return value;
		}
	};

	/**
	 * @method capitalCase
	 * @public
	 * Transforms a text to `Capital Case`
	 * @param vaue {String} Text to transform
	 * @return {String} Capital Case String
	 */
	var capitalCase = function (_value) {
		var value = '' + (_value || '');
		return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
	};

	/**
	 * @method formatList
	 * @public
	 * Formats an array into a String separating each item by the given separator. It will also remove all falsy items (null, 0, false, '', undefined)
	 * @param {Array} _array List to format
	 * @param {String} [_separator=', '] String to use to separate each item
	 * @return {String} Formatted list
	 */
	var formatList = function (_array, _separator) {
		_separator = _separator || ', ';

		_array = _.map(_array, function (_item) {
			return ('' + (_item || '')).trim();
		});
		_array = _.compact(_array);
		return _array.join(_separator);
	};

	/**
	 * @method replaceSingleQuote
	 * @public
	 * Replaces any single quote in the string to the mask
	 * @param {String} _value String to change
	 * @return {String} Formatted string
	 */
	var replaceSingleQuote = function (_value) {
		// Commented out to rollback the single quote save bug
		// doLog && console.log('[stringFormatter] - replaceSingleQuote');

		// const singleQuotes = /[‘’‛'′´`']/g;
		// var result = '';
		// if (_.isString(_value)) {
		// 	result = _value.replace(singleQuotes, '{singleQuote}');
		// }
		// return result;
		return _value;
	};

	/**
	 * @method restoreSingleQuote
	 * @public
	 * Restores any single quote inside its elements
	 * @param {String} _value String to change
	 * @return {String} Formatted string
	 */
	var restoreSingleQuote = function (_value) {
		// Commented out to rollback the single quote save bug
		// doLog && console.log('[stringFormatter] - restoreSingleQuote');
		// var result = '';
		// if (_.isString(_value)) {
		// 	result = _value.replace(/{singleQuote}/g, '\'');
		// }
		// return result;
		return _value;
	};

	return {
		cleanNonNumericString: cleanNonNumericString,
		formatDecimal: formatDecimal,
		formatPositiveDecimal: formatPositiveDecimal,
		formatCurrency: formatCurrency,
		formatPercentage: formatPercentage,
		bigNumberFormat: bigNumberFormat,
		cutString: cutString,
		capitalCase: capitalCase,
		formatList: formatList,
		replaceSingleQuote: replaceSingleQuote,
		restoreSingleQuote: restoreSingleQuote
	};
})();

module.exports = stringFormatter;
