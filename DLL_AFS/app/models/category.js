var doLog = Alloy.Globals.doLog;
exports.definition = {
	config: {
		columns: {
			id: 'TEXT UNIQUE',
			seq: 'TEXT',
			name: 'TEXT',
			versionId: 'TEXT',
			ord: 'TEXT'
		},
		defaults: {
			id: null,
			seq: null,
			name: null,
			versionId: null,
			ord: null
		},
		adapter: {
			version: 1,
			type: 'joli',
			lastFreshMigration: 1,
			idAttribute: 'id',
			collection_name: 'category'
		}
	},
	/**
	 * @class Models.category
	 * Model definition
	 */
	extendModel: function (Model) {
		_.extend(Model.prototype, {

		});

		return Model;
	},
	/**
	 * @class Collections.category
	 * Model definition
	 */
	extendCollection: function (Collection) {
		_.extend(Collection.prototype, {
			/**
			 * @method comparator
			 * It is for the sorting of the collection
			 * @param {Models.category} _category
			 * @return {Number} comparator value
			 */
			comparator: function (_category) {
				return Number(_category.get('ord')) || 0;
			},
			/**
			 * @method wipe
			 * Wipes all the local registers from this table. Use with caution
			 * @return {Collections.promo} the same Collection for cascade usage
			 */
			wipe: function () {
				doLog && console.log('[category.Collection] - wipe()');
				var _joli = this.config.getJoli();
				var _query = new _joli.query()
					.destroy()
					.from('category');

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
				doLog && console.log('[category.Collection] - save()');

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
