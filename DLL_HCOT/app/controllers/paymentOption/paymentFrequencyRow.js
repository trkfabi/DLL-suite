/**
 * @class Controllers.paymentOption.paymentFrequencyRow
 * Row controller for the PaymentFrequency attribute
 */
var args = arguments[0] || {};
var uiHelpers = require('/helpers/uiHelpers');
var paymentOption = args.paymentOption;

/**
 * @method init
 * @private
 * Inits the controller
 * @return {void}
 */
function init() {
	exports.baseController = 'paymentOption/multiOptionRow';
	paymentOption.on('change:useRateCard', handleRateCardMode);

	handleRateCardMode();
};

/**
 * @method handleRateCardMode
 * @private
 * Handles the enable/disable mode when in rate factor mode
 * @return {void}
 */
function handleRateCardMode() {
	uiHelpers.setElementEnabled($.wrapper, !!paymentOption.get('useRateCard'));
};

init();
