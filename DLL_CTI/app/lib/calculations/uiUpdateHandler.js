/**
 * # uiUpdateHandler
 * @class Lib.calculations.uiUpdateHandler
 * @singleton
 * @uses helpers/parser
 * @uses calculations/calculator
 */

var calculator = require('/calculations/calculator');

var uiUpdateHandler = (function () {

	/**
	 * @method handlePaymentOptionChange
	 * Calculates and stores any change in the Payment Options
	 * @param {Object} _params
	 * @param {Object} _params.paymentOption
	 * @param {Number} _params.equipmentCost
	 * @param {Boolean} _params.isLease
	 * @param {Number} _params.cashDown
	 * @param {String} _params.financeOption
	 * @param {Number} _params.tradeAllowance
	 * @param {Number} _params.tradePayoff
	 * @param {Boolean} _params.insuranceEnabled
	 * @param {Number} _params.insurance
	 * @param {Number} _params.insuranceFactor
	 * @param {Number} _params.fees
	 * @param {Number} _params.taxes
	 * @param {Number} _params.taxesAmount
	 * @param {Number} _params.residualValue
	 * @param {Number} _params.advancePayments
	 * @param {Number} _params.taxOnAdvance
	 * @param {String} _params.paymentFrequency
	 * @param {String} _params.purchaseOptions
	 * @param {Number} _params.term
	 * @param {Number} _params.interestRate
	 * @param {Number} _params.balloon
	 * @param {Number} _params.annualHours
	 * @param {Number} _params.acres
	 * @param {Number} _params.ptoHP
	 * @param {Number} _params.originalInvoice
	 * @param {Number} _params.residualPercentage
	 * @return {Void}
	 */
	var handlePaymentOptionChange = function (_params) {
		_params = _params || {};
		var _paymentOption = _params.paymentOption;

		if (_paymentOption) {
			_paymentOption.saveState();

			var newEquipmentCost = Number(_params.equipmentCost).toFixed(2) || 0;
			(isNaN(newEquipmentCost)) && (newEquipmentCost = 0);

			var newIsLease = _params.isLease;
			var newFinanceOption = _params.financeOption;

			// ---- Finance
			var newCashDown = Number(_params.cashDown).toFixed(2) || 0;
			var newTradeAllowance = Number(_params.tradeAllowance).toFixed(2) || 0;
			var newTradePayoff = (_params.tradePayoff) ? Number(_params.tradePayoff).toFixed(2) : 0;
			var newInsuranceEnabled = _params.insuranceEnabled;
			var newInsurance = parseFloat(_params.insurance) || 0;
			var newInsuranceFactor = parseFloat(_params.insuranceFactor).toFixed(5) || 0;
			var newFees = Number(_params.fees).toFixed(2) || 0;
			var newTaxes = parseFloat(_params.taxes).toFixed(2) || 0;
			var newTaxesAmount = parseFloat(_params.taxesAmount);

			// ----- Lease
			var newResidualValue = _params.residualValue;
			var newAdvancePayments = _params.advancePayments;
			var newTaxOnAdvance = _params.taxOnAdvance;

			// ----- Payment Options
			var newPaymentFrequency = _params.paymentFrequency;
			var newPurchaseOptions = _params.purchaseOptions;
			var newTerm = _params.term;
			var newInterestRate = _params.interestRate;
			var newBalloon = _params.balloon;
			var newAnnualHours = _params.annualHours;
			var newAcres = _params.acres;
			var newPTOHP = _params.ptoHP;
			var newOriginalInvoice = _params.originalInvoice;
			var newResidualPercentage = _params.residualPercentage;

			// ----- Previous value for the payment option
			var isLease = _paymentOption.get("isLease");
			var financeOption = _paymentOption.get('financeOption');
			var equipmentCost = parseFloat(_paymentOption.get('equipmentCost')).toFixed(2) || 0;

			var cashDown = _paymentOption.get("cashDown");
			var tradeAllowance = _paymentOption.get("tradeAllowance");
			var tradePayoff = _paymentOption.get("tradePayoff");
			var insurance = _paymentOption.get("insurance");
			var insuranceFactor = _paymentOption.get("insuranceFactor");
			var fees = _paymentOption.get("fees");
			var taxes = _paymentOption.get("taxes");
			var taxesAmount = _paymentOption.get('taxesAmount');

			var residualValue = _paymentOption.get("residualValue");
			var advancePayments = _paymentOption.get("advancePayments");
			var taxOnAdvance = _paymentOption.get("taxOnAdvance");
			var taxOnAdvanceAmount = _paymentOption.get("taxOnAdvanceAmount");

			var paymentFrequency = _paymentOption.get("paymentFrequency");
			var purchaseOptions = _paymentOption.get("purchaseOptions");
			var term = _paymentOption.get("term");
			var interestRate = _paymentOption.get("interestRate");
			var balloon = _paymentOption.get("balloon");
			var annualHours = _paymentOption.get("annualHours");
			var acres = _paymentOption.get("acres");
			var ptoHP = _paymentOption.get("ptoHP");
			var insuranceEnabled = _paymentOption.get("insuranceEnabled") || 0;
			var originalInvoice = Number(_paymentOption.get("originalInvoice")) || 0;
			var residualPercentage = Number(_paymentOption.get("residualPercentage")) || 0;

			if ((_params.equipmentCost != undefined) && (newEquipmentCost >= 0) && (equipmentCost !== newEquipmentCost)) {
				_paymentOption.set({
					equipmentCost: newEquipmentCost
				});
				equipmentCost = newEquipmentCost;
			}

			// if((typeof newIsLease != 'undefined') && (newIsLease !== isLease)){
			// 	_paymentOption.set({ isLease : newIsLease});
			// 	isLease = newIsLease;
			// } 

			if (_params.financeOption && newFinanceOption !== financeOption) {
				_paymentOption.set({
					financeOption: newFinanceOption
				});
				financeOption = newFinanceOption;
			}

			isLease = financeOption === 'lease';

			if ((newInterestRate >= 0) && (interestRate !== newInterestRate)) {
				interestRate = newInterestRate;
				_paymentOption.set({
					interestRate: interestRate
				});
			}

			if ((_params.cashDown != undefined) && (newCashDown >= 0) && (cashDown !== newCashDown)) {
				_paymentOption.set({
					cashDown: newCashDown
				});
				cashDown = newCashDown;
			}

			if ((_params.tradeAllowance != undefined) && (newTradeAllowance >= 0) && (tradeAllowance !== newTradeAllowance)) {
				_paymentOption.set({
					tradeAllowance: newTradeAllowance
				});
				tradeAllowance = newTradeAllowance;
			}

			if ((_params.tradePayoff != undefined) && (newTradePayoff >= 0) && (tradePayoff !== newTradePayoff)) {
				_paymentOption.set({
					tradePayoff: newTradePayoff
				});
				tradePayoff = newTradePayoff;
			}

			if (newTerm && (term !== newTerm)) {
				_paymentOption.set({
					term: newTerm
				});
				term = newTerm;
			}

			if (newInsuranceEnabled != null && newInsuranceEnabled !== insuranceEnabled) {
				insuranceEnabled = newInsuranceEnabled;
			}

			if (newInsuranceFactor >= 0 && insuranceFactor !== newInsuranceFactor) {
				insuranceFactor = newInsuranceFactor;
			}

			if (!insuranceEnabled) {
				insuranceFactor = 0;
			}

			insurance = (equipmentCost * insuranceFactor * term) || 0;
			insurance = insurance.toFixed(2);

			_paymentOption.set({
				insurance: insurance,
				insuranceFactor: insuranceFactor,
				insuranceEnabled: insuranceEnabled
			});

			if ((_params.fees != undefined) && (newFees >= 0) && (fees !== newFees)) {
				_paymentOption.set({
					fees: newFees
				});
				fees = newFees;
			}

			if (newResidualValue != undefined && (newResidualValue >= 0 && newResidualValue !== residualValue)) {
				residualValue = newResidualValue;
				originalInvoice = 0;
				residualPercentage = 0;

				_paymentOption.set({
					residualValue: newResidualValue,
					originalInvoice: originalInvoice,
					residualPercentage: residualPercentage
				});
			} else if ((_params.originalInvoice != undefined || _params.residualPercentage != undefined) ||
				(_params.equipmentCost != undefined && originalInvoice > 0 || residualPercentage > 0)) {

				var _residualBase = 0;

				if (newOriginalInvoice >= 0 && newOriginalInvoice !== originalInvoice) {
					_paymentOption.set({
						originalInvoice: newOriginalInvoice
					});
					originalInvoice = newOriginalInvoice;
				} else if (newResidualPercentage >= 0 && newResidualPercentage !== residualPercentage) {
					_paymentOption.set({
						residualPercentage: newResidualPercentage
					});
					residualPercentage = newResidualPercentage;
				}

				// Calculates residual everytime
				if (originalInvoice > 0 && equipmentCost > 0) {
					_residualBase = Math.min(originalInvoice, equipmentCost);
				} else if (equipmentCost <= 0) {
					_residualBase = originalInvoice;
				} else {
					_residualBase = equipmentCost;
				}
				residualValue = _residualBase * (residualPercentage / 100);
				_paymentOption.set({
					residualValue: residualValue
				});
			}

			if ((newAdvancePayments >= 0) && (advancePayments !== newAdvancePayments)) {
				_paymentOption.set({
					advancePayments: newAdvancePayments
				});
				advancePayments = newAdvancePayments;
			}

			if ((newTaxOnAdvance >= 0) && (taxOnAdvance !== newTaxOnAdvance)) {
				_paymentOption.set({
					taxOnAdvance: newTaxOnAdvance
				});
				taxOnAdvance = newTaxOnAdvance;
			}

			if (newPaymentFrequency && (paymentFrequency !== newPaymentFrequency)) {
				_paymentOption.set({
					paymentFrequency: newPaymentFrequency
				});
				paymentFrequency = newPaymentFrequency;
			}

			if (newPurchaseOptions && (purchaseOptions !== newPurchaseOptions)) {
				_paymentOption.set({
					purchaseOptions: newPurchaseOptions
				});
				purchaseOptions = newPurchaseOptions;
			}

			if (newBalloon >= 0 && (balloon !== newBalloon)) {
				_paymentOption.set({
					balloon: newBalloon
				});
				balloon = newBalloon;
			}

			if (newAnnualHours >= 0 && (annualHours !== newAnnualHours)) {
				annualHours = newAnnualHours;
				_paymentOption.set({
					annualHours: newAnnualHours
				});

				// 	// Calculate the actual Value
				// 	if(annualHours > 0){
				// 		var costPerHour = (equipmentCost / annualHours).toFixed(2);
				// 		_paymentOption.set({ costPerHour : costPerHour });	
				// 	}else{
				// 		_paymentOption.set({ costPerHour : 0 });
				// 	}
			}

			if (newAcres >= 0 && (acres !== newAcres)) {
				acres = newAcres;
				_paymentOption.set({
					acres: newAcres
				});

				// Calculate the actual Value
				// if(acres > 0){
				// 	var costPerAcre = (equipmentCost / acres).toFixed(2);
				// 	_paymentOption.set({ costPerAcre : costPerAcre });	
				// }else{
				// 	_paymentOption.set({ costPerAcre : 0 });
				// }

			}

			if (newPTOHP >= 0 && (ptoHP !== newPTOHP)) {
				ptoHP = newPTOHP;
				_paymentOption.set({
					ptoHP: newPTOHP
				});

				// Calculate the actual Value
				// if(ptoHP > 0){
				// 	var costPerPTOHour = (equipmentCost / ptoHP).toFixed(2);
				// 	_paymentOption.set({ costPerPTOHour : costPerPTOHour });
				// }else{
				// 	_paymentOption.set({ costPerPTOHour : 0 });
				// }

			}

			var amountFinanced = Number(equipmentCost);
			if (newTaxesAmount >= 0 && newTaxesAmount !== taxesAmount) {

				taxesAmount = newTaxesAmount;
				taxes = -1;
				_paymentOption.set({
					taxes: taxes,
					taxesAmount: taxesAmount
				});

			} else if ((newTaxes >= 0 && newTaxes !== taxes) ||
				(amountFinanced >= 0 && taxes >= 0)) {

				if (newTaxes >= 0) {
					taxes = newTaxes;
				}

				taxesAmount = taxes / 100 * amountFinanced;

				_paymentOption.set({
					taxesAmount: taxesAmount,
					taxes: taxes
				});

			}

			// if(isLease){

			// 	// BG-514: Residual should have no impact on NLA
			// 	// amountFinanced = amountFinanced - Number(residualValue);
			// }else{

			// 	amountFinanced = amountFinanced + Number(taxesAmount);
			// }

			// amountFinanced = amountFinanced - Number(tradeAllowance) + Number(tradePayoff) - Number(cashDown) + Number(insurance) + Number(fees);

			amountFinanced = calculator.calculateAmountFinanced({
				isLease: isLease,
				equipmentCost: Number(equipmentCost) || 0,
				taxesAmount: Number(taxesAmount) || 0,
				tradeAllowance: Number(tradeAllowance) || 0,
				tradePayoff: Number(tradePayoff) || 0,
				cashDown: Number(cashDown) || 0,
				insurance: Number(insurance) || 0,
				fees: Number(fees) || 0
			});

			amountFinanced = (amountFinanced).toFixed(2);
			_paymentOption.set({
				amountFinanced: amountFinanced
			});

			// --- Advance Payment
			if (isLease) {
				switch (paymentFrequency) {
				case 'SA':
				case 'A':
					// This is not a bug, it should be done twice
					advancePayments = calculator.calculatePayment({
						amountFinanced: amountFinanced,
						paymentOption: _paymentOption
					});
					_paymentOption.set({
						advancePayments: advancePayments
					});
					advancePayments = calculator.calculatePayment({
						amountFinanced: amountFinanced,
						paymentOption: _paymentOption
					});
					_paymentOption.set({
						advancePayments: advancePayments
					});
					break;

				default:
					advancePayments = 0;
					_paymentOption.set({
						advancePayments: advancePayments
					});
					break;
				}

				if (taxOnAdvance >= 0 || advancePayments >= 0) {
					taxOnAdvanceAmount = taxOnAdvance / 100 * advancePayments;
					_paymentOption.set({
						taxOnAdvanceAmount: taxOnAdvanceAmount
					});
				}
			}

			//Calculate costs per based on payment, frequency and amounts

			var paymentAmount = calculator.calculatePayment({
				amountFinanced: amountFinanced,
				paymentOption: _paymentOption
			});

			if (Number(paymentAmount) < 0) {
				_paymentOption.set({
					equipmentCost: 0,
					residualValue: 0,
					originalInvoice: 0,
					residualPercentage: 0,
					payment: 0
				});

				return false;
			}

			var frequency = 0;
			var costPerHour = 0;
			var costPerAcre = 0;
			var costPerPTOHour = 0;

			switch (paymentFrequency) {
			case 'M':
				frequency = 12;
				break;
			case 'Q':
				frequency = 4;
				break;
			case 'SA':
				frequency = 2;
				break;
			case 'A':
				frequency = 1;
				break;
			}

			annualHours && (costPerHour = (paymentAmount * frequency / annualHours) || 0);
			acres && (costPerAcre = (paymentAmount * frequency / acres) || 0);

			if (costPerHour && ptoHP) {
				costPerPTOHour = (costPerHour / ptoHP) || 0;
			}

			_paymentOption.set({
				payment: paymentAmount,
				costPerHour: costPerHour,
				costPerAcre: costPerAcre,
				costPerPTOHour: costPerPTOHour
			});

			if (_paymentOption.get('payment') >= 0) {
				_paymentOption.save();
			} else {
				_paymentOption.undo();
			}
		}
	};

	return {
		handlePaymentOptionChange: handlePaymentOptionChange
	};
})();

module.exports = uiUpdateHandler;
