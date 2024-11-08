/**
 * # Residual Row
 * @class Controllers.additionalCosts.residualRow
 * @uses helperts/uiHelpers
 * @uses helpers/stringFormatter
 * @uses helpers/parser
 */

var args = arguments[0] || {};
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');
var parser = require('/helpers/parser');

var uiStateChangeCallback = args.uiStateChangeCallback;
var isExpanded = false;
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
	uiHelpers.addDoneButton($.residualValueInputTextField, $.blurFields);
	uiHelpers.initClearButton($.residualValueInputTextField, $.residualClear);
	uiHelpers.initNumberFormatHandler($.residualValueInputTextField);

	uiHelpers.addDoneButton($.originalInvoiceInputTextField, $.blurFields);
	uiHelpers.initClearButton($.originalInvoiceInputTextField, $.originalInvoiceClear);
	uiHelpers.initNumberFormatHandler($.originalInvoiceInputTextField);

	uiHelpers.addDoneButton($.percentualResidualInputTextField, $.blurFields);
	uiHelpers.initClearButton($.percentualResidualInputTextField, $.percentualResidualClear);
	uiHelpers.initNumberFormatHandler($.percentualResidualInputTextField);

	uiHelpers.applyHintTextStyle($.originalInvoiceInputTextField);
	uiHelpers.applyHintTextStyle($.percentualResidualInputTextField);
};

/**
 * @method setPaymentOption
 * Sets the payment option for residualRow
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
		$.residualValueInputTextField.value = stringFormatter.formatDecimal(paymentOption.get('residualValue'), '');
		$.residualClear.visible = ($.residualValueInputTextField.value !== '');
		$.originalInvoiceInputTextField.value = stringFormatter.formatDecimal(paymentOption.get('originalInvoice'), '');
		$.originalInvoiceClear.visible = ($.originalInvoiceInputTextField.value !== '');
		$.percentualResidualInputTextField.value = stringFormatter.formatDecimal(paymentOption.get('residualPercentage'), '');
		$.percentualResidualClear.visible = ($.percentualResidualInputTextField.value !== '');
	}
};

/**
 * @method blurFields
 * Executes the event blur for insuranceFactorField
 * @return {void}
 */
$.blurFields = function () {
	$.residualValueInputTextField.blur();
	$.originalInvoiceInputTextField.blur();
	$.percentualResidualInputTextField.blur();
};

/**
 * @method handleAmountBlur
 * @private
 * Handles the event blur for textfields on residialRow and calls back uiStateChangeCallback function
 * @param {Object} _evt Blur event
 * @return {void}
 */
function handleAmountBlur(_evt) {
	var _data = {};
	_data[_evt.source.tag] = parser.parseToNumber(_evt.source.value);

	uiStateChangeCallback && uiStateChangeCallback(_data);
};

/**
 * @method handleResidualCalculatorClick
 * @private
 * Handles the event click for residualCalculatorButton that show or hide the residual calculator fields
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleResidualCalculatorClick(_evt) {
	isExpanded = !isExpanded;

	if (!isExpanded) {
		$.residualCalculatorButton.image = $.residualCalculatorButton.imageContracted;
		$.residualCalculation.height = 0;
	} else {
		$.residualCalculatorButton.image = $.residualCalculatorButton.imageExpanded;
		$.residualCalculation.height = 47;
	}
};

$.residualValueInputTextField.addEventListener('blur', handleAmountBlur);
$.originalInvoiceInputTextField.addEventListener('blur', handleAmountBlur);
$.percentualResidualInputTextField.addEventListener('blur', handleAmountBlur);
$.residualCalculatorButton.addEventListener("click", handleResidualCalculatorClick);

init();
