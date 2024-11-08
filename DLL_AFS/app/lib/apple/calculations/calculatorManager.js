/**
 * @class Apple.calculations.calculatorManager
 * @singleton
 * Manager for all the calculations and updates within the quotes
 */
var doLog = Alloy.Globals.doLog;
const LOG_TAG = '\x1b[35m' + '[apple/calculations/calculatorManager]' + '\x1b[39;49m ';

var parser = require('/helpers/parser');
var rateCards = require('/apple/rateCards');
var calculator = require('/apple/calculator');

var AppleCalculatorManager = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method handleQuoteChange
	 * Main handler function for all the changes that will affect the Payment Amount
	 * since Rate Factor is linked to Credit Rating AND Products selected, the whole list of Payments in the quote may change
	 * @param {Object} _params
	 * @param {Models.Quote} _params.quote Quote model that is changing
	 * @param {Models.PaymentOption} [_params.paymentOption] PaymentOption model that is changing.
	 * @param {Models.Equipment} [_params.equipment] Equipment model that is changing.
	 * @param {String} [_params.creditRatingId] New creditRatingId selected from the list
	 * @param {String} [_params.creditRatingName] New creditRatingName selected from the list, Required if `creditRatingId` is defined
	 * @param {String} [_params.term] New term selected on the PaymentOption. Required if `paymentOption` is defined
	 * @param {String} [_params.productId] New productId selected on the Equipment.
	 * @param {String} [_params.productName] New productId selected on the Equipment. Required if `productId` is defined
	 * @param {String} [_params.productId] New productId selected on the Equipment.
	 * @param {Number} [_params.unitPrice] New unitPrice selected on the Equipment.
	 * @param {Number} [_params.quantity] New quantity selected on the Equipment.
	 * @return {void}
	 */
	var handleQuoteChange = function (_params) {
		_params = _params || {};

		doLog && console.log(LOG_TAG, '- handleQuoteChange');
		var quote = _params.quote;
		var preventSave = _params.preventSave || false;

		if (quote) {
			var paymentOptions = quote.get('paymentOptions');
			var creditRatingId = quote.get('creditRatingId');
			var creditRatingName = quote.get('creditRatingName');
			var equipments = quote.get('equipments');
			var amountFinanced = parser.parseToNumber(quote.get('amountFinanced'));

			_.each(_params, function (_paramValue, _paramName) {
				switch (_paramName) {
				case 'shouldRecalculate':
					doLog && console.log(LOG_TAG, '- shouldRecalculate');

					if (!preventSave) {
						removeOutdatedEquipments();
						updateAllItads();
					}

					updateAllEquipments();

					amountFinanced = calculator.calculateAmountFinanced({
						quote: quote
					});

					if (!preventSave) {
						quote.addAnalyticsCounter('financedAmount', {
							newAmount: amountFinanced
						});
					}
					quote.set('amountFinanced', amountFinanced);

					updateAllPaymentOptions();
					break;

				case 'paymentOption':
					var paymentOption = _paramValue;

					if (_params.term) {
						paymentOption.set({
							term: _params.term
						});
					}

					updatePaymentOption(paymentOption);
					break;

				case 'equipment':
					var equipment = _paramValue;

					if (_params.productId) {
						equipment.set({
							productId: _params.productId
						});
					}
					if (_params.productRateFactorMatchId) {
						equipment.set({
							productRateFactorMatchId: _params.productRateFactorMatchId
						});
					}

					if (_params.productName) {
						equipment.set({
							productName: _params.productName
						});
					}

					if (_params.unitPrice != null) {
						equipment.set({
							unitPrice: _params.unitPrice
						});
					}

					if (_params.quantity != null) {
						equipment.set({
							quantity: _params.quantity
						});
					}

					if (_params.type !== undefined) {
						equipment.set({
							type: _params.type
						});
					}

					equipment.hasItad() && updateItadType(equipment);

					updateEquipmentExtraRates(equipment);

					updateEquipment(equipment);

					amountFinanced = calculator.calculateAmountFinanced({
						quote: quote
					});

					if (!preventSave) {
						quote.addAnalyticsCounter('financedAmount', {
							newAmount: amountFinanced,
							equipment: equipment
						});
					}
					quote.set('amountFinanced', amountFinanced);

					updateAllPaymentOptions();
					break;

				case 'creditRatingId':
					creditRatingId = _paramValue;
					creditRatingName = _params.creditRatingName;

					quote.set({
						'creditRatingId': creditRatingId,
						'creditRatingName': _params.creditRatingName
					});

					updateAllPaymentOptions();
					break;
				}
			});

			!preventSave && quote.save();
		}

		function updatePaymentOption(_paymentOption) {
			doLog && console.log(LOG_TAG, '- updatePaymentOption');

			var totalPaymentAmount = calculator.calculatePaymentAmount({
				quote: quote,
				paymentOption: _paymentOption,
				updateRateProgram: true
			});

			_paymentOption
				.set({
					'amountFinanced': amountFinanced,
					'equipmentPrice': amountFinanced,
					'payment': totalPaymentAmount
				});

			var rateFactor = calculator.calculateBlendedRateFactor({
				quote: quote,
				paymentOption: _paymentOption
			});

			var paybackPercentage = calculator.calculatePaybackPercentage({
				quote: quote,
				paymentOption: _paymentOption
			});

			_paymentOption
				.set({
					'rateFactor': rateFactor,
					'paybackPercentage': paybackPercentage
				});
		}

		function updateAllPaymentOptions() {
			doLog && console.log(LOG_TAG, '- updateAllPaymentOptions');

			paymentOptions.each(updatePaymentOption);
		}

		function updateItadType(_equipment) {
			var product = rateCards.getProduct(_equipment.get('productName'));
			if (product) {
				_equipment.set({
					type: product.get('type')
				});
			}
		}

		function updateEquipmentExtraRates(_equipment) {
			doLog && console.log(LOG_TAG, '- updateEquipmentExtraRates');

			if (_equipment.hasItad()) {
				_equipment.initItadRate();
			} else {
				_equipment.set('extraRates', {});
			}
		}

		function updateAllItads() {
			doLog && console.log(LOG_TAG, '- updateAllItads');

			equipments.each(function (_equipment) {
				_equipment.hasItad() && updateItadType(_equipment);
			});
		}

		function updateEquipment(_equipment) {
			doLog && console.log(LOG_TAG, '- updateEquipment');
			var maxUnitPrice = 99999.99;
			var maxUnitPriceOther = 999999.99;
			var maxQty = 99999;
			var maxQtyOther = 9999;
			var equipmentSelected = _equipment.get('productName') || '';

			if (equipmentSelected === 'Other Product/Service') {
				maxQty = maxQtyOther;
				maxUnitPrice = maxUnitPriceOther;
			}

			var quantity = parser.parseToNumber(_equipment.get('quantity'));
			if (quantity > maxQty) {
				quantity = maxQty;
			}
			var unitPrice = parser.parseToNumber(_equipment.get('unitPrice'), 2);
			if (unitPrice > maxUnitPrice) {
				unitPrice = maxUnitPrice;
			}

			var extendedPrice = calculator.calculateExtendedPrice({
				unitPrice: unitPrice,
				quantity: quantity
			});
			if (_equipment.hasItad()) {
				var product = rateCards.getProduct(_equipment.get('productName'));
				var itadRate = _equipment.getItadRate();
				itadRate.unitPrice = product ? parser.parseToNumber(product.get('itadValue')) : 0;
				itadRate.extendedPrice = calculator.calculateExtendedPrice({
					unitPrice: itadRate.unitPrice,
					quantity: quantity
				});

			}

			_equipment.set({
				quantity: quantity,
				unitPrice: unitPrice,
				extendedPrice: extendedPrice
			});
		}

		function updateAllEquipments() {
			doLog && console.log(LOG_TAG, '- updateAllEquipments');

			equipments.each(updateEquipment);
		}

		function removeOutdatedEquipments() {
			doLog && console.log(LOG_TAG, '- removeOutdatedEquipments');

			var terms = paymentOptions.pluck('term');
			var equipmentsToRemove = equipments.filter(function (_equipment) {
				var product = rateCards.getProduct(_equipment.get('productName'));

				if (!product) {
					return true;
				}

				var productRateFactorMatchId = _equipment.get('productRateFactorMatchId');

				if (!product.isDollarOut()) {
					if (!productRateFactorMatchId) {
						productRateFactorMatchId = product.get('rateFactorMatchId');
					}

					if (!productRateFactorMatchId) {
						return true;
					}
				}

				var hasRateFactors = _.every(terms, function (_term) {
					var equipmentRateCard = null;

					if (product.isDollarOut()) {
						equipmentRateCard = rateCards.getRateCard({
							rate: 'out',
							creditRating: creditRatingName,
							term: _term
						});
					} else {
						equipmentRateCard = rateCards.getRateCard({
							productRateFactorMatchId: productRateFactorMatchId,
							creditRating: creditRatingName,
							term: _term
						});
					}

					if (!equipmentRateCard) {
						return false;
					}

					return !!equipmentRateCard.get('rateFactor');
				});

				return !hasRateFactors;
			});

			_.each(equipmentsToRemove, function (_equipment) {
				doLog && console.log(LOG_TAG, '- removing equipment: ' + _equipment.id);
				_equipment.destroy();
				equipments.remove(_equipment);
			});
		}
	};

	/**
	 * @method handleRateCardUpdatesValidation
	 * Handler function to be called everytime a new set of rate cards is available 
	 * to mark all possible Payment Options or Quotes as `isOutdated`
	 * @param {Collection.Quote} Collection of quotes to check if they're expired
	 * @return {void}
	 */
	function handleRateCardUpdatesValidation(_quotes) {
		doLog && console.log(LOG_TAG, '- handleRateCardUpdatesValidation');

		if (_quotes && rateCards.hasRateCards()) {
			_quotes.each(function (_quote) {
				handleRateCardUpdateValidationSingleQuote(_quote);
				// if (!_quote.get('deleted') && !_quote.isSubmitted()) {
				// 	var newQuote = _quote.clone();
				// 	var paymentOptions = _quote.get('paymentOptions');
				// 	var newPaymentOptions = newQuote.get('paymentOptions');
				// 	var isOutdated = false;

				// 	handleQuoteChange({
				// 		quote : newQuote,
				// 		shouldRecalculate : true,
				// 		preventSave : true
				// 	});

				// 	paymentOptions.each(function (_paymentOption, _index) {
				// 		var newPaymentOption = newPaymentOptions.at(_index);
				// 		var oldPayment = parser.parseToNumber(_paymentOption.get('payment'));
				// 		var newPayment = parser.parseToNumber(newPaymentOption.get('payment'));

				// 		if (oldPayment !== newPayment) {
				// 			doLog && console.warn('[AppleCalculatorManager] - handleRateCardUpdatesValidation() - isOutdated - OLD: ' + oldPayment + ' - NEW: ' + newPayment);
				// 			_paymentOption.set({
				// 				'isOutdated' : true
				// 			});
				// 			isOutdated = true;
				// 		} else {
				// 			_paymentOption.set({
				// 				'isOutdated' : false
				// 			});
				// 		}

				// 	});

				// 	_quote.set({
				// 		'isOutdated' : isOutdated
				// 	});

				// }
			});
		}
	};

	/**
	 * @method handleRateCardUpdateValidationSingleQuote
	 * @private
	 * Handler function to be called everytime a new set of rate cards is available 
	 * to mark all possible Payment Options or Quotes as `isOutdated`
	 * @param {Quote} _quote quote to review
	 * @return {void}
	 */
	function handleRateCardUpdateValidationSingleQuote(_quote) {
		doLog && console.log(LOG_TAG, '- handleRateCardUpdateValidationSingleQuote');

		if (_quote && rateCards.hasRateCards()) {
			if (!_quote.get('deleted') && !_quote.isSubmitted()) {
				var newQuote = _quote.clone();
				var paymentOptions = _quote.get('paymentOptions');
				var newPaymentOptions = newQuote.get('paymentOptions');
				var isOutdated = false;

				handleQuoteChange({
					quote: newQuote,
					shouldRecalculate: true,
					preventSave: true
				});

				paymentOptions.each(function (_paymentOption, _index) {
					var newPaymentOption = newPaymentOptions.at(_index);
					var oldPayment = parser.parseToNumber(_paymentOption.get('payment'));
					var newPayment = parser.parseToNumber(newPaymentOption.get('payment'));

					if (_paymentOption.get('shouldRecalculate')) {
						return false;
					}

					if (oldPayment !== newPayment) {
						doLog && console.warn(
							'[AppleCalculatorManager] - handleRateCardUpdateValidationSingleQuote() - isOutdated - OLD: ' + oldPayment +
							' - NEW: ' + newPayment);
						_paymentOption.set({
							'isOutdated': true
						});
						isOutdated = true;
					} else {
						_paymentOption.set({
							'isOutdated': false
						});
					}

				});

				_quote.set({
					'isOutdated': isOutdated
				});
			}
		}
	}

	return {
		handleQuoteChange: handleQuoteChange,
		handleRateCardUpdatesValidation: handleRateCardUpdatesValidation,
		handleRateCardUpdateValidationSingleQuote: handleRateCardUpdateValidationSingleQuote
	};
})();

module.exports = AppleCalculatorManager;
