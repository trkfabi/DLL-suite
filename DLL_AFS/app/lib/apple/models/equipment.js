/**
 * @class Models.apple.equipment
 * @singleton
 * Apple-only functions for AFS equipment models
 */

var doLog = Alloy.Globals.doLog;

var equipment = (function () {
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
				'price': 0,
				'make': null,
				'model': null,
				'serialNumber': null,
				'isUsed': 0,
				'year': null,
				'description': null,
				'quantity': 0,
				'tradeAllowance': 0,
				'tradePayoff': 0,
				'isTradein': 0,
				'productId': 0,
				'productName': null,
				'unitPrice': 0,
				'extendedPrice': 0,
				'type': null,
				'extraRates': {},
				'productRateFactorMatchId': null
			};
		},
		initItadRate: function () {
			var extraRates = this.get('extraRates') || {};
			var itadRate = {
				unitPrice: 0,
				rateFactor: 0,
				extendedPrice: 0,
				name: String.format(L('itad_custom_description'), this.get('productName')),
			};

			extraRates.itad = itadRate;

			this.set('extraRates', extraRates);
		},
		hasItad: function () {
			return this.get('type') === Alloy.Globals.rateType.itad;
		},
		getItadRate: function () {
			if (this.hasItad()) {
				var extraRates = this.get('extraRates') || {};
				return extraRates.itad || {};
			}
		},
		clone: function () {
			var attributes = JSON.parse(JSON.stringify(this.attributes));

			return Alloy.createModel('equipment', attributes);
		}
	};

	var Collection = {

	};

	return {
		Model: Model,
		Collection: Collection
	};
})();

module.exports = equipment;
