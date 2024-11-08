/**
 * # Equipment Price View
 * @class Controllers.additionalCosts.equipmentPrice
 * @uses Utils.analytics
 * @uses Utils.sessionManager
 * @uses Calculations.calculator
 * @uses Calculations.calculatorManager
 * @uses Helpers.uiHelpers
 * @uses Helpers.stringFormatter
 * @uses Helpers.parser
 */
var analytics = require('/utils/analytics');
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');
var parser = require('/helpers/parser');
var configsManager = require('/utils/configsManager');
var calculatorManager = require('/calculations/calculatorManager');
var additionalCostsData = configsManager.getConfig('additionalCosts');

var paymentOption;

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
		_rowController.initKeyboardToolbar();
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

		_additionalCost.titleid && _labels.push(L(_additionalCost.titleid));
		financeOptions.push(_financeOption);

		_.each(_additionalCost.rows, function (_additionalRowInfo) {
			var _rowController = null;
			var _controllerPath = _additionalRowInfo.controller;

			_additionalRowInfo.uiStateChangeCallback = handleUIStateChange;

			_rowController = Alloy.createController(_controllerPath, _additionalRowInfo);

			_financeOptionView.add(_rowController.getView());
			rowControllers.push(_rowController);
		});

		$.financeOptionsContainer.add(_financeOptionView);
	});

	if (_labels.length > 0) {
		$.optionsSelector.setLabels(_labels);
	} else {
		$.detailContainer.remove($.optionsSelectorContainer);
	}
};

/**
 * @method setEnableControls
 * Enables or disables the controls for equipmentPrice based on _enabled parameter
 * @param {Boolean} _enabled Enable state to be set in the controls
 * @return {void}
 */
function setEnableControls(_enabled) {
	doLog && console.log('[equipmentPrice] - setEnableControls() - ' + _enabled);
	uiHelpers.setElementEnabled($.equipmentPriceLabel, _enabled);
	uiHelpers.setElementEnabled($.equipmentPriceLabel, _enabled);
	uiHelpers.setElementEnabled($.priceClear, _enabled);
	uiHelpers.setElementEnabled($.equipmentCurrencySymbol, _enabled);
	uiHelpers.setElementEnabled($.priceInputTextField, _enabled);
	uiHelpers.setElementEnabled($.textFieldUnderlineWhite, _enabled);
	$.detailContainer.opacity = _enabled ? 1.0 : Alloy.Globals.opacityDisabled;
	_.each(rowControllers, function (_rowController) {
		_rowController.setEnabled(_enabled);
	});
}

/**
 * @method setPaymentOption
 * Sets the payment option for equipmentPrice and it refresh the UI
 * @param {Models.paymentOption} _paymentOption Payment option to be set
 * @return {void}
 */
$.setPaymentOption = function (_paymentOption) {
	paymentOption && paymentOption.off('change', $.refreshUI);

	paymentOption = _paymentOption;
	paymentOption.on('change', $.refreshUI);

	$.toggleExpanded('collapsed');

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
		if (!$.priceInputTextField.hasFocus) {
			$.priceInputTextField.value = stringFormatter.formatDecimal(paymentOption.get('equipmentCost'), '');
		}
		$.priceClear.visible = ($.priceInputTextField.value !== '');
		$.amountFinancedTextField.value = stringFormatter.formatPositiveDecimal(paymentOption.get('amountFinanced'), '');
		setEnableControls(paymentOption.isActive());

		toggleFinanceOptionView('othc');

		_.each(rowControllers, function (_rowController) {
			_rowController.refreshUI();
		});
	}
};

/**
 * @method toggleExpanded
 * Expands or collapses the row in the UI
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

$.cleanUp = function () {
	doLog && console.log('[equipmentPrice] - cleanUp()');

	paymentOption && paymentOption.off('change', $.refreshUI);
	_.each(rowControllers, function (_rowController) {
		_rowController.cleanUp();
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
		_data.paymentOption = paymentOption;
		doLog && console.log('[equipmentPrice] - handleUIStateChange() - ' + JSON.stringify(_data));
		calculatorManager.handlePaymentOptionChange(_data);
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
 * @method handlePriceInputFocus
 * @private
 * Handles focus event for priceInputTextField
 * @param {Object} _evt Blur event
 * @return {void}
 */
function handlePriceInputFocus(_evt) {
	analytics.captureTiAnalytics('OTHC-MainWindow-TapIntoEquipmentPrice');
	$.priceInputTextField.hasFocus = true;
};

/**
 * @method handlePriceInputBlur
 * @private
 * Handles blur event for priceInputTextField
 * @param {Object} _evt Blur event
 * @return {void}
 */
function handlePriceInputBlur(_evt) {
	$.priceInputTextField.hasFocus = false;
	var _cost = parser.parseToNumber(_evt.source.value);
	handleUIStateChange({
		equipmentCost: _cost
	});
};

$.optionsSelector.addEventListener("click", handleOptionsSelectorClick);
$.priceInputTextField.addEventListener('focus', handlePriceInputFocus);
$.priceInputTextField.addEventListener('blur', handlePriceInputBlur);

init();
