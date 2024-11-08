/**
 * @class Controllers.paymentOption.paymentOption
 * Manages the PaymentOption row, to be used inside the Controllers.QuoteView controller
 */
var args = arguments[0] || {};
var analytics = require('/utils/analytics');
var appNavigation = require('/appNavigation');
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');
var parser = require('/helpers/parser');
var sessionManager = require('/utils/sessionManager');
var uiUpdateHandler = require('/calculations/uiUpdateHandler');

// Models
var paymentOptions = args.paymentOptions;
var paymentOption = args.paymentOption;

// Nested Controllers
var paymentCategories = [];

// Utility
var countryData = sessionManager.getCountryData();
var paymentData = countryData.payment;
var isMenuOpened = false;

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	// TODO: Make this controller configurable
	// loadPaymentRows();
	$.initKeyboardToolbar();
	paymentOption.on('change', $.refreshUI);

	$.refreshUI();
};

$.initKeyboardToolbar = function () {
	uiHelpers.addDoneButton($.interestRateTextField, $.blurFields);
	uiHelpers.initClearButton($.interestRateTextField, $.interestRateClear);
	uiHelpers.initNumberFormatHandler($.interestRateTextField, '#,##0.00', true);

	uiHelpers.addDoneButton($.ballonTextField, $.blurFields);
	uiHelpers.initNumberFormatHandler($.ballonTextField);
};

/**
 * @method loadPaymentRows
 * @private
 * Load payment rows
 * @return {void}
 */
function loadPaymentRows() {
	_.each(paymentData.categories, function (_category) {
		var _paymentCategory = Alloy.createController('paymentOption/paymentCategory', {
			paymentOption: paymentOption,
			categoryData: _category,
			uiStateChangeCallback: uiUpdateHandler.handlePaymentOptionChange
		});

		paymentCategories.push(_paymentCategory);
		$.detailContainer.add(_paymentCategory.getView());
	});
};

/**
 * @method updateDetailLabel
 * @private
 * Update detail label values
 * @return {void}
 */
function updateDetailLabel() {
	var _isLease = paymentOption.isLease();
	var _term = paymentOption.get('term');
	var _interestRate = paymentOption.get('interestRate');
	var _paymentDescriptionFormat = L('payment_description_format');
	var _residualFormat = L('payment_residual_format');
	var _additionalFormat = '%s $ %s';
	var _text = '';

	_text = String.format(_paymentDescriptionFormat,
		(_isLease ? L('lease') : L('finance')),
		_term,
		stringFormatter.formatPercentage(_interestRate)
	);

	if (_isLease) {
		_text += String.format(_residualFormat,
			stringFormatter.formatDecimal(paymentOption.get('residualValue'))
		);
	}

	$.paymentTotalLabel.text = stringFormatter.formatPositiveDecimal(paymentOption.get('payment'), '');
	$.descriptionLabel.text = _text;

	if (OS_ANDROID) {
		if (_text.length < 38) {
			$.descriptionLabel.font = {
				fontSize: 15
			};
		} else {
			$.descriptionLabel.font = {
				fontSize: 13
			};
		}
	}

	$.financeLabel.text = String.format(_additionalFormat,
		(_isLease ? L('leased_property_value') : L('amount_financed')),
		stringFormatter.formatPositiveDecimal(paymentOption.get('amountFinanced'))
	);
};

/**
 * @method refreshPaymentFrequency
 * @private
 * Refresh the payment frequency UI
 * @return {void}
 */
function refreshPaymentFrequency() {
	var _paymentFrequency = paymentOption.get("paymentFrequency");
	var _index = 0;

	switch (_paymentFrequency) {
	case 'M':
		_index = 0;
		break;
	case 'Q':
		_index = 1;
		break;
	case 'SA':
		_index = 2;
		break;
	case 'A':
		_index = 3;
		break;
	}

	$.frequencyBar.setIndex(_index);
};

