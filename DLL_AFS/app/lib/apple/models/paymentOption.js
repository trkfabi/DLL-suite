/**
 * @class Models.apple.paymentOption
 * @singleton
 * Apple-only functions for AFS paymentOption models
 */

var doLog = Alloy.Globals.doLog;

var paymentOption = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	// +-------------------
	// | Public members.
	// +-------------------

	var Model = {
		defaults: function () {
			return {
				'id': Alloy.Globals.generateGUID(),
				'equipmentCost': 0,
				'term': '24',
				'additionalCost': null,
				'amountFinanced': null,
				'payment': null,
				'rateCardName': null,
				'rateFactor': null,
				'useRateCard': 1,
				'purchaseOptions': 'F',
				'status': null,
				'paymentFrequency': 'M',
				'structure': null,
				'tradeUpAmount': 0,
				'promoCode': null,
				'promoName': null,
				'advancePayment': null,
				'advancePaymentType': null,
				'points': 0,
				'servicePayment': 0,
				'contractNumber': null,
				'advancePaymentAmount': null,
				'lastRateCardUpdate': null,
				'shouldRecalculate': false,
				'isOutdated': false,
				'paybackPercentage': 0
			};
		}
	};

	var Collection = {
		/**
		 * @method clone
		 * Creates a copy of this collection on a differente instance
		 * @return {Collection.PaymentOption} Collection of PaymentOption Models cloned
		 */
		clone: function (_options) {
			var newPayments = Alloy.createCollection('paymentOption');
			this.each(function (_paymentOption) {
				Backbone.Collection.prototype.add.call(newPayments, _paymentOption.clone(), _options);
			});

			return newPayments;
		},
		/**
		 * @method add
		 * Adds a new object to the collection
		 * @return {void}
		 */
		add: function (_model, _options) {
			if (this.length < 5) {
				Backbone.Collection.prototype.add.call(this, _model, _options);
			}
		}

	};

	return {
		Model: Model,
		Collection: Collection
	};
})();

module.exports = paymentOption;
