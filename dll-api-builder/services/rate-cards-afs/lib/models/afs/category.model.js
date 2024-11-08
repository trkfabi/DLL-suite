const _ = require('lodash');
const Base = require('../base.model');

// const LOG_TAG = '\x1b[34m' + '[models/afs/category]' + '\x1b[39;49m ';

const table = 'category';

/**
 * Custom logic for categories
 * @class Models.category
 * @singleton
 */
const Category = _.extend({}, Base, {
	table,

	/**
	 * @method constructor
	 * initialices the object
	 */
	constructor(_defaults = {}) {
		Base.constructor.call(this, _defaults, {
			name: '',
			versionId: '',
			order: 0
		});

		return this;
	},
	/**
	 * @method forAll
	 * Returns an object with the structure of the model. 
	 * @return {object}
	 */
	forAll() {
		return {
			name: this.name,
			versionId: this.versionId,
			order: this.order,
			deleted: this.deleted,
		};
	},
	/**
	 * @method forArrow
	 * Returns the properties required to save on ArrowDb
	 * @return {object}
	 */
	forArrow() {
		const json = Base.forArrow.call(this);

		return _.extend(json, this.forAll(), {

		});
	},

	/**
	 * @method forAPI
	 * Returns the properties required to present in the API
	 * @return {object}
	 */
	forAPI() {
		const json = Base.forAPI.call(this);

		return _.extend(json, this.forAll(), {

		});
	},

	/**
	 * @method forCache
	 * Returns the properties required to save in arrow
	 * @return {object}
	 */
	forCache() {
		const json = Base.forCache.call(this);

		return _.extend(json, {

		});
	}
});

/**
 * @method create
 * Creates a new rate card with its required data
 * @return {object}
 */
function create(_params = {}) {
	const category = _.extend({}, Category);

	return category.constructor(_params);
}

module.exports = {
	table,
	create
};
