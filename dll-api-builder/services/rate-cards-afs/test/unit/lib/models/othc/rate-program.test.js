const _ = require('lodash');
const should = require('should');

const RateProgram = require('../../../../../lib/models/othc/rate-program.model');
const {
	testSchema
} = require('../../../../lib/othc/test.helpers');

const createProgram = (data = {}) => {
	return RateProgram.create(_.defaults(data, {
			versionId: '1',
			terms: ['36'],
			points: 0,
			paymentFrequencies: ['M'],
			purchaseOptions: ['P'],
			amountRanges: [{
				min: 1000.0,
				max: 1999.999,
			}],
			allInRates: [{
				term: '36',
				amountRangeMin: 1000.0,
				amountRangeMax: 1999.999,
				value: 0.12
			}],
			residuals: [{
				term: '36',
				value: 0,
				purchaseOption: 'F',
			}]
		}))
		.init();
};

const validateRateFactors = (options = {}) => {
	const {
		input: {
			terms,
			allIns,
			deferrals,
			points,
			paymentFrequencies,
			purchaseOptions,
			advancePayments,
			residuals: residualInputs,
		},
		expected
	} = options;

	const ranges = {
		min: 1000.0,
		max: 1999.999,
	};

	const allInRates = terms.map((term, index) => {
		return {
			term,
			amountRangeMin: ranges.min,
			amountRangeMax: ranges.max,
			value: allIns[index]
		};
	});

	let residuals;

	if (residualInputs) {
		residuals = terms.map((term, index) => {
			return {
				term,
				value: residualInputs[index],
				purchaseOption: 'F',
			};
		});

		residuals = [...residuals, {
			value: residualInputs[0],
			purchaseOption: 'P'
		}];
	}

	const program = createProgram({
		allInRates,
		terms,
		deferrals,
		points,
		residuals,
		paymentFrequencies,
		purchaseOptions,
		advancePayments,
		name: 'Test',
	});

	const rateFactors = program.calculateRateFactors();

	testSchema('rateFactors', rateFactors);

	rateFactors.forEach(rateFactor => {
		const {
			payments,
			value,
			interestRate,
			paymentFrequency,
			points: rfPoints
		} = rateFactor;

		if (value === 0 && deferrals) {
			payments.should.equal(deferrals / 30);
			interestRate.should.equal(0);
			return;
		}

		const xAxis = terms.length > 1 ? terms : paymentFrequencies;
		const lookup = terms.length > 1 ? '' + payments : paymentFrequency;
		const x = _.indexOf(xAxis, lookup);
		const term = _.indexOf(terms, '' + payments);
		const expectedInterest = allIns[term];
		let expectedValue;

		if (points) {
			expectedValue = expected[rfPoints][x];
		} else {
			expectedValue = expected[x];
		}

		expectedValue.should.be.Number().above(0);

		value.should.equal(expectedValue);
		interestRate.should.equal(expectedInterest);
	});
};

