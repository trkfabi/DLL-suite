/**
 * @class Controllers.paymentOption.rateProgramPickerRow
 * Rate Program Picker controller
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
	paymentOption.on('change:promoCode', $.refreshUI);
	paymentOption.on('change:promoName', $.refreshUI);
	$.refreshUI();
};

/**
 * @method refreshUI
 * Refreshes the selectionLabel text paymentOptions promoName
 * @return {void}
 */
//TODO : Change to other place to avoid multiple calls
$.refreshUI = function () {
	$.selectionLabel.text = paymentOption.get('promoName');
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
	doLog && console.log('[rateProgramPickerRow] - cleanUp');
	paymentOption.off('change:promoCode', $.refreshUI);
	paymentOption.off('change:promoName', $.refreshUI);
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

		var promos = rateCards.getAllPromoCodes();
		var options = promos.map(function (_promo) {
			return {
				title: _promo.get('description'),
				value: _promo.get('program')
			};
		});

		appNavigation.openPickerWindow({
			options: options,
			callback: function (_option) {
				if (_option) {
					$.selectionLabel.text = _option.title;

					calculationUpdateCallback({
						promoName: _option.title,
						promoCode: _option.value
					});
				}

				pickerOpened = false;
			}
		});
	}
};

$.pickerContainer.addEventListener('click', handlePickerClick);

init();