/**
 * @method refreshTerms
 * @private
 * Refresh the terms UI
 * @return {void}
 */
function refreshTerms() {
	var _term = paymentOption.get("term");
	var _index = 0;

	switch (_term) {
	case '24':
		_index = 0;
		break;
	case '36':
		_index = 1;
		break;
	case '48':
		_index = 2;
		break;
	case '60':
		_index = 3;
		break;
	case '72':
		_index = 4;
		break;
	case '84':
		_index = 5;
		break;
	}

	$.termsBar.setIndex(_index);
};

/**
 * @method refreshUI
 * Refreshes the whole UI based on the Payment Model
 * @return {void}
 */
$.refreshUI = function () {
	doLog && console.log('[paymentOption] - refreshUI()');
	var _isLease = paymentOption.isLease();
	var _index = paymentOptions.indexOf(paymentOption);
	var _payment = parser.parseToNumber(paymentOption.get('payment'));

	paymentOption.set('orderNo', _index + 1);

	if (_isLease) {
		$.modifyStandardPaymentContainer.touchEnabled = false;
		$.modifyStandardPaymentContainer.height = 0;
		$.amortizationButton.visible = false;

		uiHelpers.setElementEnabled($.goalSeekButton, false);
	} else {
		$.modifyStandardPaymentContainer.touchEnabled = true;

		if ($.modifyStandardPaymentContainer.isExpandedSet) {
			if ($.modifyStandardPaymentContainer.expanded) {
				$.modifyStandardPaymentContainer.height = $.modifyStandardPaymentContainer.heightExpanded || Ti.UI.SIZE;
			} else {
				$.modifyStandardPaymentContainer.height = $.modifyStandardPaymentContainer.heightCollapsed || 40;
			}
		} else {
			$.modifyStandardPaymentContainer.height = Ti.UI.SIZE;
		}

		$.amortizationButton.visible = true;

		uiHelpers.setElementEnabled($.goalSeekButton, (_payment > 0));
	}

	updateDetailLabel();
	refreshPaymentFrequency();
	refreshTerms();

	$.numberLabel.text = _index + 1;
	$.interestRateTextField.value = stringFormatter.formatDecimal(paymentOption.get("interestRate"));
	$.interestRateClear.visible = ($.interestRateTextField.value !== '');
	$.ballonTextField.value = stringFormatter.formatDecimal(paymentOption.get('balloon'), '');
};

/**
 * @method blurFields
 * It forces a blur() on all the TextFields of this controller's view
 * @return {void}
 */
$.blurFields = function () {
	$.interestRateTextField.blur();
	$.ballonTextField.blur();
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
	analytics.captureApm('[paymentOption] - setSelected() - ' + _isSelected + ' - ' + paymentOption.id);
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
		// $.paymentContainer.animate(animation, doneCallback);
	}
};

/**
 * @method getPaymentOption
 * Get the payment option model
 * @return {Models.PaymentOption} Return a payment option model
 */
$.getPaymentOption = function () {
	return paymentOption;
};

/**
 * @method handlePaymentContainerClick
 * @private
 * Handle the click event for the headerContainer control
 * @param {Object} _evt Parameter for the click event to be used it on the headerContainer control
 * @return {void}
 */
function handlePaymentContainerClick(_evt) {
	analytics.captureApm('[paymentOption] - handlePaymentContainerClick() - ' + paymentOption.id);
	_evt.paymentOption = paymentOption;
	args.clickCallback(_evt);
};

/**
 * @method handlePaymentContainerLongPress
 * @private
 * Handle the longpress event for the paymentContainer control
 * @param {Object} _evt Parameter for the longpress event to be used it on the paymentContainer control
 * @return {void}
 */
function handlePaymentContainerLongPress(_evt) {
	analytics.captureApm('[paymentOption] - handlePaymentContainerLongPress() - ' + paymentOption.id);
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

	analytics.captureApm('[paymentOption] - handlePaymentContainerSwipe() - ' + paymentOption.id);

	$.toggleMenuOpened(_isOpened);

	_evt.isOpened = _isOpened;
	_evt.paymentOption = paymentOption;
	args.swipeCallback(_evt);
};

