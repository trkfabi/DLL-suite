const _ = require('lodash');
const Base = require('../base.model');

const LOG_TAG = '\x1b[34m' + '[models/afs/rate-factor]' + '\x1b[39;49m ';

const table = 'rate_factor';

/**
 * Custom logic for rateFactor
 * @class Models.rateFactor
 * @singleton
 */
const RateFactor = _.extend({}, Base, {
	table,

	/**
	 * @method constructor
	 * initialices the object
	 */
	constructor(_defaults = {}) {
		// doLog && console.debug(`${LOG_TAG} - constructor`);
		Base.constructor.call(this, _defaults, {
			productId: null,
			rate: '',
			value: 0,
			term: '',
			versionId: '',
			creditRating: '',
			points: 0,
			vendorCode: ''

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
			productId: this.productId,
			rate: this.rate,
			value: this.value,
			term: this.term,
			versionId: this.versionId,
			creditRating: this.creditRating,
			points: this.points,
			vendorCode: this.vendorCode,
		};
	},
	/**
	 * @method forArrow
	 * Returns the properties required to save on ArrowDb
	 * @return {object}
	 */
	forArrow() {
		// doLog && console.debug(`${LOG_TAG} - forArrow`);

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
		// doLog && console.debug(`${LOG_TAG} - forAPI`);

		return this.forAll();
	},

	/**
	 * @method forCache
	 * Returns the properties required to save in arrow
	 * @return {object}
	 */
	forCache() {
		doLog && console.debug(`${LOG_TAG} - forCache`);

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
	// doLog && console.log(LOG_TAG, '- create');

	const rateFactor = _.extend({}, RateFactor);

	return rateFactor.constructor(_params);
}

module.exports = {
	table,
	create
};
