const _ = require('lodash');
const Base = require('../base.model');
const Helpers = require('../../helpers');
const Calculator = require('../../rateCardCalculator');
const RequestError = require('../../reusable/errors/requestError');
const RateFactor = require('./rate-factor.model');
const uuid = require('uuid/v4');
const {
	compact
} = require('../../reusable/helpers');

const LOG_TAG = '\x1b[34m' + '[models/othc/rate-program]' + '\x1b[39;49m ';

const PURCHASE_OPTIONS = {
	FPO: 'P',
	FMV: 'F',
	$1: 'D'
};
const ADVANCE_PAYMENT_TYPES = {
	ADVANCE: 'A',
	SECURITY: 'S'
};

const PAYMENTS_PER_YEAR = {
	'M': 12,
	'Q': 4,
	'SA': 2,
	'A': 1,
};

const VALID_DEFERRALS = [0, 30, 60, 90, 120, 180, 360];
const MAX_ADVANCE_PAYMENTS = 4;
const MAX_ADVANCE_SECURITY_PAYMENTS = 4;

const table = 'rate_program';

/**
 * Custom logic for versions
 * @class Models.version
 * @singleton
 */
const RateProgram = _.extend({}, Base, {
	table,

	/**
	 * @method constructor
	 * initialices the object
	 */
	constructor(_defaults = {}) {
		_.extend(this, {});

		Base.constructor.call(this, _defaults, {
			rateCardId: '',
			versionId: '',
			promoCode: uuid(),
			name: '',
			promo: false,
			order: 0,
			residuals: [],
			points: 0,
			spreads: [],
			allInRates: [],
			terms: [],
			defaults: {
				term: ''
			},
			amountRanges: [],
			purchaseOptions: [],
			advancePayments: 0,
			advanceSecurityPayments: 0,
			paymentFrequencies: [],
			deferrals: 0
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

		return this;
	},

	duplicate(_newOrder) {
		log(LOG_TAG, 'duplicate');

		let newRateProgram = create(_.extend({}, this, {
			uid: undefined,
			id: undefined,
			order: _newOrder
		}));
		newRateProgram._hasUpdates = true;

		return newRateProgram;
	},
	/**
	 * @method forAll
	 * Returns an object with the structure of the model. 
	 * @return {object}
	 */
	forAll() {
		return {
			versionId: this.versionId,
			promoCode: this.promoCode,
			name: this.name,
			promo: this.promo,
			order: this.order,
			residuals: this.residuals,
			points: this.points,
			spreads: this.spreads,
			allInRates: this.allInRates,
			terms: this.terms,
			defaults: this.defaults,
			amountRanges: this.amountRanges,
			deleted: this.deleted,
			purchaseOptions: this.purchaseOptions,
			advancePayments: this.advancePayments,
			advanceSecurityPayments: this.advanceSecurityPayments,
			paymentFrequencies: this.paymentFrequencies,
			deferrals: this.deferrals
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
	 * @method update
	 * Updates the model 
	 * @param {Object} _newData Data to update
	 * @return {object}
	 */
	update(_newData) {
		const newData = JSON.parse(JSON.stringify(compact(_newData)));

		let {
			terms: newTerms = [],
			residuals: newResiduals = [],
			spreads: newSpreads = [],
			amountRanges: newAmountRanges = [],
			purchaseOptions: newPurchaseOptions = [],
			advancePayments = 0,
			advanceSecurityPayments = 0,
			deferrals = 0
		} = newData;

		if (!_.isArray(newTerms)) {
			throw RequestError('terms should be an array.')
		}

		if (!_.isArray(newResiduals)) {
			throw RequestError('residuals should be an array.')
		}

		if (!_.isArray(newSpreads)) {
			throw RequestError('spreads should be an array.')
		}

		if (!_.isArray(newAmountRanges)) {
			throw RequestError('amountRanges should be an array.')
		}

		if (!_.isArray(newPurchaseOptions)) {
			throw RequestError('purchaseOptions should be an array.')
		}
		if (!_.isInteger(advancePayments) || advancePayments > MAX_ADVANCE_PAYMENTS) {
			throw RequestError(`advancePayments must be an integer between 0 and ${MAX_ADVANCE_PAYMENTS}.`)
		}
		if (!_.isInteger(advanceSecurityPayments) || advanceSecurityPayments > MAX_ADVANCE_SECURITY_PAYMENTS) {
			throw RequestError(`advanceSecurityPayments must be an integer between 0 and ${MAX_ADVANCE_SECURITY_PAYMENTS}.`)
		}
		if (!_.isInteger(deferrals) || !VALID_DEFERRALS.includes(deferrals)) {
			throw RequestError(`deferrals must be an integer ${VALID_DEFERRALS.join(', ')}.`)
		}

		newTerms = Helpers.sanitizeTerms(newTerms);
		newPurchaseOptions = this.sanitizePurchaseOptions(newPurchaseOptions);

		delete newData.terms;
		delete newData.residuals;
		delete newData.spreads;
		delete newData.amountRanges;
		delete newData.purchaseOptions;

		let updateResiduals = false;
		let updateSpreads = false;

		if (newTerms.length > 0) {
			this.terms = newTerms;
			updateResiduals = true;
			updateSpreads = true;
		}

		if (newData.defaults && newData.defaults.term && !this.terms.includes(newData.defaults.term)) {
			throw RequestError('defaultTerm is not in terms.')
		}

		if (!(newData.defaults && newData.defaults.term) && this.terms.length > 0 && !this.terms.includes(this.defaults.term)) {
			this.defaults.term = this.terms[0];
		}

		if (newAmountRanges.length > 0) {
			newAmountRanges = _.sortBy(newAmountRanges, 'min');
			this.checkAmountRanges(newAmountRanges);
			this.amountRanges = newAmountRanges;
			updateSpreads = true;
		}
		if (newPurchaseOptions.length > 0) {
			this.purchaseOptions = newPurchaseOptions;
			updateResiduals = true;
		}

		if (updateResiduals) {
			this.residuals = this.updateTermsPOOnArray(this.terms, this.purchaseOptions, this.residuals);
		}
		if (updateSpreads) {
			this.spreads = this.updateTermsAmountRangesOnArray(this.terms, this.amountRanges, this.spreads);
		}

		if (newResiduals.length > 0) {
			this.updateResiduals(newResiduals);
		}
		if (newSpreads.length > 0) {
			this.updateSpreads(newSpreads);
		}

		this._hasUpdates = true;

		_.extend(this, newData);

		return this;
	},
	/**
	 * @method updateTermsAmountRangesOnArray
	 * Receives an array of objects with structure {term,amountRangeMin, amountRangeMax, value} and updates that array to have all terms and 
	 * amountRangeMin and amountRangeMax
	 * Returns the new array with all the terms and amountRangeMin and amountRangeMax, if item is found it keeps it without change, 
	 * if an object had a term, amountRangeMin, amountRangeMax that isn't available anymore it deletes it and if the keys are new it creates 
	 * an object with empty value
	 * @param _terms {Array}  Terms to update
	 * @param _amountRanges {Array}  Amount ranges to update
	 * @param _arrayToUpdate {Array[Object]} array to update of structure {term, amountRangeMin, amountRangeMax, value}
	 * @param _emptyValue {Number} empty value
	 * @return {Array} The new Array
	 */
	updateTermsAmountRangesOnArray(_terms, _amountRanges, _arrayToUpdate = [], _emptyValue = 0) {
		let newArray = [];
		_.each(_terms, term => {
			_.each(_amountRanges, amountRange => {
				const item = _.find(_arrayToUpdate, {
					term,
					amountRangeMin: amountRange.min,
					amountRangeMax: amountRange.max
				});

				if (item) {
					newArray.push(item);
				} else {
					newArray.push({
						term,
						amountRangeMin: amountRange.min,
						amountRangeMax: amountRange.max,
						value: _emptyValue
					});
				}
			});
		});
		return newArray;
	},
	/**
	 * @method updateTermsPOOnArray
	 * Receives an array of objects with structure {term,purchaseOption, value} and updates that array to have all terms and valid purchaseOptions
	 * Returns the new array with all the terms and valid purchase options, if term or purchaseOption is found it keeps same object, 
	 * if an object had a term or valid purchaseOption that isn't available anymore it deletes it and if the term or purchaseOption is new it creates 
	 * an object with empty value
	 * @param _terms {Array}  Terms to update
	 * @param _purchaseOptions {Array}  Purchase Options to update
	 * @param _arrayToUpdate {Array[Object]} array to update of structure {term, purchaseOption, value}
	 * @param _emptyValue {Number} empty value
	 * @return {Array} The new Array
	 */
	updateTermsPOOnArray(_terms, _purchaseOptions, _arrayToUpdate = [], _emptyValue = 0) {
		let newArray = [];
		_.each(_purchaseOptions, purchaseOption => {
			if (purchaseOption === PURCHASE_OPTIONS.FMV) {
				_.each(_terms, term => {
					const item = _.find(_arrayToUpdate, {
						term,
						purchaseOption
					});

					if (item) {
						newArray.push(item);
					} else {
						newArray.push({
							term,
							purchaseOption,
							value: _emptyValue
						});
					}
				});
			} else if (purchaseOption === PURCHASE_OPTIONS.FPO) {
				const item = _.find(_arrayToUpdate, {
					purchaseOption
				});

				if (item) {
					newArray.push(item);
				} else {
					newArray.push({
						purchaseOption,
						value: _emptyValue
					});
				}
			}
		});

		return newArray;
	},
	/**
	 * @method updateAllInRates
	 * Receives an array of cofs from the version
	 * Updates allInRates 
	 * @param _COFS {Array} Cofs used to calculate allInRates
	 * @return {Void}
	 */
	updateAllInRates(_cofs) {
		const previousAllInRates = this.allInRates;
		this.allInRates = Calculator.calculateAllInsOTHC({
			cofs: _cofs,
			spreads: this.spreads
		});
		_.each(previousAllInRates, previousAllInRate => {
			const allInRate = _.find(this.allInRates, {
				term: previousAllInRate.term,
				amountRangeMin: previousAllInRate.amountRangeMin,
				amountRangeMax: previousAllInRate.amountRangeMax
			});

			if (!allInRate || (allInRate.value !== previousAllInRate.value)) {
				this._hasUpdates = true;
			}
		});
	},
	/**
	 * @method removeInvalidTerms
	 * Receives an array of terms from the version and removes terms that are not in the array
	 * @param _terms {Array} Version terms
	 * @return {Void}
	 */
	removeInvalidTerms(_terms) {
		const previousTerms = this.terms;
		this.terms = _.intersection(this.terms, _terms);
		if (this.terms.length > 0 && !this.terms.includes(this.defaults.term)) {
			this.defaults.term = this.terms[0];
		}
		if (this.terms.length === 0) {
			this.defaults.term = '';
		}
		this.residuals = this.updateTermsPOOnArray(this.terms, this.purchaseOptions, this.residuals);
		this.spreads = this.updateTermsAmountRangesOnArray(this.terms, this.amountRanges, this.spreads);
		if (previousTerms.length > this.terms.length) {
			this._hasUpdates = true;
		}
	},
	/**
	 * @method updateResiduals
	 * Updates the residuals of the rate program
	 * @param {Array[Object]} _newResiduals Residuals data to update
	 * @return {void}
	 */
	updateResiduals(_newResiduals = []) {
		_.each(_newResiduals, newResidual => {
			let residual;
			if (newResidual.purchaseOption === PURCHASE_OPTIONS.FPO) {
				residual = _.find(this.residuals, {
					purchaseOption: newResidual.purchaseOption
				});
				delete newResidual.term;
			} else if (newResidual.purchaseOption === PURCHASE_OPTIONS.FMV) {
				residual = _.find(this.residuals, {
					term: newResidual.term,
					purchaseOption: newResidual.purchaseOption
				});
			}

			if (residual) {
				_.extend(residual, compact(newResidual));
			}
		});
	},
	/**
	 * @method updateSpreads
	 * Updates the spreads of the rate program
	 * @param {Array[Object]} _newSpreads Spreads data to update
	 * @return {void}
	 */
	updateSpreads(_newSpreads = []) {
		_.each(_newSpreads, newSpread => {
			const spread = _.find(this.spreads, {
				term: newSpread.term,
				amountRangeMin: newSpread.amountRangeMin,
				amountRangeMax: newSpread.amountRangeMax
			});

			if (spread) {
				_.extend(spread, compact(newSpread));
			}
		});
	},
	/**
	 * @method checkAmountRanges
	 * Checks that there are no gaps between amountRanges
	 * @param {Array[Object]} _newAmountRanges Amount Ranges
	 * @return {void}
	 */
	checkAmountRanges(_newAmountRanges = []) {
		for (let i = 0; i < _newAmountRanges.length; i++) {
			if (i > 0 && (_newAmountRanges[i - 1].max + 0.01 !== _newAmountRanges[i].min)) {
				throw RequestError('There is a gap in the amount ranges')
			}
			if (_newAmountRanges[i].min > _newAmountRanges[i].max) {
				throw RequestError('Min should not be greater than max')
			}
		}
	},
	/**
	 * @method sanitizePurchaseOptions
	 * Checks that all the purchase options in the array are valid
	 * Returns the new array with valid purchase options convertedtolowercase
	 * @param _purchaseOptions {Array}  Purchase options to validate
	 * @return {Array} The valid purchase options
	 */
	sanitizePurchaseOptions(_purchaseOptions = []) {
		const validPurchaseOptions = Object.values(PURCHASE_OPTIONS);
		return _.chain(_purchaseOptions)
			.compact()
			.filter(purchaseOption => validPurchaseOptions.includes(purchaseOption.toUpperCase()))
			.map(purchaseOption => purchaseOption.toUpperCase())
			.uniq()
			.value()
	},

	/**
	 * @method
	 * Returns a complete array with all the advance security payments this rate program covers
	 * @return {number[]} list of advance payments (e.g. `[0, 1, 2]` if `this.advanceSecurityPayments === 2`)
	 */
	getCompleteAdvanceSecurityPayments() {
		return _.range(this.advanceSecurityPayments + 1);
	},

	/**
	 * @method
	 * Returns a complete array with all the advance payments this rate program covers
	 * @return {number[]} list of advance payments (e.g. `[0, 1, 2]` if `this.advancePayments === 2`)
	 */
	getCompleteAdvancePayments() {
		return _.range(this.advancePayments + 1);
	},

	/**
	 * @method
	 * Returns a complete array with all the points this rate program covers
	 * @param {number[]} [addedPoints=[]] Extra points to add in the list (usually from vendor codes)
	 * @return {number[]} list of advance payments (e.g. `[0, 1, 2]` if `this.points === 2`)
	 */
	getCompletePoints(addedPoints = []) {
		const basePoints = [0, ...addedPoints];
		const myPoints = _.range(this.points + 1);
		return _.uniq([...basePoints, ...myPoints]).sort();
	},

	/**
	 * @method calculateRateFactors
	 * Calculates rate factors for this rate program, does not add them in the model
	 * @param {object} options={} extra options or filters to generate the rate factors
	 * @param {object} options.filters={} Filters for specific rate factors, 
	 * **NOTE ALL FILTERS MUST BE IN ARRAYS**
	 * @param {string[]} options.filters.purchaseOptions 
	 * @param {string[]} options.filters.paymentFrequencies 
	 * @param {number[]} options.filters.advancePayments 
	 * @param {number[]} options.filters.points 
	 * @return {Models.othc.rateFactor[]} Rate factors generated
	 */
	calculateRateFactors(options = {}) {
		log(LOG_TAG, 'calculateRateFactors', options);

		const {
			addedPoints = [],
				filters: {
					purchaseOptions: filteredPurchaseOptions,
					paymentFrequencies: filteredPaymentFrequencies,
					advancePayments: filteredAdvancePayments,
					points: filteredPoints,
				} = {}
		} = options;

		let {
			uid: rateProgramId,
			versionId,
			promoCode,
			name,
			terms,
			purchaseOptions,
			paymentFrequencies,
			amountRanges,
			deferrals,
			allInRates,
			residuals
		} = this;

		let advancePayments = this.getCompleteAdvancePayments();
		let advanceSecurityPayments = this.getCompleteAdvanceSecurityPayments();
		let points = this.getCompletePoints(addedPoints);

		if (filteredPurchaseOptions) {
			purchaseOptions = _.intersection(purchaseOptions, filteredPurchaseOptions);
		}

		if (filteredPaymentFrequencies) {
			paymentFrequencies = _.intersection(paymentFrequencies, filteredPaymentFrequencies);
		}

		if (filteredAdvancePayments) {
			advancePayments = _.intersection(advancePayments, filteredAdvancePayments);
		}

		if (parseInt(filteredPoints) >= 0) {
			points = _.intersection(points, filteredPoints);
		}

		const series = [
			terms,
			purchaseOptions,
			paymentFrequencies,
			points,
			amountRanges,
			advancePayments,
			advanceSecurityPayments,
			[deferrals]
		];
		const combinations = Helpers.combine(series);
		return _.chain(combinations)
			.map(combination => {
				const [
					term,
					purchaseOption,
					paymentFrequency,
					points,
					amountRanges,
					advancePayments,
					advanceSecurityPayments,
					deferral,
				] = combination;
				if (advancePayments && advanceSecurityPayments) {
					return [];
				}
				// rate factor value calculation
				let residual = 0; //purchaseOption==='out'
				let residualItem;
				if (purchaseOption === PURCHASE_OPTIONS.FPO) {
					residualItem = _.find(residuals, {
						purchaseOption
					});
					residual = residualItem ? residualItem.value : 0;
				}

				if (purchaseOption === PURCHASE_OPTIONS.FMV) {
					residualItem = _.find(residuals, {
						term,
						purchaseOption
					});
					residual = residualItem ? residualItem.value : 0;
				}

				const rate = _.find(allInRates, {
					term,
					amountRangeMin: amountRanges.min,
					amountRangeMax: amountRanges.max,
				}).value;

				const termNumber = Number(term) || 0;
				const payments = PAYMENTS_PER_YEAR[paymentFrequency];
				const numberOfPayments = termNumber / (12 / payments);
				let value = 0;
				let totalDeferrals = 0;

				if (!payments) {
					throw Error(LOG_TAG, `No PAYMENTS_PER_YEAR found for paymentFrequency: ${paymentFrequency}`);
				}

				if (deferral) {
					let type = 0;

					if (this.advancePayments > 0 || this.advanceSecurityPayments > 0) {
						type = 1;
					}

					totalDeferrals = parseInt(deferral / 30);
					const future = Calculator.calculateExcelFV({
						rate: rate / 12,
						numberOfPayments: totalDeferrals,
						payment: 0,
						present: 1,
						type: 0
					});

					value = Calculator.calculateExcelPMT({
						numberOfPayments,
						type,
						rate: rate / 12,
						present: future,
						future: residual,
					});
				} else {
					value = Calculator.calculateExcelPMT({
						numberOfPayments,
						rate: rate / payments,
						present: -1,
						future: residual,
						type: 0
					});
				}

				if (points) {
					value = Calculator.calculatePaymentWithPoints({
						points,
						payment: value,
					});
				}

				// advance payments re-formatting
				let advancePaymentsNumber = 0;
				let advancePaymentsType = ADVANCE_PAYMENT_TYPES.ADVANCE;

				if (advancePayments) {
					advancePaymentsNumber = advancePayments;
				} else if (advanceSecurityPayments) {
					advancePaymentsNumber = advanceSecurityPayments;
					advancePaymentsType = ADVANCE_PAYMENT_TYPES.SECURITY;
				}

				const rateFactor = (data = {}) => {
					return RateFactor.create(_.extend({
						versionId,
						rateProgramId,
						promoCode,
						purchaseOption,
						paymentFrequency,
						points,
						deferral,
						value,
						advancePaymentsType,
						vendorCodePoints: 0,
						term: termNumber,
						advancePayments: advancePaymentsNumber,
						paymentLevel: 1,
						payments: termNumber,
						amountRangeMin: amountRanges.min,
						amountRangeMax: amountRanges.max,
						rateProgram: name,
						interestRate: rate,
					}, data));
				};

				let rateFactors = [];

				// generate rate factors based on deferrals
				if (totalDeferrals) {
					rateFactors = [
						rateFactor({
							paymentLevel: 1,
							value: 0,
							interestRate: 0,
							term: termNumber + totalDeferrals,
							payments: totalDeferrals,
						}),
						rateFactor({
							paymentLevel: 2,
							term: termNumber + totalDeferrals
						})
					];
				} else {
					rateFactors = [
						rateFactor()
					];
				}

				return rateFactors;
			})
			.flatten()
			.value();
	},

	/**
	 * @method
	 * Returns the list of available options to filter for in this rate program, 
	 * based on the given filters given
	 * @param {object} [_filters={}] Filters currently selected by the user
	 * @return {object} dictionary of filtering options for this rate program
	 */
	availableFilterOptions(_filters = {}) {
		const {
			purchaseOptions: filteredPurchaseOptions,
			paymentFrequencies: filteredPaymentFrequencies,
			advancePayments: filteredAdvancePayments,
			points: filteredPoints,
		} = _filters;

		const validate = (filter, current) => {
			return filter && _.intersection(filter, current).length === 0;
		}

		const advancePayments = this.getCompleteAdvancePayments();
		const points = this.getCompletePoints();

		if (validate(filteredPurchaseOptions, this.purchaseOptions)) {
			return;
		}

		if (validate(filteredPaymentFrequencies, this.paymentFrequencies)) {
			return;
		}

		if (validate(filteredAdvancePayments, advancePayments)) {
			return;
		}

		if (validate(filteredPoints, points)) {
			return;
		}

		return {
			advancePayments,
			points,
			id: this.uid,
			name: this.name,
			purchaseOptions: this.purchaseOptions,
			paymentFrequencies: this.paymentFrequencies,
		};
	}

});

/**
 * @method create
 * Creates a new rate progrsam with its required data
 * @return {object}
 */
function create(_params = {}) {
	const rateProgram = _.extend({}, RateProgram);

	return rateProgram.constructor(_params);
}

module.exports = {
	table,
	create
};