/**
 * @method handleFieldBlur
 * @private
 * Handle the blur event for some textfields controls
 * @param {Object} _evt Parameter for the blur event for some textfields controls
 * @return {void}
 */
function handleFieldBlur(_evt) {
	var _tag = _evt.source.tag;
	var _value = parser.parseToNumber(_evt.source.value);
	var _data = {};

	if (_tag) {
		_data[_tag] = _value;
	}

	handleUIStateChange(_data);
};

/**
 * @method handleInterestRateFieldBlur
 * @private
 * Handle the blur event for interest rate textfield control
 * @param {Object} _evt Parameter for the interest rate textfield blur event 
 * @return {void}
 */
function handleInterestRateFieldBlur(_evt) {
	var _tag = _evt.source.tag;
	var _value = parser.parseToNumber(_evt.source.value);
	var _data = {};

	if (_tag) {
		_data[_tag] = _value;
	}
	handleUIStateChange(_data);

	if (args.interestRateBlurCallback && typeof args.interestRateBlurCallback === 'function') {
		args.interestRateBlurCallback();
	}
}

/**
 * @method handleTabbarClick
 * @private
 * Handle the click event for for termsBar, and frequencyBar
 * @param {Object} _evt Parameter for the click event for termsBar, and frequencyBar
 * @return {void}
 */
function handleTabbarClick(_evt) {
	var _tag = _evt.source.tag;
	var _index = _evt.index || 0;
	var _value = _evt.source.values[_index];
	var _data = {};

	analytics.captureApm('[paymentOption] - handleTabbarClick() - ' + (_tag || 'Option') + ' = ' + _value);

	if (_tag) {
		_data[_tag] = _value;
	}

	handleUIStateChange(_data);
};

/**
 * @method handleAmortizationClick
 * @private
 * Handle the click event for amortizationButton control
 * @param {Object} _evt Parameter for the click event of amortizationButton control
 * @return {void}
 */
function handleAmortizationClick(_evt) {
	analytics.captureApm('[paymentOption] - handleAmortizationClick() - ' + paymentOption.id);
	appNavigation.openAmortizationWindow({
		paymentOption: paymentOption
	});
};

/**
 * @method handleUIStateChange
 * @private
 * Handle the state change of the UI payment option
 * @param {Object} _data Parameter to be used for the payment option
 * @return {void}
 */
function handleUIStateChange(_data) {
	if (_data) {
		_data.paymentOption = paymentOption;
	}

	uiUpdateHandler.handlePaymentOptionChange(_data);
};

/**
 * @method standardHeaderClick
 * @private
 * Handle the the click event for the modifyStandardHeader control
 * @param {Object} _evt Parameter for the click event for modifyStandardHeader control
 * @return {void}
 */
function standardHeaderClick(_evt) {
	uiHelpers.expandCollapse({
		container: $.modifyStandardPaymentContainer,
		button: $.modifyStandardPaymentButton
	});
};

$.headerContainer.addEventListener('click', handlePaymentContainerClick);
$.paymentContainer.addEventListener('swipe', handlePaymentContainerSwipe);
$.paymentContainer.addEventListener('longpress', handlePaymentContainerLongPress);

$.interestRateTextField.addEventListener('blur', handleFieldBlur);
$.ballonTextField.addEventListener('blur', handleFieldBlur);
$.interestRateTextField.addEventListener('blur', handleInterestRateFieldBlur);

$.termsBar.addEventListener('click', handleTabbarClick);
$.frequencyBar.addEventListener('click', handleTabbarClick);
$.amortizationButton.addEventListener('click', handleAmortizationClick);
$.modifyStandardHeader.addEventListener('click', standardHeaderClick);

init();
