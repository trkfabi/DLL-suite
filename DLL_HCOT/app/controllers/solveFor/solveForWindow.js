/**
 * @class Controllers.solveFor.solveForWindow
 * Manages the logic for the Solve For Window
 * @uses Utils.analytics
 */
var args = arguments[0] || {};
var analytics = require('/utils/analytics');
var appNavigation = require('/appNavigation');
var calculatorManager = require('/calculations/calculatorManager');
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');
var parser = require('/helpers/parser');
var rateCards = require('/rateCards');

var closeCallback = args.closeCallback;
var paymentOption = args.paymentOption;
var toggleAnalyticsSolveForEdit = args.toggleAnalyticsSolveForEdit;

var selectedTextField;
var originalPaymentOptionValues;
var currentValues;
var previousValues;
var validRateCards;
var minMax;
var amountFinancedLimits = Alloy.Globals.amountFinancedLimits;

// How much the adjustment changes per angular degree.
// Declare some minimums to prevent weird dial behavior.
var minimumPayment = 10;
var minimumCost = 1000;
var minimumRate = 0.001;
var deltasPerDegree;
// Constants for the types of behavior on this screen.
var ADJUSTMENTS = {
	RATE: 'RATE',
	PAYMENT: 'PAYMENT',
	EQUIPMENTCOST: 'EQUIPMENTCOST',
	TRADEUPAMOUNT: 'TRADEUPAMOUNT'
};
var topValueBeingAdjusted = ADJUSTMENTS.PAYMENT;
var bottomValueBeingAdjusted = ADJUSTMENTS.EQUIPMENTCOST;
// Thresholds for rotational events.
// i.e. Execute the dial callbacks after this many event notifications.
var numEventsThresholdTop = 3;
var numEventsThresholdBottom = 3;

// Since we don't react to every rotational callback, track consective events during rotation.
var numConsecutiveCWEventsTop = 0;
var numConsecutiveCCWEventsTop = 0;
var numConsecutiveCWEventsBottom = 0;
var numConsecutiveCCWEventsBottom = 0;
var cumulativeDegreesCWTop = 0;
var cumulativeDegreesCCWTop = 0;
var cumulativeDegreesCWBottom = 0;
var cumulativeDegreesCCWBottom = 0;
var topDial = null;
var bottomDial = null;

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {

	analytics.captureApm('[solveForWindow] - init()');

	!paymentOption && closeWindow();
	originalPaymentOptionValues = paymentOption.toJSON(); // JSON.parse(JSON.stringify(paymentOption));
	validRateCards = rateCards.getRangeOfRatesForPaymentOption(paymentOption);
	if (validRateCards.length > 0) {
		minMax = {
			min: validRateCards.min(function (_rateCard) {
				return parser.parseToNumber(_rateCard.get('min'));
			}).get('min'),
			max: validRateCards.max(function (_rateCard) {
				return parser.parseToNumber(_rateCard.get('max'));
			}).get('max')
		};
	} else {
		minMax = amountFinancedLimits;
	}

	// The current values to display, initialize from the paymentOption model.
	currentValues = {
		payment: parser.parseToNumber(originalPaymentOptionValues.payment),
		rateFactor: parser.parseToNumber(originalPaymentOptionValues.rateFactor),
		useRateCard: parser.parseToNumber(originalPaymentOptionValues.useRateCard),
		equipmentCost: parser.parseToNumber(originalPaymentOptionValues.equipmentCost),
		additionalCost: parser.parseToNumber(originalPaymentOptionValues.additionalCost),
		tradeUpAmount: parser.parseToNumber(originalPaymentOptionValues.tradeUpAmount),
		amountFinanced: parser.parseToNumber(originalPaymentOptionValues.amountFinanced),
		points: parser.parseToNumber(originalPaymentOptionValues.points)
	};

	doLog && console.error('[solveForWindow] - currentValues=' + JSON.stringify(currentValues));

	previousValues = _.clone(currentValues);

	// deltasPerDegree = {
	// 	payment : (currentValues.payment > minimumPayment) ? (currentValues.payment * 0.10) / 360 : (minimumPayment * 0.10) / 360,
	// 	rateFactor : (currentValues.rateFactor > minimumRate) ? (currentValues.rateFactor * 0.10) / 360 : (minimumRate * 0.10) / 360,
	// 	equipmentCost : (currentValues.equipmentCost > minimumCost) ? (currentValues.equipmentCost * 0.10) / 360 : (minimumCost * 0.10) / 360,
	// 	additionalCost : (currentValues.additionalCost > minimumCost) ? (currentValues.additionalCost * 0.10) / 360 : (minimumCost * 0.10) / 360
	// };

	deltasPerDegree = {
		payment: Math.max(Math.min(currentValues.payment, 2000), 10) * 0.10 / 360,
		rateFactor: Math.max(Math.min(currentValues.rateFactor, 1), 0.0001) * 0.10 / 360,
		equipmentCost: Math.max(Math.min(currentValues.equipmentCost, 100000), 1000) * 0.10 / 360,
		additionalCost: Math.max(Math.min(currentValues.additionalCost, 100000), 1000) * 0.10 / 360
	};

	uiHelpers.addDoneButton($.paymentValueField, handleTextFieldBlur, false, true);
	uiHelpers.addDoneButton($.equipmentValueField, handleTextFieldBlur, false, true);
	uiHelpers.addDoneButton($.additionalCostValueField, handleTextFieldBlur, false, true);

	uiHelpers.initNumberFormatHandler($.paymentValueField, '#0.00', '0.00', false);
	uiHelpers.initNumberFormatHandler($.equipmentValueField, '#0.00', '0.00', false);
	uiHelpers.initNumberFormatHandler($.additionalCostValueField, '#0.00', '0.00', false);

	topValueBeingAdjusted = currentValues.useRateCard ? ADJUSTMENTS.PAYMENT : ADJUSTMENTS.RATE;

};

