const _ = require('lodash');
const uuid = require('uuid/v4');
const LOG_TAG = '\x1b[34m' + '[models/base]' + '\x1b[39;49m ';
const Helpers = require('../reusable/helpers');

/**
 * Custom logic for all models
 * @class Models.base
 * @singleton
 */
const Base = {
	constructor(..._defaults) {
		_.defaults(this, ..._defaults, {
			uid: uuid(),
			deleted: false
		});

		if (this.uid === this.id) {
			this.id = undefined;
		}

		return this;
	},
	/**
	 * @method dependencies
	 * Returns an Array of all external models tied to the model, this is used for saving on ArrowDb
	 * @return {Array[Object]} Array of the dependencies
	 */
	dependencies() {
		return [];
	},

	active(attribute) {
		return this[attribute].filter(item => !item.deleted);
	},

	duplicate() {
		log(LOG_TAG, 'duplicate');

		return _.extend({}, this, {
			id: undefined,
			uid: uuid(),
			_hasUpdates: true
		});
	},
	/**
	 * @method update
	 * Updates the model 
	 * @param {Object} _data Data to update
	 * @return {object}
	 */
	update(_data = {}) {
		log(LOG_TAG, 'update', _data);

		_data._hasUpdates = true;

		Helpers.compact(_data);
		_.extend(this, _data);
	},
	/**
	 * @method remove
	 * Removes the object marking it as deleted, not a physical deletion
	 * @return {object}
	 */
	remove() {
		log(LOG_TAG, 'remove');

		this.update({
			deleted: true
		});

		return this;
	},
	/**
	 * @method forArrow
	 * Returns the properties required to save on ArrowDb
	 * @return {object}
	 */
	forArrow() {
		return {
			id: this.id,
			uid: this.uid,
		};
	},

	/**
	 * @method forAPI
	 * Returns the properties required to present in the API
	 * @return {object}
	 */
	forAPI() {
		return {
			id: this.uid
		};
	},

	/**
	 * @method forCache
	 * Returns the properties required to save in arrow
	 * @return {object}
	 */
	forCache() {
		return {
			id: this.id,
			uid: this.uid,
		};
	}
};

module.exports = Base;
