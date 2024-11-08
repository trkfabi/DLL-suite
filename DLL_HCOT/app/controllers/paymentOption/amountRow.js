/**
 * @class Controllers.paymentOption.amountRow
 * Payment category
 * @uses Helpers.uiHelpers
 * @uses Helpers.stringFormatter
 */

var args = arguments[0] || {};
var modelProperty = args.property;
var paymentOption = args.paymentOption;
var calculationUpdateCallback = args.calculationUpdateCallback;
var titleid = args.titleid;
var pattern = args.pattern;
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');

/**
 * @method init
 * @private
 * Initialize values for current controller
 * @return {void}
 */
function init() {
	$.titleLabel.text = L(titleid);
	uiHelpers.initNumberFormatHandler($.amountText, pattern, false);
	uiHelpers.initClearButton($.amountText, $.cleanButton);
	uiHelpers.addDoneButton($.amountText, $.blurFields);
	paymentOption.on('change:' + modelProperty, $.refreshUI);
	$.refreshUI();
};

/**
 * @method refreshUI
 * Refreshes the amountText value based on paymentOptions modelProperty
 * @return {void}
 */
$.refreshUI = function () {
	$.amountText.value = stringFormatter.formatDecimal(paymentOption.get(modelProperty), '', pattern);
};

/**
 * @method disableUI
 * Sets enable = false for the view of the current controller
 * @return {void}
 */
$.disableUI = function () {
	uiHelpers.setElementEnabled($.wrapper, false);
};

/**
 * @method enableUI
 * Sets enable = true for the view of the current controller
 * @return {void}
 */
$.enableUI = function () {
	uiHelpers.setElementEnabled($.wrapper, true);
};

/**
 * @method cleanUp
 * Remove the monitoring changes of the model
 * @return {void}
 */
$.cleanUp = function () {
	doLog && console.log('[amountRow] - cleanUp - ' + modelProperty);

	paymentOption.off('change:' + modelProperty, $.refreshUI);
};

/**
 * @method blurFields
 * Blurs all fields, hiding the soft keyboard
 * return {void}
 * @return {void}
 */
$.blurFields = function () {
	$.amountText.blur();
};

/**
 * @method handleCleanButtonClick
 * @private
 * Cleans the value of amountText and sets the focus in the control
 * @return {void}
 */
function handleCleanButtonClick() {
	$.amountText.value = '';
	$.amountText.focus();
};

/**
 * @method handleAmountTextBlur
 * @private
 * Handles the blur event of amountText and sets the pattern if any
 * @return {void}
 */
function handleAmountTextBlur() {
	var params = {};
	params[modelProperty] = $.amountText.value;
	calculationUpdateCallback(params);
};

$.cleanButton.addEventListener('click', handleCleanButtonClick);
$.amountText.addEventListener('blur', handleAmountTextBlur);

init();
