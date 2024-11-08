const _ = require('lodash');
const Base = require('./base.model');

// const LOG_TAG = '\x1b[34m' + '[models/afs/vendor-code]' + '\x1b[39;49m ';

const table = 'vendor_code';

/**
 * Custom logic for vendorCodes
 * @class Models.vendorCode
 * @singleton
 */
const VendorCode = _.extend({}, Base, {
	table,

	/**
	 * @method constructor
	 * initialices the object
	 */
	constructor(_defaults = {}) {
		Base.constructor.call(this, _defaults, {
			name: '',
			points: 0,
			versionId: '',
			rateCardId: ''
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
			versionId: this.versionId,
			rateCardId: this.rateCardId,
			name: this.name,
			points: this.points,
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
	},
});

/**
 * @method create
 * Creates a new rate card with its required data
 * @return {object}
 */
function create(_params = {}) {
	const vendorCode = _.extend({}, VendorCode);

	return vendorCode.constructor(_params);
}

module.exports = {
	table,
	create
};