/**
 * @method loadUI
 * @private
 * Load UI, and refresh UI for the current window
 * @return {void}
 */
function loadUI() {
	//OS_IOS && createDials();
	topDial = Alloy.createWidget('RotatingDial', null, {
		top: 0,
		clockwiseCallback: topDialClockwiseCallback,
		counterClockwiseCallback: topDialCounterClockwiseCallback,
		centerTapCallback: topCenterTapCallback,
		container: $.paymentContainer,
		touchendCallback: topDialTouchendCallback
	});

	// Create the bottom dial.
	bottomDial = Alloy.createWidget('RotatingDial', null, {
		top: 0,
		clockwiseCallback: bottomDialClockwiseCallback,
		counterClockwiseCallback: bottomDialCounterClockwiseCallback,
		centerTapCallback: bottomCenterTapCallback,
		container: $.equipmentCostContainer,
		touchendCallback: bottomDialTouchendCallback
	});

	_.defer(topDial.init);
	_.defer(bottomDial.init);

	_.defer(setTopDialUIState);
	_.defer(setBottomDialUIState);
	refresh();
};

/**
 * @method handleLabelTap
 * @private
 * @deprecated
 * Handle the event tap to detect the payment, rate, equipment, or additional options
 * @param {Object} _evt Parameter to detect the label tag
 * @return {void}
 */
function handleLabelTap(_evt) {
	var tag = _evt.source.tag;

	doLog && console.log('[solveForWindow] - handleLabelTap() - ' + tag);

	if (tag) {
		switch (tag) {
		case 'payment':
			topValueBeingAdjusted = ADJUSTMENTS.PAYMENT;
			setTopDialUIState();
			topDial.enable();
			break;
		case 'rate':
			topValueBeingAdjusted = ADJUSTMENTS.RATE;
			setTopDialUIState();
			topDial.enable();
			break;
		case 'equipment':
			bottomValueBeingAdjusted = ADJUSTMENTS.EQUIPMENTCOST;
			setBottomDialUIState();
			bottomDial.enable();
			break;
		case 'additional':
			bottomValueBeingAdjusted = ADJUSTMENTS.TRADEUPAMOUNT;
			setBottomDialUIState();
			bottomDial.enable();
		}
	}
};

/**
 * @method handleTextFieldBlur
 * @private
 * Handle the blur event for textfields
 * @param {Object} _evt Parameter for the blur event to be used on textfields
 * @return {void}
 */
function handleTextFieldBlur(_evt) {
	var tag = _evt.source.tag;
	var source = _evt.source;
	var label;

	source.removeEventListener('blur', handleTextFieldBlur);
	source.blur();
	source.addEventListener('blur', handleTextFieldBlur);
	selectedTextField = null;

	doLog && console.log('[solveForWindow] - handleTextFieldBlur - tag - ' + tag);
	if (tag) {
		switch (tag) {
		case 'payment':
			label = $.paymentValueContainer;
			solveForPayment(source.value);
			break;
		case 'rate':
			label = $.rateValue;
			solveForRateFactor(source.value);
			break;
		case 'equipment':
			label = $.equipmentValueContainer;
			solveForEquipmentCost(source.value);
			break;
		case 'additional':
			label = $.additionalCostValue;
			solveForAdditionalCost(source.value);
		}

		source.visible = false;
		label.visible = true;
	}
};

/**
 * @method handleLabelLongPress
 * @private
 * @deprecated
 * Handle the long press event for Labels
 * @param {Object} _evt Parameter for the event long press of the labels
 * @return {void}
 */
function handleLabelLongPress(_evt) {
	var tag = _evt.source.tag;
	var source = _evt.source;
	var textField;

	doLog && console.log('[solveForWindow] - handleLabelLongPress() - ' + tag);

	if (tag) {
		switch (tag) {
		case 'payment':
			textField = $.paymentValueField;
			break;
		case 'equipment':
			textField = $.equipmentValueField;
			break;
		case 'additional':
			textField = $.additionalCostValueField;
			break;
		}

		source.visible = false;
		textField.visible = true;
		textField.focus();
	}
};

