var doLog = Alloy.Globals.doLog;
exports.definition = {
	config: {
		columns: {
			id: 'TEXT UNIQUE',
			name: 'TEXT'
		},
		defaults: {
			id: null,
			name: null
		},
		adapter: {
			version: 1,
			type: 'joli',
			lastFreshMigration: 1,
			idAttribute: 'id',
			collection_name: 'creditRating'
		}
	},
	/**
	 * @class Models.creditRating
	 * Model definition to store each Promo Code with its Description
	 */
	extendModel: function (Model) {
		_.extend(Model.prototype, {

		});

		return Model;
	},
	/**
	 * @class Collections.creditRating
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
				doLog && console.log('[creditRating.Collection] - wipe()');
				var _joli = this.config.getJoli();
				var _query = new _joli.query()
					.destroy()
					.from('creditRating');

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
				doLog && console.log('[creditRating.Collection] - save()');

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
			}
		});

		return Collection;
	}
};
