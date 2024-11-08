/**
 * @class Controllers.paymentOption.paymentOption
 * Manages the PaymentOption row, to be used inside the Controllers.QuoteView controller
 * uses libs/analytics
 * uses appNavigation
 * uses calculations/calculator
 * uses calculations/calculatorManager
 * uses helpers/uiHelpers
 * uses helpers/stringFormatter
 * uses helpers/parser
 * uses rateCards
 */

var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;

var analytics = require('/utils/analytics');
var appNavigation = require('/appNavigation');
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');
var parser = require('/helpers/parser');
var dataHelpers = require('/helpers/dataHelpers');
var configsManager = require('/utils/configsManager');
var calculatorManager = require('/calculations/calculatorManager');
var rateCards = require('/rateCards');

// Models
var paymentOptions = args.paymentOptions;
var paymentOption = args.paymentOption;
var useRateCard = paymentOption.get('useRateCard');
// Nested Controllers
var paymentRows = {};

// Utility
var paymentData = configsManager.getConfig('payment');
var isMenuOpened = false;
var rateFactorPaymentCategoryIndex = 0;
var hasShownAlert = false;

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	doLog && console.log('[paymentOption] - init');

	loadPaymentOptionRows();

	if (paymentOption.isActive()) {
		paymentOption.on('change', $.refreshUI);

		if (paymentOption.get('shouldRecalculate')) {
			handleCalculatorChange(dataHelpers.defaults(paymentOption.toJSON(), rateCards.getDefaults()));

			paymentOption
				.set('shouldRecalculate', false)
				.save();
		}
	}

	$.refreshUI();
};

/**
 * @method loadPaymentOptionRows
 * @private
 * Load payment rows
 * @return {void}
 */
function loadPaymentOptionRows() {
	doLog && console.log('[paymentOption] - loadPaymentOptionRows');

	if (paymentData.sections) {

		_.each(paymentData.sections, function (_section) {
			// doLog && console.log('[paymentOption] - loadPaymentOptionRows - ' + _section.controller);
			// TODO: load sections and each section should load a row. DO NOT load rows directly int he list
			// var paymentSection = Alloy.createController('paymentOption/paymentSection', _section);
			// sections.push(paymentSection);
			// $.paymentRowContainer.add(paymentSection.getView());

			var rows = _section.rows || [];

			_.each(rows, function (_row) {
				var paymentOptions = {
					id: _row.id,
					property: _row.property,
					paymentOption: paymentOption,
					calculationUpdateCallback: handleCalculatorChange,
					titleid: _row.titleid,
					pattern: _row.pattern
				};

				if (_row.id === 'rateOptions') {
					paymentOptions.options = _row.options;
				}

				if (_row.id === 'purchaseOptions' || _row.id === 'paymentFrequency') {
					paymentOptions.definitions = _row.definitions;
				}

				var paymentRow = Alloy.createController(_row.controller, paymentOptions);

				paymentRows[_row.id] = paymentRow;

				$.paymentRowContainer.add(paymentRow.getView());
			});
		});

	}
};

/**
 * @method updateDetailLabel
 * @private
 * Update detail label values
 * @return {void}
 */
function updateDetailLabel() {
	doLog && console.log('[paymentOption] - updateDetailLabel');
	var rateFactor = paymentOption.get('rateFactor');
	var strPurchaseOption = '';

	rateFactor = stringFormatter.formatDecimal(rateFactor, '', '#.000000');

	switch (paymentOption.get('purchaseOptions')) {
	case 'D':
		strPurchaseOption = '$1';
		break;
	case 'P':
		strPurchaseOption = 'FPO';
		break;
	case 'F':
		strPurchaseOption = 'FMV';
		break;
	default:
		strPurchaseOption = 'FMV';
	}

	$.descriptionLabel.text = String.format(
		'%s %s %s %s',
		'' + paymentOption.get('term'),
		L('months'),
		strPurchaseOption,
		rateFactor
	);

	$.financeLabel.text = String.format(
		'%s $ %s',
		L('amount_financed'),
		stringFormatter.formatDecimal(paymentOption.get('amountFinanced'))
	);
};

/**
 * @method refreshUI
 * @private
 * Refreshes the whole UI based on the Payment Model
 * @return {void}
 */