/**
 * @method handleEditControlSingleTap
 * @private
 * Handle the singletap event for some labels, and views
 * @param {Object} _evt singletap event object
 * @return {void}
 */
function handleEditControlSingleTap(_evt) {
	var tag = _evt.source.tag;
	var source;
	var textField;

	doLog && console.log('[solveForWindow] - handleEditControlSingleTap() - ' + tag);

	if (tag) {
		switch (tag) {
		case 'payment':
			analytics.captureTiAnalytics('OTHC-SolveFor-TapIntoEditPayment');
			(toggleAnalyticsSolveForEdit) && toggleAnalyticsSolveForEdit('payment');
			textField = $.paymentValueField;
			source = $.paymentValueContainer;
			break;
		case 'equipment':
			analytics.captureTiAnalytics('OTHC-SolveFor-TapIntoEditEquipmentCost');
			(toggleAnalyticsSolveForEdit) && toggleAnalyticsSolveForEdit('equipment');
			textField = $.equipmentValueField;
			source = $.equipmentValueContainer;
			break;
		case 'additional':
			textField = $.additionalCostValueField;
			source = $.additionalCostValue;
			break;
		}

		if (selectedTextField != textField) {
			source.visible = false;
			textField.visible = true;
			textField.focus();
			setTimeout(function () {
				selectedTextField = textField;
				textField.focus();
			}, 300);
			// Wait until blur of Text field occurs
		}
	}
};

/**
 * @method resetValues
 * @private
 * Reset the values back to it is state at creation
 * @return {void}
 */
function resetValues() {
	analytics.captureTiAnalytics('OTHC-SolveFor-Reset');
	analytics.captureApm('[solveForWindow] - resetValues()');

	currentValues.payment = parser.parseToNumber(originalPaymentOptionValues.payment);
	currentValues.rateFactor = parser.parseToNumber(originalPaymentOptionValues.rateFactor);
	currentValues.useRateCard = parser.parseToNumber(originalPaymentOptionValues.useRateCard);
	currentValues.equipmentCost = parser.parseToNumber(originalPaymentOptionValues.equipmentCost);
	currentValues.additionalCost = parser.parseToNumber(originalPaymentOptionValues.additionalCost);
	currentValues.tradeUpAmount = parser.parseToNumber(originalPaymentOptionValues.tradeUpAmount);
	currentValues.amountFinanced = parser.parseToNumber(originalPaymentOptionValues.amountFinanced);
	currentValues.points = parser.parseToNumber(originalPaymentOptionValues.points);

	topDial.resetDial();
	bottomDial.resetDial();
	refresh();
};

/**
 * @method acceptValues
 * @private
 * Handle the click event of the done button to accept values for the solveForWindow
 * @return {void}
 */
function acceptValues() {
	analytics.captureTiAnalytics('OTHC-SolveFor-Confirm');
	analytics.captureApm('[solveForWindow] - acceptValues()');
	currentValues.paymentOption = paymentOption;

	if (topValueBeingAdjusted === ADJUSTMENTS.RATE) {
		currentValues.manualRateFactor = currentValues.rateFactor;
	}

	calculatorManager.handlePaymentOptionChange(currentValues);
	(closeCallback) && (closeCallback(paymentOption));
	appNavigation.closeSolveForWindow();
};

/**
 * @method recalculateRateFactor
 * @private
 * Looks for a rate factor match based on the given amount financed
 * @param {Number} [_amountFinanced] amount finaced value to search its rate Factor
 * @return {Number} rate factor found. 0 if didnt find anything
 */
function recalculateRateFactor(_amountFinanced) {
	doLog && console.log('[solveForWindow] - recalculateRateFactor() - _amountFinanced: ' + _amountFinanced);

	var rateFactor = 0;
	var amountFinanced = _amountFinanced || currentValues.amountFinanced || 0;

	validRateCards.each(function (_rateCard) {
		if (amountFinanced >= _rateCard.get('min') && amountFinanced <= _rateCard.get('max')) {
			rateFactor = _rateCard.get('rateFactor');
		}
	});

	return parser.parseToNumber(rateFactor, 7);
};

/**
 * @method solveForPayment
 * @private
 * Payment calculation
 * @param {Number} _newPayment Parameter to be used it to update a current value
 * @return {void}
 */
