/**
 * @class Controllers.solveFor.solveForWindow
 * Manages the logic for the Solve For Window
 */
var args = arguments[0] || {};
var analytics = require('/utils/analytics');
var calculator = require('/calculations/calculator');
var appNavigation = require('/appNavigation');
var uiUpdateHandler = require('/calculations/uiUpdateHandler');
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');
var parser = require('/helpers/parser');
var closeCallback = args.closeCallback;
var paymentOption = args.paymentOption;
var paymentOptionId;
var selectedTextField;
var originalPaymentOptionValues;
var currentValues;
var previousValues;
// How much the adjustment changes per angular degree.
// Declare some minimums to prevent weird dial behavior.
var minimumPayment = 10;
var minimumCost = 1000;
var minimumRate = 1;
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
	paymentOptionId = paymentOption.id;
	originalPaymentOptionValues = paymentOption.toJSON(); // JSON.parse(JSON.stringify(paymentOption));

	// The current values to display, initialize from the paymentOption model.
	currentValues = {
		paymentOptionId: paymentOptionId,
		payment: Number(paymentOption.get('payment') || 0),
		interestRate: Number(paymentOption.get('interestRate') || 0),
		equipmentCost: Number(paymentOption.get('equipmentCost') || 0),
		additionalCost: Number(paymentOption.get('additionalCost') || 0),
		tradeAllowance: Number(paymentOption.get("tradeAllowance") || 0),
		fromGoalSeeker: true
	};
	doLog && console.error('[goalSeekerWindow] - currentValues=' + JSON.stringify(currentValues));

	previousValues = _.clone(currentValues);

	deltasPerDegree = {
		payment: (currentValues.payment > minimumPayment) ? (currentValues.payment * 0.10) / 360 : (minimumPayment * 0.10) /
			360,
		interestRate: (currentValues.interestRate > minimumRate) ? (currentValues.interestRate * 0.10) / 360 : (minimumRate *
			0.10) / 360,
		equipmentCost: (currentValues.equipmentCost > minimumCost) ? (currentValues.equipmentCost * 0.02) / 360 : (
			minimumCost * 0.02) / 360,
		tradeAllowance: (currentValues.tradeAllowance > minimumCost) ? (currentValues.tradeAllowance * 0.10) / 360 : (
			minimumCost * 0.10) / 360,
	};

	uiHelpers.addDoneButton($.paymentValueField, handleTextFieldBlur, false, true);
	uiHelpers.addDoneButton($.equipmentValueField, handleTextFieldBlur, false, true);
	uiHelpers.addDoneButton($.rateValueField, handleTextFieldBlur, false, true);
	uiHelpers.addDoneButton($.additionalCostValueField, handleTextFieldBlur, false, true);

};

/**
 * @method loadUI
 * @private
 * Load UI, and refresh UI for the current window
 * @return {void}
 */
