var configsManager = require('/utils/configsManager');

exports.definition = {
	config: {
		columns: {
			rateCardCode: 'TEXT',
			purchaseOption: 'TEXT',
			paymentFrequency: 'TEXT',
			advancePayment: 'INTEGER',
			advancePaymentType: 'TEXT',
			promoCode: 'TEXT',
			term: 'INTEGER',
			min: 'REAL',
			max: 'REAL',
			paymentLevel: 'INTEGER',
			payments: 'INTEGER',
			rateFactor: 'REAL',
			rateProgramFilter: 'TEXT',
			points: 'INTEGER',
			expirationDate: 'TEXT',
			lastUpdated: 'TEXT',

			interestRate: 'REAL',
			deferral: 'INTEGER',
			versionId: 'TEXT',
			vendorCodePoints: 'INTEGER',
			promoCodeName: 'TEXT'
		},
		defaults: {
			rateCardCode: null,
			purchaseOption: null,
			paymentFrequency: null,
			advancePayment: 0,
			advancePaymentType: null,
			promoCode: null,
			term: 0,
			min: 0,
			max: 0,
			paymentLevel: 0,
			payments: 0,
			rateFactor: 0,
			rateProgramFilter: null,
			points: 0,
			expirationDate: null,
			lastUpdated: null,

			interestRate: 0,
			deferral: 0,
			versionId: null,
			vendorCodePoints: 0,
			promoCodeName: null
		},
		adapter: {
			version: 2,
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