function solveForPayment(_newPayment) {
	doLog && console.log('[solveForWindow] - solveForPayment() - ' + _newPayment);

	previousValues = _.clone(currentValues);
	_newPayment = parser.parseToNumber(_newPayment);

	var rateIndex = 0;
	var rateCard = validRateCards.at(rateIndex);
	var newAmountFinanced = currentValues.newAmountFinanced || 0;
	var foundValidRate = false;

	currentValues.useRateCard = 1;

	while (rateCard) {
		var rateFactor = Number(rateCard.get('rateFactor'));
		var min = Number(rateCard.get('min'));
		var max = Number(rateCard.get('max'));
		newAmountFinanced = parser.parseToNumber(_newPayment / rateFactor);

		if (newAmountFinanced >= min && newAmountFinanced <= max) {
			foundValidRate = true;
			currentValues.rateFactor = rateFactor;
			currentValues.amountFinanced = newAmountFinanced;
			currentValues.payment = _newPayment;

			updateBottomValue();

			break;
		} else {
			rateIndex++;
			rateCard = validRateCards.at(rateIndex);
		}
	}

	if (!foundValidRate) {
		newAmountFinanced = parser.parseToNumber(_newPayment / currentValues.rateFactor);

		if (newAmountFinanced >= minMax.min && newAmountFinanced <= minMax.max) {
			solveForAmountFinanced(newAmountFinanced);
		} else {
			undoToPreviousValues();
		}
	}
};

/**
 * @method solveForRateFactor
 * @private
 * Rate Factor calculation when changing its value
 * @param {Number} _newInterestRate Interest rate value to be calculated from
 * @return {void}
 */
function solveForRateFactor(_newRateFactor) {
	doLog && console.log('[solveForWindow] - solveForRateFactor() - ' + _newRateFactor);

	previousValues = _.clone(currentValues);
	_newRateFactor = parser.parseToNumber(_newRateFactor, 6);

	if (_newRateFactor < 0) {
		_newRateFactor = 0;
	}

	var amountFinanced = currentValues.amountFinanced || 0;
	var newPayment = parser.parseToNumber(amountFinanced * _newRateFactor);

	currentValues.payment = newPayment;
	currentValues.rateFactor = _newRateFactor;
	currentValues.useRateCard = 0;

	refresh();
};

/**
 * @method solveForEquipmentCost
 * @private
 * Equipment cost calculation
 * @param {Number} _newEquipmentCost Number equipment cost value to be calculated from
 * @return {void}
 */
function solveForEquipmentCost(_newEquipmentCost) {
	doLog && console.log('[solveForWindow] - solveForEquipmentCost() - ' + _newEquipmentCost);

	previousValues = _.clone(currentValues);
	_newEquipmentCost = parser.parseToNumber(_newEquipmentCost);

	if (_newEquipmentCost < 0) {
		_newEquipmentCost = 0;
	}

	currentValues.equipmentCost = _newEquipmentCost;

	solveForAmountFinanced();
};

/**
 * @method solveForAdditionalCost
 * @private
 * Calculates the new values when changing the additional cost
 * @param {Number} _newAdditionalCost new Additional cost to set
 * @return {void}
 */
function solveForAdditionalCost(_newAdditionalCost) {
	doLog && console.log('[solveForWindow] - solveForAdditionalCost() - ' + _newAdditionalCost);

	previousValues = _.clone(currentValues);
	_newAdditionalCost = parser.parseToNumber(_newAdditionalCost);

	if (_newAdditionalCost < 0) {
		_newAdditionalCost = 0;
	}

	currentValues.additionalCost = _newAdditionalCost;

	solveForAmountFinanced();
};

/**
 * @method solveForAmountFinanced
 * @private
 * Calculates the new values when changing the amount finaced
 * @param {Number} [_newAmountFinanced] new Amount financed value, if null, will be re-calculated
 * @return {void}
 */
function solveForAmountFinanced(_newAmountFinanced) {
	doLog && console.log('[solveForWindow] - solveForAmountFinanced - ' + _newAmountFinanced);

	_newAmountFinanced = parser.parseToNumber(_newAmountFinanced);
	var equipmentCost = currentValues.equipmentCost || 0;
	var additionalCost = currentValues.additionalCost || 0;
	var tradeUpAmount = currentValues.tradeUpAmount || 0;

	_newAmountFinanced = _newAmountFinanced || parser.parseToNumber(equipmentCost + additionalCost + tradeUpAmount);

	if (topValueBeingAdjusted === ADJUSTMENTS.RATE) {
		if (_newAmountFinanced >= 0) {
			_newAmountFinanced = Math.max(amountFinancedLimits.min, _newAmountFinanced);
			_newAmountFinanced = Math.min(amountFinancedLimits.max, _newAmountFinanced);

			currentValues.amountFinanced = _newAmountFinanced;
			currentValues.payment = parser.parseToNumber(_newAmountFinanced * currentValues.rateFactor);

			updateBottomValue();
		} else {
			undoToPreviousValues();
		}
	} else {
		_newAmountFinanced = Math.max(minMax.min, _newAmountFinanced);
		_newAmountFinanced = Math.min(minMax.max, _newAmountFinanced);

		if (_newAmountFinanced >= minMax.min && _newAmountFinanced <= minMax.max) {
			currentValues.amountFinanced = _newAmountFinanced;
			var newRateFactor = recalculateRateFactor();

			if (newRateFactor !== currentValues.rateFactor) {
				currentValues.rateFactor = parser.parseToNumber(newRateFactor, 7);
			}

			currentValues.payment = parser.parseToNumber(_newAmountFinanced * currentValues.rateFactor);

			updateBottomValue();
		} else {
			undoToPreviousValues();
		}
	}

};

