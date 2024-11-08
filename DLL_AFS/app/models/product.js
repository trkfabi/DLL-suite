var doLog = Alloy.Globals.doLog;
var LOG_TAG = '[models/product] ';

exports.definition = {
	config: {
		columns: {
			id: 'TEXT UNIQUE',
			section: 'TEXT',
			name: 'TEXT',
			type: 'TEXT',

			categoryId: 'TEXT',
			seq: 'TEXT',
			ord: 'TEXT',
			versionId: 'TEXT',
			hasItad: 'INTEGER',
			itadValue: 'REAL',
			ratesEnabled: 'TEXT',
			terms: 'TEXT',
			rateFactorMatchId: 'TEXT'
		},
		defaults: {
			id: null,
			section: null,
			name: null,
			type: null,

			categoryId: null,
			seq: null,
			ord: null,
			versionId: null,
			hasItad: null,
			itadValue: null,
			ratesEnabled: null,
			terms: null,
			rateFactorMatchId: null
		},
		adapter: {
			version: 6,
			type: 'joli',
			lastFreshMigration: 1,
			idAttribute: 'id',
			collection_name: 'product'
		}
	},
	/**
	 * @class Models.product
	 * Model definition to store each Promo Code with its Description
	 */
	extendModel: function (Model) {
		_.extend(Model.prototype, {
			isDollarOut: function () {
				var ratesEnabled = this.get('ratesEnabled');

				try {
					ratesEnabled = JSON.parse(ratesEnabled);
				} catch (error) {
					doLog && console.error(LOG_TAG, 'calculatePaymentAmount - error parsing ratesEnabled ', error.message);
					ratesEnabled = [];
				}
				return _.contains(ratesEnabled, '1out');
			}
		});

		return Model;
	},
	/**
	 * @class Collections.product
	 * Model definition to store each Promo Code with its Description
	 */
	extendCollection: function (Collection) {
		_.extend(Collection.prototype, {
			/**
			 * @method comparator
			 * It is for the sorting of the collection
			 * @param {Models.product} _product
			 * @return {Number} comparator value
			 */
			comparator: function (_product) {
				return Number(_product.get('ord')) || 0;
			},
			/**
			 * @method wipe
			 * Wipes all the local registers from this table. Use with caution
			 * @return {Collections.promo} the same Collection for cascade usage
			 */
			wipe: function () {
				doLog && console.log('[product.Collection] - wipe()');
				var _joli = this.config.getJoli();
				var _query = new _joli.query()
					.destroy()
					.from('product');

				var _result = _query.execute('array');

				return this;
			},
			/**
			 * @method save
			 * Save collection
			 * @param {Object} _options Options for saving the Collection
			 * @return {Models.quote}
			 */
			save: function (_options) {
				doLog && console.log('[product.Collection] - save()');

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
				var keys = _.keys(columns);
				var values = [];

				result = keys.join(',');
				values = this.map(function (_model) {
					var value = _.map(keys, function (_key) {
						var keyValue = _model.get(_key);
						keyValue = keyValue && keyValue.toString().replace(/,/g, '|');
						return keyValue;
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
