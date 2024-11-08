var doLog = Alloy.Globals.doLog;
exports.definition = {
	config: {
		columns: {
			'entityId': 'TEXT',
			'entityName': 'TEXT',
			'entityParent': 'TEXT',
			'stRating': 'TEXT',
			'ltRating': 'TEXT',
			'lastUpdate': 'TEXT'
		},
		defaults: {
			'entityId': null,
			'entityName': null,
			'entityParent': null,
			'stRating': null,
			'ltRating': null,
			'lastUpdate': null
		},
		adapter: {
			version: 1,
			type: 'joli',
			lastFreshMigration: 1,
			idAttribute: 'entityId',
			collection_name: 'entityRatings'
		}
	},
	/**
	 * @class Models.entityRatings
	 * Model definition to store all about sales representative
	 */
	extendModel: function (Model) {
		_.extend(Model.prototype, {

		});

		return Model;
	},
	/**
	 * @class Collections.entityRatings
	 * Model definition to store all about sales representative
	 */
	extendCollection: function (Collection) {
		_.extend(Collection.prototype, {
			/**
			 * @method wipe
			 * Wipes all the local registers from this table. Use with caution
			 * @return {Collections.entityRatings} the same Collection for cascade usage
			 */
			wipe: function () {
				doLog && console.log('[entityRatings.Collection] - wipe()');
				var _joli = this.config.getJoli();
				var _query = new _joli.query()
					.destroy()
					.from('entityRatings');

				var _result = _query.execute('array');

				return this;
			},
			/**
			 * @method save
			 * Save collection
			 * @param {Object} _options Options for saving he Collection
			 * @return {Models.entityRating}
			 */
			save: function (_options) {
				doLog && console.log('[entityRatings.Collection] - save()');

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
			}
		});

		return Collection;
	}
};