/**
 * @method undoToPreviousValues
 * @private
 * Resets the current values to the previous valid values
 * @return {void}
 */
function undoToPreviousValues() {
	doLog && console.log('[solveForWindow] - undoToPreviousValues() - previousValues: ' + JSON.stringify(previousValues));
	currentValues = _.clone(previousValues);
	refresh();
};

function updateBottomValue() {
	doLog && console.log('[solveForWindow] - updateBottomValue()');

	var amountFinanced = currentValues.amountFinanced || 0;
	var equipmentCost = currentValues.equipmentCost || 0;
	var additionalCost = currentValues.additionalCost || 0;
	var tradeUpAmount = currentValues.tradeUpAmount || 0;
	var newBottomValue = 0;

	if (bottomValueBeingAdjusted === ADJUSTMENTS.EQUIPMENTCOST) {
		currentValues.equipmentCost = amountFinanced - additionalCost - tradeUpAmount;
		newBottomValue = currentValues.equipmentCost;
	} else {
		currentValues.additionalCost = amountFinanced - equipmentCost - tradeUpAmount;
		newBottomValue = currentValues.additionalCost;
	}

	if (newBottomValue >= 0) {
		refresh();
	} else {
		undoToPreviousValues();
	}
};

/**
 * @method refresh
 * @private
 * Refresh values for equipments, payments, rate, and additional costs.
 * @return {void}
 */
function refresh() {
	var payment = parser.parseToNumber(currentValues.payment, 2);
	var equipmentCost = parser.parseToNumber(currentValues.equipmentCost, 2);
	var additionalCost = parser.parseToNumber(currentValues.additionalCost, 2);
	var rateFactor = parser.parseToNumber(currentValues.rateFactor, 6);

	var equipmentDecimalPortion = decimalPortionOf(equipmentCost);
	var paymentDecimalPortion = decimalPortionOf(payment);

	$.equipmentValue.text = stringFormatter.formatPositiveDecimal(integerPortionOf(equipmentCost), '0', '#,###');
	$.equipmentDecimalValue.text = formatDecimalPortionString(equipmentDecimalPortion);
	$.paymentValue.text = stringFormatter.formatPositiveDecimal(integerPortionOf(payment), '0', '#,###');
	$.paymentDecimalsValue.text = formatDecimalPortionString(paymentDecimalPortion);
	$.additionalCostValue.text = stringFormatter.formatPositiveDecimal(additionalCost);
	$.rateValue.text = stringFormatter.formatPositiveDecimal(rateFactor, '0.000000', '#,##0.000000');

	$.paymentValueField.value = stringFormatter.formatPositiveDecimal(payment).replace(',', '');
	$.equipmentValueField.value = stringFormatter.formatPositiveDecimal(equipmentCost).replace(',', '');
	$.additionalCostValueField.value = stringFormatter.formatPositiveDecimal(additionalCost).replace(',', '');
};

/**
 * @method setTopDialUIState
 * @private
 * Setting the top UI state to some payments, and rate values
 * @return {void}
 */
function setTopDialUIState() {
	analytics.captureTiAnalytics('OTHC-SolveFor-TogglePaymentRate');
	(selectedTextField != null) && (selectedTextField.blur());

	if (topValueBeingAdjusted === ADJUSTMENTS.RATE) {
		$.paymentDialTicks.backgroundImage = '/images/im_dialbg_additional.png';
		$.paymentLabel.color = Alloy.Globals.colors.nobel;
		$.paymentValue.color = Alloy.Globals.colors.nobel;
		$.paymentEditImage.backgroundImage = '/images/im_pencil_gray.png';
		$.paymentDecimalsValue.color = Alloy.Globals.colors.nobel;
		$.paymentSymbol.color = Alloy.Globals.colors.nobel;
		$.paymentDecimalsValue.color = Alloy.Globals.colors.nobel;
		$.rateValue.color = Alloy.Globals.colors.white;
		$.rateLabel.color = Alloy.Globals.colors.white;
		$.paymentActiveLabel.color = Alloy.Globals.colors.transparent;
		$.paymentActiveLabel.text = L('rate_factor_uppercase_new_line');
		$.paymentActiveLabel.color = Alloy.Globals.colors.white;
	} else {
		$.paymentDialTicks.backgroundImage = '/images/im_dialbg_equipment.png';
		$.paymentLabel.color = Alloy.Globals.colors.white;
		$.paymentValue.color = Alloy.Globals.colors.white;
		$.paymentEditImage.backgroundImage = '/images/im_pencil_white.png';
		$.paymentDecimalsValue.color = Alloy.Globals.colors.white;
		$.paymentSymbol.color = Alloy.Globals.colors.white;
		$.paymentDecimalsValue.color = Alloy.Globals.colors.white;
		$.rateValue.color = Alloy.Globals.colors.nobel;
		$.rateLabel.color = Alloy.Globals.colors.nobel;
		$.paymentActiveLabel.color = Alloy.Globals.colors.transparent;
		$.paymentActiveLabel.text = L('total_payment_uppercase');
		$.paymentActiveLabel.color = Alloy.Globals.colors.white;
	}
};

