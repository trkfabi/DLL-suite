/**
 * # Amortization Window
 * @class Controllers.amortization.amortizationWindow
 * @uses utils/analytics
 * @uses calculations/amortization
 * @uses appNavigation
 * @uses utils/sessionManager
 */

var args = arguments[0] || {};
var analytics = require('/utils/analytics');
var amortization = require('/calculations/amortization');
var appNavigation = require('/appNavigation');
var paymentOption = args.paymentOption;
var amortizationInfo;

/**
 * @method init
 * @private
 * Initialize values for the current view
 * @return {void}
 */
function init() {
	analytics.captureApm('[amortizationWindow] - init()');

	amortizationInfo = amortization.getAmortizationInfo({
		payment: paymentOption
	});

	for (var i = 0, j = amortizationInfo.schedule.length; i < j; i++) {
		var scheduleRow = amortizationInfo.schedule[i];
		var amortizationRow = Alloy.createController('amortization/amortizationRow', {
			scheduleRow: scheduleRow
		});
		$.scheduleSection.add(amortizationRow.getView());
	}
};

/**
 * @method handleWindoClose
 * @private
 * Handles the close event for amortization Window
 * @return {void}
 */
function handleWindoClose(_evt) {
	$.window.removeEventListener('close', handleWindoClose);
	OS_IOS && appNavigation.closeAmortizationWindow();
};

/**
 * @method handleBackClick
 * @private
 * Handles the click on Android device back button
 * @return {void}
 */
function handleBackClick(_evt) {
	appNavigation.closeAmortizationWindow();
};

if (OS_ANDROID) {
	$.titleLabel.addEventListener('click', handleBackClick);
	$.backButton.addEventListener('click', handleBackClick);
}

$.backView.addEventListener('click', handleBackClick);
$.window.addEventListener('close', handleWindoClose);

init();