function loadUI() {
	// Create the top dial.
	topDial = Alloy.createWidget('RotatingDial', null, {
		top: 0,
		clockwiseCallback: topDialClockwiseCallback,
		counterClockwiseCallback: topDialCounterClockwiseCallback,
		centerTapCallback: topCenterTapCallback,
		container: $.paymentContainer
	});

	// Create the bottom dial.
	bottomDial = Alloy.createWidget('RotatingDial', null, {
		top: 0,
		clockwiseCallback: bottomDialClockwiseCallback,
		counterClockwiseCallback: bottomDialCounterClockwiseCallback,
		centerTapCallback: bottomCenterTapCallback,
		container: $.equipmentCostContainer
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

	doLog && console.log('[goalSeekerWindow] - handleLabelTap() - ' + tag);

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

	doLog && console.log('[goalSeekerWindow] - handleTextFieldBlur - tag - ' + tag);
	if (tag) {
		switch (tag) {
		case 'payment':
			label = $.paymentValueContainer;
			solveForPayment(source.value);
			break;
		case 'rate':
			label = $.rateValue;
			solveForInterestRate(source.value);
			break;
		case 'equipment':
			label = $.equipmentValueContainer;
			solveForEquipmentCost(source.value);
			break;
		case 'additional':
			label = $.additionalCostValue;
			solveForTradeAllowance(source.value);
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

	doLog && console.log('[goalSeekerWindow] - handleLabelLongPress() - ' + tag);

	if (tag) {
		switch (tag) {
		case 'payment':
			textField = $.paymentValueField;
			break;
		case 'rate':
			textField = $.rateValueField;
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

	doLog && console.log('[goalSeekerWindow] - handleEditControlSingleTap() - ' + tag);

	if (tag) {
		switch (tag) {
		case 'payment':
			textField = $.paymentValueField;
			source = $.paymentValueContainer;
			break;
		case 'rate':
			textField = $.rateValueField;
			source = $.rateValue;
			break;
		case 'equipment':
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
			}, 300); // Wait until blur of Text field occurs
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
	analytics.captureApm('[solveForWindow] - resetValues()');
	currentValues.paymentOptionId = originalPaymentOptionValues.paymentOptionId;
	currentValues.payment = Number(originalPaymentOptionValues.payment);
	currentValues.interestRate = Number(originalPaymentOptionValues.interestRate);
	currentValues.equipmentCost = Number(originalPaymentOptionValues.equipmentCost);
	currentValues.tradeAllowance = Number(originalPaymentOptionValues.tradeAllowance);
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
	analytics.captureApm('[solveForWindow] - acceptValues()');
	currentValues.paymentOption = paymentOption;
	uiUpdateHandler.handlePaymentOptionChange(currentValues);
	(closeCallback) && (closeCallback(paymentOption));
	closeWindow();
};

/**
 * @method solveForPayment
 * @private
 * Payment calculation
 * @param {Number} _newPayment Parameter to be used it to update a current value
 * @return {void}
 */
function solveForPayment(_newPayment) {
	doLog && console.log("[goalSeekerWindow] - solveForPayment() - " + _newPayment);

	previousValues = _.clone(currentValues);

	currentValues.payment = parser.parseToNumber(_newPayment);

	if (currentValues.payment < 0) {
		currentValues.payment = 0;
	}

	if (bottomValueBeingAdjusted === ADJUSTMENTS.TRADEUPAMOUNT) {
		var newTradeAllowance = calculator.solveForTradeAllowance({
			payment: currentValues.payment,
			interestRate: currentValues.interestRate,
			equipmentCost: currentValues.equipmentCost,
			paymentOption: paymentOption
		});

		if (newTradeAllowance < 0) {
			solveForTradeAllowance(0);
			return false;
		}

		currentValues.tradeAllowance = Number(newTradeAllowance);
	} else {
		var newEquipmentCost = calculator.solveForEquipmentCost({
			payment: currentValues.payment,
			interestRate: currentValues.interestRate,
			tradeAllowance: currentValues.tradeAllowance,
			paymentOption: paymentOption
		});
		currentValues.equipmentCost = Number(newEquipmentCost);
	}

	_.defer(refresh);
};

/**
 * @method solveForInterestRate
 * @private
 * Interest rate calculation
 * @param {Number} _newInterestRate Interest rate value to be calculated from
 * @return {void}
 */
function solveForInterestRate(_newInterestRate) {
	doLog && console.log("[goalSeekerWindow] - solveForInterestRate - " + _newInterestRate);

	previousValues = _.clone(currentValues);

	currentValues.interestRate = parser.parseToNumber(_newInterestRate);

	if (currentValues.interestRate < 0) {
		currentValues.interestRate = 0;
	}

	calculatePayment();
	_.defer(refresh);
};

/**
 * @method solveForEquipmentCost
 * @private
 * Equipment cost calculation
 * @param {Number} _newEquipmentCost Number equipment cost value to be calculated from
 * @return {void}
 */
function solveForEquipmentCost(_newEquipmentCost) {
	doLog && console.log("[goalSeekerWindow] - solveForEquipmentCost - " + _newEquipmentCost);

	previousValues = _.clone(currentValues);

	currentValues.equipmentCost = parser.parseToNumber(_newEquipmentCost);

	if (currentValues.equipmentCost < 0) {
		currentValues.equipmentCost = 0;
	}

	calculatePayment();
	_.defer(refresh);
};

/**
 * @method solveForTradeAllowance
 * @private
 * Trade allowance calculation
 * @param {Number} _newTradeAllowance Trade allowance value to be calculated from
 * @return {void}
 */
function solveForTradeAllowance(_newTradeAllowance) {
	doLog && console.log("[goalSeekerWindow] - solveForTradeAllowance - " + _newTradeAllowance);

	previousValues = _.clone(currentValues);

	currentValues.tradeAllowance = parser.parseToNumber(_newTradeAllowance);

	if (currentValues.tradeAllowance < 0) {
		currentValues.tradeAllowance = 0;
	}

	if (calculatePayment() < 0) {
		solveForPayment(0);
	} else {
		_.defer(refresh);
	}
};

/**
 * @method calculatePayment
 * @private
 * Calculate payment
 * @return {void}
 */
function calculatePayment() {
	doLog && console.log('[goalSeekerWindow] - calculatePayment() - currentValues=' + JSON.stringify(currentValues));

	var newPayment = calculator.solveForPayment({
		interestRate: currentValues.interestRate,
		equipmentCost: currentValues.equipmentCost,
		tradeAllowance: currentValues.tradeAllowance,
		paymentOption: paymentOption
	});

	if (newPayment < 0) {
		if (bottomValueBeingAdjusted === ADJUSTMENTS.TRADEUPAMOUNT &&
			currentValues.tradeAllowance !== previousValues.tradeAllowance) {
			solveForTradeAllowance(previousValues.tradeAllowance);
			return false;
		} else {
			newPayment = 0;
		}
	}

	currentValues.payment = newPayment;

	return newPayment;
};

/**
 * @method refresh
 * @private
 * Refresh values for equipments, payments, rate, and additional costs.
 * @return {void}
 */
function refresh() {
	(currentValues.equipmentCost < 0) && (currentValues.equipmentCost = 0);
	(currentValues.payment < 0) && (currentValues.payment = 0);

	var equipmentDecimalPortion = decimalPortionOf(currentValues.equipmentCost);
	var paymentDecimalPortion = decimalPortionOf(currentValues.payment);

	$.equipmentValue.text = stringFormatter.formatPositiveDecimal(integerPortionOf(currentValues.equipmentCost), '0',
		'#,###');
	$.equipmentDecimalValue.text = formatDecimalPortionString(equipmentDecimalPortion);
	$.paymentValue.text = stringFormatter.formatPositiveDecimal(integerPortionOf(currentValues.payment), '0', '#,###');
	$.paymentDecimalsValue.text = formatDecimalPortionString(paymentDecimalPortion);
	$.additionalCostValue.text = stringFormatter.formatPositiveDecimal(currentValues.tradeAllowance);
	$.rateValue.text = stringFormatter.formatPositiveDecimal(currentValues.interestRate);

	$.paymentValueField.value = stringFormatter.formatPositiveDecimal(currentValues.payment);
	$.equipmentValueField.value = stringFormatter.formatPositiveDecimal(currentValues.equipmentCost);
	$.rateValueField.value = stringFormatter.formatPositiveDecimal(currentValues.interestRate);
	$.additionalCostValueField.value = stringFormatter.formatPositiveDecimal(currentValues.tradeAllowance);
};

/**
 * @method setTopDialUIState
 * @private
 * Setting the top UI state to some payments, and rate values
 * @return {void}
 */
function setTopDialUIState() {
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
		$.rateEditImage.backgroundImage = '/images/im_pencil_white.png';
		$.paymentActiveLabel.color = Alloy.Globals.colors.transparent;
		$.paymentActiveLabel.text = L("interest_rate_uppercase");
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
		$.rateEditImage.backgroundImage = '/images/im_pencil_gray.png';
		$.paymentActiveLabel.color = Alloy.Globals.colors.transparent;
		$.paymentActiveLabel.text = L("payment_uppercase");
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
		$.equipmentActiveLabel.text = L("trade_allowance_uppercase");
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
		$.equipmentActiveLabel.text = L("equipment_price_uppercase");
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
	doLog && console.log('[goalSeekerWindow] - topDialClockwiseCallback() - data=' + JSON.stringify(_data));
	++numConsecutiveCWEventsTop;
	numConsecutiveCCWEventsTop = 0;
	var angleDelta = Math.abs(_data.angleDelta);
	cumulativeDegreesCWTop += angleDelta;
	cumulativeDegreesCCWTop = 0;
	if (numConsecutiveCWEventsTop > numEventsThresholdTop) {
		numConsecutiveCWEventsTop = 0;
		if (topValueBeingAdjusted === ADJUSTMENTS.RATE) {
			solveForInterestRate(currentValues.interestRate + deltasPerDegree.interestRate * cumulativeDegreesCWTop);
		} else {
			solveForPayment(currentValues.payment + deltasPerDegree.payment * cumulativeDegreesCWTop);
		}
		cumulativeDegreesCWTop = 0;
	}
};

/**
 * @method topDialCounterClockwiseCallback
 * @private
 * Callback to receive notifications when the top dial is turned counterclockwise
 * @param {Object} _data Parameter to be used it for the angle delta
 * @return {void}
 */
function topDialCounterClockwiseCallback(_data) {
	doLog && console.log('[goalSeekerWindow] - topDialCounterClockwiseCallback() - data=' + JSON.stringify(_data));
	++numConsecutiveCCWEventsTop;
	numConsecutiveCWEventsTop = 0;
	var angleDelta = Math.abs(_data.angleDelta);
	cumulativeDegreesCCWTop += angleDelta;
	cumulativeDegreesCWTop = 0;
	if (numConsecutiveCCWEventsTop > numEventsThresholdTop) {
		numConsecutiveCCWEventsTop = 0;
		if (topValueBeingAdjusted === ADJUSTMENTS.RATE) {
			solveForInterestRate(currentValues.interestRate - deltasPerDegree.interestRate * cumulativeDegreesCCWTop);
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
	doLog && console.log('[goalSeekerWindow] - bottomDialClockwiseCallback() - data=' + JSON.stringify(_data));
	++numConsecutiveCWEventsBottom;
	numConsecutiveCCWEventsBottom = 0;
	var angleDelta = Math.abs(_data.angleDelta);
	cumulativeDegreesCWBottom += angleDelta;
	if (numConsecutiveCWEventsBottom > numEventsThresholdBottom) {
		numConsecutiveCWEventsBottom = 0;
		if (bottomValueBeingAdjusted === ADJUSTMENTS.EQUIPMENTCOST) {
			solveForEquipmentCost(currentValues.equipmentCost + deltasPerDegree.equipmentCost * cumulativeDegreesCWBottom);
		} else {
			solveForTradeAllowance(currentValues.tradeAllowance + deltasPerDegree.tradeAllowance * cumulativeDegreesCWBottom);
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
	doLog && console.log('[goalSeekerWindow] - bottomDialCounterClockwiseCallback() - data=' + JSON.stringify(_data));
	++numConsecutiveCCWEventsBottom;
	numConsecutiveCWEventsBottom = 0;
	var angleDelta = Math.abs(_data.angleDelta);
	cumulativeDegreesCCWBottom += angleDelta;
	if (numConsecutiveCCWEventsBottom > numEventsThresholdBottom) {
		numConsecutiveCCWEventsBottom = 0;
		if (bottomValueBeingAdjusted === ADJUSTMENTS.EQUIPMENTCOST) {
			solveForEquipmentCost(currentValues.equipmentCost - deltasPerDegree.equipmentCost * cumulativeDegreesCCWBottom);
		} else {
			solveForTradeAllowance(currentValues.tradeAllowance - deltasPerDegree.tradeAllowance * cumulativeDegreesCCWBottom);
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
	topValueBeingAdjusted = (topValueBeingAdjusted === ADJUSTMENTS.RATE) ? ADJUSTMENTS.PAYMENT : ADJUSTMENTS.RATE;
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
	appNavigation.closeSolveForWindow();
};

/**
 * @method handleWindowOpen
 * @private
 * Handler for the open event of the solve for Window 
 * @return {void}
 */
function handleWindowOpen() {
	loadUI();
}

/**
 * @method animateOpen
 * @private
 * Handle the animation to open the window
 * @return {void}
 */
function animateOpen() {
	$.window.removeEventListener('postlayout', animateOpen);
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
$.rateValue.addEventListener('singletap', handleEditControlSingleTap);
$.additionalCostValue.addEventListener('singletap', handleEditControlSingleTap);
$.paymentEditImage.addEventListener('singletap', handleEditControlSingleTap);
$.paymentLabel.addEventListener('singletap', handleEditControlSingleTap);
$.rateEditImage.addEventListener('singletap', handleEditControlSingleTap);
$.rateLabel.addEventListener('singletap', handleEditControlSingleTap);
$.equipmentEditImage.addEventListener('singletap', handleEditControlSingleTap);
$.equipmentLabel.addEventListener('singletap', handleEditControlSingleTap);
$.additionalCostEditImage.addEventListener('singletap', handleEditControlSingleTap);
$.additionalCostAllowanceLabel.addEventListener('singletap', handleEditControlSingleTap);

$.paymentValueField.addEventListener('blur', handleTextFieldBlur);
$.equipmentValueField.addEventListener('blur', handleTextFieldBlur);
$.rateValueField.addEventListener('blur', handleTextFieldBlur);
$.additionalCostValueField.addEventListener('blur', handleTextFieldBlur);

$.container.addEventListener('singletap', handleContainerSingleTap);

$.window.addEventListener('open', handleWindowOpen);
$.window.addEventListener('postlayout', animateOpen);

init();