/**
 * @method setBottomDialUIState
 * @private
 * Setting the bottom UI state to some equipments, and additional cost values
 * @return {void} 
 */
function setBottomDialUIState() {
	analytics.captureTiAnalytics('OTHC-SolveFor-ToggleEquipmentAdditional');
	(selectedTextField != null) && (selectedTextField.blur());

	if (bottomValueBeingAdjusted === ADJUSTMENTS.TRADEUPAMOUNT) {
		$.equipmentDialTicks.backgroundImage = '/images/im_dialbg_additional.png';
		$.equipmentLabel.color = Alloy.Globals.colors.nobel;
		$.equipmentValue.color = Alloy.Globals.colors.nobel;
		$.equipmentEditImage.backgroundImage = '/images/im_pencil_gray.png';
		$.equipmentDecimalValue.color = Alloy.Globals.colors.nobel;
		$.equipmentSymbol.color = Alloy.Globals.colors.nobel;
		$.additionalCostValue.color = Alloy.Globals.colors.white;
		$.additionalCostSymbol.color = Alloy.Globals.colors.white;
		$.additionalCostAllowanceLabel.color = Alloy.Globals.colors.white;
		$.additionalCostEditImage.backgroundImage = '/images/im_pencil_white.png';
		$.equipmentActiveLabel.color = Alloy.Globals.colors.transparent;
		$.equipmentActiveLabel.text = L('additional_cost_uppercase');
		$.equipmentActiveLabel.color = Alloy.Globals.colors.white;
	} else {
		$.equipmentDialTicks.backgroundImage = '/images/im_dialbg_equipment.png';
		$.equipmentLabel.color = Alloy.Globals.colors.white;
		$.equipmentValue.color = Alloy.Globals.colors.white;
		$.equipmentEditImage.backgroundImage = '/images/im_pencil_white.png';
		$.equipmentDecimalValue.color = Alloy.Globals.colors.white;
		$.equipmentSymbol.color = Alloy.Globals.colors.white;
		$.additionalCostValue.color = Alloy.Globals.colors.nobel;
		$.additionalCostSymbol.color = Alloy.Globals.colors.nobel;
		$.additionalCostAllowanceLabel.color = Alloy.Globals.colors.nobel;
		$.additionalCostEditImage.backgroundImage = '/images/im_pencil_gray.png';
		$.equipmentActiveLabel.color = Alloy.Globals.colors.transparent;
		$.equipmentActiveLabel.text = L('equipment_cost_uppercase');
		$.equipmentActiveLabel.color = Alloy.Globals.colors.white;
	}

};

/**
 * @method integerPortionOf
 * @private
 * Get an integer value portion of a real number
 * @param {Number} _decimalNumber Description
 * @return {String} An integer value of a decimal number
 */
function integerPortionOf(_decimalNumber) {
	return '' + Math.floor(_decimalNumber);
};

/**
 * @method decimalPortionOf
 * @private
 * Obtains the decimals from a real number
 * @param {Number} _decimalNumber Used it to format the decimal portion
 * @return {String} A formatted value without decimals
 */
function decimalPortionOf(_decimalNumber) {
	return ((_decimalNumber % 1) * 100).toFixed(0);
};

/**
 * @method formatDecimalPortionString
 * @private
 * Formatting a value to convert it to a decimal value
 * @param  {Number} _value Parameter to be used it to format the decimal portion
 * @return {String} A formatted value with decimals
 */
function formatDecimalPortionString(_value) {
	return Alloy.Globals.decimalSeparator + ((_value < 10) ? '0' : '') + _value;
};

/**
 * @method topDialClockwiseCallback
 * @private
 * Callback to receive notifications when the top dial is turned clockwise
 * @param {Object} _data Parameter to be used it for the angle delta
 * @return {void}
 */
