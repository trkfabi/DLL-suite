/**
 * @class Controllers.paymentOption.rateFactorRow
 * Rate factor row controller
 * @uses Helpers.uiHelpers
 * @uses Helpers.stringFormatter
 */

var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog || false;
var modelProperty = args.property;
var paymentOption = args.paymentOption;
var titleid = args.titleid;
var pattern = args.pattern;
var calculationUpdateCallback = args.calculationUpdateCallback;
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
	// uiHelpers.initNumberFormatHandler($.amountText, pattern, false, false);
	uiHelpers.initClearButton($.amountText, $.cleanButton);
	uiHelpers.addDoneButton($.amountText, $.blurFields);
	paymentOption.on('change:useRateCard', $.refreshUI);
	paymentOption.on('change:manualRateFactor', $.refreshUI);
	$.refreshUI();
};

/**
 * @method refreshUI
 * Refreshes the amountText value based on paymentOptions modelProperty
 * @return {void}
 */
$.refreshUI = function () {
	doLog && console.log('[rateFactorRow] - refreshUI()');
	if (paymentOption.get('useRateCard')) {
		$.amountText.value = '';
		$.cleanButton.visible = false;
	} else {
		$.amountText.value = stringFormatter.formatDecimal(paymentOption.get('manualRateFactor'), '', pattern);
		$.cleanButton.visible = (($.amountText.value || '').trim() !== '');
	}
	uiHelpers.setElementEnabled($.wrapper, !paymentOption.get('useRateCard'));
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
 * @method blurFields
 * Blurs all fields, hiding the soft keyboard
 * return {void}
 * @return {void}
 */
$.blurFields = function () {
	$.amountText.blur();
};

/**
 * @method cleanUp
 * Remove the monitoring changes of the model
 * @return {void}
 */
$.cleanUp = function () {
	doLog && console.log('[rateFactorRow] - cleanUp - ' + modelProperty);

	paymentOption.off('change:useRateCard', $.refreshUI);
	paymentOption.off('change:manualRateFactor', $.refreshUI);
};

/**
 * @method handleAmountTextBlur
 * @private
 * Handles the blur event of amountText and update the rateFactor value
 * @return {void}
 */
function handleAmountTextBlur() {
	if (!paymentOption.get('useRateCard')) {
		doLog && console.log('[rateFactorRow] - handleAmountTextBlur');
		var params = {};
		params.manualRateFactor = $.amountText.value;
		calculationUpdateCallback(params);
	}
};

$.amountText.addEventListener('blur', handleAmountTextBlur);

init();
