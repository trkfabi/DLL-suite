const _ = require('lodash');
const Base = require('../base.model');

// const LOG_TAG = '\x1b[34m' + '[models/afs/product]' + '\x1b[39;49m ';

const table = 'product';

/**
 * Custom logic for product
 * @class Models.product
 * @singleton
 */
const Product = _.extend({}, Base, {
	table,

	/**
	 * @method constructor
	 * initialices the object
	 */
	constructor(_defaults = {}) {
		Base.constructor.call(this, _defaults, {
			name: '',
			categoryId: '',
			order: 0,
			versionId: '',
			hasItad: false,
			itadValue: 0,
			ratesEnabled: [],
			terms: {},
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
			categoryId: this.categoryId,
			order: this.order,
			versionId: this.versionId,
			hasItad: this.hasItad,
			itadValue: this.itadValue,
			ratesEnabled: this.ratesEnabled,
			terms: this.terms,
			deleted: this.deleted
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
	},
});

/**
 * @method create
 * Creates a new rate card with its required data
 * @return {object}
 */
function create(_params = {}) {
	const product = _.extend({}, Product);

	return product.constructor(_params);
}

module.exports = {
	table,
	create
};
