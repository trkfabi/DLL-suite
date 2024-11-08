/**
 * # Equipment Price View
 * @class Controllers.additionalCosts.equipmentPrice
 * @uses utils/analytics
 * @uses calculations/calculator
 * @uses helpers/uiHelpers
 * @uses helpers/stringFormatter
 * @uses helpers/parser
 * @uses utils/sessionManager
 * @uses calculations/uiUpdateHandler
 */
var analytics = require('/utils/analytics');
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');
var parser = require('/helpers/parser');
var sessionManager = require('/utils/sessionManager');
var uiUpdateHandler = require('/calculations/uiUpdateHandler');

var paymentOption;

var countryData = sessionManager.getCountryData();
var additionalCostsData = countryData.additionalCosts;
var financeOptionsViews = {};
var financeOptions = [];
var rowControllers = [];
var currentOptionView;

// NOTE: This controller won't use the observer pattern in order to avoid confussions about what event is being
// launched in which model. Use $.setPaymentOption for 'telling' this controller what paymentOption should paint.
// ONLY the changes on the current paymentOption will be listened to

/**
 * @method init
 * @private
 * Initialize values for the current view
 * @return {void}
 */
function init() {
	loadFinanceOptions();
	handleOptionsSelectorClick({
		index: 0
	});

	$.initKeyboardToolbar();
};

$.initKeyboardToolbar = function () {
	uiHelpers.addDoneButton($.priceInputTextField, $.blurFields);
	uiHelpers.initClearButton($.priceInputTextField, $.priceClear);
	uiHelpers.initNumberFormatHandler($.priceInputTextField);

	_.each(rowControllers, function (_rowController) {
		_rowController.initKeyboardToolbar && _rowController.initKeyboardToolbar();
	});
};

/**
 * @method toggleFinanceOptionView
 * @private
 * Show the selected financeOptionView and hides the currentOptionView if any
 * @param {String} _financeOption Finance option selected (Finance / Lease)
 * @return {void}
 */
function toggleFinanceOptionView(_financeOption) {
	analytics.captureApm('[equipmentPrice] - toggleFinanceOptionView() - ' + _financeOption);
	if (_financeOption !== currentOptionView) {
		if (currentOptionView) {
			financeOptionsViews[currentOptionView].visible = false;
		}

		$.optionsSelector.setIndex(_.indexOf(financeOptions, _financeOption));

		currentOptionView = _financeOption;
		financeOptionsViews[currentOptionView].visible = true;

		$.amountFinancedLabel.text = L(additionalCostsData[_financeOption].amountFinanced.titleid);
	}
};

/**
 * @method loadFinanceOptions
 * @private
 * Load the finance options given the additionalCostsData in the country data json
 * @return {void}
 */
function loadFinanceOptions() {
	var _labels = [];

	_.each(additionalCostsData, function (_additionalCost, _financeOption) {
		var _financeOptionView = $.UI.create('View', {
			'classes': 'financeOptionWrapper'
		});

		financeOptionsViews[_financeOption] = _financeOptionView;

		_labels.push(L(_additionalCost.titleid));
		financeOptions.push(_financeOption);

		_.each(_additionalCost.rows, function (_additionalRowInfo) {
			var _rowController = null;
			var _controllerPath = _additionalRowInfo.controller;

			_additionalRowInfo.uiStateChangeCallback = handleUIStateChange;
			_additionalRowInfo.blurOptionsFields = $.blurFields;

			_rowController = Alloy.createController(_controllerPath, _additionalRowInfo);

			_financeOptionView.add(_rowController.getView());
			rowControllers.push(_rowController);
		});

		$.financeOptionsContainer.add(_financeOptionView);
	});

	$.optionsSelector.setLabels(_labels);
};

/**
 * @method setPaymentOption
 * Sets the payment option for equipmentPrice and it refresh the UI
 * @param {Model.PaymentOption} _paymentOption Payment option to be set
 * @return {void}
 */
$.setPaymentOption = function (_paymentOption) {
	if (paymentOption) {
		paymentOption.off('change', $.refreshUI);
	}

	paymentOption = _paymentOption;
	paymentOption.on('change', $.refreshUI);

	$.toggleExpanded("collapsed");

	_.each(rowControllers, function (_rowController) {
		// We pass the Payment Optiom so each row will know what to do with it
		// validate it since not all the rows will need it
		_rowController.setPaymentOption(paymentOption);
	});

	$.refreshUI();
};

/**
 * @method refreshUI
 * Refresh values of the current view
 * @return {void}
 */
$.refreshUI = function () {
	if (paymentOption) {
		$.priceInputTextField.value = stringFormatter.formatDecimal(paymentOption.get('equipmentCost'), '');
		$.priceClear.visible = ($.priceInputTextField.value !== '');
		$.amountFinancedTextField.value = stringFormatter.formatPositiveDecimal(paymentOption.get('amountFinanced'), '');

		toggleFinanceOptionView(paymentOption.get('financeOption'));

		_.each(rowControllers, function (_rowController) {
			_rowController.refreshUI();
		});
	}
};

/**
 * @method refreshUI
 * Refresh values of the current amountRow
 * @param {Boolean} _isExpanded Variable that indicates if the $.container its expanded
 * @return {void}
 */
$.toggleExpanded = function (_isExpanded) {
	uiHelpers.expandCollapse({
		button: $.expandButton,
		container: $.container,
		forced: _isExpanded
	});
	$.amountFinancedContainer.bottom = $.container.expanded ? $.amountFinancedContainer.bottomExpanded : $.amountFinancedContainer
		.bottomCollapsed;
	$.blurFields();
};

/**
 * @method blurFields
 * Executes the event blur for priceInputTextField and all controllers within rowControllers
 * @return {void}
 */
$.blurFields = function () {
	$.priceInputTextField.blur();

	_.each(rowControllers, function (_rowController) {
		_rowController.blurFields();
	});
};

/**
 * @method handleUIStateChange
 * @private
 * Handles the change on UI values
 * @param {Object} _data Data to be updated to paymentOption
 * @return {void}
 */
function handleUIStateChange(_data) {
	if (_data) {
		$.detailContainer.scrollTo(0.5, 0);
		_data.paymentOption = paymentOption;
		uiUpdateHandler.handlePaymentOptionChange(_data);
	}
};

/**
 * @method handleOptionsSelectorClick
 * @private
 * Handles the click event for option selector control
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleOptionsSelectorClick(_evt) {
	var _financeOptions = Object.keys(additionalCostsData);
	var _financeOption = _financeOptions[_evt.index];

	handleUIStateChange({
		financeOption: _financeOption
	});
};

/**
 * @method handlePriceInputBlur
 * @private
 * Handles blur event for priceInputTextField
 * @param {Object} _evt Blur event
 * @return {void}
 */
function handlePriceInputBlur(_evt) {
	var _cost = parser.parseToNumber(_evt.source.value);
	handleUIStateChange({
		equipmentCost: _cost
	});
};

$.optionsSelector.addEventListener("click", handleOptionsSelectorClick);
$.priceInputTextField.addEventListener('blur', handlePriceInputBlur);

init();