describe('services/rate-cards', () => {
	describe('models/othc/rate-program', () => {
		describe('#calculateRateFactors', () => {
			it('Should calculate the rate factors with NO_DEFERRALS, FPO', () => {
				const input = {
					terms: ['36', '48', '60'],
					purchaseOptions: ['P'],
					allIns: [0.0599, 0.0599, 0.0599]
				}

				const expected = [.0304174, .0234804, .0193282];

				validateRateFactors({
					input,
					expected
				});
			});

			it('Should calculate the rate factors with PAYMENT_FREQUENCIES, NO_DEFERRALS, FPO', () => {
				const input = {
					terms: ['36'],
					paymentFrequencies: ['M', 'Q', 'SA', 'A'],
					allIns: [0.0599],
					purchaseOptions: ['P'],
				}

				const expected = [.0304174, .0916657, .1845669, .3740406];

				validateRateFactors({
					input,
					expected
				});
			});

			it('Should calculate the rate factors with DEFERRALS, FPO', () => {
				const input = {
					terms: ['36', '48', '60'],
					allIns: [0.0625, 0.0625, 0.0625],
					deferrals: 90,
					purchaseOptions: ['P'],
				};
				const expected = [.0310149, .0239705, .0197547];

				validateRateFactors({
					input,
					expected
				});
			});

			it('Should calculate the rate factors with RESIDUALS, NO_DEFERRALS, FMV', () => {
				const input = {
					terms: ['12', '24', '36', '48', '60'],
					allIns: [0.0899, 0.0699, 0.0675, 0.0675, 0.0675],
					residuals: [0.25, 0.23, 0.22, 0.18, 0.13],
					purchaseOptions: ['F'],
				};
				const expected = [.0674580, .0358111, .0252326, .0205535, .0178559];

				validateRateFactors({
					input,
					expected
				});
			});

			it('Should calculate the rate factors with DEFERRALS and RESIDUALS', () => {
				const input = {
					terms: ['12', '36', '60'],
					allIns: [0.0379, 0.0379, 0.0379],
					residuals: [0.2, 0.2, 0.2],
					deferrals: 90,
					purchaseOptions: ['F', 'P'],
				};
				const expected = [0.0694833, 0.0244559, 0.0154633];

				validateRateFactors({
					input,
					expected
				});
			});

			it('Should calculate the rate factors with DEFERRALS, RESIDUALS and ADVANCE_PAYMENTS', () => {
				const input = {
					terms: ['12', '36', '60'],
					allIns: [0.0379, 0.0379, 0.0379],
					residuals: [0.2, 0.2, 0.2],
					deferrals: 90,
					advancePayments: 2,
					purchaseOptions: ['F', 'P'],
				};
				const expected = [0.0692645, 0.0243789, 0.0154147];

				validateRateFactors({
					input,
					expected
				});
			});

			it('Should calculate the rate factors with POINTS, DEFERRALS and RESIDUALS', () => {
				const input = {
					terms: ['12', '36', '60'],
					allIns: [0.0379, 0.0379, 0.0379],
					residuals: [0.2, 0.2, 0.2],
					deferrals: 90,
					purchaseOptions: ['F', 'P'],
					points: 2
				};
				const expected = [
					[0.0694833, 0.0244559, 0.0154633], // 0 points
					[0.0701748, 0.0247046, 0.0156146], // 1 point
					[0.0708696, 0.0249492, 0.0157692], // 2 points
				];

				validateRateFactors({
					input,
					expected
				});
			});

			it('Should calculate the rate factors with POINTS, DEFERRALS, RESIDUALS and ADVANCE_PAYMENTS', () => {
				const input = {
					terms: ['12', '36', '60'],
					allIns: [0.0379, 0.0379, 0.0379],
					residuals: [0.2, 0.2, 0.2],
					deferrals: 90,
					purchaseOptions: ['F', 'P'],
					advancePayments: 3,
					points: 2
				};
				const expected = [
					[0.0692645, 0.0243789, 0.0154147], // 0 points
					[0.0699526, 0.0246238, 0.0155641], // 1 point
					[0.0706452, 0.0248676, 0.0157182], // 2 points
				];

				validateRateFactors({
					input,
					expected
				});
			});

			it('Should filter out rateFactors', () => {
				const rateProgram = createProgram({
					purchaseOptions: ['F', 'P', 'D'],
					paymentFrequencies: ['M', 'Q', 'SA', 'A'],
					points: 3,
					advancePayments: 2
				});

				const input = {
					purchaseOptions: ['F'],
					paymentFrequencies: ['M'],
					points: [1],
					advancePayments: [1]
				};

				const expected = input;

				const rateFactors = rateProgram.calculateRateFactors({
					filters: input
				});

				const actual = _.reduce(rateFactors, (memo, rateFactor) => {
					const {
						purchaseOption,
						paymentFrequency,
						points: rfPoints,
						advancePayments: rfAdvancePayments,
					} = rateFactor;

					const {
						purchaseOptions = [],
							paymentFrequencies = [],
							points = [],
							advancePayments = [],
					} = memo;

					return {
						purchaseOptions: _.uniq([...purchaseOptions, purchaseOption]),
						paymentFrequencies: _.uniq([...paymentFrequencies, paymentFrequency]),
						points: _.uniq([...points, rfPoints]),
						advancePayments: _.uniq([...advancePayments, rfAdvancePayments])
					};

				}, {});

				actual.should.deepEqual(expected);
			});
		});

		describe('#getCompleteAdvanceSecurityPayments', () => {
			it('should return 0 by default', () => {
				const input = {};
				const expected = [0];

				const rateProgram = createProgram(input);
				const actual = rateProgram.getCompleteAdvanceSecurityPayments();
				actual.should.deepEqual(expected);
			});

			it('should return a complete list with added advanceSecurityPayments', () => {
				const input = {
					advanceSecurityPayments: 3
				};
				const expected = [0, 1, 2, 3];

				const rateProgram = createProgram(input);
				const actual = rateProgram.getCompleteAdvanceSecurityPayments();
				actual.should.deepEqual(expected);
			});
		});

		describe('#getCompleteAdvancePayments', () => {
			it('should return 0 by default', () => {
				const input = {};
				const expected = [0];

				const rateProgram = createProgram(input);
				const actual = rateProgram.getCompleteAdvancePayments();
				actual.should.deepEqual(expected);
			});

			it('should return a complete list with added advancePayments', () => {
				const input = {
					advancePayments: 3
				};
				const expected = [0, 1, 2, 3];

				const rateProgram = createProgram(input);
				const actual = rateProgram.getCompleteAdvancePayments();
				actual.should.deepEqual(expected);
			});
		});

		describe('#getCompletePoints', () => {
			it('should return 0 by default', () => {
				const input = {};
				const expected = [0];

				const rateProgram = createProgram(input);
				const actual = rateProgram.getCompletePoints();
				actual.should.deepEqual(expected);
			});

			it('should return a complete list with added points', () => {
				const input = {
					points: 3
				};
				const expected = [0, 1, 2, 3];

				const rateProgram = createProgram(input);
				const actual = rateProgram.getCompletePoints();
				actual.should.deepEqual(expected);
			});

			it('should return a complete list with points and additional points', () => {
				const input = {
					points: 3
				};
				const expected = [0, 1, 2, 3, 6];

				const rateProgram = createProgram(input);
				const actual = rateProgram.getCompletePoints([1, 6]);
				actual.should.deepEqual(expected);
			});
		});

		describe('#availableFilterOptions', () => {
			it('should return options with no current filter', () => {
				const rateProgram = createProgram({
					uid: '1',
					name: 'A',
					paymentFrequencies: ['M', 'SA'],
					purchaseOptions: ['F', 'P'],
					points: 1,
					advancePayments: 1
				});

				const expected = {
					id: '1',
					name: 'A',
					paymentFrequencies: ['M', 'SA'],
					purchaseOptions: ['F', 'P'],
					points: [0, 1],
					advancePayments: [0, 1]
				};
				const actual = rateProgram.availableFilterOptions();

				actual.should.deepEqual(expected);
			});

			it('should return `undefined` when a current filter does not meet an option', () => {
				const rateProgram = createProgram({
					uid: '1',
					name: 'A',
					paymentFrequencies: ['M', 'SA'],
					purchaseOptions: ['F', 'P'],
					points: 1,
					advancePayments: 1
				});
				const input = {
					paymentFrequencies: ['Y']
				};

				const expected = undefined;
				const actual = rateProgram.availableFilterOptions(input);
				should().equal(expected, actual);
			});

			it('should return the correct options when a current filter does meet all options', () => {
				const rateProgram = createProgram({
					uid: '1',
					name: 'A',
					paymentFrequencies: ['M', 'SA'],
					purchaseOptions: ['F', 'P'],
					points: 1,
					advancePayments: 1
				});

				const input = {
					paymentFrequencies: ['M'],
					purchaseOptions: ['P'],
					points: [0],
					advancePayments: [1]
				};

				const expected = {
					id: '1',
					name: 'A',
					paymentFrequencies: ['M', 'SA'],
					purchaseOptions: ['F', 'P'],
					points: [0, 1],
					advancePayments: [0, 1]
				};
				const actual = rateProgram.availableFilterOptions(input);
				actual.should.deepEqual(expected);
			});
		});

	});
});
