var doLog = Alloy.Globals.doLog;
var configsManager = require('/utils/configsManager');
exports.definition = {
	config: {
		columns: {
			//reused atts
			rateCardCode: 'TEXT',
			term: 'INTEGER',
			rateFactor: 'REAL',
			points: 'INTEGER',

			// new atts
			creditRating: 'TEXT',
			productId: 'TEXT',
			vendorCode: 'TEXT',
			versionId: 'TEXT',
			rate: 'TEXT',
			productRateFactorMatchId: 'TEXT',
			// old atts

			purchaseOption: 'TEXT',
			paymentFrequency: 'TEXT',
			advancePayment: 'INTEGER',
			advancePaymentType: 'TEXT',
			promoCode: 'TEXT',
			min: 'REAL',
			max: 'REAL',
			paymentLevel: 'INTEGER',
			payments: 'INTEGER',
			rateProgramFilter: 'TEXT',
			expirationDate: 'TEXT',
			lastUpdated: 'TEXT',
			type: 'TEXT'

		},
		defaults: {
			rateCardCode: null,
			term: 0,
			rateFactor: 0,
			points: 0,

			creditRating: null,
			productId: null,
			vendorCode: null,
			versionId: null,
			rate: null,
			productRateFactorMatchId: null,

			purchaseOption: null,
			paymentFrequency: null,
			advancePayment: 0,
			advancePaymentType: null,
			promoCode: null,
			min: 0,
			max: 0,
			paymentLevel: 0,
			payments: 0,
			rateProgramFilter: null,
			expirationDate: null,
			lastUpdated: null,
			type: null
		},
		adapter: {
			version: 5,
			type: 'joli',
			lastFreshMigration: 1,
			collection_name: 'rateCard'
		}
	},
	/**
	 * @class Models.rateCard
	 * Model definition to store each Rate Card info
	 */
	extendModel: function (Model) {
		_.extend(Model.prototype, {
			// TODO: All the rate cards management will be here
		});

		return Model;
	},
	/**
	 * @class Collections.rateCard
	 * Model definition to store each Rate Card info
	 */
	extendCollection: function (Collection) {
		_.extend(Collection.prototype, {
			/**
			 * @method wipe
			 * Wipes all the local registers from this table. Use with caution
			 * @return {Collections.rateCard} the same Collection for cascade usage
			 */
			wipe: function () {
				doLog && console.log('[rateCard.Collection] - wipe()');
				var _joli = this.config.getJoli();
				var _query = new _joli.query()
					.destroy()
					.from('rateCard');

				var _result = _query.execute('array');

				return this;
			},
			/**
			 * @method save
			 * Save collection
			 * @param {Object} _options Options for saving he Collection
			 * @return {Models.quote}
			 */
			save: function (_options) {
				doLog && console.log('[rateCard.Collection] - save()');

				_options = _options || {};

				return this.model.prototype.save.call(this, null, _options);
			},

			/**
			TODO: joli sync should not depend on this function on collections
	 		* @method isNew
	 		* Function to know if it is a new collection
	 		* @return {Boolean}
	 		*/
			isNew: function () {
				return false;
			},

			/**
			 * @method asCsv
			 * Returns a String of values to use inside a csv file
			 * @return {String}
			 */
			asCsv: function () {
				var result = '';
				var columns = this.config.columns || {};
				var keys = configsManager.getConfig('exportCSVColumns');
				var values = [];

				if (!keys || (keys && keys.length == 0)) {
					keys = _.keys(columns);
				}

				result = keys.join(',');

				values = this.map(function (_model) {
					var value = _.map(keys, function (_key) {
						return _model.get(_key);
					});

					return value.join(',');
				});

				result += '\n' + values.join('\n');

				return result;
			}
		});

		return Collection;
	}
};
