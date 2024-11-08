/**
 * @class Models.othc.equipment
 * @singleton
 * OTHC-only functions for OTHC equipment models
 */
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
				'quantity': 1,
				'tradeAllowance': 0,
				'tradePayoff': 0,
				'isTradein': 0,
				'productId': 0,
				'productName': null,
				'unitPrice': 0,
				'extendedPrice': 0
			};
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
