var doLog = Alloy.Globals.doLog;

/**
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

/**
 * # Calculator Module
 * Calculates various financial formulas
 * @class Lib.calculations.calculator
 * @singleton
 */
var calculator = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	/**
	 * @method calculateAmountForLease
	 * @private
	 * Function to calculate the amount to be financed for Lease
	 * @param {Object} _params
	 * @param {Number} _params.equipmentCost Equipment Cost
	 * @param {Number} _params.payment Payment Amount
	 * @param {Number} _params.interestRate Interest Rate
	 * @param {Number} _params.residualValue Residual Value
	 * @param {Number} _params.term Total months of payments
	 * @param {Number} _params.paymentFrequency Frequency of the payment (Monthly, Quarterly, Semi-Annually, Annyally)
	 * @param {Number} _params.advancePayments Payments required on advance
	 * @return {Number} Amount to be Financed
	 */
	function calculateAmountForLease(_params) {
		doLog && console.log('[calculator] - calculateAmountForLease() - _params=' + JSON.stringify(_params));
		var amountFinanced;
		if (_params) {
			var equipmentCost = _params.equipmentCost;
			var payment = _params.payment;
			var interestRate = _params.interestRate / 100;
			var residualValue = _params.residualValue;
			var term = _params.term;
			var paymentFrequency = _params.paymentFrequency;
			var advancePayments = _params.advancePayments;
			var freqNumber;
			var reversedNumberPaymentsPerYear;
			switch (paymentFrequency) {
			case 'M':
				freqNumber = 12;
				reversedNumberPaymentsPerYear = 1;
				break;
			case 'Q':
				freqNumber = 4;
				reversedNumberPaymentsPerYear = 3;
				break;
			case 'SA':
				freqNumber = 2;
				reversedNumberPaymentsPerYear = 6;
				break;
			case 'A':
				freqNumber = 1;
				reversedNumberPaymentsPerYear = 12;
				break;
			default:
				freqNumber = 12;
				reversedNumberPaymentsPerYear = 12;
				break;
			}
			var ratePerFrequency = interestRate / freqNumber;
			var numberPayments = term / reversedNumberPaymentsPerYear;

			if (!advancePayments) {
				advancePayments = 0;
			}

			if (advancePayments) {
				amountFinanced = -(Math.pow((ratePerFrequency + 1), (1 - numberPayments)) * (Math.pow((ratePerFrequency + 1),
					numberPayments) - 1) * (-payment - (residualValue * ratePerFrequency) / ((ratePerFrequency + 1) * (Math.pow((
					ratePerFrequency + 1), numberPayments) - 1)))) / ratePerFrequency;
			} else {
				amountFinanced = (Math.pow((ratePerFrequency + 1), (-numberPayments)) * (-Math.pow((ratePerFrequency + 1),
					numberPayments) + ratePerFrequency + 1) * ((residualValue * ratePerFrequency) / (-Math.pow((ratePerFrequency +
					1), numberPayments) + ratePerFrequency + 1) - payment)) / ratePerFrequency;
			}

			amountFinanced = amountFinanced.toFixed(2);
		}
		return amountFinanced;
	};

	/**
	 * @method calculateAmountForFinance
	 * @private
	 * Function to calculate the amount to be financed for Finance
	 * @param {Object} _params
	 * @param {Number} _params.equipmentCost Equipment Cost
	 * @param {Number} _params.payment Payment Amount
	 * @param {Number} _params.interestRate Interest Rate
	 * @param {Number} _params.term Total months of payments
	 * @param {Number} _params.paymentFrequency Frequency of the payment (Monthly, Quarterly, Semi-Annually, Annyally)
	 * @param {Number} _params.balloon Ballon Payments
	 * @return {Number} Amount to be Financed
	 */
	function calculateAmountForFinance(_params) {
		doLog && console.log('[calculator] - calculateAmountForFinance() - _params=' + JSON.stringify(_params));
		var amountFinanced;
		if (_params) {
			var equipmentCost = _params.equipmentCost;
			var payment = _params.payment;
			var interestRate = _params.interestRate / 100;
			var term = Number(_params.term);
			var paymentFrequency = _params.paymentFrequency;
			var balloon = _params.balloon;
			var freqNumber;
			var reversedNumberPaymentsPerYear;
			switch (paymentFrequency) {
			case 'M':
				freqNumber = 12;
				reversedNumberPaymentsPerYear = 1;
				break;
			case 'Q':
				freqNumber = 4;
				reversedNumberPaymentsPerYear = 3;
				break;
			case 'SA':
				freqNumber = 2;
				reversedNumberPaymentsPerYear = 6;
				break;
			case 'A':
				freqNumber = 1;
				reversedNumberPaymentsPerYear = 12;
				break;
			default:
				freqNumber = 12;
				reversedNumberPaymentsPerYear = 12;
				break;
			}
			if (interestRate > 0) {
				var ratePerFrequency = interestRate / freqNumber;
				var numberPayments = term / reversedNumberPaymentsPerYear;

				if (balloon) {
					amountFinanced = (Math.pow((ratePerFrequency + 1), (-numberPayments)) * (payment * Math.pow((ratePerFrequency +
						1), numberPayments) + ratePerFrequency * balloon - ratePerFrequency * payment - payment)) / ratePerFrequency;

				} else {
					amountFinanced = (payment * Math.pow((ratePerFrequency + 1), (-numberPayments)) * (Math.pow((ratePerFrequency +
						1), numberPayments) - 1)) / ratePerFrequency;
				}
			} else {
				switch (paymentFrequency) {
				case 'M':
					freqNumber = 1;
					break;
				case 'Q':
					freqNumber = 3;
					break;
				case 'SA':
					freqNumber = 6;
					break;
				case 'A':
					freqNumber = 12;
					break;
				default:
					1;
				}
				// Commenting this beacuse DLL changed calculations
				// if(balloon){
				// 	amountFinanced = (payment * term + balloon * freqNumber) / freqNumber;
				// } else {
				// 	amountFinanced = payment * term / freqNumber;
				// }

				// This worked, but was more complex
				// amountFinanced = (-(payment * freqNumber) + freqNumber * (balloon || 0) + payment * term)/freqNumber;

				if (balloon) {
					amountFinanced = payment * (term / freqNumber) - payment + balloon;
				} else {
					amountFinanced = payment * (term / freqNumber);
				}
			}

			amountFinanced = amountFinanced.toFixed(2);
		}
		return amountFinanced;
	};

	/**
	 * @method calculatePaymentForLease
	 * @private
	 * Function to calculate the Payment for a Lease Quote
	 * @param {Object} _params
	 * @param {Number} _params.amountFinanced Amount to be Financed
	 * @param {Number} _params.equipmentCost Equipment Cost
	 * @param {Number} _params.interestRate Interest Rate
	 * @param {Number} _params.residualValue Residual Value
	 * @param {Number} _params.term Total months of payments
	 * @param {Number} _params.paymentFrequency Frequency of the payment (Monthly, Quarterly, Semi-Annually, Annyally)
	 * @param {Number} _params.advancePayments Payments required on advance
	 * @param {Number} _params.balloon Ballon Payments
	 * @return {Number} Calculated Payment amount
	 */
	function calculatePaymentForLease(_params) {
		doLog && console.log('[calculator] - calculatePaymentForLease() - _params=' + JSON.stringify(_params));
		var payment;
		if (_params) {
			var equipmentCost = _params.equipmentCost;
			var amountFinanced = _params.amountFinanced || _params.equipmentCost;
			var interestRate = _params.interestRate / 100;
			var residualValue = _params.residualValue;
			var term = _params.term;
			var paymentFrequency = _params.paymentFrequency;
			var advancePayments = _params.advancePayments;
			var freqNumber;
			var reversedNumberPaymentsPerYear;
			switch (paymentFrequency) {
			case 'M':
				freqNumber = 12;
				reversedNumberPaymentsPerYear = 1;
				break;
			case 'Q':
				freqNumber = 4;
				reversedNumberPaymentsPerYear = 3;
				break;
			case 'SA':
				freqNumber = 2;
				reversedNumberPaymentsPerYear = 6;
				break;
			case 'A':
				freqNumber = 1;
				reversedNumberPaymentsPerYear = 12;
				break;
			default:
				freqNumber = 12;
				reversedNumberPaymentsPerYear = 12;
				break;
			}

			if (interestRate > 0) {
				var ratePerFrequency = interestRate / freqNumber;
				var numberPayments = term / reversedNumberPaymentsPerYear;

				if (!advancePayments) {
					advancePayments = 0;
				}

				var numerator = amountFinanced - (residualValue / (Math.pow((1 + ratePerFrequency), numberPayments)));
				var denominator = (1 - Math.pow((1 + ratePerFrequency), -(numberPayments - 1))) / ratePerFrequency;

				switch (paymentFrequency) {
				case 'SA':
				case 'A':
					if (advancePayments) {
						payment = numerator / (1 + denominator);
					} else {
						payment = numerator / denominator;
					}
					break;

				default:
					payment = -(ratePerFrequency * (residualValue - amountFinanced * Math.pow((ratePerFrequency + 1), numberPayments))) /
						(Math.pow((ratePerFrequency + 1), numberPayments) - 1);
					break;
				}
			} else {
				switch (paymentFrequency) {
				case 'M':
					freqNumber = 1;
					break;
				case 'Q':
					freqNumber = 3;
					break;
				case 'SA':
					freqNumber = 6;
					break;
				case 'A':
					freqNumber = 12;
					break;
				default:
					1;
				}
				payment = (amountFinanced - residualValue) / term * freqNumber;
			}

			payment = payment.toFixed(2);
		}
		return payment;
	};

	/**
	 * @method calculatePaymentForFinance
	 * @private
	 * Function to calculate the Payment for a Finance Quote
	 * @param {Object} _params
	 * @param {Number} _params.equipmentCost Equipment Cost
	 * @param {Number} _params.interestRate Interest Rate
	 * @param {Number} _params.term Total months of payments
	 * @param {Number} _params.paymentFrequency Frequency of the payment (Monthly, Quarterly, Semi-Annually, Annyally)
	 * @param {Number} _params.balloon Ballon Payments
	 * @return {Number} Calculated Payment amount
	 */
	function calculatePaymentForFinance(_params) {
		doLog && console.log('[calculator] - calculatePaymentForFinance() - _params=' + JSON.stringify(_params));
		var payment;
		if (_params) {
			var equipmentCost = _params.equipmentCost;
			var amountFinanced = _params.amountFinanced;
			var interestRate = _params.interestRate / 100;
			var term = _params.term;
			var paymentFrequency = _params.paymentFrequency;
			var balloon = _params.balloon;
			var freqNumber;
			var reversedNumberPaymentsPerYear;
			switch (paymentFrequency) {
			case 'M':
				freqNumber = 12;
				reversedNumberPaymentsPerYear = 1;
				break;
			case 'Q':
				freqNumber = 4;
				reversedNumberPaymentsPerYear = 3;
				break;
			case 'SA':
				freqNumber = 2;
				reversedNumberPaymentsPerYear = 6;
				break;
			case 'A':
				freqNumber = 1;
				reversedNumberPaymentsPerYear = 12;
				break;
			default:
				freqNumber = 12;
				reversedNumberPaymentsPerYear = 12;
				break;
			}

			if (interestRate > 0) {
				var ratePerFrequency = interestRate / freqNumber;
				var numberPayments = term / reversedNumberPaymentsPerYear;

				if (balloon && amountFinanced > 0) {
					var numerator = (amountFinanced - (balloon / Math.pow((1 + ratePerFrequency), numberPayments)));
					var denominator = ((1 - Math.pow((1 + ratePerFrequency), -(numberPayments - 1))) / ratePerFrequency);

					payment = numerator / denominator;
				} else {
					payment = amountFinanced / ((1 - Math.pow((1 + ratePerFrequency), -numberPayments)) / ratePerFrequency);
				}
			} else {
				switch (paymentFrequency) {
				case 'M':
					freqNumber = 1;
					break;
				case 'Q':
					freqNumber = 3;
					break;
				case 'SA':
					freqNumber = 6;
					break;
				case 'A':
					freqNumber = 12;
					break;
				default:
					1;
				}
				//Commenting this beacuse DLL changed calculations
				/*if(balloon){
					payment = (amountFinanced - balloon) / term * freqNumber;
				} else {
					payment = amountFinanced / term * freqNumber;
				}*/

				// This worked, but it was more complex
				// payment = (amountFinanced * freqNumber - (balloon || 0) * freqNumber) / (term - freqNumber);

				if (balloon && amountFinanced > 0) {
					payment = (amountFinanced - balloon) / (term / freqNumber - 1);
				} else {
					payment = amountFinanced / (term / freqNumber);
				}
			}

			payment = payment.toFixed(2);

			doLog && console.log('[calculator] - calculatePaymentForFinance() - payment: ' + payment);
		}
		return payment;
	};

	/**
	 * @method calculateEquipmentCostForLease
	 * @private
	 * Function to calculate the Equipment Cost for a Lease Quote
	 * @param {Object} _params
	 * @param {Number} _params.payment Payment amount
	 * @param {Number} _params.interestRate Interest Rate
	 * @param {Number} _params.residualValue Residual Value
	 * @param {Number} _params.term Total months of payments
	 * @param {Number} _params.paymentFrequency Frequency of the payment (Monthly, Quarterly, Semi-Annually, Annyally)
	 * @param {Number} _params.advancePayments Payments required on advance
	 * @return {Number} Calculated Equipment Cost
	 */
	function calculateEquipmentCostForLease(_params) {
		// doLog && console.log('[calculator] - calculateEquipmentCostForLease() - _params=' + JSON.stringify(_params));
		var equipmentCost;
		if (_params) {
			var payment = _params.payment;
			var interestRate = _params.interestRate / 100;
			var residualValue = _params.residualValue;
			var term = _params.term;
			var paymentFrequency = _params.paymentFrequency;
			var advancePayments = _params.advancePayments;
			var freqNumber;
			switch (paymentFrequency) {
			case 'M':
				freqNumber = 12;
				break;
			case 'Q':
				freqNumber = 4;
				break;
			case 'SA':
				freqNumber = 2;
				break;
			case 'A':
				freqNumber = 1;
				break;
			default:
				freqNumber = 12;
				break;
			}
			var ratePerFrequency = interestRate / freqNumber;

			// --- MOCK VALUES ----
			advancePayments = 0;
			// --- MOCK VALUES ----

			var denominator = advancePayments + ((1 - (1 / (Math.pow((1 + ratePerFrequency), (term - advancePayments))))) /
				ratePerFrequency);
			equipmentCost = denominator * payment + residualValue / (Math.pow((1 + ratePerFrequency), term));
			equipmentCost = equipmentCost.toFixed(2);
		}
		return equipmentCost;
	};

	/**
	 * @method calculateEquipmentCostForFinance
	 * @private
	 * Function to calculate the Equipment Cost for a Lease Quote
	 * @param {Object} _params
	 * @param {Number} _params.residualValue Residual Value
	 * @return {Number} Calculated Equipment Cost 
	 */
	function calculateEquipmentCostForFinance(_params) {
		// doLog && console.log('[calculator] - calculateEquipmentCostForFinance() - _params=' + JSON.stringify(_params));
		var equipmentCost;
		if (_params) {
			_params.residualValue = 0;
			equipmentCost = calculateEquipmentCostForLease(_params);
		}
		return equipmentCost;
	};

	// +-------------------
	// | Public members.
	// +-------------------
	// 

	/**
	 * @method rateFactorToInterestRate
	 * Utility function for Rate Factor conversion.	
	 * @param {Number} _rateFactor Value of rate Factor
	 * @return {Number} Interest rate
	 */
	function rateFactorToInterestRate(_rateFactor) {
		return (_rateFactor >= 0) ? (_rateFactor * 365.25) : undefined;
	};

	/**
	 * @method interestRateToRateFactor
	 * Utility function for Interest Rate conversion
	 * @param {Number} _interestRate Value of _interestRate
	 * @return {Number} Rate factor
	 */
	function interestRateToRateFactor(_interestRate) {
		return (_interestRate >= 0) ? (_interestRate / 365.25) : undefined;
	};

	/**
	 * @method calculatePayment
	 * Payment calculation with flexible input parameters.
	 * @param {Object} _params
	 * @param {Object} _params.paymentOption All options choosen by user to calculate the payment amount
	 * @param {Number} _params.equipmentCost Equipment Cost
	 * @param {Number} _params.tradeAllowance Trade Allowance
	 * @param {Number} _params.interestRate Interest Rate
	 * @param {Number} _params.amountFinanced Amount to be financed
	 * @return {Number} Payment
	 */
	function calculatePayment(_params) {
		var payment;
		if (_params && _params.paymentOption) {
			var paymentOption = _params.paymentOption;
			var equipmentCost = _params.equipmentCost != null ? _params.equipmentCost : paymentOption.get('equipmentCost');
			var tradeAllowance = _params.tradeAllowance != null ? _params.tradeAllowance : paymentOption.get('tradeAllowance');
			var interestRate = _params.interestRate != null ? _params.interestRate : paymentOption.get('interestRate');

			var term = Number(paymentOption.get('term'));
			var taxesAmount = Number(paymentOption.get('taxesAmount'));
			var taxes = (Number(paymentOption.get('taxes')) / 100) || 0;
			var insuranceEnabled = paymentOption.get('insuranceEnabled');
			var insuranceFactor = Number(paymentOption.get('insuranceFactor')) ||  0;
			var insurance = 0;

			(taxes > 0) && (taxesAmount = equipmentCost * taxes);
			(!insuranceEnabled) && (insuranceFactor = 0);
			insurance = insuranceFactor * equipmentCost * term;

			var amountFinanced = _params.amountFinanced || calculateAmountFinanced({
				isLease: paymentOption.isLease(),
				equipmentCost: equipmentCost,
				taxesAmount: taxesAmount,
				tradeAllowance: tradeAllowance,
				tradePayoff: paymentOption.get('tradePayoff'),
				cashDown: paymentOption.get('cashDown'),
				insurance: insurance,
				fees: paymentOption.get('fees')
			});

			var calculationParams = {
				amountFinanced: amountFinanced,
				equipmentCost: equipmentCost,
				additionalCost: 0,
				interestRate: interestRate,
				residualValue: paymentOption.get('residualValue'),
				term: paymentOption.get('term'),
				paymentFrequency: paymentOption.get('paymentFrequency'),
				advancePayments: paymentOption.get('advancePayments'),
				balloon: paymentOption.get('balloon')
			};

			doLog && console.log('[calculator] - calculatePayment() - _params=' + JSON.stringify(calculationParams));
			if (paymentOption.isLease()) {
				payment = calculatePaymentForLease(calculationParams);
			} else {
				payment = calculatePaymentForFinance(calculationParams);
			}
		}

		doLog && console.log("[calculator] - calculatePayment() - payment : " + payment);

		if (isNaN(payment)) {
			payment = null;
		}
		// doLog && console.log('[calculator] - calculatePayment() - payment=' + payment);
		return Number(payment);
	};

	/**
	 * @method calculateTradeAllowance
	 * TradeAllowance calculation with flexible input parameters.
	 * @param {Object} _params
	 * @param {Object} _params.paymentOption All options choosen by user to calculate the payment amount
	 * @param {Number} _params.equipmentCost Equipment Cost
	 * @param {Number} _params.payment Payment Amount
	 * @param {Number} _params.interestRate Interest Rate
	 * @return {Number} Trade Allowance
	 */
	function calculateTradeAllowance(_params) {
		var tradeAllowance;
		if (_params && _params.paymentOption) {
			var paymentOption = _params.paymentOption;
			var equipmentCost = _params.equipmentCost != null ? _params.equipmentCost : paymentOption.get('equipmentCost');
			var payment = _params.payment != null ? _params.payment : paymentOption.get('payment');
			var interestRate = _params.interestRate != null ? _params.interestRate : paymentOption.get('interestRate');
			var amountFinanced;

			var calculationParams = {
				payment: payment,
				equipmentCost: equipmentCost,
				additionalCost: 0,
				interestRate: interestRate,
				residualValue: paymentOption.get('residualValue'),
				term: paymentOption.get('term'),
				paymentFrequency: paymentOption.get('paymentFrequency'),
				advancePayments: paymentOption.get('advancePayments'),
				balloon: paymentOption.get('balloon')
			};

			doLog && console.log('[calculator] - calculateTradeAllowance() - _params=' + JSON.stringify(calculationParams));
			if (paymentOption.isLease()) {
				amountFinanced = calculateAmountForLease(calculationParams);
			} else {
				amountFinanced = calculateAmountForFinance(calculationParams);
			}
			doLog && console.log("----------- amountFinanced : " + amountFinanced);

			tradeAllowance = -Number(amountFinanced) +
				Number(equipmentCost) +
				Number(paymentOption.get('taxesAmount')) +
				Number(paymentOption.get('tradePayoff')) -
				Number(paymentOption.get('cashDown')) +
				Number(paymentOption.get('insurance')) +
				Number(paymentOption.get('fees'));

		}

		doLog && console.log('[calculator] - calculateTradeAllowance() - tradeAllowance=' + tradeAllowance);
		return tradeAllowance;
	};

	/**
	 * @method calculateEquipmentCost
	 * Payment calculation with flexible input parameters.
	 * @param {Object} _params
	 * @param {Object} _params.paymentOption All options choosen by user to calculate the payment amount
	 * @param {Number} _params.payment Payment amount
	 * @param {Number} _params.interestRate Interest Rate
	 * @param {Number} _params.tradeAllowance Trade Allowance
	 * @return {Number} Equipment Cost
	 */
	function calculateEquipmentCost(_params) {
		// doLog && console.log('[calculator] - calculateEquipmentCost() - _params=' + JSON.stringify(_params));
		var equipmentCost;
		if (_params && _params.paymentOption) {
			var paymentOption = _params.paymentOption;
			var payment = _params.payment != null ? _params.payment : paymentOption.get('payment');
			var interestRate = _params.interestRate != null ? _params.interestRate : paymentOption.get('interestRate');
			var tradeAllowance = _params.tradeAllowance != null ? _params.tradeAllowance : paymentOption.get('tradeAllowance');
			var insuranceFactor = Number(paymentOption.get('insuranceFactor')) || 0;
			var term = Number(paymentOption.get('term'));
			var amountFinanced;

			var calculationParams = {
				payment: payment,
				additionalCost: 0,
				interestRate: interestRate,
				residualValue: paymentOption.get('residualValue'),
				term: term,
				paymentFrequency: paymentOption.get('paymentFrequency'),
				advancePayments: paymentOption.get('advancePayments'),
				balloon: paymentOption.get('balloon')
			};

			doLog && console.log('[calculator] - calculateEquipmentCost() - _params=' + JSON.stringify(calculationParams));
			if (paymentOption.isLease()) {
				amountFinanced = calculateAmountForLease(calculationParams);
			} else {
				amountFinanced = calculateAmountForFinance(calculationParams);
			}
			doLog && console.log("----------- amountFinanced : " + amountFinanced);

			if (!paymentOption.get('insuranceEnabled')) {
				insuranceFactor = 0;
			}

			if (paymentOption.get('taxes') > 0) {
				equipmentCost = (
					Number(amountFinanced) +
					Number(tradeAllowance) -
					Number(paymentOption.get('tradePayoff')) +
					Number(paymentOption.get('cashDown')) -
					Number(paymentOption.get('fees'))
				) / (
					1 +
					(Number(paymentOption.get('taxes')) / 100) +
					(insuranceFactor * term)
				);
			} else {
				equipmentCost = (
					Number(amountFinanced) +
					Number(tradeAllowance) -
					Number(paymentOption.get('taxesAmount')) -
					Number(paymentOption.get('tradePayoff')) +
					Number(paymentOption.get('cashDown')) -
					Number(paymentOption.get('fees'))
				) / (
					1 +
					(insuranceFactor * term)
				);
			}

		}
		doLog && console.log('[calculator] - calculateEquipmentCost() - equipmentCost=' + equipmentCost);
		return equipmentCost;
	};

	/**
	 * @method calculateAmountFinanced
	 * Whole Amount financed calculation
	 * @param {Object} _params
	 * @param {Number} _params.equipmentCost Equipment Cost
	 * @param {Boolean} _params.isLease Determine if it's a Lease or Finance quote
	 * @param {Number} _params.taxesAmount Total amount of taxes
	 * @param {Number} _params.tradeAllowance Trade Allowance
	 * @param {Number} _params.tradePayoff Trade Pay off
	 * @param {Number} _params.cashDown Amount of cash down that the client will pay
	 * @param {Number} _params.insurance Amount of Insurance
	 * @param {Number} _params.fees Aditional Fees
	 * @return {Number} Amount Financed
	 */
	function calculateAmountFinanced(_params) {
		if (_params) {
			doLog && console.log('[calculator] - calculateAmountFinanced() - _params: ' + JSON.stringify(_params));

			/*
			+ AF
			- TA
			+ TrA
			- TrPO
			- CD
			- I
			- F
			---------
			+ EC
	
			*/

			var amountFinanced = Number(_params.equipmentCost);

			if (!_params.isLease) {
				amountFinanced += Number(_params.taxesAmount) - Number(_params.tradeAllowance) + Number(_params.tradePayoff) -
					Number(_params.cashDown);
			}

			amountFinanced = amountFinanced + Number(_params.insurance) + Number(_params.fees);

			doLog && console.log('[calculator] - calculateAmountFinanced() - amountFinanced: ' + amountFinanced);
			return amountFinanced;
		}

		return null;
	};

	/**
	 * @method solveForPayment
	 * Quick Payment calculation for the SolveFor screen.
	 * @param {Object} _params
	 * @return {Number} payment
	 */
	function solveForPayment(_params) {
		doLog && console.log('[calculator] - solveForPayment() - _params=' + JSON.stringify(_params));
		var payment;
		if (_params) {
			payment = calculatePayment(_params);
		}
		// doLog && console.log('[calculator] - solveForPayment() - payment=' + payment);
		return payment;
	};

	/**
	 * @method solveForRateFactor
	 * Quick RateFactor calculation for the SolveFor screen.
	 * @param {Object} _params
	 * @param {Number} _params.payment
	 * @param {Object} _params.equipmentCost Equipment Cost
	 * @param {Object} _params.tradeAllowance Trade Allowance
	 * @return {Number} Rate Factor
	 */
	function solveForRateFactor(_params) {
		doLog && console.log('[calculator] - solveForRateFactor() - _params=' + JSON.stringify(_params));
		var rateFactor;
		if (_params) {
			rateFactor = _params.payment / (_params.equipmentCost + _params.tradeAllowance);
		}
		// doLog && console.log('[calculator] - solveForRateFactor() - rateFactor=' + rateFactor);
		return rateFactor;
	};

	/**
	 * @method solveForInterestRate
	 * Quick InterestRate calculation for the SolveFor screen.
	 * @param {Object} _params
	 * @param {Number} _params.payment
	 * @param {Number} _params.equipmentCost Equipment Cost
	 * @param {Number} _params.tradeUpAmount Trade up Amount
	 * @return {Number} Interest Rate
	 */
	function solveForInterestRate(_params) {
		doLog && console.log('[calculator] - solveForInterestRate() - params=' + JSON.stringify(_params));
		var interestRate;
		if (_params) {
			interestRate = 365.25 * _params.payment / (_params.equipmentCost + _params.tradeUpAmount);
			interestRate = interestRate.toFixed(2);
		}
		doLog && console.log('[calculator] - solveForInterestRate() - interestRate=' + interestRate);
		return interestRate;
	};

	/**
	 * @method solveForEquipmentCost
	 * Quick EquipmentCost calculation for the SolveFor screen.
	 * @param {Object} _params
	 * @return {Number} Equipment Cost
	 */
	function solveForEquipmentCost(_params) {
		doLog && console.log('[calculator] - solveForEquipmentCost() - _params=' + JSON.stringify(_params));
		var equipmentCost;
		if (_params) {
			equipmentCost = calculateEquipmentCost(_params);
		}
		// doLog && console.log('[calculator] - solveForEquipmentCost() - equipmentCost=' + equipmentCost);
		return equipmentCost;
	};

	/**
	 * @method solveForTradeAllowance
	 * Quick TradeAllowance calculation for the SolveFor screen.
	 * @param {Object} _params
	 * @return {Number} payment
	 */
	function solveForTradeAllowance(_params) {
		doLog && console.log('[calculator] - solveForTradeAllowance() - ');
		var payment;
		if (_params) {
			payment = calculateTradeAllowance(_params);
		}
		// doLog && console.log('[calculator] - solveForPayment() - payment=' + payment);
		return payment;
	};

	// Public API.
	return {
		// Robust payment calculation with flexible parameters accepted.
		calculatePayment: calculatePayment,
		calculateAmountFinanced: calculateAmountFinanced,

		// Quick calculations for the SolveFor screen.
		// NOTE: Minimal parameter validation is performed.
		solveForPayment: solveForPayment,
		solveForInterestRate: solveForInterestRate,
		solveForRateFactor: solveForRateFactor,
		solveForEquipmentCost: solveForEquipmentCost,
		solveForTradeAllowance: solveForTradeAllowance,

		// Utility methods.
		rateFactorToInterestRate: rateFactorToInterestRate,
		interestRateToRateFactor: interestRateToRateFactor,

		calculatePaymentForFinance: calculatePaymentForFinance,
		calculatePaymentForLease: calculatePaymentForLease
	};
})();

module.exports = calculator;
