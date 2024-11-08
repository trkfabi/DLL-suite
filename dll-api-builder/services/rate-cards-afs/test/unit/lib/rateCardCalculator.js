const should = require('should');
const assert = require('assert');
const _ = require('lodash');
const RateCardCalculator = require('../../../lib/rateCardCalculator');

describe('services/rate-cards', () => {
	describe('lib/rateCardCalculator', () => {
		describe('#calculateExcelPMT()', () => {
			it('Should work with all options set', () => {
				const input = {
					rate: 0.004183333,
					numberOfPayments: 12,
					present: -1,
					future: 0.45,
					type: 0
				};
				const expected = 0.0489717;
				const actual = RateCardCalculator.calculateExcelPMT(input);

				assert.strictEqual(actual, expected);
			});

			it('Should work with negative present', () => {
				const input = {
					rate: 0.0625 / 12,
					numberOfPayments: 36,
					present: -1.0157065,
					future: 0,
					type: 0
				};
				const expected = 0.0310149;
				const actual = RateCardCalculator.calculateExcelPMT(input);

				assert.strictEqual(actual, expected);
			});

			it('Should work omitting `future`, `type`', () => {
				const input = {
					rate: 0.05,
					numberOfPayments: 48,
					present: 100
				};
				const expected = -5.5318431;
				const actual = RateCardCalculator.calculateExcelPMT(input);

				assert.strictEqual(actual, expected);
			});

			it('Should work using `type` = 1', () => {
				const input = {
					rate: 1,
					numberOfPayments: 12,
					present: -1,
					future: 0.5,
					type: 1
				};
				const expected = 0.5000611;
				const actual = RateCardCalculator.calculateExcelPMT(input);

				assert.strictEqual(actual, expected);
			});

			it('should return null if no payment and no options are present', () => {
				const expected = null;

				assert.strictEqual(RateCardCalculator.calculateExcelPMT(), expected, 'Not null if receives undefined');
				assert.strictEqual(RateCardCalculator.calculateExcelPMT({}), expected, 'Not null if receives {}');
				assert.strictEqual(RateCardCalculator.calculateExcelPMT([]), expected, 'Not null if receives []');
			});
		});

		describe('#calculatePayment()', () => {
			it('should work the same as the CTI app, using equipment, interest, residual', () => {
				const input = {
					equipment: 10000,
					term: 24,
					interest: 3.54 / 100,
					residual: 3500
				};
				const expected = 291.2580729;
				const actual = RateCardCalculator.calculatePayment(input);

				assert.strictEqual(actual, expected);
			});

			it('should work Using equipment = 1', () => {
				const input = {
					equipment: 1,
					term: 24,
					interest: 3.54 / 100,
					residual: 0.35
				};
				const expected = 0.0291258;
				const actual = RateCardCalculator.calculatePayment(input);

				assert.strictEqual(actual, expected);
			});

			it('should work Using equipment = 1, interest = 0 and residual = 0', () => {
				const input = {
					equipment: 1,
					term: 12,
					interest: 0,
					residual: 0
				};
				const expected = 0.0833333;
				const actual = RateCardCalculator.calculatePayment(input);

				assert.strictEqual(actual, expected);
			});

			it('should return null if no options are present', () => {
				const expected = null;

				assert.strictEqual(RateCardCalculator.calculatePayment(), expected, 'Not null if receives undefined');
				assert.strictEqual(RateCardCalculator.calculatePayment({}), expected, 'Not null if receives {}');
				assert.strictEqual(RateCardCalculator.calculatePayment([]), expected, 'Not null if receives []');
			});
		});

		describe('#calculatePaymentWithPoints()', () => {
			it('should work with payment, points', () => {
				const input = {
					payment: 0.03898,
					points: 2
				};
				const expected = 0.0397596;
				const actual = RateCardCalculator.calculatePaymentWithPoints(input);

				assert.strictEqual(actual, expected);
			});

			it('should round a payment ended with 5 down, and then calculate points', () => {
				const input = {
					payment: 0.038985,
					points: 2
				};
				const expected = 0.0397596;
				const actual = RateCardCalculator.calculatePaymentWithPoints(input);

				assert.strictEqual(actual, expected);
			});

			it('should work with payment, 0 points', () => {
				const input = {
					payment: 0.02911,
					points: 0
				};
				const expected = 0.029110;
				const actual = RateCardCalculator.calculatePaymentWithPoints(input);

				assert.strictEqual(actual, expected);
			});

			it('should not round to 5 decimals if 0 points', () => {
				const input = {
					payment: 0.029112,
					points: 0
				};
				const expected = 0.029112;
				const actual = RateCardCalculator.calculatePaymentWithPoints(input);

				assert.strictEqual(actual, expected);
			});

			it('should work with payment options and no payment', () => {
				const input = {
					equipment: 10000,
					term: 24,
					interest: 3.54 / 100,
					residual: 3500,
					points: 2
				};
				const expected = 297.0832314;
				const actual = RateCardCalculator.calculatePaymentWithPoints(input);

				assert.strictEqual(actual, expected);
			});

			it('should use calculate based on the payment, if all options are present', () => {
				const input = {
					payment: 0.03898,
					points: 2,
					equipment: 10000,
					term: 24,
					interest: 3.54 / 100,
					residual: 3500
				};
				const expected = 0.0397596;
				const actual = RateCardCalculator.calculatePaymentWithPoints(input);

				assert.strictEqual(actual, expected);
			});

			it('should return null if no payment and no options are present', () => {
				const expected = null;

				assert.strictEqual(RateCardCalculator.calculatePaymentWithPoints(), expected, 'Not null if receives undefined');
				assert.strictEqual(RateCardCalculator.calculatePaymentWithPoints({}), expected, 'Not null if receives {}');
				assert.strictEqual(RateCardCalculator.calculatePaymentWithPoints([]), expected, 'Not null if receives []');
			});
		});

		describe('#calculateAllInsAFS()', () => {

			it('Returns All-In with same ids of both types when they are entered.', () => {
				const input = {
					terms: ['12', '18'],
					inputs: [{
						id: '001',
						type: 'cof',
						name: 'FMV',
						terms: {
							'12': 0.0,
							'18': 0.1,
							'24': 0.2,
							'48': 0.3
						},
					}, {
						type: 'cof',
						name: '$1 Out',
						terms: {
							'18': 1.0
						}
					}, {
						id: '002',
						type: 'spread',
						name: 'AAA to AA',
						creditRatings: ['AAA', 'AA+', 'AA'],
						terms: {
							'12': 2.0,
							'18': 2.1
						}
					}, {
						id: '003',
						type: 'spread',
						name: 'AA- to A-',
						creditRatings: ['AA-', 'A+', 'A', 'A-'],
						terms: {
							'18': 3.1
						}
					}, {
						type: 'spread',
						name: 'BBB+ to BBB-',
						creditRatings: ['BBB+', 'BBB', 'BBB-'],
						terms: {
							'24': 4.0
						}
					}, {
						// Shoud be ignored
						id: '004',
						type: 'non-supported',
						name: 'COF Other',
						terms: {
							'12': 0.12,
							'18': 0.13
						}
					}, {
						id: '010',
						type: 'allin-fmv',
						name: 'AAA to AA',
						creditRatings: ['AAA', 'AA+', 'AA'],
						terms: {
							'12': 0,
							'18': 0,
						}
					}, {
						id: '011',
						type: 'allin-fmv',
						name: 'AA- to A-',
						creditRatings: ['AA-', 'A+', 'A', 'A-'],
						terms: {
							'12': 0,
							'18': 0,
						}
					}, {
						id: '012',
						type: 'allin-fmv',
						name: 'BBB+ to BBB-',
						creditRatings: ['BBB+', 'BBB', 'BBB-'],
						terms: {
							'12': 0,
							'18': 0,
						}
					}, {
						id: '013',
						type: 'allin-out',
						name: 'AAA to AA',
						creditRatings: ['AAA', 'AA+', 'AA'],
						terms: {
							'12': 0,
							'18': 0,
						}
					}, {
						id: '014',
						type: 'allin-out',
						name: 'AA- to A-',
						creditRatings: ['AA-', 'A+', 'A', 'A-'],
						terms: {
							'12': 0,
							'18': 0,
						}
					}, {
						id: '015',
						type: 'allin-out',
						name: 'BBB+ to BBB-',
						creditRatings: ['BBB+', 'BBB', 'BBB-'],
						terms: {
							'12': 0,
							'18': 0,
						}
					}]
				};
				const expected = [{
					id: '010',
					type: 'allin-fmv',
					name: 'AAA to AA',
					creditRatings: ['AAA', 'AA+', 'AA'],
					terms: {
						'12': 2.0,
						'18': 2.2
					}
				}, {
					id: '011',
					type: 'allin-fmv',
					name: 'AA- to A-',
					creditRatings: ['AA-', 'A+', 'A', 'A-'],
					terms: {
						'12': 0,
						'18': 3.2
					}
				}, {
					id: '012',
					type: 'allin-fmv',
					name: 'BBB+ to BBB-',
					creditRatings: ['BBB+', 'BBB', 'BBB-'],
					terms: {
						'12': 0,
						'18': 0.1
					}
				}, {
					id: '013',
					type: 'allin-out',
					name: 'AAA to AA',
					creditRatings: ['AAA', 'AA+', 'AA'],
					terms: {
						'12': 2.0,
						'18': 3.1
					}
				}, {
					id: '014',
					type: 'allin-out',
					name: 'AA- to A-',
					creditRatings: ['AA-', 'A+', 'A', 'A-'],
					terms: {
						'12': 0,
						'18': 4.1
					}
				}, {
					id: '015',
					type: 'allin-out',
					name: 'BBB+ to BBB-',
					creditRatings: ['BBB+', 'BBB', 'BBB-'],
					terms: {
						'12': 0,
						'18': 1.0
					}
				}];

				const actual = RateCardCalculator.calculateAllInsAFS(input);

				assert.strictEqual(actual.length, expected.length, 'Items are not the same length');

				_.each(actual, actualItem => {
					const {
						type,
						name
					} = actualItem;

					const expectedItem = _.find(expected, {
						type,
						name
					});

					assert.ok(expectedItem, `No expectedItem found for name: ${name}; type: ${type}`);
					assert.deepStrictEqual(actualItem, expectedItem, `No match for name: ${name}; type: ${type}`);
				});
			});

			it('Returns All-In with `null` ids of both types when they are entered.', () => {
				const input = {
					terms: ['12', '18'],
					inputs: [{
						id: '001',
						type: 'cof',
						name: 'FMV',
						terms: {
							'12': 0.0,
							'18': 0.1,
							'24': 0.2,
							'48': 0.3
						},
					}, {
						type: 'cof',
						name: '$1 Out',
						terms: {
							'18': 1.0
						}
					}, {
						id: '002',
						type: 'spread',
						name: 'AAA to AA',
						creditRatings: ['AAA', 'AA+', 'AA'],
						terms: {
							'12': 2.0,
							'18': 2.1
						}
					}, {
						id: '003',
						type: 'spread',
						name: 'AA- to A-',
						creditRatings: ['AA-', 'A+', 'A', 'A-'],
						terms: {
							'18': 3.1
						}
					}, {
						type: 'spread',
						name: 'BBB+ to BBB-',
						creditRatings: ['BBB+', 'BBB', 'BBB-'],
						terms: {
							'24': 4.0
						}
					}, {
						// Shoud be ignored
						id: '004',
						type: 'non-supported',
						name: 'COF Other',
						terms: {
							'12': 0.12,
							'18': 0.13
						}
					}]
				};
				const expected = [{
					id: null,
					type: 'allin-fmv',
					name: 'AAA to AA',
					creditRatings: ['AAA', 'AA+', 'AA'],
					terms: {
						'12': 2.0,
						'18': 2.2
					}
				}, {
					id: null,
					type: 'allin-fmv',
					name: 'AA- to A-',
					creditRatings: ['AA-', 'A+', 'A', 'A-'],
					terms: {
						'12': 0,
						'18': 3.2
					}
				}, {
					id: null,
					type: 'allin-fmv',
					name: 'BBB+ to BBB-',
					creditRatings: ['BBB+', 'BBB', 'BBB-'],
					terms: {
						'12': 0,
						'18': 0.1
					}
				}, {
					id: null,
					type: 'allin-out',
					name: 'AAA to AA',
					creditRatings: ['AAA', 'AA+', 'AA'],
					terms: {
						'12': 2.0,
						'18': 3.1
					}
				}, {
					id: null,
					type: 'allin-out',
					name: 'AA- to A-',
					creditRatings: ['AA-', 'A+', 'A', 'A-'],
					terms: {
						'12': 0,
						'18': 4.1
					}
				}, {
					id: null,
					type: 'allin-out',
					name: 'BBB+ to BBB-',
					creditRatings: ['BBB+', 'BBB', 'BBB-'],
					terms: {
						'12': 0,
						'18': 1.0
					}
				}];

				const actual = RateCardCalculator.calculateAllInsAFS(input);

				assert.strictEqual(actual.length, expected.length, 'Items are not the same length');

				_.each(actual, actualItem => {
					const {
						type,
						name
					} = actualItem;

					const expectedItem = _.find(expected, {
						type,
						name
					});

					assert.ok(expectedItem, `No expectedItem found for name: ${name}; type: ${type}`);
					assert.deepStrictEqual(actualItem, expectedItem, `No match for name: ${name}; type: ${type}`);
				});
			});
			describe('#calculateAllInsOTHC()', () => {

				it('Returns AllInRates with same ids of both types when they are entered.', () => {
					const input = {
						cofs: [{
							term: '12',
							value: 1.5
						}, {
							term: '18',
							value: 2.0
						}],
						spreads: [{
								term: '12',
								amountRangeMin: 10000,
								amountRangeMax: 19999.99,
								value: 1.3
							}, {
								term: '12',
								amountRangeMin: 20000,
								amountRangeMax: 30000,
								value: -1.3
							},
							{
								term: '18',
								amountRangeMin: 10000,
								amountRangeMax: 19999.99,
								value: -1.3
							}, {
								term: '18',
								amountRangeMin: 20000,
								amountRangeMax: 30000,
								value: 1.55
							}
						]
					};
					const expected = [{
							term: '12',
							amountRangeMin: 10000,
							amountRangeMax: 19999.99,
							value: 2.8
						}, {
							term: '12',
							amountRangeMin: 20000,
							amountRangeMax: 30000,
							value: 0.2
						},
						{
							term: '18',
							amountRangeMin: 10000,
							amountRangeMax: 19999.99,
							value: 0.7
						}, {
							term: '18',
							amountRangeMin: 20000,
							amountRangeMax: 30000,
							value: 3.55
						}
					];

					const actual = RateCardCalculator.calculateAllInsOTHC(input);

					assert.strictEqual(actual.length, expected.length, 'Items are not the same length');

					_.each(actual, actualItem => {
						const {
							term,
							amountRangeMin,
							amountRangeMax
						} = actualItem;

						const expectedItem = _.find(expected, {
							term,
							amountRangeMin,
							amountRangeMax
						});

						assert.ok(expectedItem,
							`No expectedItem found for term: ${term}; amountRangeMin: ${amountRangeMin};amountRangeMax: ${amountRangeMax}`);
						assert.deepStrictEqual(actualItem, expectedItem,
							`term: ${term}; amountRangeMin: ${amountRangeMin};amountRangeMax: ${amountRangeMax}`);
					});
				});

			});

			it('Returns 8 All-In with an example from real data', () => {
				const input = {
					terms: ['12', '18'],
					inputs: [{
						'id': '5b99833b59470c022116e2e4',
						'name': 'BBB+ to BBB-',
						'terms': {
							'12': 240
						},
						'creditRatings': ['BBB+', 'BBB', 'BBB-'],
						'type': 'allin-out',
						'versionId': '5b9961655c467b0221b9e85d'
					}, {
						'id': '5b99833a5c467b0219bdf5be',
						'name': 'AA- to A-',
						'terms': {
							'12': 0
						},
						'creditRatings': ['AA-', 'A+', 'A', 'A-'],
						'type': 'allin-fmv',
						'versionId': '5b9961655c467b0221b9e85d'
					}, {
						'id': '5b99833acac39f0221b7a9af',
						'name': 'BB+ to BB',
						'terms': {
							'12': 0
						},
						'creditRatings': ['BB+', 'BB'],
						'type': 'allin-out',
						'versionId': '5b9961655c467b0221b9e85d'
					}, {
						'id': '5b99833a2ad7170221b6ffb3',
						'name': 'BB+ to BB',
						'terms': {
							'12': 0
						},
						'creditRatings': ['BB+', 'BB'],
						'type': 'allin-fmv',
						'versionId': '5b9961655c467b0221b9e85d'
					}, {
						'id': '5b99833a93fb030220bbd733',
						'name': 'AAA to AA',
						'terms': {
							'12': 0
						},
						'creditRatings': ['AAA', 'AA+', 'AA'],
						'type': 'allin-fmv',
						'versionId': '5b9961655c467b0221b9e85d'
					}, {
						'id': '5b99833a5c467b0221bb0355',
						'name': 'BBB+ to BBB-',
						'terms': {
							'12': 24.1
						},
						'creditRatings': ['BBB+', 'BBB', 'BBB-'],
						'type': 'allin-fmv',
						'versionId': '5b9961655c467b0221b9e85d'
					}, {
						'id': '5b99833a1ce6bb0221b9596c',
						'name': 'AA- to A-',
						'terms': {
							'12': 0
						},
						'creditRatings': ['AA-', 'A+', 'A', 'A-'],
						'type': 'allin-out',
						'versionId': '5b9961655c467b0221b9e85d'
					}, {
						'id': '5b99833a1ce6bb0219b77cf8',
						'name': 'AAA to AA',
						'terms': {
							'12': 0
						},
						'creditRatings': ['AAA', 'AA+', 'AA'],
						'type': 'allin-out',
						'versionId': '5b9961655c467b0221b9e85d'
					}, {
						'id': '5b996166b3747a0219b71667',
						'name': 'AA- to A-',
						'terms': {
							'12': '0.0'
						},
						'creditRatings': ['AA-', 'A+', 'A', 'A-'],
						'type': 'spread',
						'versionId': '5b9961655c467b0221b9e85d'
					}, {
						'id': '5b99616693fb030218ba86b9',
						'name': 'BB+ to BB',
						'terms': {
							'12': '0.0'
						},
						'creditRatings': ['BB+', 'BB'],
						'type': 'spread',
						'versionId': '5b9961655c467b0221b9e85d'
					}, {
						'id': '5b99616693fb030218ba86ba',
						'name': 'BBB+ to BBB-',
						'terms': {
							'12': 14
						},
						'creditRatings': ['BBB+', 'BBB', 'BBB-'],
						'type': 'spread',
						'versionId': '5b9961655c467b0221b9e85d'
					}, {
						'id': '5b996166d53a360220be34f9',
						'name': 'FMV',
						'terms': {
							'12': 0.1
						},
						'creditRatings': [],
						'type': 'cof',
						'versionId': '5b9961655c467b0221b9e85d'
					}, {
						'id': '5b9961662ad7170219bad2e4',
						'name': '$1 Out',
						'terms': {
							'12': '0.0'
						},
						'creditRatings': [],
						'type': 'cof',
						'versionId': '5b9961655c467b0221b9e85d'
					}, {
						'id': '5b996166625c1b0219be6bd7',
						'name': 'AAA to AA',
						'terms': {
							'12': '0.0'
						},
						'creditRatings': ['AAA', 'AA+', 'AA'],
						'type': 'spread',
						'versionId': '5b9961655c467b0221b9e85d'
					}]
				};
				const expected = [{
					'id': '5b99833a5c467b0219bdf5be',
					'name': 'AA- to A-',
					'terms': {
						'12': 0,
						'18': 0
					},
					'creditRatings': ['AA-', 'A+', 'A', 'A-'],
					'type': 'allin-fmv',
					'versionId': '5b9961655c467b0221b9e85d'
				}, {
					'id': '5b99833a1ce6bb0221b9596c',
					'name': 'AA- to A-',
					'terms': {
						'12': 0,
						'18': 0
					},
					'creditRatings': ['AA-', 'A+', 'A', 'A-'],
					'type': 'allin-out',
					'versionId': '5b9961655c467b0221b9e85d'
				}, {
					'id': '5b99833a2ad7170221b6ffb3',
					'name': 'BB+ to BB',
					'terms': {
						'12': 0,
						'18': 0
					},
					'creditRatings': ['BB+', 'BB'],
					'type': 'allin-fmv',
					'versionId': '5b9961655c467b0221b9e85d'
				}, {
					'id': '5b99833acac39f0221b7a9af',
					'name': 'BB+ to BB',
					'terms': {
						'12': 0,
						'18': 0
					},
					'creditRatings': ['BB+', 'BB'],
					'type': 'allin-out',
					'versionId': '5b9961655c467b0221b9e85d'
				}, {
					'id': '5b99833a5c467b0221bb0355',
					'name': 'BBB+ to BBB-',
					'terms': {
						'12': 14.1,
						'18': 0
					},
					'creditRatings': ['BBB+', 'BBB', 'BBB-'],
					'type': 'allin-fmv',
					'versionId': '5b9961655c467b0221b9e85d'
				}, {
					'id': '5b99833b59470c022116e2e4',
					'name': 'BBB+ to BBB-',
					'terms': {
						'12': 140,
						'18': 0
					},
					'creditRatings': ['BBB+', 'BBB', 'BBB-'],
					'type': 'allin-out',
					'versionId': '5b9961655c467b0221b9e85d'
				}, {
					'id': '5b99833a93fb030220bbd733',
					'name': 'AAA to AA',
					'terms': {
						'12': 0,
						'18': 0
					},
					'creditRatings': ['AAA', 'AA+', 'AA'],
					'type': 'allin-fmv',
					'versionId': '5b9961655c467b0221b9e85d'
				}, {
					'id': '5b99833a1ce6bb0219b77cf8',
					'name': 'AAA to AA',
					'terms': {
						'12': 0,
						'18': 0
					},
					'creditRatings': ['AAA', 'AA+', 'AA'],
					'type': 'allin-out',
					'versionId': '5b9961655c467b0221b9e85d'
				}];

				const actual = RateCardCalculator.calculateAllInsAFS(input);

				assert.strictEqual(actual.length, expected.length, 'Items are not the same length');

				_.each(actual, actualItem => {
					const {
						type,
						name
					} = actualItem;

					const expectedItem = _.find(expected, {
						type,
						name
					});

					assert.ok(expectedItem, `No expectedItem found for name: ${name}; type: ${type}`);
					assert.deepStrictEqual(actualItem, expectedItem, `No match for name: ${name}; type: ${type}`);
				});
			});

			it('Should return `null` with missing inputs.', () => {

				assert.strictEqual(RateCardCalculator.calculateAllInsAFS(), null, 'Result is not null with no data');

				assert.strictEqual(RateCardCalculator.calculateAllInsAFS([]), null, 'Result is not null with empty array.');

				assert.strictEqual(RateCardCalculator.calculateAllInsAFS([{},
					{
						name: 'FMV'
					},
					{
						type: 'non-supported'
					}
				]), null, 'Result is not null with invalidt inputs.');
			});
		});
		describe('#roundDown()', () => {
			it('should round to up if last is greater than 5', () => {
				assert.strictEqual(RateCardCalculator.roundDown(0.003456, 5), 0.00346);
				assert.strictEqual(RateCardCalculator.roundDown(23.303458, 5), 23.30346);
			});
			it('should round down if last is equal to 5', () => {
				assert.strictEqual(RateCardCalculator.roundDown(0.003455, 5), 0.00345);
				assert.strictEqual(RateCardCalculator.roundDown(23.303455, 5), 23.30345);
				assert.strictEqual(RateCardCalculator.roundDown(0.0035500, 4), 0.0035);
				assert.strictEqual(RateCardCalculator.roundDown(0.003425, 5), 0.00342);
				assert.strictEqual(RateCardCalculator.roundDown(0.013557734235, 11), 0.01355773423);
			});
		});

		describe('#calculateRateFactors()', () => {
			it('Returns rate factors with all required data', () => {
				const versionId = 'version--0001';
				const terms = ['12', '24'];
				const creditRatings = ['AAA', 'AA+', 'AA'];
				const inputs = [{
					type: 'cof',
					name: 'FMV',
					terms: {
						'24': 0.1
					},
				}, {
					type: 'cof',
					name: '$1 Out',
					terms: {
						'24': 1.0
					},
				}, {
					type: 'spread',
					name: 'AAA to AA',
					creditRatings: ['AAA', 'AA+', 'AA'],
					terms: {
						'24': 0.2
					}
				}];
				const products = [{
					uid: '1',
					name: 'MacBook Pro',
					categoryId: '1',
					seq: '1001',
					order: 1,
					hasItad: true,
					itadValue: 100,
					terms: {
						'24': 0.3
					}
				}, {
					uid: '2',
					name: 'MacBook Air',
					categoryId: '2',
					seq: '1002',
					order: 1,
					terms: {
						'24': 1.0
					}
				}];

				const rateFactors = RateCardCalculator.calculateRateFactors({
					versionId,
					terms,
					creditRatings,
					inputs,
					products
				});

				rateFactors.should.be.Array();
				rateFactors.length.should.equal(creditRatings.length * terms.length + creditRatings.length * terms.length * products.length);

				_.each(rateFactors, rateFactor => {
					const {
						value,
						term: rfTerm,
						versionId: rfVersionId,
						creditRating: rfCreditRating,
						productId: rfProductId,
						rate: rfRate
					} = rateFactor;

					rfVersionId.should.equal(versionId);

					value.should.be.a.Number();

					rfTerm.should.not.be.empty();
					rfTerm.should.be.String();

					rfCreditRating.should.not.be.empty();
					rfCreditRating.should.be.String();

					rfRate.should.not.be.empty();
					rfRate.should.be.String();

					(terms.includes(rfTerm)).should.be.ok();
					(creditRatings.includes(rfCreditRating)).should.be.ok();

					if (rfRate === 'fmv') {
						const product = _.find(products, {
							uid: rfProductId
						});

						product.should.not.be.empty();
					}
				});

			});

			it('Should return `[]` with no inputs.', () => {
				const cofs = [];
				const spreads = [];
				const hedge = [];

				assert.deepStrictEqual(RateCardCalculator.calculateRateFactors(), [], 'Result is not [] with no data');

				assert.deepStrictEqual(RateCardCalculator.calculateRateFactors({
					cofs,
					spreads,
					hedge
				}), [], 'Result is not [] with no residuals');

				assert.deepStrictEqual(RateCardCalculator.calculateRateFactors({
					cofs: [],
					spreads: [],
					hedge: [],
					residuals: []
				}), [], 'Result is not [] with empty arrays');

				assert.deepStrictEqual(RateCardCalculator.calculateRateFactors({
					cofs: {},
					spreads: {},
					hedge: {},
					residuals: {}
				}), [], 'Result is not [] with empty objects');
			});
		});

		describe('#calculateExcelFV()', () => {
			it('Should calculate the same values as excel', () => {
				const input = {
					rate: 0.0625 / 12,
					numberOfPayments: 3,
					payment: 0,
					present: -1,
					type: 0
				};

				const expected = 1.0157065;
				const actual = RateCardCalculator.calculateExcelFV(input);

				actual.should.equal(expected);
			});
		});
	});
});
