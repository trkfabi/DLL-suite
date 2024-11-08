const moment = require('moment');
const requestPromise = require('request-promise-native');
const _ = require('lodash');
const mocks = require('./mocks');
const should = require('should');

/**
 * Helpers for tests in rate cards afs
 * @class helpers.test
 * @singleton
 */

const Test = (function () {
	// +-------------------
	// | Private members.
	// +-------------------
	const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
	const NAME_REGEX = /[\w]{0,20}/;

	// +-------------------
	// | Public members.
	// +-------------------

	const request = async (api, method = 'GET', body = {}) => {
		const response = await requestPromise({
			url: `${HOST}/api/afs_rate_cards/${api}`,
			method,
			body,
			auth: {
				username: API_KEY,
				password: ''
			},
			headers: {
				'x-userid': 'TestUser'
			},

			json: true
		});

		return response;
	};

	/**
	 * @method testRateCard
	 * Tests the schema and properties for a rateCard object
	 * @param {object} rateCard Rate card to test
	 * @param {object} options Options for testing the object
	 * @param {string} options.type='api' Type of object to test: api or model
	 * @param {boolean} options.strict=false true if must check all required values and exact logic in the object. 
	 * false to check only the properties are declared
	 * @return {void}
	 */
	const testRateCard = (rateCard, options = {}) => {
		const {
			type = 'api',
				strict = true,
		} = options;

		let id = null;

		rateCard.should.have.property('app').String();
		rateCard.should.have.property('versionInProgress').String();
		rateCard.should.have.property('versionPublished').String();
		rateCard.should.have.property('order').Number();
		rateCard.should.have.property('published').Boolean();
		rateCard.should.have.property('versions').Array();
		rateCard.should.have.property('deleted').Boolean();

		if (type === 'api') {
			rateCard.should.have.property('id').String();
			id = rateCard.id;
		} else {
			rateCard.should.have.property('uid').String();
			id = rateCard.uid;
		}

		if (!strict) {
			return;
		}

		id.should.match(UUID_REGEX);
		rateCard.name.should.match(NAME_REGEX);
		rateCard.versions.should.not.be.empty();

		if (rateCard.versionPublished) {
			rateCard.published.should.equal(true);
		}

		rateCard.versions.forEach(version => {
			testVersion(version, options);
			version.rateCardId.should.equal(id);
		});
	};

	/**
	 * @method testVersion
	 * Tests the schema and properties for a version object
	 * @param {object} version Version to test
	 * @param {object} options Options for testing the object
	 * @param {string} options.type='api' Type of object to test: api or model
	 * @param {boolean} options.strict=false true if must check all required values and exact logic in the object. 
	 * false to check only the properties are declared
	 * @return {void}
	 */
	const testVersion = (version, options = {}) => {
		const {
			type = 'api',
				strict = true,
		} = options;

		let id = null;

		version.should.have.property('app').String();
		version.should.have.property('rateCardId').String();
		version.should.have.property('terms').Array();
		version.should.have.property('cofs').Array();
		version.should.have.property('canPublish').Boolean();
		version.should.have.property('archived').Boolean();
		version.should.have.property('published').Boolean();
		version.should.have.property('isPublishing').Boolean();
		version.should.have.property('datePublished');
		version.should.have.property('vendorCodes').Array();
		version.should.have.property('ratePrograms').Array();
		version.should.have.property('deleted').Boolean();

		if (type === 'api') {
			version.should.have.property('id').String();
			id = version.id;
		} else {
			version.should.have.property('uid').String();
			id = version.uid;
		}

		if (!strict) {
			return;
		}

		id.should.match(UUID_REGEX);

		version.rateCardId.should.be.String().not.empty().match(UUID_REGEX);
		version.terms.should.be.Array().not.empty();
		version.canPublish.should.be.Boolean();
		version.isPublishing.should.be.Boolean();
		version.archived.should.be.Boolean();
		version.published.should.be.Boolean();
		version.cofs.should.be.Array();
		version.vendorCodes.should.be.Array();
		version.deleted.should.be.Boolean();

		if (version.canPublish) {
			version.published.should.equal(false);
			version.archived.should.equal(false);
			version.datePublished.should.be.empty();
		}

		if (version.published) {
			version.canPublish.should.equal(false);
			version.isPublishing.should.equal(false);
			version.archived.should.equal(false);
			version.datePublished.should.be.String().not.empty();
			moment(version.datePublished).isValid().should.equal(true);
		}

		if (version.archived) {
			version.canPublish.should.equal(false);
			version.published.should.equal(false);
			version.isPublishing.should.equal(false);
			version.datePublished.should.be.String().not.empty();
			moment(version.datePublished).isValid().should.equal(true);
		}

		version.terms.forEach(term => {
			term.should.be.String().not.empty();
			Number(term).should.not.be.NaN();
		});

		//	const terms = version.terms;

		//		version.inputs.forEach(input => {
		//			Object.keys(input.terms).should.deepEqual(terms);
		//		});

		/*
				if (version.vendorCodes.length > 0) {
					version.vendorCodes.forEach(vendorCode => {
						testVendorCode(vendorCode, options);
						vendorCode.versionId.should.equal(id);
						vendorCode.rateCardId.should.equal(version.rateCardId);
					});

					if (type === 'api') {
						version.vendorCodeNames.should.have.length(version.vendorCodes.length);
						_.map(version.vendorCodes, 'name').should.deepEqual(version.vendorCodeNames);
					}
				}
		*/
	};

	/**
	 * @method testVendorCode
	 * Tests the schema and properties for a Vendor Code object
	 * @param {object} vendorCode VendorCode to test
	 * @param {object} options Options for testing the object
	 * @param {string} options.type='api' Type of object to test: api or model
	 * @param {boolean} options.strict=false true if must check all required values and exact logic in the object. 
	 * false to check only the properties are declared
	 * @return {void}
	 */
	const testVendorCode = (vendorCode, options = {}) => {
		const {
			type = 'api',
				strict = true,
		} = options;

		let id = null;

		vendorCode.should.have.property('name').String();
		vendorCode.should.have.property('rateCardId').String();
		vendorCode.should.have.property('versionId').String();
		vendorCode.should.have.property('points').Number();
		vendorCode.should.have.property('deleted').Boolean();

		if (type === 'api') {
			vendorCode.should.have.property('id').String();
			id = vendorCode.id;
		} else {
			vendorCode.should.have.property('uid').String();
			id = vendorCode.uid;
		}

		if (!strict) {
			return;
		}

		if (type === 'api') {
			vendorCode.rateCardId.should.be.not.empty().match(UUID_REGEX);
		}

		id.should.match(UUID_REGEX);
		vendorCode.name.should.be.not.empty().match(NAME_REGEX);
		vendorCode.versionId.should.be.not.empty().match(UUID_REGEX);
		vendorCode.points.should.be.aboveOrEqual(0);
	};

	/**
	 * @method testRateProgram
	 * Tests the schema and properties for a rateProgram object
	 * @param {object} rateProgram RateProgram to test
	 * @param {object} options Options for testing the object
	 * @param {string} options.type='api' Type of object to test: api or model
	 * @param {boolean} options.strict=false true if must check all required values and exact logic in the object. 
	 * false to check only the properties are declared
	 * @return {void}
	 */
	const testRateProgram = (rateProgram, options = {}) => {
		const {
			type = 'api',
				strict = true,
		} = options;

		let id = null;

		rateProgram.should.have.property('versionId').String();
		rateProgram.should.have.property('promoCode').String();
		rateProgram.should.have.property('name').String();
		rateProgram.should.have.property('promo').Boolean();
		rateProgram.should.have.property('order').Number();
		rateProgram.should.have.property('points').Number();
		rateProgram.should.have.property('residuals').Array();
		rateProgram.should.have.property('spreads').Array();
		rateProgram.should.have.property('allInRates').Array();
		rateProgram.should.have.property('terms').Array();
		rateProgram.should.have.property('defaults').Object();
		rateProgram.defaults.should.have.property('term').String();
		rateProgram.should.have.property('amountRanges').Array();
		rateProgram.should.have.property('purchaseOptions').Array();
		rateProgram.should.have.property('advancePayments').Number();
		rateProgram.should.have.property('advanceSecurityPayments').Number();
		rateProgram.should.have.property('paymentFrequencies').Array();
		rateProgram.should.have.property('deferrals').Number();
		rateProgram.should.have.property('deleted').Boolean();

		if (type === 'api') {
			rateProgram.should.have.property('id').String();
			id = rateProgram.id;
		} else {
			rateProgram.should.have.property('uid').String();
			id = rateProgram.uid;
		}

		if (!strict) {
			return;
		}

		id.should.match(UUID_REGEX);
		rateProgram.name.should.be.not.empty().match(NAME_REGEX);
		rateProgram.versionId.should.be.not.empty().match(UUID_REGEX);
		rateProgram.promoCode.should.be.not.empty().match(UUID_REGEX);
		rateProgram.promo.should.be.Boolean();
		rateProgram.order.should.be.aboveOrEqual(0);
		rateProgram.points.should.be.aboveOrEqual(0);
		rateProgram.residuals.should.be.Array();
		rateProgram.spreads.should.be.Array();
		rateProgram.allInRates.should.be.Array();
		rateProgram.terms.should.be.Array();
		rateProgram.defaults.should.be.Object();
		rateProgram.defaults.term.should.be.String();
		rateProgram.amountRanges.should.be.Array();
		rateProgram.purchaseOptions.should.be.Array();
		rateProgram.advancePayments.should.be.aboveOrEqual(0);
		rateProgram.advanceSecurityPayments.should.be.aboveOrEqual(0);
		rateProgram.paymentFrequencies.should.be.Array();
		rateProgram.deferrals.should.be.aboveOrEqual(0);
		rateProgram.deleted.should.be.Boolean();

		rateProgram.terms.forEach(term => {
			term.should.be.String().not.empty();
			Number(term).should.not.be.NaN();
		});

	};
	/**
	 * @method testRateFactor
	 * Tests the schema and properties for a RateFactor object
	 * @param {object} rateFactor Rate Factor to test
	 * @param {object} options Options for testing the object
	 * @param {string} options.type='api' Type of object to test: api, admin or model
	 * @param {boolean} options.strict=false true if must check all required values and exact logic in the object. 
	 * false to check only the properties are declared
	 * @return {void}
	 */
	const testRateFactor = (rateFactor, options = {}) => {
		const {
			type = 'api',
				strict = true,
		} = options;

		rateFactor.should.have.property('versionId').String().not.empty();
		rateFactor.should.have.property('rateProgramId').String().not.empty();

		switch (type) {
		case 'api':
		case 'model':
			rateFactor.should.have.property('interestRate').Number();
			rateFactor.should.have.property('value').Number();
			rateFactor.should.have.property('term').Number();
			rateFactor.should.have.property('payments').Number();
			rateFactor.should.have.property('points').Number();
			rateFactor.should.have.property('vendorCode').String();
			rateFactor.should.have.property('purchaseOption').String();
			rateFactor.should.have.property('paymentFrequency').String();
			rateFactor.should.have.property('advancePayments').Number();
			rateFactor.should.have.property('advancePaymentsType').String();
			rateFactor.should.have.property('deferral').Number();
			rateFactor.should.have.property('amountRangeMin').Number();
			rateFactor.should.have.property('amountRangeMax').Number();
			break;
		case 'admin':
			rateFactor.should.have.property('terms').Object();
			rateFactor.should.have.property('order').String().not.empty();
			break;
		}

		if (!strict) {
			return;
		}

		switch (type) {
		case 'api':
		case 'model':
			rateFactor.value.should.be.aboveOrEqual(0);
			Number(rateFactor.term).should.be.aboveOrEqual(0).not.NaN();

			if (rateFactor.vendorCode) {
				rateFactor.points.should.be.aboveOrEqual(0);
			}
			break;

		case 'admin':
			if (rateFactor.rate === 'fmv') {
				//				rateFactor.productId.should.match(UUID_REGEX);
				//				rateFactor.product.should.not.be.empty();
				//				rateFactor.category.should.not.be.empty();
			}

			if (rateFactor.rate === 'out') {
				//				should(rateFactor.productId).be.empty();
			}
			rateFactor.terms.should.not.be.empty();
			rateFactor.order.should.not.be.empty();
			break;
		}

	};

	/**
	 * @method testSchema
	 * tests a schema for a given model
	 * @return {void}
	 */
	const testSchema = (name, object, options = {}) => {
		switch (name) {
		case 'rateCard':
			testRateCard(object, options);
			break;

		case 'version':
			testVersion(object, options);
			break;

		case 'vendorCode':
			testVendorCode(object, options);
			break;

		case 'rateProgram':
			testRateProgram(object, options);
			break;

		case 'rateFactor':
			testRateFactor(object, options);
			break;

		case 'rateFactors':
			if (options.type === 'admin') {
				object.should.have.property('out').Array();
				object.should.have.property('fmv').Array();
				object.out.forEach(rateFactor => testRateFactor(rateFactor, options));
				object.fmv.forEach(rateFactor => testRateFactor(rateFactor, options));
			} else {
				object.should.be.Array().not.empty();
				object.forEach(rateFactor => testRateFactor(rateFactor, options));
			}
			break;

		default:
			throw Error(`Model not supported: ${name}`);
		}
	};

	/**
	 * @method create
	 * Creates any of the models
	 * @return {Promise}
	 */
	const create = async (name, using = {}) => {
		const apis = {
			'rateCard': 'rate_card/create',
			'version': 'version/create',
			'vendorCode': 'vendor_code/create',
		};
		const api = apis[name];
		const model = mocks[name]();
		const body = _.extend({}, model, using);

		const response = await request(api, 'POST', body)
		const result = response.result;
		testSchema(name, result);

		return result;
	};

	/**
	 * @method update
	 * updates any of the models
	 * @return {Promise}
	 */
	const update = async (name, using = {}) => {
		const apis = {
			'rateCard': 'rate_card/update',
			'version': 'version/update',
			'vendorCode': 'vendor_code/update',
		};
		const api = apis[name];
		const model = mocks[name]();
		const body = _.extend({}, model, using);

		const response = await request(api, 'POST', body)
		const result = response.result;
		testSchema(name, result);
		result.should.containDeep(body);

		return result;
	};

	/**
	 * @method remove
	 * calls remove/<model>
	 * @param {string} name model name to delete
	 * @param {string} id id of the model to remove
	 * @return {Promise}
	 */
	const remove = async (name, id) => {
		const apis = {
			'rateCard': 'rate_card/delete',
			'version': 'version/delete',
			'vendorCode': 'vendor_code/delete',
		};
		const api = apis[name];

		const response = await request(api, 'POST', {
			id
		});

		const {
			result
		} = response;

		testSchema(name, result, {
			type: 'api',
			strict: false
		});
		result.should.have.property('deleted').equal(true);

		return result;
	};

	return {
		create,
		request,
		testSchema,
		update,
		remove,
	};
})();

module.exports = Test;