function topDialClockwiseCallback(_data) {
	//analytics.captureTiAnalytics('OTHC-SolveFor-RotateTopDial-Clockwise');
	doLog && console.log('[solveForWindow] - topDialClockwiseCallback() - _data=' + JSON.stringify(_data));

	++numConsecutiveCWEventsTop;
	numConsecutiveCCWEventsTop = 0;
	var angleDelta = Math.abs(_data.angleDelta);
	cumulativeDegreesCWTop += angleDelta;
	cumulativeDegreesCCWTop = 0;

	if (numConsecutiveCWEventsTop > numEventsThresholdTop) {
		numConsecutiveCWEventsTop = 0;
		if (topValueBeingAdjusted === ADJUSTMENTS.RATE) {
			solveForRateFactor(currentValues.rateFactor + deltasPerDegree.rateFactor * cumulativeDegreesCWTop);
		} else {
			solveForPayment(currentValues.payment + deltasPerDegree.payment * cumulativeDegreesCWTop);
		}
		cumulativeDegreesCWTop = 0;
	}
};

/**
 * @method topDialTouchendCallback
 * @private
 * Callback to receive notifications when the user stops touching
 * @return {void}
 */
function topDialTouchendCallback() {
	analytics.captureTiAnalytics('OTHC-SolveFor-RotateTopDial-Touchend');
}

/**
 * @method bottomDialTouchendCallback
 * @private
 * Callback to receive notifications when the user stops touching
 * @return {void}
 */
function bottomDialTouchendCallback() {
	analytics.captureTiAnalytics('OTHC-SolveFor-RotateBottomDial-Touchend');
}

/**
 * @method topDialCounterClockwiseCallback
 * @private
 * Callback to receive notifications when the top dial is turned counterclockwise
 * @param {Object} _data Parameter to be used it for the angle delta
 * @return {void}
 */
function topDialCounterClockwiseCallback(_data) {
	doLog && console.log('[solveForWindow] - topDialCounterClockwiseCallback() - _data=' + JSON.stringify(_data));

	++numConsecutiveCCWEventsTop;
	numConsecutiveCWEventsTop = 0;
	var angleDelta = Math.abs(_data.angleDelta);
	cumulativeDegreesCCWTop += angleDelta;
	cumulativeDegreesCWTop = 0;

	if (numConsecutiveCCWEventsTop > numEventsThresholdTop) {
		numConsecutiveCCWEventsTop = 0;
		if (topValueBeingAdjusted === ADJUSTMENTS.RATE) {
			solveForRateFactor(currentValues.rateFactor - deltasPerDegree.rateFactor * cumulativeDegreesCCWTop);
		} else {
			solveForPayment(currentValues.payment - deltasPerDegree.payment * cumulativeDegreesCCWTop);
		}
		cumulativeDegreesCCWTop = 0;
	}
};

/**
 * @method bottomDialClockwiseCallback
 * @private
 * Callback to receive notifications when the bottom dial is turned clockwise
 * @param {Object} data Parameter to be used it for the angle delta
 * @return {void}
 */
function bottomDialClockwiseCallback(_data) {
	doLog && console.log('[solveForWindow] - bottomDialClockwiseCallback() - _data=' + JSON.stringify(_data));

	++numConsecutiveCWEventsBottom;
	numConsecutiveCCWEventsBottom = 0;
	var angleDelta = Math.abs(_data.angleDelta);
	cumulativeDegreesCWBottom += angleDelta;
	cumulativeDegreesCCWBottom = 0;

	if (numConsecutiveCWEventsBottom > numEventsThresholdBottom) {
		numConsecutiveCWEventsBottom = 0;
		if (bottomValueBeingAdjusted === ADJUSTMENTS.EQUIPMENTCOST) {
			solveForEquipmentCost(currentValues.equipmentCost + deltasPerDegree.equipmentCost * cumulativeDegreesCWBottom);
		} else {
			solveForAdditionalCost(currentValues.additionalCost + deltasPerDegree.additionalCost * cumulativeDegreesCWBottom);
		}
		cumulativeDegreesCWBottom = 0;
	}
};

/**
 * @method bottomDialCounterClockwiseCallback
 * @private
 * Callback to receive notifications when the bottom dial is turned counterclockwise
 * @param {Object} data Parameter to be used it for the angle delta
 * @return {void}
 */
function bottomDialCounterClockwiseCallback(_data) {
	doLog && console.log('[solveForWindow] - bottomDialCounterClockwiseCallback() - _data=' + JSON.stringify(_data));

	++numConsecutiveCCWEventsBottom;
	numConsecutiveCWEventsBottom = 0;
	var angleDelta = Math.abs(_data.angleDelta);
	cumulativeDegreesCCWBottom += angleDelta;
	cumulativeDegreesCWBottom = 0;

	if (numConsecutiveCCWEventsBottom > numEventsThresholdBottom) {
		numConsecutiveCCWEventsBottom = 0;
		if (bottomValueBeingAdjusted === ADJUSTMENTS.EQUIPMENTCOST) {
			solveForEquipmentCost(currentValues.equipmentCost - deltasPerDegree.equipmentCost * cumulativeDegreesCCWBottom);
		} else {
			solveForAdditionalCost(currentValues.additionalCost - deltasPerDegree.additionalCost * cumulativeDegreesCCWBottom);
		}
		cumulativeDegreesCCWBottom = 0;
	}
};

