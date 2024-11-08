/**
 * # Amount Row
 * @class Controllers.additionalCosts.amountRow
 * Generic controller for amount row
 * @uses Helpers.uiHelpers
 * @uses Helpers.stringFormatter
 * @uses Helpers.parser
 * @uses Utils.analytics
 */

var args = arguments[0] || {};
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');
var parser = require('/helpers/parser');
var analytics = require('/utils/analytics');

var titleid = args.titleid;
var property = args.property;
var uiStateChangeCallback = args.uiStateChangeCallback;
var readOnly = args.readOnly || false;

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	$.amountTitle.text = L(titleid);
	$.initKeyboardToolbar();
	// uiHelpers.initNumberFormatHandler($.amountField);
	(!readOnly) && ($.amountField.readOnly = readOnly);
	$.amountField.visible = !readOnly;
	$.amountLabel.visible = readOnly;
};

$.initKeyboardToolbar = function () {
	uiHelpers.addDoneButton($.amountField, $.blurFields);
	uiHelpers.initClearButton($.amountField, $.clearAmountButton);
};
/**
 * @method setPaymentOption
 * Sets the payment option for amountRow
 * @param {Models.paymentOption} _paymentOption Payment option object
 * @return {void}
 */
$.setPaymentOption = function (_paymentOption) {
	$.paymentOption = _paymentOption;
};

/**
 * @method refreshUI
 * Refresh values of the current view
 * @return {void}
 */
$.refreshUI = function () {
	if ($.paymentOption && !$.amountField.hasFocus) {
		var amountValue = stringFormatter.formatDecimal($.paymentOption.get(property), '');
		(!readOnly) && ($.amountField.value = amountValue);
		(!readOnly) && ($.clearAmountButton.visible = ($.amountField.value !== ''));
		(readOnly) && ($.amountLabel.text = amountValue);

	}
};

/**
 * @method blurFields
 * Executes the event blur for amountField
 * @return {void}
 */
$.blurFields = function () {
	$.amountField.blur();
};

/**
 * @method setEnabled
 * Enables or disables the UI elements
 * @return {void}
 */
$.setEnabled = function (_enable) {
	$.amountField.enabled = _enable;
	$.clearAmountButton.enabled = _enable;
};

/**
 * @method cleanUp
 * Free resources once this controller is not needed anymore
 * @return {void}
 */
$.cleanUp = function () {

};

/**
 * @method handleAmountFocus
 * @private
 * Handles the event focus for amountField
 * @param {Object} _evt focus event
 * @return {void}
 */
function handleAmountFocus(_evt) {
	switch (titleid) {
	case 'additional_cost':
		analytics.captureTiAnalytics('OTHC-EquipmentPriceDrawer-TapIntoAdditionalCosts');
		break;
	case 'tradeup_amount':
		analytics.captureTiAnalytics('OTHC-EquipmentPriceDrawer-TapIntoTradeUpAmount');
		break;
	case 'service_payment':
		analytics.captureTiAnalytics('OTHC-EquipmentPriceDrawer-TapIntoServicePayment');
		break;
	}
	$.amountField.hasFocus = true;
};

/**
 * @method handleAmountBlur
 * @private
 * Handles the event blur for amountField and calls back to persist the value given by property
 * @param {Object} _evt Blur event
 * @return {void}
 */
function handleAmountBlur(_evt) {
	$.amountField.hasFocus = false;
	var _data = {};
	_data[property] = parser.parseToNumber($.amountField.value);
	uiStateChangeCallback && uiStateChangeCallback(_data);
	_.defer($.refreshUI);
};

$.amountField.addEventListener('focus', handleAmountFocus);
$.amountField.addEventListener('blur', handleAmountBlur);

init();
