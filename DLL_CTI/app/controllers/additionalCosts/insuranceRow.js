/**
 * # Insurance Row
 * @class Controllers.additionalCosts.insuranceRow
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
var isChecked = false;
var blurOptionsFields = args.blurOptionsFields;

/**
 * @method init
 * @private
 * Initialize values for the current View
 * @return {void}
 */
function init() {
	$.initKeyboardToolbar();

	toggleInsuranceCheck(false);
};

$.initKeyboardToolbar = function () {
	uiHelpers.addDoneButton($.insuranceFactorField, $.blurFields);
	uiHelpers.initClearButton($.insuranceFactorField, $.insuranceClearButton);
	uiHelpers.initNumberFormatHandler($.insuranceFactorField, '#,##0.00000');
};

/**
 * @method toggleInsuranceCheck
 * @private
 * Toggles the check mark for insurance
 * @param {Boolean} _shouldCheck Boolean that indicates if the insuranccecheck image displays on or off
 * @return {void}
 */
function toggleInsuranceCheck(_shouldCheck) {
	isChecked = _shouldCheck;
	if (_shouldCheck) {
		$.insuranceCheck.image = $.insuranceCheck.imageOn;
	} else {
		$.insuranceCheck.image = $.insuranceCheck.imageOff;
	}

	$.insuranceFactorField.touchEnabled = !!_shouldCheck;
};

/**
 * @method setPaymentOption
 * Sets the payment option for insuranceRow
 * @param {Model.PaymentOption} _paymentOption Payment Option to be set
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
		$.insuranceFactorField.value = stringFormatter.formatDecimal(paymentOption.get('insuranceFactor'), '', '#,##0.00000');
		$.insuranceClearButton.visible = ($.insuranceFactorField.value !== '');
		$.insuranceAmountField.value = stringFormatter.formatDecimal(paymentOption.get('insurance'), '');
		toggleInsuranceCheck(paymentOption.get('insuranceEnabled'));
	}
};

/**
 * @method blurFields
 * Executes the event blur for insuranceFactorField
 * @return {void}
 */
$.blurFields = function () {
	$.insuranceFactorField.blur();
};

/**
 * @method handleAmountBlur
 * @private
 * Handles the event blut for insuranceFactorField and calls back uiStateChangeCallback function
 * @param {Object} _evt Blur event
 * @return {void}
 */
function handleAmountBlur(_evt) {
	var _data = {};
	_data.insuranceFactor = parser.parseToNumber($.insuranceFactorField.value);

	uiStateChangeCallback && uiStateChangeCallback(_data);
};

/**
 * @method handleInsuranceCheckClick
 * @private
 * Handles the click event for Insurance Check
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleInsuranceCheckClick(_evt) {
	blurOptionsFields && blurOptionsFields();
	setTimeout(function () {
		toggleInsuranceCheck(!isChecked);
		var _data = {};
		_data.insuranceEnabled = isChecked;

		uiStateChangeCallback && uiStateChangeCallback(_data);
	}, 300);
};

$.insuranceFactorField.addEventListener('blur', handleAmountBlur);
$.insuranceCheck.addEventListener('click', handleInsuranceCheckClick);

init();
