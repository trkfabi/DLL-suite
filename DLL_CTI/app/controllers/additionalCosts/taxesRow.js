/**
 * # Taxes Row
 * @class Controllers.additionalCosts.taxesRow
 * @uses helperts/uiHelpers
 * @uses helpers/stringFormatter
 * @uses helpers/parser
 */

var args = arguments[0] || {};
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');
var parser = require('/helpers/parser');

var uiStateChangeCallback = args.uiStateChangeCallback;
var paymentOption;

/**
 * @method init
 * @private
 * Initialize values for the current View
 * @return {void}
 */
function init() {
	$.initKeyboardToolbar();
};

$.initKeyboardToolbar = function () {
	uiHelpers.addDoneButton($.taxesPercentInputTextField, $.blurFields);
	uiHelpers.initClearButton($.taxesPercentInputTextField, $.taxesClear);
	uiHelpers.initNumberFormatHandler($.taxesPercentInputTextField, '#,##0.000');

	uiHelpers.addDoneButton($.taxesInputTextField, $.blurFields);
	uiHelpers.initClearButton($.taxesInputTextField, $.taxesClear);
	uiHelpers.initNumberFormatHandler($.taxesInputTextField);
};

/**
 * @method setPaymentOption
 * Sets the payment option for taxesRow
 * @param {Model.PaymentOption} _paymentOption Payment option to be set
 * @return {void}
 */
$.setPaymentOption = function (_paymentOption) {
	paymentOption = _paymentOption;
};

/**
 * @method refreshUI
 * Refresh values of the current view
 * @return {void}
 */
$.refreshUI = function () {
	if (paymentOption) {
		$.taxesPercentInputTextField.value = stringFormatter.formatPositiveDecimal(paymentOption.get('taxes'), '');
		$.taxesInputTextField.value = stringFormatter.formatDecimal(paymentOption.get('taxesAmount'), '');
		$.taxesClear.visible = ($.taxesInputTextField.value !== '');
	}
};

/**
 * @method blurFields
 * Executes the event blur for taxesRow
 * @return {void}
 */
$.blurFields = function () {
	$.taxesPercentInputTextField.blur();
	$.taxesInputTextField.blur();
};

/**
 * @method handleAmountBlur
 * @private
 * Handles the event blur for taxesInputTextField and calls back uiStateChangeCallback function
 * @param {Object} _evt Blur event
 * @return {void}
 */
function handleAmountBlur(_evt) {
	var _data = {};
	_data[_evt.source.tag] = parser.parseToNumber(_evt.source.value);

	uiStateChangeCallback && uiStateChangeCallback(_data);
};

$.taxesPercentInputTextField.addEventListener('blur', handleAmountBlur);
$.taxesInputTextField.addEventListener('blur', handleAmountBlur);

init();