$.refreshUI = function () {
	doLog && console.log('[paymentOption] - refreshUI()');
	var useRateCard = paymentOption.get('useRateCard');
	var payment = parser.parseToNumber(paymentOption.get('payment'));
	var hasValidRateCard = rateCards.hasValidRateCard(paymentOption);
	var terms = [];
	var frequencies = [];
	var purchaseOptions = [];

	$.paymentTotalLabel.text = stringFormatter.formatCurrency(payment.toFixed(2), '');

	updateDetailLabel();

	if (paymentOption.isActive()) {
		terms = rateCards.getTermsForPaymentOption(paymentOption);
		frequencies = rateCards.getPaymentFrequeciesForPaymentOption(paymentOption);
		purchaseOptions = rateCards.getPurchaseOptionsForPaymentOption(paymentOption);

		paymentRows.purchaseOptions.setOptions(purchaseOptions);
		paymentRows.termOptions.setOptions(terms);
		paymentRows.paymentFrequency.setOptions(frequencies);

	} else {
		paymentOption.off('change', $.refreshUI);

		terms.push(paymentOption.get('term'));
		frequencies.push(paymentOption.get('paymentFrequency'));
		purchaseOptions.push(paymentOption.get('purchaseOptions'));

		paymentRows.purchaseOptions.setOptions(purchaseOptions);
		paymentRows.termOptions.setOptions(terms);
		paymentRows.paymentFrequency.setOptions(frequencies);

		_.defer($.disableAllControls);

		if (!paymentOption.isSubmitted() && !hasShownAlert && !Alloy.Globals.updateDialogIsVisible) {
			appNavigation.showAlertMessage(L('quote_not_available'));
			hasShownAlert = true;
		}
	}

	uiHelpers.setElementEnabled($.solveForButton, !!(paymentOption.isActive() && payment > 0 && hasValidRateCard));
};

/**
 * @method toggleExpanded
 * Handle the toggle to expand a container
 * @param {Boolean} _isExpanded Parameter to be used it to know if a container is expanded 
 * @return {void}
 */
$.toggleExpanded = function (_isExpanded) {
	uiHelpers.expandCollapse({
		container: $.container,
		button: $.expandCollapseButton,
		shouldExpand: _isExpanded
	});
};

/**
 * @method setSelected
 * Handle the selections of the payments
 * @param {Boolean} _isSelected Parameter to be used it to select a payment
 * @return {void}
 */
$.setSelected = function (_isSelected) {
	analytics.captureEvent('[paymentOption] - setSelected() - ' + _isSelected + ' - ' + paymentOption.id);

	if (_isSelected) {
		$.numberLabel.backgroundColor = $.numberLabel.backgroundColorActive;
		$.numberLabel.borderColor = $.numberLabel.borderColorActive;
		$.numberLabel.color = $.numberLabel.colorActive;
	} else {
		$.numberLabel.backgroundColor = $.numberLabel.backgroundColorUnactive;
		$.numberLabel.borderColor = $.numberLabel.borderColorUnactive;
		$.numberLabel.color = $.numberLabel.colorUnactive;
	}
};

/**
 * @method toggleMenuOpened
 * Handle the toggle of the menu to know if the menu should be opened
 * @param {Boolean} _shouldOpen Parameter to know if the menu should be opened
 * @return {void}
 */
$.toggleMenuOpened = function (_shouldOpen) {
	_shouldOpen = (_shouldOpen != null ? _shouldOpen : !isMenuOpened);
	var _animation = Ti.UI.createAnimation({
		left: _shouldOpen ? 230 : 0,
		duration: 150
	});

	if (isMenuOpened !== _shouldOpen) {
		$.paymentContainer.animate(_animation, function () {
			isMenuOpened = _shouldOpen;
		});
	}
};

/**
 * @method undoLatestPaymentOptionValues
 * @private
 * Roll back the most recent update of values.
 * @return {void}
 */
$.undoLatestPaymentOptionValues = function () {
	doLog && console.log('[paymentOption] - undoLatestPaymentOptionValues() ');
	paymentOption.undo();
};

/**
 * @method setPaymentOptionIndex
 * Sets the index for the current payment options and updates the UI
 * @param {Number} _paymentOptionIndex Value to be set in the paymentOption.orderNo
 * @return {void}
 */
$.setPaymentOptionIndex = function (_paymentOptionIndex) {
	$.numberLabel.text = _paymentOptionIndex;
	paymentOption.set({
		'orderNo': _paymentOptionIndex
	});
};

/**
 * @method isReadyForUpload
 * @return {Boolean} True/False
 * @deprecated
 */