/**
 * @method topCenterTapCallback
 * @private
 * Callback to receive notifications when the center of the top dial is tapped.
 * @return {void}
 */
function topCenterTapCallback() {
	if (topValueBeingAdjusted === ADJUSTMENTS.RATE) {
		topValueBeingAdjusted = ADJUSTMENTS.PAYMENT;
		solveForPayment(currentValues.payment);
	} else {
		topValueBeingAdjusted = ADJUSTMENTS.RATE;
		currentValues.useRateCard = 0;
	}

	setTopDialUIState();
};

/**
 * @method bottomCenterTapCallback
 * @private
 * Callback to receive notifications when the center of the bottom dial is tapped
 * @return {void}
 */
function bottomCenterTapCallback() {
	bottomValueBeingAdjusted = (bottomValueBeingAdjusted === ADJUSTMENTS.EQUIPMENTCOST) ? ADJUSTMENTS.TRADEUPAMOUNT :
		ADJUSTMENTS.EQUIPMENTCOST;
	setBottomDialUIState();
};

/**
 * @method handleContainerSingleTap
 * @private
 * Handle the singletap event of the container view 
 * @param {Object} _evt Parameter for the singletap event to be used it on the container
 * @return {void}
 */
function handleContainerSingleTap(_evt) {
	(selectedTextField != null) && (selectedTextField.blur());
};

/**
 * @method closeWindow
 * @private
 * Close the current window 
 * @return {void}
 */
function closeWindow() {
	analytics.captureTiAnalytics('OTHC-SolveFor-Cancel');
	appNavigation.closeSolveForWindow();
};

/**
 * @method handleWindowPostlayout
 * @private
 * Handler for the postlayout event of the solve for Window 
 * @return {void}
 */
function handleWindowPostlayout() {
	$.window.removeEventListener('postlayout', handleWindowPostlayout);
	loadUI();
	animateOpen();
}

/**
 * @method handleTextFieldFocus
 * @private
 * Handle the focus event of the textfields 
 * @param {Object} _evt Parameter for the focus event of the textfields
 * @return {void}
 */
function handleTextFieldFocus(_evt) {
	_.defer(function () {
		_evt.source.setSelection(_evt.value.length, _evt.value.length);
	});
}

/**
 * @method animateOpen
 * @private
 * Handle the animation to open the window
 * @return {void}
 */
function animateOpen() {
	var _animation = Ti.UI.createAnimation({
		top: $.container.visibleTop,
		duration: 250,
		curve: Ti.UI.ANIMATION_CURVE_EASE_OUT
	});
	$.container.animate(_animation);
}

/**
 * @method closeWindow
 * Handle the animation to close the window
 * @return {void}
 */
$.closeWindow = function () {
	if (OS_IOS) {
		var _animation = Ti.UI.createAnimation({
			top: $.container.hiddenTop,
			duration: 250,
			curve: Ti.UI.ANIMATION_CURVE_EASE_IN
		});
		$.container.animate(_animation, function () {
			$.window.close();
		});
	} else {
		$.window.close();
	}
};

$.cancelButton.addEventListener('click', closeWindow);
$.refreshButton.addEventListener('click', resetValues);
$.doneButton.addEventListener('click', acceptValues);

$.paymentValueContainer.addEventListener('singletap', handleEditControlSingleTap);
$.equipmentValueContainer.addEventListener('singletap', handleEditControlSingleTap);
$.additionalCostValue.addEventListener('singletap', handleEditControlSingleTap);
$.paymentEditImage.addEventListener('singletap', handleEditControlSingleTap);
$.paymentLabel.addEventListener('singletap', handleEditControlSingleTap);
$.equipmentEditImage.addEventListener('singletap', handleEditControlSingleTap);
$.equipmentLabel.addEventListener('singletap', handleEditControlSingleTap);
$.additionalCostEditImage.addEventListener('singletap', handleEditControlSingleTap);
$.additionalCostAllowanceLabel.addEventListener('singletap', handleEditControlSingleTap);

$.paymentValueField.addEventListener('blur', handleTextFieldBlur);
$.equipmentValueField.addEventListener('blur', handleTextFieldBlur);
$.additionalCostValueField.addEventListener('blur', handleTextFieldBlur);

$.container.addEventListener('singletap', handleContainerSingleTap);

$.window.addEventListener('postlayout', handleWindowPostlayout);
OS_ANDROID && $.window.addEventListener('androidback', appNavigation.closeSolveForWindow);

OS_ANDROID && $.paymentValueField.addEventListener('focus', handleTextFieldFocus);
OS_ANDROID && $.equipmentValueField.addEventListener('focus', handleTextFieldFocus);
OS_ANDROID && $.additionalCostValueField.addEventListener('focus', handleTextFieldFocus);

init();
