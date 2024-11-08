/**
 * @class Models.apple.quote
 * @singleton
 * Apple-only functions for AFS quote models
 */

var doLog = Alloy.Globals.doLog;

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
				'dateCreated': new moment().toISOString(),
				'deleted': 0,
				'submitStatus': Alloy.Globals.submitStatus.unsubmitted,
				'revision': 1,
				'creditRatingId': '01',
				'creditRatingName': 'AAA',
				'pendingSync': 0,
				'modifiedDate': null,
				'expirationDate': null,
				'displayPaybackPercentage': 1,
				customer: {},
				paymentOptions: [{
					term: '24'
				}, {
					term: '36'
				}],
				equipments: [{}],
				requests: []
			};
		},
		/**
		 * @method isNew
		 * Verifies if the quote has customer information, to determine whether or not it is a new quote.
		 * If a quote is submitted it is not considered new
		 * @return {Boolean} Returns true if the quote is new
		 */
		isNew: function () {
			doLog && console.log('[Apple-quote] - isNew()');

			if (this.getQuoteName() || this.isSubmitted() || this.get('customQuoteName')) {
				return false;
			}

			return true;
		},
		/**
		 * @method shouldRecalculate
		 * Determines if the quote should be recalculated based on one of its paymentOptions
		 * @return {Boolean} `true` if one of the paymentOptions should be recalculated
		 */
		shouldRecalculate: function () {
			var paymentOptions = this.get('paymentOptions');

			return paymentOptions.any(function (_paymentOption) {
				return !!_paymentOption.get('shouldRecalculate');
			});
		},
		/**
		 * @method updateDefaultExpirationDate
		 * @private
		 * Sets the correct default expiration date for the quote, based on the current configuration of it
		 * @return {void}
		 */
		updateDefaultExpirationDate: function () {
			var dateCreated = this.get('dateCreated');
			var expirationDate = this.get('expirationDate');

			if (expirationDate) {
				return false;
			}

			expirationDate = moment(dateCreated).add(29, 'days').format();
			this.set('expirationDate', expirationDate);
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
