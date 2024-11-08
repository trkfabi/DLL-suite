const uuid = require('uuid/v1');
const _ = require('lodash');

/**
 * Calculations for Rate Factors, Inputs, Residuals
 * @class Utils.RateCardCalculator
 * @singleton
 */

const LOG_TAG = '\x1b[35m' + '[utils/RateCardCalculator]' + '\x1b[39;49m ';

const RateCardCalculator = (function () {
	// +-------------------
	// | Private members.
	// +-------------------
	const validCofs = ['FMV', '$1 Out'];

	/**
	 * @method fixDecimals
	 * @private
	 * Parses a number to have up to n decimal values
	 * @param {number} value Value to parse
	 * @param {number} decimals=6 max amount of decimals to show
	 * @return {number}
	 */
	function fixDecimals(value = 0, decimals = 7) {
		value = Number(value) || 0;
		return Number(value.toFixed(decimals));
	}

	/**
	 * @method roundDown
	 * Parses a number to have up to n decimal values always rounding the "5" down
	 * @param {number} value Value to parse
	 * @param {number} decimals=6 max amount of decimals to show
	 * @return {number}
	 */
	function roundDown(value = 0, decimals = 7) {
		value = Number(value) || 0;
		return Number(-Math.round(-value + 'e' + decimals) + 'e-' + decimals);
	}

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method calculateAllInsAFS
	 * Calculates items for the All-IN read-only tables
	 * @param {object} params Options to calculate the tabels from
	 * @param {object[]} params.inputs List of input models to calculate from
	 * @param {string[]} params.terms List of terms to use
	 * @return {object[]}
	 */
	function calculateAllInsAFS({
		inputs = [],
		terms = []
	} = {}) {
		// log(LOG_TAG, 'calculateAllInsAFS', {
		// 	inputs, terms
		// });

		const resultTypes = ['allin-fmv', 'allin-out'];

		if (terms.length === 0) {
			log(LOG_TAG, '- calculateAllInsAFS - skipping - no terms to use.');
			return null;
		}

		const inputGroups = _.groupBy(inputs, 'type');
		inputGroups.cof = _.filter(inputGroups.cof, input => validCofs.includes(input.name));

		const validInputs = [...inputGroups.cof, ...inputGroups.spread];
		if (validInputs.length <= 0) {
			log(LOG_TAG, '- calculateAllInsAFS - skipping - no inputs to use.');
			return null;
		}

		let result = [];
		_.each(inputGroups.spread, (spread) => {
			_.each(inputGroups.cof, (cof) => {
				const resultType = resultTypes[_.indexOf(validCofs, cof.name)];
				const {
					[resultType]: inputGroup = []
				} = inputGroups;

				const originalItem = _.find(inputGroup, {
					type: resultType,
					name: spread.name,
					creditRatings: spread.creditRatings
				}) || {};

				let allInItem = _.chain(originalItem)
					.clone()
					.defaults({
						id: null,
						type: resultType,
						name: spread.name,
						creditRatings: spread.creditRatings
					})
					.extend({
						terms: {},
					})
					.value();

				_.each(terms, term => {
					const spreadTerm = spread.terms[term] || 0;
					const cofTerm = cof.terms[term] || 0;

					allInItem.terms[term] = fixDecimals(spreadTerm + cofTerm);
				});

				result.push(allInItem);
			});
		});

		return result;
	}

	/**
	 * @method calculateAllInsOTHC
	 * Calculates items for the all in rates read-only tables
	 * @param {object} params Options to calculate the tabels from
	 * @param {object[]} params.cofs List of cofs to use
	 * @param {string[]} params.spreads List of spreads to use
	 * @return {object[]}
	 */
	function calculateAllInsOTHC({
		cofs = [],
		spreads = []
	} = {}) {
		let newArray = [];
		_.each(spreads, spread => {
			const cof = _.find(cofs, {
				term: spread.term
			});
			if (cof) {
				newArray.push({
					term: spread.term,
					amountRangeMin: spread.amountRangeMin,
					amountRangeMax: spread.amountRangeMax,
					value: fixDecimals((cof.value + spread.value), 6)
				});
			}
		});
		return newArray;
	}

	/**
	 * @method calculateRateFactors
	 * Calculates the list of rate factors based on the inputs and products
	 * @param {object} params Options to generate rate factors from
	 * @param {object[]} params.inputs List of input models
	 * @param {string[]} params.terms List of terms
	 * @param {object[]} params.products List of Product models
	 * @return {object[]}
	 */
	function calculateRateFactors({
		versionId,
		inputs = [],
		terms = [],
		products = [],
		vendorCodes = [],
		creditRatings = [],
		baseOnly = false
	} = {}) {

		log(LOG_TAG, 'calculateRateFactors', {
			versionId,
			inputs,
			terms,
			products,
			vendorCodes,
			creditRatings,
			baseOnly,
		});

		const required = {
			inputs,
			creditRatings,
			terms,
			products,
		};

		const isMissingData = _.some(required, (items, name) => {
			if (items.length === 0) {
				log(LOG_TAG, `calculateRateFactors - skipping - no ${name}`);
				return true;
			}

			return false;
		});

		if (isMissingData) {
			return [];
		}

		const allInInputs = calculateAllInsAFS({
			inputs,
			terms
		});

		let result = [];

		_.each(creditRatings, creditRating => {
			const allIns = _.filter(allInInputs, input => {
				return input.creditRatings.includes(creditRating);
			});

			const allInFmv = _.find(allIns, {
				type: 'allin-fmv'
			});

			const allInOut = _.find(allIns, {
				type: 'allin-out'
			});

			if (!allInFmv && !allInOut) {
				return;
			}

			_.each(terms, term => {
				const baseRF = {
					term,
					versionId,
					creditRating,
					points: 0,
					vendorCode: '',
				};

				if (allInOut) {
					const allInTerm = allInOut.terms[term] || 0;

					const rateFactor = _.extend({}, baseRF, {
						uid: uuid(),
						productId: null,
						rate: 'out',
						value: calculatePayment({
							interest: allInTerm,
							term: term,
							residual: 0
						})
					});

					result.push(rateFactor);
				}

				if (!allInFmv) {
					return;
				}

				_.each(products, product => {
					const {
						uid,
						terms = [],
						ratesEnabled = []
					} = product;

					if (ratesEnabled.includes('1out')) {
						return;
					}

					const allInTerm = allInFmv.terms[term] || 0;
					const productTerm = terms[term] || 0;

					const rateFactor = _.extend({}, baseRF, {
						uid: uuid(),
						productId: uid,
						rate: 'fmv',
						value: calculatePayment({
							interest: allInTerm,
							term: term,
							residual: productTerm
						})
					});

					result.push(rateFactor);
				});
			});
		});

		if (!baseOnly && vendorCodes.length > 0) {
			let rateFactorsWithPoints = [];

			_.each(vendorCodes, vendorCode => {
				const {
					name,
					points
				} = vendorCode;

				const vendorRateFactors = result.map(rateFactor => {
					return _.extend({}, rateFactor, {
						uid: uuid(),
						points,
						vendorCode: name,
						value: calculatePaymentWithPoints({
							points,
							payment: rateFactor.value,
						})
					});
				});

				rateFactorsWithPoints = [...rateFactorsWithPoints, ...vendorRateFactors];
			});

			result = [...result, ...rateFactorsWithPoints];
		}

		return result;
	}

	/**
	 * @method calculateExcelPMT
	 * Calculates the payment amount, similar to the PMT function of Excel
	 * @param {object} params Options to calculate
	 * @param {number} params.rate is the interest rate per period for the loan. For example, use 6%/4 for quarterly payments at 6% APR.
	 * @param {number} params.numberOfPayments  is the total number of payments for the loan.
	 * @param {number} params.present is the present value: the total amount that a series of future payments is worth now.
	 * @param {number} [params.future=0] is the future value, or a cash balance you want to attain after the last payment is made, 0 (zero) if omitted.
	 * @param {number} [params.type=0] `1` if payment at the beginning of the period; `0` if payment at the end of the period
	 * @return {number}
	 */
	function calculateExcelPMT({
		rate,
		numberOfPayments,
		present,
		future = 0,
		type = 0
	} = {}) {
		log(LOG_TAG, 'calculateExcelPMT', {
			rate,
			numberOfPayments,
			present,
			future,
			type
		});

		let result = null;
		if (rate != null && rate !== 0) {
			const interest = Math.pow(1 + rate, numberOfPayments);
			result = -(rate * (future + (interest * present))) / ((-1 + interest) * (1 + rate * (type)));

		} else if (numberOfPayments != null && numberOfPayments !== 0) {
			result = -(future + present) / numberOfPayments;
		}

		if (result == null) {
			return result;
		}

		return fixDecimals(result);
	}

	/**
	 * @method calculateExcelFV
	 * Calculates the FV (Future Value) with the same approach as Excel's FV formula
	 * @param {object} params Options to calculate
	 * @param {number} params.rate The interest rate per period.
	 * @param {number} params.numberOfPayments  The total number of payment periods in an annuity.
	 * @param {number} [params.payment] The payment made each period; it cannot change over the life of the annuity. Typically, pmt contains principal and interest but no other fees or taxes. If it's omitted, you must include the present argument.
	 * @param {number} [params.present] The present value, or the lump-sum amount that a series of future payments is worth right now. If it's omitted, it is assumed to be 0 (zero), and you must include the payment argument.
	 * @param {number} [params.type] The number 0 or 1 and indicates when payments are due. If type is omitted, it is assumed to be 0.
	 * @return {number}
	 */
	function calculateExcelFV({
		rate,
		numberOfPayments,
		payment = 0,
		present = 0,
		type = 0
	}) {
		const pow = Math.pow(1 + rate, numberOfPayments);
		let result;
		if (rate) {
			result = (payment * (1 + rate * type) * (1 - pow) / rate) - present * pow;
		} else {
			result = -1 * (present + payment * numberOfPayments);
		}
		return fixDecimals(result);
	}

	function calculatePayment(params = {}) {
		// log(LOG_TAG, 'calculatePayment', params);

		const {
			interest,
			term,
			residual,
			equipment = 1
		} = params;

		const required = {
			interest,
			term,
			residual
		};

		const isMissingData = _.some(required, (item, name) => {
			if (item == null) {
				log(LOG_TAG, `calculatePayment - skipping - missing ${name}`, params);
				return true;
			}

			return false;
		});

		if (isMissingData) {
			return null;
		}

		const freqNumber = 12;
		const numberOfPayments = term;
		let payment = null;

		if (interest > 0) {
			const ratePerFrequency = interest / freqNumber;

			payment = -(ratePerFrequency * (residual - equipment * Math.pow((ratePerFrequency + 1), numberOfPayments))) /
				(Math.pow((ratePerFrequency + 1), numberOfPayments) - 1);
		} else {
			payment = (equipment - residual) / numberOfPayments;
		}
		payment = fixDecimals(payment);

		return payment;
	}

	/**
	 * @method calculatePaymentWithPoints
	 * Similar to #calculateExcelPMT, but it also adds points to the given payment
	 * @param {object} params Options to calculate
	 * @param {number} params.point Points to add
	 * @param {number} [params.payment] Payment previously calculated, if ommited, must include options to calculate a new payment
	 * @param {number} [params.rate] Rate, from #calculateExcelPMT
	 * @param {number} [params.numberOfPayments] Number of Payments, from #calculateExcelPMT
	 * @param {number} [params.present] Present, from #calculateExcelPMT
	 * @param {number} [params.future] Future, from #calculateExcelPMT
	 * @param {number} [params.type] Type, from #calculateExcelPMT
	 * @return {void}
	 */
	function calculatePaymentWithPoints(params = {}) {
		// log(LOG_TAG, 'calculatePaymentWithPoints', params);

		let {
			points = 0,
				payment = null
		} = params;

		if (payment === null) {
			payment = calculatePayment(params);
		}

		if (payment === null) {
			return null;
		}
		//Not using fixDecimals function as we want to round the "5" down
		if (points !== 0) {
			payment = roundDown(payment, 5);
		}
		return fixDecimals(payment * (1 + points / 100));
	}

	return {
		calculateAllInsAFS,
		calculateAllInsOTHC,
		calculateRateFactors,
		calculateExcelPMT,
		calculatePayment,
		calculatePaymentWithPoints,
		roundDown,
		calculateExcelFV,
	};
})();

module.exports = RateCardCalculator;
