/**
 * @class Controllers.paymentOption.rateCardOptionRow
 * Payment category
 * @uses Helpers.uiHelpers
 */

var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog || false;
var uiHelpers = require('/helpers/uiHelpers');
var paymentOption = args.paymentOption;
var calculationUpdateCallback = args.calculationUpdateCallback;
var options = args.options;
var rateTypeBar;

/**
 * @method init
 * @private
 * Initialize values for current controller
 * @return {void}
 */
function init() {
	loadRateTypeBar();
	_.defer($.refreshUI);
	paymentOption.on('change:useRateCard', $.refreshUI);
};

/**
 * @method loadRateTypeBar
 * @private
 * Loads the tabbed bar for rate type
 * @return {void}
 */
function loadRateTypeBar() {

	rateTypeBar = Alloy.createController('common/tabbedBar', {
		bottom: 5,
		left: 10,
		right: 50,
		index: 0,
		style: Alloy.Globals.tabbedBar.STYLE_TABBED_BAR,
		tintColor: Alloy.Globals.colors.abbey,
		backgroundColor: Alloy.Globals.colors.gallery,
		selectColor: Alloy.Globals.colors.white,
		labels: options.labels
	});

	$.wrapper.add(rateTypeBar.getView());

	rateTypeBar.addEventListener('click', handleRateTypeBarClick);
};

/**
 * @method translateOptionToIndex
 * @private
 * Translate useRateCard to 0 or 1
 * @return {Number} index of tabbed that corresponds useRateCard value
 */
function translateOptionToIndex() {
	doLog && console.log('[RateCardOptionRow] - translateOptionToIndex() - ' + paymentOption.get('useRateCard'));
	return (paymentOption.get('useRateCard')) ? 0 : 1;
}

/**
 * @method refreshUI
 * Refreshes the rate type var of the controller based on paymentOptions.useRateCard
 * @return {void}
 */
$.refreshUI = function () {
	rateTypeBar.setIndex(translateOptionToIndex());
};

/**
 * @method disableUI
 * Sets enable = false for all controller of the current controller
 * @return {void}
 */
$.disableUI = function () {
	uiHelpers.setElementEnabled($.wrapper, false);
};

/**
 * @method cleanUp
 * Removew the monitoring changes of the model
 * @return {void}
 */
$.cleanUp = function () {
	doLog && console.log('[rateCardOptionRow] - cleanUp');

	paymentOption.off('change:useRateCard', $.refreshUI);
};

/**
 * @method handleRateTypeBarClick
 * @private
 * Handles click event from the rateTypeBar
 * @param {Object} _evt Click event object
 * @return {void}
 */
function handleRateTypeBarClick(_evt) {
	if (translateOptionToIndex() != _evt.index) {
		calculationUpdateCallback({
			useRateCard: +!_evt.index
		});
	}
};

/**
 * @method handleResetOptionsClick
 * @private
 * Handles click event from resetOptionsButton
 * @param {Object} _evt Click event object
 * @return {void}
 */
function handleResetOptionsClick() {
	calculationUpdateCallback({
		reset: true
	});
};

$.resetOptionsButton.addEventListener('click', handleResetOptionsClick);

init();
