/**
 * # calculatorManager
 * @class Lib.calculations.calculatorManager
 * @singleton
 * @uses helpers/parser
 * @uses calculations/calculator
 */
var parser = require('/helpers/parser');
var calculator = require('/calculations/calculator');
var rateCards = require('/rateCards');

var calculatorManager = (function () {
	/**
	 * @method calculatePaymentChange
	 * Calculates and stores any change in the Payment Options
	 * @return {Void}
	 */
	function calculatePaymentChange(_params) {
		_params = _params || {};

		var paymentOptionOrig = _params.paymentOption;
		var amountFinanced = null;
		var paymentOption = null;
		var selectedValues = null;

		if (paymentOptionOrig && paymentOptionOrig.isActive()) {
			paymentOption = Alloy.createModel('paymentOption', paymentOptionOrig.toJSON({
				retainSelected: true
			}));
			paymentOption.saveState();

			if (_params.reset) {
				_params = _.extend(_params, paymentOption.defaults(), rateCards.getDefaults());
				_params = _.extend(_params, rateCards.getDefaultValuesForPromo(_params.promoCode));

				delete _params['equipmentCost'];
				delete _params['additionalCost'];
				delete _params['tradeUpAmount'];
				delete _params['servicePayment'];

			} else if (_params.useRateCard != null && !_params.shouldRecalculate) {
				if (_params.useRateCard) {
					_params.paymentFrequency = paymentOption.get('rateCardPaymentFrequency') || 'M';
					_params.points = paymentOption.get('rateCardPoints') || paymentOption.get('points') || 0;
				} else {
					_params.paymentFrequency = 'M';
					_params.points = 0;

					paymentOption.set('rateCardPaymentFrequency', paymentOption.get('paymentFrequency'));
					paymentOption.set('rateCardPoints', paymentOption.get('points'));
				}
			}

			// doLog && console.log('[calculatorManager] - calculatePaymentChange() - ' + JSON.stringify(_params, null, '\t'));

			selectedValues = paymentOption.get('selectedValues') || {};

			_.each(_params, function (_paramValue, _paramName) {
				var shouldSetProperty = false;
				switch (_paramName) {
				case 'equipmentCost':
				case 'additionalCost':
				case 'servicePayment':
				case 'advancePaymentAmount':
					_paramValue = parser.parseToNumber(_paramValue, 2);
					shouldSetProperty = true;
					break;
				case 'tradeUpAmount':
					_paramValue = parser.parseToNumber(_paramValue, 2);
					shouldSetProperty = true;
					if (_paramValue <= 0) {
						paymentOption.set('contractNumber', null);
					}
					break;
				case 'points':
					_paramValue = parser.parseToNumber(_paramValue, 0);
					shouldSetProperty = true;
					break;
				case 'manualRateFactor':
				case 'rateFactor':
					_paramValue = parser.parseToNumber(_paramValue, 6);
					shouldSetProperty = true;
					break;
					// @TODO: we maye need some custom handling in the future
				case 'promoCode':
				case 'promoName':
				case 'paymentFrequency':
				case 'purchaseOptions':
				case 'term':
				case 'advancePayment':
				case 'advancePaymentType':
				case 'contractNumber':
					shouldSetProperty = true;
					break;
				case 'useRateCard':
					paymentOption.set(_paramName, _paramValue);
					break;
				}

				if (shouldSetProperty) {
					if (_paramValue < 0) {
						_paramValue = 0;
					}

					paymentOption.set(_paramName, _paramValue);
					selectedValues[_paramName] = true;
				}
			});

			if (_params.shouldRecalculate || _params.reset) {
				selectedValues = {};
			}

			paymentOption.set('selectedValues', selectedValues);
			paymentOptionOrig.set(paymentOption.toJSON({
				retainSelected: true
			}));

			amountFinanced = calculator.calculateAmountFinanced(paymentOption);
			updateAmountFinancedAnalytics(paymentOption, amountFinanced);
			paymentOption.set('amountFinanced', amountFinanced);

			var rateFactor = null;
			var equipmentCost = null;
			// Apply changes only for positive amount financed 
			if (amountFinanced >= 0) {
				if (paymentOption.get('useRateCard')) {
					var tradeUpAmount = null;
					var additionalCost = null;

					if (rateCards.isActivePromo(paymentOption.get('promoCode'))) {
						// Update Promo Name =======================================
						paymentOption.set({
							promoName: rateCards.getPromoName(paymentOption.get('promoCode'))
						});
					} else {
						// Invalid Promo handling =====================================
						var newPromo = rateCards.getDefaultPromo();

						paymentOption.set({
							promoCode: newPromo.get('program'),
							promoName: newPromo.get('description')
						});
					}

					manageAmountFinanceBounds(paymentOption, _params);

					amountFinanced = parser.parseToNumber(paymentOption.get('amountFinanced'));
					equipmentCost = parser.parseToNumber(paymentOption.get('equipmentCost'));
					tradeUpAmount = parser.parseToNumber(paymentOption.get('tradeUpAmount'));
					additionalCost = parser.parseToNumber(paymentOption.get('additionalCost'));

					// if (_params.shouldRecalculate && amountFinanced === 0) {
					// 	var defaultValues = rateCards.getDefaultValuesForPromo(paymentOption.get('promoCode'));

					// 	paymentOption.set({
					// 		term: defaultValues.payments,
					// 		purchaseOptions: defaultValues.purchaseOptions,
					// 		paymentFrequency: defaultValues.paymentFrequency
					// 	});
					// }

					// Retrieve a fresh new rate card
					// if (
					// 	(
					// 		_params.shouldRecalculate
					// 		&& rateCards.getRangeOfRatesForPaymentOption(paymentOption).length <= 0
					// 	) || (
					// 		_params.shouldRecalculate
					// 		&& amountFinanced > 0 
					// 		&& !rateCards.hasValidRateCard(paymentOption)
					// 	) || (
					// 		_params.promoCode != null
					// 		&& !rateCards.hasValidRateCard(paymentOption)
					// 		// && amountFinanced > 0
					// 		&& _params.useRateCard == null
					// 	)
					// ) 
					if (
						_params.reset ||
						(_params.shouldRecalculate && amountFinanced === 0) ||
						(_params.shouldRecalculate && !rateCards.hasValidRateCard(paymentOption)) ||
						(_params.promoCode != null && _params.useRateCard == null)
					) {
						doLog && console.log('[calculatorManager] - Looking for new rate card');
						var validRateCard = rateCards.getDefaultOptionsForPaymentPromo(paymentOption);

						if (validRateCard) {
							doLog && console.log('[calculatorManager] - rate card found: ' + JSON.stringify(validRateCard, null, '\t'));

							paymentOption.set({
								purchaseOptions: validRateCard.get('purchaseOption'),
								paymentFrequency: validRateCard.get('paymentFrequency'),
								advancePayment: validRateCard.get('advancePayment'),
								advancePaymentType: validRateCard.get('advancePaymentType'),
								promoCode: validRateCard.get('promoCode'),
								promoName: validRateCard.get('description'),
								term: '' + validRateCard.get('payments'),
								points: validRateCard.get('points')
							});
						}
					}
					// ====================================================

					// rateCard validation
					rateFactor = rateCards.getRateFactorForPaymentOption(paymentOption);

					paymentOption.set({
						rateFactor: rateFactor
					});

					if (
						(!rateFactor &&
							(
								_params.equipmentCost != null ||
								_params.additionalCost != null ||
								_params.tradeUpAmount != null ||
								_params.servicePayment != null ||
								_params.useRateCard != null
							)
						) ||
						!equipmentCost ||
						!amountFinanced
					) {
						paymentOption.set({
							'amountFinanced': 0,
							'payment': 0,
							'rateFactor': 0
						});
					} else if (rateFactor) {
						paymentOption.set('payment', calculator.calculatePayment(paymentOption));
					} else {
						// If rate card is not valid
						paymentOption.undo();
					}
				} else {
					// Rate Factor Mode
					rateFactor = parser.parseToNumber(paymentOption.get('manualRateFactor'), 6);
					equipmentCost = null;

					manageAmountFinanceBounds(paymentOption, _params, Alloy.Globals.amountFinancedLimits);

					equipmentCost = parser.parseToNumber(paymentOption.get('equipmentCost'));
					amountFinanced = parser.parseToNumber(paymentOption.get('amountFinanced'));

					if (rateFactor < 0) {
						rateFactor = 0;
					}

					if (equipmentCost === 0 || amountFinanced === 0) {
						paymentOption
							.set({
								'amountFinanced': 0,
								'payment': 0,
								'rateFactor': 0
							});
					} else if (rateFactor >= 0) {
						paymentOption
							.set('rateFactor', rateFactor)
							.set('payment', calculator.calculatePayment(paymentOption));
					} else {
						paymentOption.undo();
					}

				}
			} else {
				// If amount financed is negative
				paymentOption.undo();
			}

			paymentOptionOrig
				.set(paymentOption.toJSON({
					retainSelected: true
				}))
				.save();

		}
	};

	/**
	 * @method manageAmountFinanceBounds
	 * @private
	 * Validates the minimum and maximum values for the Amount financed, editing the EC, TUA or AC
	 * @param {Models.PaymentOption} paymentOption model to validate
	 * @param {Object} _params Parameters coming from the calculationHandler
	 * @param {Object} [_minMax] minimum and maximum values. If not set will be retrieved from the rate cards.
	 * @param {Number} [_minMax.min] minimum allowed value
	 * @param {Number} [_minMax.max] maximum allowed value
	 * @return {void}
	 */
	function manageAmountFinanceBounds(_paymentOption, _params, _minMax) {
		var isAmountFinanceOutOfBounds = false;
		var minMax = _minMax || rateCards.getMinMaxAmounts(_paymentOption);
		var equipmentCost = parser.parseToNumber(_paymentOption.get('equipmentCost'));
		var tradeUpAmount = parser.parseToNumber(_paymentOption.get('tradeUpAmount'));
		var additionalCost = parser.parseToNumber(_paymentOption.get('additionalCost'));
		var amountFinanced = parser.parseToNumber(_paymentOption.get('amountFinanced'));

		// Amount Finance Bounds Validation ===============================
		if (amountFinanced > 0 && amountFinanced < minMax.min) {
			_paymentOption.set('amountFinanced', minMax.min);
			isAmountFinanceOutOfBounds = true;
		} else if (amountFinanced > 0 && amountFinanced > minMax.max) {
			_paymentOption.set('amountFinanced', minMax.max);
			isAmountFinanceOutOfBounds = true;
		}

		if (isAmountFinanceOutOfBounds) {
			var calcOrder = {};

			if (_params.tradeUpAmount != null) {
				calcOrder = {
					'equipmentCost': calculator.calculateEquipmentCost,
					'additionalCost': calculator.calculateAdditionalCost,
					'tradeUpAmount': calculator.calculateTradeUpAmount
				};
			} else if (_params.additionalCost != null) {
				calcOrder = {
					'equipmentCost': calculator.calculateEquipmentCost,
					'additionalCost': calculator.calculateAdditionalCost,
					'tradeUpAmount': calculator.calculateTradeUpAmount
				};
			} else if (_params.equipmentCost != null) {
				calcOrder = {
					'equipmentCost': calculator.calculateEquipmentCost
				};
			} else {
				if (amountFinanced < minMax.min) {
					calcOrder = {
						'equipmentCost': calculator.calculateEquipmentCost
					};
				} else if (amountFinanced > minMax.max) {
					calcOrder = {
						'equipmentCost': calculator.calculateEquipmentCost,
						'additionalCost': calculator.calculateAdditionalCost,
						'tradeUpAmount': calculator.calculateTradeUpAmount
					};

					if (equipmentCost <= 0) {
						delete calcOrder['equipmentCost'];
					}

					if (tradeUpAmount <= 0) {
						delete calcOrder['tradeUpAmount'];
					}

					if (additionalCost <= 0) {
						delete calcOrder['additionalCost'];
					}
				}

			}

			_.each(calcOrder, function (_calcFunction, _property) {
				_paymentOption.set(_property, _calcFunction(_paymentOption));
			});

			amountFinanced = calculator.calculateAmountFinanced(_paymentOption);

			_paymentOption.set('amountFinanced', amountFinanced);
		}
	};

	/**
	 * @method handlePaymentOptionChange
	 * Handler for all the changes within the calculations for the payment amount
	 * @return {Void}
	 */
	var handlePaymentOptionChange = function (_params) {
		_.defer(function () {
			calculatePaymentChange(_params);
		});
	};

	/**
	 * @method handleRateCardUpdatesValidation
	 * Handler function to be called everytime there is a rateCard update so it will check all the payments that they are still valid
	 * @param {Collection.Quote} _quotes Collection of Quotes to validate
	 * @return {void}
	 */
	function handleRateCardUpdatesValidation(_quotes) {
		if (_quotes && rateCards.hasRateCards()) {
			_quotes.each(function (_quote) {
				handleRateCardUpdateValidationSingleQuote(_quote);
			});

			// TODO: this will reset all the outdated payments. Use with caution
			// _quotes.each(function (_quote) {
			// 	_quote.get('paymentOptions').each(function (_paymentOption) {
			// 		_paymentOption.set('isOutdated', false).save();
			// 		doLog && console.log('[calculatorManager] - handleRateCardUpdatesValidation() - set to FALSE: ' + _paymentOption.id);
			// 	});
			// });
		}

	};

	/**
	 * @method updateAmountFinancedAnalytics
	 * @private
	 * Updates the analytics counter for amount financed
	 * @param {Object} _paymentOption Payment option
	 * @param {Number} _newAmountFinanced Amount to compare
	 * @return {void}
	 */
	function updateAmountFinancedAnalytics(_paymentOption, _newAmountFinanced) {
		doLog && console.log('[calculatorManager] - updateAmountFinancedAnalytics');
		_paymentOption.addAnalyticsCounter('amountFinanced', _newAmountFinanced);
	}

	/**
	 * @method handleRateCardUpdateValidationSingleQuote
	 * @private
	 * Handler function to be called everytime a new set of rate cards is available 
	 * to mark all possible Payment Options or Quotes as `isOutdated`
	 * @param {Quote} _quote quote to review
	 * @return {void}
	 */
	function handleRateCardUpdateValidationSingleQuote(_quote) {
		if (!_quote.get('deleted') && !_quote.isSubmitted()) {
			_quote.get('paymentOptions').each(function (_paymentOption) {
				if ( /*_paymentOption.isActive() && */ _paymentOption.get('useRateCard') && !_paymentOption.get(
						'shouldRecalculate')) {
					checkRateCardUpdatesForPayment(_paymentOption);
				}
			});
		}
	}

	/**
	 * @method checkRateCardUpdatesForPayment
	 * @private
	 * Checks if there were any changes to the rateFactor.
	 * If the rate card is invalid or if the payment changed, it will be marked 
	 * as outdated
	 * @param {Model.PaymentOption} _paymentOption Payment Option model to validate
	 * @return {void}
	 */
	function checkRateCardUpdatesForPayment(_paymentOption) {
		// doLog && console.log('[calculatorManager] - checkRateCardUpdatesForPayment()');

		var newRateFactor = parser.parseToNumber(rateCards.getRateFactorForPaymentOption(_paymentOption));
		var currentPayment = parser.parseToNumber(_paymentOption.get('payment'), 2);
		var amountFinanced = parser.parseToNumber(_paymentOption.get('amountFinanced'), 2);
		var newPayment = 0;

		if (newRateFactor > 0) {
			newPayment = amountFinanced * newRateFactor;
		}

		newPayment = newPayment.toFixed(2);
		currentPayment = currentPayment.toFixed(2);

		if (newPayment !== currentPayment) {
			_paymentOption.set({
				'isOutdated': true,
				// 'rateFactor' : 0.01234,
				// 'payment' : amountFinanced * 0.01234
			});
			doLog && console.warn('[calculatorManager] - checkRateCardUpdatesForPayment() - Marking as isOutdated: ');
			doLog && console.warn('newPayment: ' + newPayment);
			doLog && console.warn('currentPayment: ' + currentPayment);
		} else if (_paymentOption.get('isOutdated')) {
			_paymentOption.set('isOutdated', false);
		}
	};

	return {
		handlePaymentOptionChange: handlePaymentOptionChange,
		handleRateCardUpdatesValidation: handleRateCardUpdatesValidation,
		handleRateCardUpdateValidationSingleQuote: handleRateCardUpdateValidationSingleQuote
	};
})();

module.exports = calculatorManager;
