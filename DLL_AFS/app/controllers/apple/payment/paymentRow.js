/**
 * @class Controllers.apple.payment.paymentRow
 * Payment Row
 * @uses Helpers.uiHelpers
 */
var args = arguments[0] || {};
var analytics = require('/utils/analytics');
var doLog = Alloy.Globals.doLog;
var appNavigation = require('/appNavigation');
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');
var calculatorManager = require('/apple/calculations/calculatorManager');
var isMenuOpened = false;

/**
 * @property {Models.quote} quote
 * @private
 * Quote containing the Payment Option to show
 */
var quote = args.quote;

/**
 * @property {Models.paymentOption} paymentOption
 * @private
 * Payment Option to show and save ni the UI
 */
var paymentOption = args.paymentOption;

/**
 * @property {Array} termOptions
 * @private
 * Term options to show in the tabbed bar selector
 */
var termOptions = ['12', '18', '24', '36', '48'];

/**
 * @property {Boolean} hasShownAlert
 * @private
 * Flag to know if the alert has been shown
 */
var hasShownAlert = false;

/**
 * @property {Object} currentTerm
 * @private
 * Flag to know if the alert has been shown
 */
var currentTerm = '';

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	$.termBar.labels = termOptions;

	if ((quote && quote.isActive()) && paymentOption.isActive()) {
		paymentOption.on('change', $.refreshUI);

		if (paymentOption.get('shouldRecalculate')) {

			calculatorManager.handleQuoteChange({
				quote: quote,
				paymentOption: paymentOption
			});

			paymentOption
				.set('shouldRecalculate', false)
				.save();
		}
	} else {
		_.defer($.disableAllControls);
	}

	$.paymentRow.paymentId = paymentOption.id;
	$.refreshUI();
};

/**
 * @method toggleExpandCollapse
 * Expands or collapses paymentRow
 * @return {void}
 */
$.toggleExpandCollapse = function (_isExpanded) {
	doLog && console.log('[paymentRow] - toggleExpandCollapse() - ' + _isExpanded);
	_.defer(function () {
		uiHelpers.expandCollapseTop({
			button: $.expandButton,
			container: $.optionsView,
			forced: _isExpanded
		});
	});
};

/**
 * @method toggleMenuOpened
 * Handle the toggle of the menu to know if the menu should be opened
 * @param {Boolean} _shouldOpen Parameter to know if the menu should be opened
 * @return {void}
 */
$.toggleMenuOpened = function (_shouldOpen) {
	_shouldOpen = (_shouldOpen != null ? _shouldOpen : !isMenuOpened);
	$.toggleExpandCollapse(_shouldOpen);
};

/**
 * @method disableAllControls
 * Disables all the controls for the payment row
 * @return {void}
 */
$.disableAllControls = function () {
	doLog && console.log('[paymentRow] - disableAllControls()');

	$.paymentRow.editable = false;
	uiHelpers.setElementEnabled($.termBar, false);
};

/**
 * @method enableAllControls
 * Enables all the controls for the payment row
 * @return {void}
 */
$.enableAllControls = function () {
	doLog && console.log('[paymentRow] - enableAllControls()');

	$.paymentRow.editable = true;
	uiHelpers.setElementEnabled($.termBar, true);
};

/**
 * @method refreshUI
 * @private
 * Refreshes the whole UI based on the Payment Model
 * @return {void}
 */
$.refreshUI = function () {
	$.termLabel.text = paymentOption.get('term') + ' Months';
	$.rateFactorLabel.text = 'Rate Factor: ' + stringFormatter.formatDecimal(paymentOption.get('rateFactor'), '',
		'#.000000');
	$.paymentLabel.text = stringFormatter.formatCurrency(paymentOption.get('payment'), '');
	currentTerm = paymentOption.get('term');
	$.termBar.index = termOptions.indexOf(currentTerm);
};

/**
 * @method getPaymentOption
 * Get the payment option model
 * @return {Models.paymentOption} Payment Option model representing this controller's data
 */
$.getPaymentOption = function () {
	return paymentOption;
};

/**
 * @method setSelected
 * Handle the selections of the payments
 * @param {Boolean} _isSelected Parameter to be used it to select a payment
 * @return {void}
 */
$.setSelected = function (_isSelected) {
	if (_isSelected) {
		$.numberLabel.color = $.numberLabel.colorActive;
		$.numberLabel.borderColor = $.numberLabel.borderColorActive;
		$.numberLabel.backgroundColor = $.numberLabel.backgroundColorActive;
	} else {
		$.numberLabel.color = $.numberLabel.colorUnactive;
		$.numberLabel.borderColor = $.numberLabel.borderColorUnactive;
		$.numberLabel.backgroundColor = $.numberLabel.backgroundColorUnactive;
	}
};

/**
 * @method setPaymentOptionIndex
 * Sets the index for the current payment options and updates the UI
 * @param {Number} _index Value to be set in the paymentOption.orderNo
 * @return {void}
 */
$.setPaymentOptionIndex = function (_index) {
	$.numberLabel.text = '' + _index;
	paymentOption.set({
		'orderNo': _index
	});
};

/**
 * @method cleanUp
 * Removes all memory dependencies
 * @return {void}
 */
$.cleanUp = function () {
	doLog && console.log('[Apple-paymentOption] - cleanUp()');
	paymentOption.off('change', $.refreshUI);
};

/**
 * @method handleTermBarClick
 * @private
 * Handler function for the `change` event on the term bar
 * @param {Object} _evt
 * @return {void}
 */
function handleTermBarClick(_evt) {
	doLog && console.log('[Apple-paymentOption] - handleTermBarClick');
	var newTerm = termOptions[$.termBar.index];
	if (currentTerm != newTerm) {
		paymentOption.addAnalyticsCounter('term');
	}
	calculatorManager.handleQuoteChange({
		quote: quote,
		paymentOption: paymentOption,
		term: newTerm
	});
};

/**
 * @method handlePaymentHeaderClick
 * @private
 * Handle the click event for the headerContainer control
 * @param {Object} _evt Parameter for the click event to be used it on the headerContainer control
 * @return {void}
 */
function handlePaymentHeaderClick(_evt) {
	analytics.captureEvent('[paymentOption] - handlePaymentHeaderClick() - ' + paymentOption.id);
	_evt.paymentOption = paymentOption;
	args.clickCallback && args.clickCallback(_evt);
};

/**
 * @method handlePaymentContainerLongPress
 * @private
 * Handle the longpress event for the paymentContainer control
 * @param {Object} _evt Parameter for the longpress event to be used it on the paymentContainer control
 * @return {void}
 */
function handlePaymentHeaderLongPress(_evt) {
	analytics.captureEvent('[paymentOption] - handlePaymentHeaderLongPress() - ' + paymentOption.id);
	_evt.paymentOption = paymentOption;
	args.longpressCallback && args.longpressCallback(_evt);
};

$.paymentHeaderView.addEventListener('singletap', handlePaymentHeaderClick);
$.paymentHeaderView.addEventListener('longpress', handlePaymentHeaderLongPress);
$.termBar.addEventListener('click', handleTermBarClick);

init();
