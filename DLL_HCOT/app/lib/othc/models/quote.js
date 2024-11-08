/**
 * @class Models.othc.quote
 * @singleton
 * OTHC-only functions for OTHC quote models
 */
var quote = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	// +-------------------
	// | Public members.
	// +-------------------

	var Model = {
		defaults: function () {
			return {
				'name': L('no_name'),
				'isFavorited': 0,
				'dateCreated': new moment().format(),
				'deleted': 0,
				'submitStatus': Alloy.Globals.submitStatus.unsubmitted,
				'revision': 1,
				'pendingSync': 0,
				'modifiedDate': null,
				customer: {},
				paymentOptions: [],
				equipments: [{}],
				requests: []
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

module.exports = quote;