$.isSolveForEnabled = function () {
	return isSolveForEnabled;
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
 * @method showUnselected
 * Change the numberContainer background color to display the payment option as selected
 * @return {void}
 */
$.showUnselected = function () {
	doLog && console.log('[paymentOption] - showUnselected');
	if (OS_IOS) {
		$.numberContainer.backgroundColor = Alloy.Globals.colors.white;
	} else {
		$.numberContainer.backgroundImage = '/images/ic_payment_circle_transparent.png';
	}

	$.numberLabel.color = Alloy.Globals.colors.titleBlue;
};

/**
 * @method cleanUp
 * Sets paymentOption model to null
 * @return {void}
 */
$.cleanUp = function () {
	doLog && console.log('[paymentOption] - cleanUp()');
	paymentOption.off('change', $.refreshUI);

	_.each(paymentRows, function (_category) {
		_category.cleanUp();
	});
};

/**
 * @method showRowCollapsed
 * Changes the height of container to display the payment options row as collapsed
 * @return {void}
 */
$.showRowCollapsed = function () {
	$.container.height = Alloy.Globals.paymentRowHeight;
};

/**
 * @method blurFields
 * Blur all fields of dynamic rows
 * @return {void}
 */
$.blurFields = function () {
	_.each(paymentRows, function (_category) {
		_category.blurFields && _category.blurFields();
	});
};

/**
 * @method setDeleteButtonActive
 * Activates/Desactivates the delete button
 * @param {Boolean} _state `true` is the delete button should be active, `false` otherwise
 * @return {void}
 */
$.setDeleteButtonActive = function (_state) {
	uiHelpers.setElementEnabled($.deleteButton, _state);
};

/**
 * @method disableAllControls
 * Disables all the controls for de PO
 * @return {void}
 */
$.disableAllControls = function () {
	doLog && console.log('[paymentOption] - disableAllControls()');
	// TODO: make sure you still can duplicate unsubmitted expired payments
	var allowDuplicate = !paymentOption.isSubmitted();
	uiHelpers.setElementEnabled($.blankSpaceViewTop, false);
	uiHelpers.setElementEnabled($.blankSpaceViewBottom, false);

	uiHelpers.setElementEnabled($.deleteButton, false);
	uiHelpers.setElementEnabled($.duplicateButton, allowDuplicate);
	uiHelpers.setElementEnabled($.solveForButton, false);

	_.each(paymentRows, function (_category) {
		_category.disableUI();
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
 * @method handleDetailContainerClick
 * @private
 * Handle the click event for the detailContainer control
 * @param {Object} _evt Parameter for the click event to be used it on the detailContainer control
 * @return {void}
 */
function handleDetailContainerClick(_evt) {
	doLog && console.log('[paymentOption] - handleDetailContainerClick()');
	$.blurFields();
};

/**
 * @method handlePaymentContainerLongPress
 * @private
 * Handle the longpress event for the paymentContainer control
 * @param {Object} _evt Parameter for the longpress event to be used it on the paymentContainer control
 * @return {void}
 */
function handlePaymentContainerLongPress(_evt) {
	analytics.captureEvent('[paymentOption] - handlePaymentContainerLongPress() - ' + paymentOption.id);
	_evt.paymentOption = paymentOption;
	args.longpressCallback(_evt);
};

/**
 * @method handlePaymentContainerSwipe
 * @private
 * Handle the swipe event for the paymentContainer control
 * @param {Object} _evt Parameter for the swipe event to be used it on the paymentContainer control
 * @return {void}
 */
function handlePaymentContainerSwipe(_evt) {
	var _isOpened = false;
	if (_evt.direction === 'right') {
		_isOpened = true;
	} else if (_evt.direction === 'left') {
		_isOpened = false;
	}

	analytics.captureEvent('[paymentOption] - handlePaymentContainerSwipe() - ' + paymentOption.id);

	$.toggleMenuOpened(_isOpened);

	_evt.isOpened = _isOpened;
	_evt.paymentOption = paymentOption;
	args.swipeCallback(_evt);
};

/**
 * @method handleCalculatorChange
 * @private
 * Handles any change in the payment values so the calculator handler will do all the calculations again
 * @return {void}
 */
function handleCalculatorChange(_params) {
	_params = _params || {};
	_params.paymentOption = paymentOption;

	calculatorManager.handlePaymentOptionChange(_params);
};

$.headerContainer.addEventListener('click', handlePaymentHeaderClick);
$.detailContainer.addEventListener('click', handleDetailContainerClick);
$.paymentContainer.addEventListener('swipe', handlePaymentContainerSwipe);
$.paymentContainer.addEventListener('longpress', handlePaymentContainerLongPress);

init();
