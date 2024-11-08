exports.definition = {
	config: {
		columns: {
			program: 'TEXT UNIQUE',
			description: 'TEXT',
			displayOrder: 'INTEGER'
		},
		defaults: {
			program: '',
			description: '',
			displayOrder: 0
		},
		adapter: {
			version: 2,
			type: 'joli',
			lastFreshMigration: 1,
			idAttribute: 'promo',
			collection_name: 'promo'
		}
	},
	/**
	 * @class Models.promo
	 * Model definition to store each Promo Code with its Description
	 */
	extendModel: function (Model) {
		_.extend(Model.prototype, {

		});

		return Model;
	},
	/**
	 * @class Collections.promo
	 * Model definition to store each Promo Code with its Description
	 */
	extendCollection: function (Collection) {
		_.extend(Collection.prototype, {
			/**
			 * @method wipe
			 * Wipes all the local registers from this table. Use with caution
			 * @return {Collections.promo} the same Collection for cascade usage
			 */
			wipe: function () {
				doLog && console.log('[promo.Collection] - wipe()');
				var _joli = this.config.getJoli();
				var _query = new _joli.query()
					.destroy()
					.from('promo');

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
				doLog && console.log('[promo.Collection] - save()');

				_options = _options || {};

				return this.model.prototype.save.call(this, null, _options);
			},
			/**
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
