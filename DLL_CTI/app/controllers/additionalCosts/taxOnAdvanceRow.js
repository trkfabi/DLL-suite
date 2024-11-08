/**
 * # Tax on Advance Row
 * @class Controllers.additionalCosts.taxOnAdvanceRow
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
	uiHelpers.addDoneButton($.taxesOnAdvInputTextField, $.blurFields);
	uiHelpers.initClearButton($.taxesOnAdvInputTextField, $.taxesOnAdvClear);
	uiHelpers.initNumberFormatHandler($.taxesOnAdvInputTextField, '#,##0.000');
};

/**
 * @method setPaymentOption
 * Sets the payment option for taxOnAdvanceRow
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
		$.taxesOnAdvInputTextField.value = stringFormatter.formatDecimal(paymentOption.get('taxOnAdvance'), '', '#,##0.000');
		$.taxesOnAdvClear.visible = ($.taxesOnAdvInputTextField.value !== '');
		$.taxesOnAdvAmountLabel.text = stringFormatter.formatDecimal(paymentOption.get('taxOnAdvanceAmount'), '');
	}
};

/**
 * @method blurFields
 * Executes the event blur on taxesOnAdvInputTextField
 * @return {void}
 */
$.blurFields = function () {
	$.taxesOnAdvInputTextField.blur();
};

/**
 * @method handleAmountBlur
 * @private
 * Handles the event blur for taxesOnAdvInputTextField and calls back uiStateChangeCallback function
 * @param {Object} _evt Blur event
 * @return {void}
 */
function handleAmountBlur(_evt) {
	var _data = {};
	_data['taxOnAdvance'] = parser.parseToNumber($.taxesOnAdvInputTextField.value);

	uiStateChangeCallback && uiStateChangeCallback(_data);
};

$.taxesOnAdvInputTextField.addEventListener('blur', handleAmountBlur);

init();
