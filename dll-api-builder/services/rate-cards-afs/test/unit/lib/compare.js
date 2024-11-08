const assert = require('assert');
const _ = require('lodash');
const Compare = require('../../../lib/compare');

describe('services/rate-cards', () => {
	describe('lib/compare', () => {
		const compare = new Compare();
		describe('#compareName()', () => {
			const previousObject = {
				'100': {
					name: 'Category 1',
					value: 0
				},
				'101': {
					name: 'Category 2',
					value: 0
				}
			};

			const currentObject = {
				'100': {
					name: 'Category 1 changed',
					value: 0
				},
				'102': {
					name: 'Category 3',
					value: 0
				}
			};

			it('Should have as many keys as union of keys between previous and current object', () => {

				const actual = compare.loadComparisonObject(previousObject, currentObject, false);
				const actualKeys = Object.keys(actual).length;
				const expected = 3;

				assert.strictEqual(actualKeys, expected);
			});

			it('Common key with different name between objects should have status edited', () => {

				const actual = compare.loadComparisonObject(previousObject, currentObject, false);
				const status = actual['100'].status;
				const expected = 'edited';
				assert.strictEqual(status, expected);
			});
			it('Key in previous object and not in current object should have status deleted', () => {

				const actual = compare.loadComparisonObject(previousObject, currentObject, false);
				const status = actual['101'].status;
				const expected = 'deleted';
				assert.strictEqual(status, expected);
			});
			it('Key in new object and not in previous object should have status new', () => {

				const actual = compare.loadComparisonObject(previousObject, currentObject, false);
				const status = actual['102'].status;
				const expected = 'new';
				assert.strictEqual(status, expected);
			});

			it('Should return all status new if previous object is empty', () => {

				const actual = compare.loadComparisonObject({}, currentObject, false);

				_.each(actual, actualItem => {
					const {
						status
					} = actualItem;

					const statusOk = (status == 'new');

					assert.ok(statusOk, `Status is not new`);
				});

			});
			it('Should return all status deleted if current object is empty', () => {

				const actual = compare.loadComparisonObject(previousObject, {}, false);

				_.each(actual, actualItem => {
					const {
						status
					} = actualItem;

					const statusOk = (status == 'deleted');

					assert.ok(statusOk, `Status is not deleted`);
				});

			});

		});
		describe('#compareNumericValue()', () => {

			const previousObject = {
				'100': {
					name: 'Item1',
					value: 1.3
				},
				'101': {
					name: 'Item2',
					value: 2
				},
				'102': {
					name: 'Item3',
					value: 2
				}
			};

			const currentObject = {
				'100': {
					name: 'Item11',
					value: 1
				},
				'101': {
					name: 'Item 21',
					value: 3
				},
				'102': {
					name: 'Item3',
					value: 2
				}
			};
			it('Should return status higher for a common key if value of currentObject is greater than value of previous object', () => {
				const actual = compare.loadComparisonObject(previousObject, currentObject, true);
				const status = actual['101'].status;
				const expected = 'higher';
				assert.strictEqual(status, expected);
			});
			it('Should return status higher for a common key if currentObject is greater than value of previous object', () => {
				const actual = compare.loadComparisonObject(previousObject, currentObject, true);
				const status = actual['100'].status;
				const expected = 'lower';
				assert.strictEqual(status, expected);
			});
			it('Should return status null for a common key if currentObject is equal to value of previous object', () => {
				const actual = compare.loadComparisonObject(previousObject, currentObject, true);
				const status = actual['102'].status;
				const expected = null;
				assert.strictEqual(status, expected);
			});
			it('Should return all status new if previous object is empty', () => {

				const actual = compare.loadComparisonObject({}, currentObject, true);

				_.each(actual, actualItem => {
					const {
						status
					} = actualItem;

					const statusOk = (status == 'new');

					assert.ok(statusOk, `Status is not new`);
				});

			});
			it('Should return all status deleted if current object is empty', () => {

				const actual = compare.loadComparisonObject(previousObject, {}, true);

				_.each(actual, actualItem => {
					const {
						status
					} = actualItem;

					const statusOk = (status == 'deleted');

					assert.ok(statusOk, `Status is not deleted`);
				});

			});

		});
	});
});
