/**
 * @class Controllers.paymentOption.advancePaymentPickerRow
 * Advance Payment Picker controller
 * @uses Helpers.uiHelpers
 * @uses appNavigation
 * @uses rateCards
 */

var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog || false;
var paymentOption = args.paymentOption;
var calculationUpdateCallback = args.calculationUpdateCallback;
var titleid = args.titleid;
var uiHelpers = require('/helpers/uiHelpers');
var appNavigation = require('/appNavigation');
var rateCards = require('/rateCards');
var pickerOpened = false;

/**
 * @method init
 * @private
 * Initialize values for current controller
 * @return {void}
 */
function init() {
	$.titleLabel.text = L(titleid);
	paymentOption.on('change:advancePayment', $.refreshUI);
	paymentOption.on('change:advancePaymentType', $.refreshUI);
	$.refreshUI();
};

/**
 * @method refreshUI
 * Refreshes the advance payment selection based on payment options
 * @return {void}
 */
$.refreshUI = function () {
	$.selectionLabel.text = rateCards.getAdvancePaymentTitle({
		advancePayment: paymentOption.get('advancePayment'),
		advancePaymentType: paymentOption.get('advancePaymentType')
	});
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
	doLog && console.log('[AdvancePaymentPickerRow] - cleanUp');

	paymentOption.off('change:advancePayment', $.refreshUI);
	paymentOption.off('change:advancePaymentType', $.refreshUI);
};

/**
 * @method handlePickerClick
 * @private
 * Handles the click event of the picker and updates the value
 * @return {void}
 */
function handlePickerClick() {
	if (!pickerOpened) {

		pickerOpened = true;

		var advancePayments = rateCards.getAllAdvancePayments(paymentOption);
		var options = [];
		options = advancePayments.map(function (_advancePayment) {
			return {
				'title': rateCards.getAdvancePaymentTitle(_advancePayment),
				'value': _advancePayment
			};
		});

		appNavigation.openPickerWindow({
			options: options,
			callback: function (_rowSelected) {
				if (_rowSelected) {
					var value = _rowSelected.value || {};

					$.selectionLabel.text = _rowSelected.title;

					calculationUpdateCallback({
						advancePayment: value.advancePayment,
						advancePaymentType: value.advancePaymentType
					});
				}

				pickerOpened = false;
			}
		});
	}
};

$.pickerContainer.addEventListener('click', handlePickerClick);

init();
