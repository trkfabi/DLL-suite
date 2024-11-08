var parser = require('/helpers/parser');

/**
 * @class Calculations.calculator
 * @singleton
 * This module performs calculations based upon the following financial formulas:
 * 
 * 	// Basic Formulas
 * 	totalPrice = (payment / rateFactor)
 * 	payment = rateFactor * totalPrice
 * 	interestRate = 365.25 * payment/totalPrice
 * 
 * 	// With TotalPrice Expanded Out
 * 	// 	(NOTE: totalPrice = equipmentCost + additionalCost)
 * 	payment = rateFactor * (equipmentCost + additionalCost)
 * 	interestRate = 365.25 * payment / (equipmentCost + additionalCost)
 * 	additionalCost = (payment / rateFactor) - equipmentCost
 * 	equipmentCost = (payment / rateFactor) - additionalCost
 */
var calculator = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method calculatePayment
	 * Calculates payment for OTHC rules
	 * @param {Models.paymentOption} _paymentOption Payment Option model to re-calculate
	 * @return {Number} Calculated Payment Amount, null if could not get calculated
	 */
	function calculatePayment(_paymentOption) {
		var paymentAmount = null;

		if (_paymentOption) {
			var amountFinanced = 0;
			var rateFactor = 0;

			amountFinanced = parser.parseToNumber(_paymentOption.get('amountFinanced'));
			rateFactor = parser.parseToNumber(_paymentOption.get('rateFactor'));

			paymentAmount = amountFinanced * rateFactor;
		}

		doLog && console.log('[calculator] - calculatePayment() - paymentAmount=' + paymentAmount);

		return paymentAmount;
	};

	/**
	 * @method calculateAmountFinanced
	 * Calculates Amount Financed based on Equipment Cost, Additional Costs & Tradeup Amount
	 * @param {Models.paymentOption} _paymentOption Payment Option model to re-calculate
	 * @return {Number} Calculated Amount Financed, null if could not get calculated
	 */
	function calculateAmountFinanced(_paymentOption) {
		var amountFinanced = null;
		var equipmentCost = 0;
		var additionalCost = 0;
		var tradeUpAmount = 0;

		if (_paymentOption) {

			equipmentCost = parser.parseToNumber(_paymentOption.get('equipmentCost'));
			additionalCost = parser.parseToNumber(_paymentOption.get('additionalCost'));
			tradeUpAmount = parser.parseToNumber(_paymentOption.get('tradeUpAmount'));

			if (equipmentCost != 0) {
				amountFinanced = parser.parseToNumber(
					equipmentCost +
					additionalCost +
					tradeUpAmount
				);
			} else {
				amountFinanced = 0;
			}
		}

		doLog && console.log('[calculator] - calculateAmountFinanced() - amountFinanced=' + amountFinanced);

		return amountFinanced;

	};

	/**
	 * @method calculateEquipmentCost
	 * Calculates Equipment Cost based on Amount Financed, Additional Costs & Tradeup Amount
	 * @param {Models.paymentOption} _paymentOption Payment Option model to re-calculate
	 * @return {Number} Calculated Equipment Cost, null if could not get calculated
	 */
	function calculateEquipmentCost(_paymentOption) {
		var equipmentCost = null;
		var amountFinanced = 0;
		var additionalCost = 0;
		var tradeUpAmount = 0;

		if (_paymentOption) {
			amountFinanced = parser.parseToNumber(_paymentOption.get('amountFinanced'));
			additionalCost = parser.parseToNumber(_paymentOption.get('additionalCost'));
			tradeUpAmount = parser.parseToNumber(_paymentOption.get('tradeUpAmount'));

			equipmentCost = parser.parseToNumber(
				amountFinanced -
				additionalCost -
				tradeUpAmount
			);

			if (equipmentCost < 0) {
				equipmentCost = 0;
			}
		}

		doLog && console.log('[calculator] - calculateEquipmentCost() - equipmentCost=' + equipmentCost);

		return equipmentCost;
	};

	/**
	 * @method calculateTradeUpAmount
	 * Calculates Trade Up Amount based on Amount Financed, Additional Costs & Equipment Cost
	 * @param {Models.paymentOption} _paymentOption Payment Option model to re-calculate
	 * @return {Number} Calculated Trade Up Amount, null if could not get calculated
	 */
	function calculateTradeUpAmount(_paymentOption) {
		var tradeUpAmount = null;
		var amountFinanced = 0;
		var equipmentCost = 0;
		var additionalCost = 0;

		if (_paymentOption) {
			amountFinanced = parser.parseToNumber(_paymentOption.get('amountFinanced'));
			additionalCost = parser.parseToNumber(_paymentOption.get('additionalCost'));
			equipmentCost = parser.parseToNumber(_paymentOption.get('equipmentCost'));

			tradeUpAmount = parser.parseToNumber(
				amountFinanced -
				additionalCost -
				equipmentCost
			);

			if (tradeUpAmount < 0) {
				tradeUpAmount = 0;
			}
		}

		doLog && console.log('[calculator] - calculateTradeUpAmount() - tradeUpAmount=' + tradeUpAmount);

		return tradeUpAmount;
	};

	/**
	 * @method calculateAdditionalCost
	 * Calculates Additional Cost based on Amount Financed, Equipment Cost & Tradeup Amount
	 * @param {Models.paymentOption} _paymentOption Payment Option model to re-calculate
	 * @return {Number} Calculated Additional Cost, null if could not get calculated
	 */
	function calculateAdditionalCost(_paymentOption) {
		var additionalCost = null;
		var amountFinanced = 0;
		var equipmentCost = 0;
		var tradeUpAmount = 0;

		if (_paymentOption) {
			amountFinanced = parser.parseToNumber(_paymentOption.get('amountFinanced'));
			equipmentCost = parser.parseToNumber(_paymentOption.get('equipmentCost'));
			tradeUpAmount = parser.parseToNumber(_paymentOption.get('tradeUpAmount'));

			additionalCost = parser.parseToNumber(
				amountFinanced -
				equipmentCost -
				tradeUpAmount
			);

			if (additionalCost < 0) {
				additionalCost = 0;
			}
		}

		doLog && console.log('[calculator] - calculateAdditionalCost() - additionalCost=' + additionalCost);

		return additionalCost;
	};

	/**
	 * @method calculateAdvancePaymentAmount
	 * Calculates payment amount + Service Payment
	 * @param {Models.paymentOption} _paymentOption Payment Option model to re-calculate
	 * @return {Number} Calculated payment amount + Service Payments
	 */
	function calculateAdvancePaymentAmount(_paymentOption) {
		var advancePaymentAmount = null;

		if (_paymentOption) {
			var paymentAmount = calculatePayment(_paymentOption);
			var advancePayment = parser.parseToNumber(_paymentOption.get('advancePayment'));
			var servicePayment = parser.parseToNumber(_paymentOption.get('servicePayment'));

			advancePaymentAmount = (paymentAmount + servicePayment) * advancePayment;
		}

		doLog && console.log('[calculator] - calculateAdvancePaymentAmount() -' + advancePaymentAmount);

		return advancePaymentAmount;
	};

	/**
	 * @method calculateTotalPaymentAmount
	 * Calculates payment amount + Service Payment
	 * @param {Models.paymentOption} _paymentOption Payment Option model to re-calculate
	 * @return {Number} Calculated payment amount + Service Payments
	 */
	function calculateTotalPaymentAmount(_paymentOption) {
		var totalPaymentAmount = null;

		if (_paymentOption) {
			var paymentAmount = calculatePayment(_paymentOption);
			var servicePayment = parser.parseToNumber(_paymentOption.get('servicePayment'));

			if (paymentAmount > 0) {
				totalPaymentAmount = paymentAmount + servicePayment;
			} else {
				totalPaymentAmount = 0;
			}

		}

		doLog && console.log('[calculator] - calculateTotalPaymentAmount() -' + totalPaymentAmount);

		return totalPaymentAmount;
	};

	/**
	 * Quick Payment calculation for the SolveFor screen.
	 * @param {Object} params
	 * 		Required values:
	 * 		- rateFactor/interestRate
	 * 		- equipmentCost
	 * 		- additionalCost
	 */
	function solveForPayment(params) {
		doLog && console.log('[calculator] - solveForPayment() - params=' + JSON.stringify(params));
		var payment = null;
		if (params) {
			var additionalCost = Number(params.additionalCost) || 0;
			var tradeUpAmount = Number(params.tradeUpAmount) || 0;
			var rateFactor = Number(params.rateFactor) || 0;
			var equipmentCost = Number(params.equipmentCost) || 0;

			payment = (equipmentCost + additionalCost + tradeUpAmount) * rateFactor;
		}

		doLog && console.log('[calculator] - solveForPayment() - payment=' + payment);
		return payment;
	};

	/**
	 * Quick RateFactor calculation for the SolveFor screen.
	 * @param {Object} params
	 * 		Required values:
	 * 		- payment
	 * 		- equipmentCost
	 * 		- additionalCost
	 */
	function solveForRateFactor(params) {
		doLog && console.log('[calculator] - solveForRateFactor() - params=' + JSON.stringify(params));
		var rateFactor = null;
		if (params) {
			var additionalCost = Number(params.additionalCost) || 0;
			var tradeUpAmount = Number(params.tradeUpAmount) || 0;
			var payment = Number(params.payment) || 0;
			var equipmentCost = Number(params.equipmentCost) || 0;

			rateFactor = payment / (equipmentCost + additionalCost + tradeUpAmount);
		}

		doLog && console.log('[calculator] - solveForPayment() - rateFactor=' + rateFactor);
		return rateFactor;
	};

	/**
	 * Quick EquipmentCost calculation for the SolveFor screen.
	 * @param {Object} params
	 * 		Required values:
	 * 		- payment
	 * 		- equipmentCost
	 * 		- additionalCost
	 */
	function solveForEquipmentCost(params) {
		doLog && console.log('[calculator] - solveForEquipmentCost() - params=' + JSON.stringify(params));
		var equipmentCost = null;
		if (params) {
			var additionalCost = Number(params.additionalCost) || 0;
			var tradeUpAmount = Number(params.tradeUpAmount) || 0;
			var payment = Number(params.payment) || 0;
			var rateFactor = Number(params.rateFactor) || 0;

			equipmentCost = (payment / rateFactor) - additionalCost - tradeUpAmount;
		}

		doLog && console.log('[calculator] - solveForPayment() - equipmentCost=' + equipmentCost);
		return equipmentCost;
	};

	/**
	 * Quick AdditionalCost calculation for the SolveFor screen.
	 * @param {Object} params
	 * 		Required values:
	 * 		- payment
	 * 		- interestRate
	 * 		- equipmentCost
	 */
	function solveForAdditionalCost(params) {
		doLog && console.log('[calculator] - solveForAdditionalCost() - params=' + JSON.stringify(params));
		var additionalCost = null;
		if (params) {
			var equipmentCost = Number(params.equipmentCost) || 0;
			var tradeUpAmount = Number(params.tradeUpAmount) || 0;
			var payment = Number(params.payment) || 0;
			var rateFactor = Number(params.rateFactor) || 0;

			additionalCost = (payment / rateFactor) - tradeUpAmount - equipmentCost;
		}

		doLog && console.log('[calculator] - solveForPayment() - additionalCost=' + additionalCost);
		return additionalCost;
	};

	// Public API.
	return {
		// General Calculations
		calculatePayment: calculatePayment,
		calculateAmountFinanced: calculateAmountFinanced,
		calculateEquipmentCost: calculateEquipmentCost,
		calculateTradeUpAmount: calculateTradeUpAmount,
		calculateAdditionalCost: calculateAdditionalCost,
		calculateAdvancePaymentAmount: calculateAdvancePaymentAmount,
		calculateTotalPaymentAmount: calculateTotalPaymentAmount,
		// Solve for calculations
		solveForPayment: solveForPayment,
		solveForRateFactor: solveForRateFactor,
		solveForEquipmentCost: solveForEquipmentCost,
		solveForAdditionalCost: solveForAdditionalCost,
	};
})();

module.exports = calculator;
