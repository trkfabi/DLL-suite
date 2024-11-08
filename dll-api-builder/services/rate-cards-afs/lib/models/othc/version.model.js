const _ = require('lodash');
const VersionBase = require('../version-base.model');
const RateProgram = require('./rate-program.model');
const VendorCode = require('../vendor-code.model');
const Helpers = require('../../helpers');
const DataError = require('../../reusable/errors/dataError');
const RequestError = require('../../reusable/errors/requestError');
const Constants = require('../../../constants/constants');
const Calculator = require('../../rateCardCalculator');
const RateFactor = require('./rate-factor.model');
const uuid = require('uuid/v4');

const {
	compact
} = require('../../reusable/helpers');

const LOG_TAG = '\x1b[34m' + '[models/othc/version]' + '\x1b[39;49m ';

const table = 'version';

const ARROW_FIELDS = {
	VENDOR_CODES: '[CUSTOM_vendorcode]vendor_code_ids',
	RATE_PROGRAMS: '[CUSTOM_rate_program]rate_program_ids'
};
/**
 * Custom logic for versions
 * @class Models.version
 * @singleton
 */
const Version = _.extend({}, VersionBase, {
	table,

	/**
	 * @method constructor
	 * initialices the object
	 */
	constructor(_defaults = {}) {
		_.extend(this, {
			app: Constants.apps.APP_OTHC,
			terms: ['12']
		});

		VersionBase.constructor.call(this, _defaults, {
			cofs: [{
				term: '12',
				value: 0,
			}],
			ratePrograms: [],
			rateFactors: [],
			vendorCodes: [],
		});

		_.each(ARROW_FIELDS, fieldName => {
			if (!this[fieldName]) {
				return;
			}

			switch (fieldName) {
			case ARROW_FIELDS.RATE_PROGRAMS:
				this.ratePrograms = this[fieldName];
				break;
			case ARROW_FIELDS.VENDOR_CODES:
				this.vendorCodes = this[fieldName];
				break;
			}
		});

		const nested = [{
			field: 'ratePrograms',
			model: RateProgram
		}, {
			field: 'vendorCodes',
			model: VendorCode
		}];

		_.each(nested, ({
			field,
			model
		}) => {
			if (this[field].length === 0) {
				return;
			}

			this[field] = _.chain(this[field])
				.filter(item => {
					return _.isObject(item) && !item.deleted;
				})
				.compact()
				.map(item => {
					return model.create(item);
				})
				.value();
		});

		this.update({
			terms: _defaults.terms
		});

		this._hasUpdates = false;

		return this;
	},
	/**
	 * @method init
	 * initialices the object
	 */
	init() {
		log(LOG_TAG, 'init');
		VersionBase.init.call(this);

		this.ratePrograms.forEach(rateProgram => {
			rateProgram.versionId = this.uid;
			rateProgram.rateCardId = this.rateCardId;
		});

		this.vendorCodes.forEach(vendorCode => {
			vendorCode.versionId = this.uid;
			vendorCode.rateCardId = this.rateCardId;
		});

		return this;
	},
	/**
	 * @method duplicate
	 * Duplicates the version creating copies of its dependencies to use on the new version
	 * @return {object} the new version
	 */
	duplicate() {
		log(LOG_TAG, 'duplicate');

		let newVersion = create(_.extend({}, this, {
			uid: undefined,
			id: undefined,
			published: false,
			archived: false,
			canPublish: true,
			datePublished: '',
			ratePrograms: [],
			vendorCodes: [],
			rateFactors: []
		}));

		const ratePrograms = this.ratePrograms.map(rateProgram => {
			let newRateProgram = rateProgram.duplicate();
			newRateProgram.versionId = newVersion.uid;

			return newRateProgram;
		});
		const vendorCodes = this.vendorCodes.map(vendorCode => {
			let newVendorCode = vendorCode.duplicate();
			newVendorCode.versionId = newVersion.uid;

			return newVendorCode;
		});

		_.extend(newVersion, {
			ratePrograms,
			vendorCodes,
			_hasUpdates: true
		});

		return newVersion;
	},
	/**
	 * @method dependencies
	 * Returns an Array of all external models tied to the version, this is used for saving on ArrowDb
	 * @return {Array[Object]} Array of the dependencies
	 */
	dependencies() {
		return [
			...this.ratePrograms.filter(rateProgram => rateProgram._hasUpdates),
			...this.vendorCodes.filter(vendorCode => vendorCode._hasUpdates)
		];
	},
	/**
	 * @method forAll
	 * Returns an object with the structure of the model. 
	 * @return {object}
	 */
	forAll() {
		const json = VersionBase.forAll.call(this);
		return _.extend(json, {
			cofs: this.cofs,
			vendorCodeNames: this.vendorCodeNames
		});
	},
	/**
	 * @method forArrow
	 * Returns the properties required to save on ArrowDb
	 * @return {object}
	 */
	forArrow() {
		const json = VersionBase.forArrow.call(this);

		return _.extend(json, this.forAll(), {
			[ARROW_FIELDS.VENDOR_CODES]: _.compact(this.active('vendorCodes').map(vendorCode => vendorCode.id)),
			[ARROW_FIELDS.RATE_PROGRAMS]: _.compact(this.active('ratePrograms').map(rateProgram => rateProgram.id))
		});
	},

	/**
	 * @method forAPI
	 * Returns the properties required to present in the API
	 * @return {object}
	 */
	forAPI() {
		const json = VersionBase.forAPI.call(this);
		return _.extend(json, this.forAll(), {
			vendorCodes: this.active('vendorCodes').map(vendorCode => vendorCode.forAPI()),
			ratePrograms: _.chain(this.active('ratePrograms')).sortBy('order').map(rateProgram => rateProgram.forAPI())
				.value(),
			rateFactors: this.rateFactors.map(rateFactor => rateFactor.forAPI())
		});
	},
	/**
	 * @method remove
	 * Removes the object and all dependencies marking them as deleted, not a physical deletion
	 * @return {object}
	 */
	remove() {
		log(LOG_TAG, 'remove');

		this.ratePrograms.forEach(rateProgram => rateProgram.remove());
		this.vendorCodes.forEach(vendorCode => vendorCode.remove());

		const json = VersionBase.remove.call(this);

		return _.extend(json, this);
	},

	vendorCodePoints() {
		return this.active('vendorCodes').map(vendorCode => vendorCode.points);
	},

	/**
	 * @method createRateProgram
	 * Creates a rate program
	 * @param {Object} _newData Data of the rate program to create
	 * @return {Object} The newly created rate program
	 */
	createRateProgram(_newData = {}) {
		log(LOG_TAG, 'createRateProgram', _newData);

		let {
			name,
			order = -1,
			terms: newTerms = []
		} = _newData;

		if (name) {
			try {
				Helpers.validateName({
					collection: this.ratePrograms,
					name,
					maxAllowedCharacters: 100
				});
			} catch (_error) {
				throw DataError({
					code: 'duplicated-rateprogram',
					value: name
				});
			}
		} else {
			throw DataError({
				code: 'missing-required-parameter',
				variable: 'name'
			});
		}

		checkRateProgramTerms(newTerms, this.terms);

		const rateProgram = RateProgram.create(compact(_newData));

		if (_.isNull(order) || order === -1) {
			order = this.getNextOrder(this.ratePrograms);
		}
		_.extend(_newData, {
			versionId: this.uid,
			order
		});
		rateProgram.update(_newData);

		rateProgram.updateAllInRates(this.cofs);

		this.ratePrograms.push(rateProgram);

		this.update({
			canPublish: true
		});

		return rateProgram;
	},
	/**
	 * @method updateRateProgram
	 * Updates a rate program
	 * @param {Object} _newData Data to update
	 * @return {Object} The updated rate program
	 */
	updateRateProgram(_newData = {}) {
		log(LOG_TAG, 'updateRateProgram', _newData);

		const newData = JSON.parse(JSON.stringify(compact(_newData)));
		const {
			uid,
			name = '',
			spreads: newSpreads = [],
			amountRanges: newAmountRanges = []
		} = newData;

		let {
			terms: newTerms = []
		} = newData;

		if (!uid) {
			throw Error(`${LOG_TAG} - updateRateProgram - Missing uid`);
		}

		checkRateProgramTerms(newTerms, this.terms);

		const rateProgram = this.getRateProgram(uid);

		if (name.length > 0 && rateProgram && (name !== rateProgram.name)) {
			try {
				Helpers.validateName({
					collection: this.ratePrograms,
					name,
					uid,
					maxAllowedCharacters: 100
				});
			} catch (_error) {
				throw DataError({
					code: 'duplicated-rateprogram',
					value: name
				});
			}
		}

		rateProgram.update(newData);
		if (newTerms.length > 0 || newSpreads.length > 0 || newAmountRanges.length > 0) {
			rateProgram.updateAllInRates(this.cofs);
		}

		this.update({
			canPublish: true
		});

		return rateProgram;
	},
	/**
	 * @method removeRateProgram
	 * Removes a rate program
	 * @param {String} _rateProgramId Id of the rate program to remove
	 * @return {Object} The removed rate program
	 */
	removeRateProgram(_rateProgramId) {
		log(LOG_TAG, 'removeRateProgram', _rateProgramId);

		const rateProgram = this.getRateProgram(_rateProgramId);
		rateProgram.remove();

		this.update({
			canPublish: true
		});

		return rateProgram;
	},
	/**
	 * @method getRateProgram
	 * Returns a rate program
	 * @param {String} _rateProgramId Id of the rate program to return
	 * @return {Object} The rate program
	 */
	getRateProgram(_rateProgramId) {
		log(LOG_TAG, 'getRateProgram', _rateProgramId);

		return this.findByUID(this.ratePrograms, _rateProgramId);
	},
	/**
	 * @method duplicateRateProgram
	 * Duplicates a rate program
	 * @param {String} _rateProgramId Id of the rate program to duplicate
	 * @return {Object} The duplicated rate program
	 */
	duplicateRateProgram(_rateProgramId) {
		log(LOG_TAG, 'duplicateRateProgram', _rateProgramId);

		const rateProgram = this.getRateProgram(_rateProgramId);
		const newName = `Copy of ${rateProgram.name}`;
		try {
			Helpers.validateName({
				collection: this.ratePrograms,
				name: newName,
				maxAllowedCharacters: 100
			});
		} catch (_error) {
			throw DataError({
				code: 'duplicated-rateprogram',
				value: newName
			});
		}

		const order = this.getNextOrder(this.ratePrograms);
		const duplicatedRateprogram = rateProgram.duplicate(order);

		duplicatedRateprogram.name = newName;
		duplicatedRateprogram.promoCode = uuid();
		this.ratePrograms.push(duplicatedRateprogram);

		this.update({
			canPublish: true
		});

		return duplicatedRateprogram;
	},
	/**
	 * @method update
	 * Updates the model 
	 * @param {Object} _newData Data to update
	 * @return {object}
	 */
	update(_newData) {
		const newData = JSON.parse(JSON.stringify(compact(_newData)));

		let {
			terms: newTerms = [],
			cofs: newCofs = []
		} = newData;

		if (!_.isArray(newTerms)) {
			throw RequestError('terms should be an array.')
		}

		if (!_.isArray(newCofs)) {
			throw RequestError('cofs should be an array.')
		}

		newTerms = Helpers.sanitizeTerms(newTerms);

		delete newData.cofs;
		delete newData.terms;
		delete newData.app;

		if (newTerms.length > 0) {
			this.terms = newTerms;
			this.cofs = Helpers.updateTermsOnArray(newTerms, this.cofs);
		}

		_.extend(this, newData);

		if (newCofs.length > 0) {
			this.updateCofs(newCofs);
		}

		if (newTerms.length > 0 || newCofs.length > 0) {
			_.each(this.ratePrograms, rateProgram => {
				rateProgram.removeInvalidTerms(this.terms);
				rateProgram.updateAllInRates(this.cofs);
			});
		}

		this._hasUpdates = true;

		return this;
	},
	/**
	 * @method updateCofs
	 * Updates the cofs of the version
	 * @param {Array[Object]} _newCofs Cofs data to update
	 * @return {void}
	 */
	updateCofs(_newCofs = []) {
		_.each(_newCofs, newCof => {
			const cof = _.find(this.cofs, {
				term: newCof.term
			});

			if (cof) {
				_.extend(cof, compact(newCof));
			}
		});
	},

	/**
	 * @method
	 * Filters out this version's ratePrograms based on the list of given ids
	 * @param {string[]} [rateProgramsFiltered=[]] array of ids to filter ratePrograms
	 * @return {Models.rateProgram[]} Array of filtered rate programs
	 */
	filterRatePrograms(rateProgramsFiltered) {

		let ratePrograms = this.ratePrograms;
		if (rateProgramsFiltered) {
			ratePrograms = _.filter(ratePrograms, rateProgram => {
				return rateProgramsFiltered.includes(rateProgram.uid);
			});
		}

		return ratePrograms;
	},
	/**
	 * @method calculateRateFactors
	 * Calculates the ratefactors of the version
	 * @param {String} _vendorCodeId Id of the vendor code to return
	 * @return {Object} The vendor code
	 */
	calculateRateFactors(_options = {}) {
		log(LOG_TAG, 'calculateRateFactors', _options);

		const {
			filters = {}
		} = _options;

		const ratePrograms = this.filterRatePrograms(filters.ratePrograms);
		const vendorCodesFiltered = filters.vendorCodes;
		let vendorCodes = this.active('vendorCodes');

		let rateFactors = _.chain(ratePrograms)
			.map(rateProgram => rateProgram.calculateRateFactors(_options))
			.flatten()
			.value();

		if (vendorCodes.length > 0) {
			if (vendorCodesFiltered) {
				vendorCodes = vendorCodes.filter(vendorCode => vendorCodesFiltered.includes(vendorCode.uid));
			}

			rateFactors = _.chain(rateFactors)
				.map(rateFactor => this.getVendorCodeRateFactors(rateFactor, vendorCodes))
				.flatten()
				.value()
		}
		this.rateFactors = rateFactors;

		return rateFactors;
	},

	getVendorCodeRateFactors(rateFactor, vendorCodes) {
		log(LOG_TAG, 'getVendorCodeRateFactors', {
			rateFactor,
			vendorCodes
		});

		const vendorCodeRateFactors = _.map(vendorCodes, vendorCode => {
			return RateFactor.create(_.extend({}, rateFactor, {
				vendorCode: vendorCode.name,
				vendorCodePoints: vendorCode.points,
				vendorCodeId: vendorCode.uid,
				value: Calculator.calculatePaymentWithPoints({
					payment: rateFactor.value,
					points: vendorCode.points,
				})
			}));
		});

		return [rateFactor, ...vendorCodeRateFactors];
	},

	/**
	 * @method rateFactorsAdmin
	 * Returns the ratefactors 
	 * @param {String} show Option to return Rate or interestRate
	 * @param {String} vendorCodeId Vendor code id to filter rate factors
	 * @return {Array[Object]} The ratefactors
	 */
	rateFactorsAdmin(show, vendorCodeId) {
		const rateFactorsCache = {};
		const ratePrograms = {};
		let terms = new Set();
		let rateFactors = this.rateFactors;
		if (vendorCodeId) {
			rateFactors = rateFactors.filter(rateFactor => {
				return rateFactor.vendorCodeId === vendorCodeId
			})
		} else {
			rateFactors = rateFactors.filter(rateFactor => {
				return rateFactor.vendorCode === '' && rateFactor.vendorCodePoints === 0
			})
		}
		rateFactors.forEach(rateFactor => {
			rateFactor = rateFactor.forAPI();
			const termForAdmin = '' + rateFactor.payments;
			if (!this.terms.includes(termForAdmin) || (this.terms.includes(termForAdmin) && rateFactor.deferral / 30 === parseInt(termForAdmin) &&
					rateFactor.paymentLevel === 1)) {
				return;
			}
			const customId = [
				rateFactor.rateProgram,
				(rateFactor.amountRangeMin * 100).toString().padStart(9, '0'),
				rateFactor.purchaseOption,
				rateFactor.points
			].join('-');

			let cachedRateFactor = rateFactorsCache[customId];
			terms.add(parseInt(termForAdmin));
			if (!cachedRateFactor) {
				let rateProgram = ratePrograms[rateFactor.rateProgramId] || _.find(this.ratePrograms, {
					uid: rateFactor.rateProgramId
				});

				cachedRateFactor = _.extend({}, rateFactor, {
					terms: {},
					rateProgramOrder: rateProgram.order
				});

				rateFactorsCache[customId] = cachedRateFactor;
			}
			cachedRateFactor.order = [
				cachedRateFactor.rateProgramOrder.toString().padStart(3, '0'),
				(rateFactor.amountRangeMin * 100).toString().padStart(9, '0'),
				rateFactor.purchaseOption,
				rateFactor.points.toString().padStart(2, '0')
			].join('-');
			cachedRateFactor.terms[termForAdmin] = (show === 'rates') ? rateFactor.value : rateFactor.interestRate;
			delete cachedRateFactor.term;
			delete cachedRateFactor.payments;
			delete cachedRateFactor.value;
			delete cachedRateFactor.interestRate;
		});
		return {
			terms: Helpers.sanitizeTerms([...terms]),
			rateFactors: _.chain(rateFactorsCache)
				.toArray()
				.sortBy('order')
				.value()
		}
	},

	/**
	 * @method
	 * Returns a list of available options to filter for based on this version's rate programs
	 * and the current filters applied
	 * @param {object} [_currentFilters={}] dictionary with the current filters selected by the user
	 * @return {object} dictionary of available options to filter
	 */
	availableFilterOptions(_currentFilters = {}) {
		const concat = (actual, newArray) => {
			return _.uniq([...actual, ...newArray]);
		};

		const sortPOs = (a, b) => {
			const order = ['F', 'P', 'D'];
			return order.indexOf(a) - order.indexOf(b);
		};

		const sortPFs = (a, b) => {
			const order = ['M', 'Q', 'SA', 'A'];
			return order.indexOf(a) - order.indexOf(b);
		};
		const ratePrograms = this.filterRatePrograms(_currentFilters.ratePrograms);

		return _.chain(ratePrograms)
			.map(rateProgram => rateProgram.availableFilterOptions(_currentFilters))
			.compact()
			.reduce((memo, rateProgram) => {

				let {
					ratePrograms = [],
						paymentFrequencies = [],
						purchaseOptions = [],
						advancePayments = [],
						points = [],
				} = memo;

				ratePrograms = concat(ratePrograms, [{
					id: rateProgram.id,
					name: rateProgram.name
				}]);
				paymentFrequencies = concat(paymentFrequencies, rateProgram.paymentFrequencies)
					.sort(sortPFs);

				purchaseOptions = concat(purchaseOptions, rateProgram.purchaseOptions)
					.sort(sortPOs);

				advancePayments = concat(advancePayments, rateProgram.advancePayments)
					.sort();

				points = concat(points, rateProgram.points)
					.sort();

				return {
					ratePrograms,
					paymentFrequencies,
					purchaseOptions,
					advancePayments,
					points,
				};
			}, {})
			.value();
	}

});
/**
 * @method checkRateProgramTerms
 * @private
 * Checks that the rate program terms are in the version
 * @param {Array} _terms Rate program terms
 * @param {Array} _versionTerms Version terms
 * @return {Array} Sanitized terms
 */
function checkRateProgramTerms(_terms, _versionTerms) {
	_terms = Helpers.sanitizeTerms(_terms);

	if (_terms.length > 0) {
		if (_.difference(_terms, _versionTerms).length > 0) {
			throw RequestError('All terms should be in the version')
		}
	}
}
/**
 * @method create
 * Creates a new rate card with its required data
 * @return {object}
 */
function create(_params = {}) {
	const version = _.extend({}, Version);

	return version.constructor(_params);
}

module.exports = {
	table,
	create
};
