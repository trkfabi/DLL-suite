/**
 * @class Apple.calculator
 * @singleton
 * Description
 */

const LOG_TAG = '\x1b[36m' + '[apple/calculator]' + '\x1b[39;49m ';

var doLog = Alloy.Globals.doLog;
var parser = require('/helpers/parser');
var rateCards = require('/apple/rateCards');

var AppleCalculator = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method calculatePaymentAmount
	 * Calculates the complete PaymentAmount for the given PaymentOption
	 * @param {Object} _params
	 * @param {Models.quote} _params.quote Quote to calculate from the new Payment Amount
	 * @param {Models.paymentOption} _params.paymentOption PaymentOption to calculate the payment amount in
	 * @return {Number} Payment Amount, `null` if an error occurs
	 */
	var calculatePaymentAmount = function (_params) {
		_params = _params || {};

		var quote = _params.quote;
		var paymentOption = _params.paymentOption;
		var updateRateProgram = _params.updateRateProgram || false;
		var firstRateCard = null;
		var paymentAmount = null;

		if (quote && paymentOption) {
			var equipments = quote.get('equipments');
			var creditRatingId = quote.get('creditRatingId');
			var creditRatingName = quote.get('creditRatingName');
			var term = paymentOption.get('term');

			paymentAmount = 0;

			var hasValidRateCards = equipments.every(function (_equipment) {
				var extendedPrice = parser.parseToNumber(_equipment.get('extendedPrice'));
				var productRateFactorMatchId = _equipment.get('productRateFactorMatchId');
				var product = rateCards.getProduct(_equipment.get('productName'));

				if (!product) {
					doLog && console.log(LOG_TAG, 'calculatePaymentAmount - no product found for ', _equipment.get('productName'));
					return false;
				}

				var equipmentRateCard = null;

				if (product.isDollarOut()) {
					equipmentRateCard = rateCards.getRateCard({
						rate: 'out',
						creditRating: creditRatingName,
						term: term
					});
				} else {

					if (!productRateFactorMatchId) {
						productRateFactorMatchId = product.get('rateFactorMatchId');
						if (!productRateFactorMatchId) {
							// Fallback so the ratecard does not freeze
							return true;
						}
					}

					equipmentRateCard = rateCards.getRateCard({
						productRateFactorMatchId: productRateFactorMatchId,
						creditRating: creditRatingName,
						term: term
					});
				}

				if (!equipmentRateCard) {
					doLog && console.log(LOG_TAG, 'calculatePaymentAmount - no rate card found', JSON.stringify(_equipment));
					return false;
				}

				var equipmentRateFactor = equipmentRateCard.get('rateFactor');
				paymentAmount += extendedPrice * equipmentRateFactor;

				if (_equipment.hasItad()) {
					// Check if the product still has ITAD
					var productItad = product.get('hasItad');
					if (!productItad) {
						doLog && console.warn(LOG_TAG, '- equipment ' + _equipment.get('productName') +
							' has ITAD but product does not - Freeze quote');
						return false;
					}

					var itadRateCard = rateCards.getRateCard({
						rate: 'out',
						creditRating: creditRatingName,
						term: term
					});

					if (!itadRateCard) {
						doLog && console.log(LOG_TAG, 'calculatePaymentAmount - no itadRateCard found', JSON.stringify(_equipment));
						return false;
					}

					var itadExtendedPrice = _equipment.getItadRate().extendedPrice;

					var itadRateFactor = itadRateCard.get('rateFactor');
					paymentAmount += itadExtendedPrice * itadRateFactor;
				}

				return true;
			});

			if (hasValidRateCards) {
				updateRateProgram && firstRateCard && paymentOption.set({
					promoCode: firstRateCard.get('promoCode')
				});
			} else {
				paymentAmount = null;
			}
		}

		doLog && console.debug(LOG_TAG, '- calculatePaymentAmount() - ' + paymentAmount);
		return paymentAmount;
	};

	/**
	 * @method calculateAmountFinanced
	 * Calculates the Amount Financed, adding all the extended prices from the equipment's collection
	 * @param {Object} _params
	 * @param {Models.quote} _params.quote Quote model to calculate its Amount Financed
	 * @return {Number} Amount Financed, `null` if an error occurs
	 */
	var calculateAmountFinanced = function (_params) {
		_params = _params || {};

		var amountFinanced = null;
		var quote = _params.quote;

		if (quote) {
			var equipments = quote.get('equipments');

			amountFinanced = equipments.reduce(function (_memo, _equipment) {
				if (_equipment.hasItad()) {
					_memo += parser.parseToNumber(_equipment.getItadRate().extendedPrice);
				}

				return _memo + parser.parseToNumber(_equipment.get('extendedPrice'));
			}, 0);
		}

		doLog && console.debug(LOG_TAG, '- calculateAmountFinanced() - ' + amountFinanced);

		return amountFinanced;
	};

	/**
	 * @method calculateExtendedPrice
	 * Calculates the extended price from the given Equipment Model
	 * @param {Object} _params
	 * @param {Number} _params.quantity Quantity of products
	 * @param {Number} _params.unitPrice Price per product
	 * @return {Number} Extended Price, `null` if an error occurs
	 */
	var calculateExtendedPrice = function (_params) {
		_params = _params || {};

		var quantity = parser.parseToNumber(_params.quantity);
		var unitPrice = parser.parseToNumber(_params.unitPrice);
		var extendedPrice = quantity * unitPrice;

		doLog && console.debug(LOG_TAG, '- calculateExtendedPrice() - ' + extendedPrice);

		return extendedPrice;
	};

	/**
	 * @method calculateBlendedRateFactor
	 * Calculates the blended rate factor from the given Payment Option
	 * @param {Object} _params
	 * @param {Models.paymentOption} _params.paymentOption PaymentOption to calculate the Blended Rate Factor in
	 * @return {Number} Blended Rate Factor, `null` if an error occurs
	 */
	var calculateBlendedRateFactor = function (_params) {
		_params = _params || {};

		var blendedRateFactor = null;
		var paymentOption = _params.paymentOption;
		var quote = _params.quote;

		if (quote && paymentOption) {
			var amountFinanced = parser.parseToNumber(quote.get('amountFinanced'));
			var paymentAmount = parser.parseToNumber(paymentOption.get('payment'));

			blendedRateFactor = paymentAmount / amountFinanced;
		}

		doLog && console.debug(LOG_TAG, '- calculateBlendedRateFactor() - ' + blendedRateFactor);

		return blendedRateFactor;
	};

	/**
	 * @method calculatePaybackPercentage
	 * Calculates the Payback% for the given PaymentOption model
	 * @param {Object} _params
	 * @param {Models.paymentOption} _params.paymentOption PaymentOption to calculate the Payback%
	 * @return {Number} Payback%, `null` if an error occurs
	 */
	var calculatePaybackPercentage = function (_params) {
		_params = _params || {};

		var paybackPercentage = null;
		var quote = _params.quote;
		var paymentOption = _params.paymentOption;

		if (quote && paymentOption) {
			var paymentAmount = parser.parseToNumber(paymentOption.get('payment'));
			var term = parser.parseToNumber(paymentOption.get('term'));
			var amountFinanced = parser.parseToNumber(quote.get('amountFinanced'));

			paybackPercentage = paymentAmount * term / amountFinanced;
		}

		doLog && console.debug(LOG_TAG, '- calculatePaybackPercentage() - ' + paybackPercentage);

		return paybackPercentage;
	};

	return {
		calculatePaymentAmount: calculatePaymentAmount,
		calculateAmountFinanced: calculateAmountFinanced,
		calculateExtendedPrice: calculateExtendedPrice,
		calculateBlendedRateFactor: calculateBlendedRateFactor,
		calculatePaybackPercentage: calculatePaybackPercentage
	};
})();

module.exports = AppleCalculator;
