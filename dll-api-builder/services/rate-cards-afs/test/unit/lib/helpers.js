const assert = require('assert');
const Helpers = require('../../../lib/helpers');
const should = require('should');

describe('services/rate-cards', () => {
	describe('lib/helpers', () => {
		describe('#updateObjectFromArray()', () => {
			const initialArray = ['12', '24', '48'];

			it('Should create an object with empty values if only initial array sent', () => {
				const expectedObject = {
					'12': 0,
					'24': 0,
					'48': 0
				}
				const result = Helpers.updateObjectFromArray(initialArray);
				assert.deepEqual(result, expectedObject);
			});
			it('Should remove key:values where key is not in initial array', () => {
				const expectedObject = {
					'12': 0.5,
					'24': 0.4,
					'48': 0.3
				};
				const objectToUpdate = {
					'12': 0.5,
					'18': 0.7,
					'24': 0.4,
					'48': 0.3
				}
				const result = Helpers.updateObjectFromArray(initialArray, objectToUpdate);
				assert.deepEqual(result, expectedObject);
			});
			it('Should add key with empty value if initial array item not found in objectToupdate', () => {
				const expectedObject = {
					'12': 0.5,
					'24': 0,
					'48': 0
				};
				const objectToUpdate = {
					'12': 0.5
				}
				const result = Helpers.updateObjectFromArray(initialArray, objectToUpdate);
				assert.deepEqual(result, expectedObject);
			});
		});
		describe('#updateTermsOnArray()', () => {
			const initialArray = ['12', '24', '48'];

			it('Should add one object with the term as key for each item in the initial array', () => {
				const expectedArray = [{
						term: '12',
						value: 0
					},
					{
						term: '24',
						value: 0
					},
					{
						term: '48',
						value: 0
					}
				];
				const result = Helpers.updateTermsOnArray(initialArray);
				assert.deepEqual(result, expectedArray);
			});
			it('Should remove objects where key term is not in initial array', () => {
				const expectedArray = [{
						term: '12',
						value: 0.5
					},
					{
						term: '24',
						value: 0.5
					},
					{
						term: '48',
						value: 0
					}
				];
				const arrayToUpdate = [{
						term: '12',
						value: 0.5
					},
					{
						term: '24',
						value: 0.5
					},
					{
						term: '36',
						value: 0
					}
				];

				const result = Helpers.updateTermsOnArray(initialArray, arrayToUpdate);
				assert.deepEqual(result, expectedArray);

			});
		});
		describe('#sanitizeTerms()', () => {

			it('Should validate invalid terms and remove them', () => {
				const terms = ['1', 'a', 'b', '0010', null];
				const expected = ['1', '10'];

				const result = Helpers.sanitizeTerms(terms);
				assert.deepEqual(result, expected);
			});
		});
		describe('#validateName()', () => {
			const collection = [{
					name: 'Name 1',
					uid: 'ABC123'
				},
				{
					name: 'Name 2',
					uid: 'ABC1234'
				}

			];

			it('Should throw error if name is longer than maxAllowedCharacters', () => {
				const name = 'Test Name';
				const maxAllowedCharacters = 6;

				should.throws(() => {
					Helpers.validateName({
						name,
						maxAllowedCharacters
					})
				});
			});
			it('Should throw an error if the name already exists in collection', () => {
				const name = 'Name 1';

				should.throws(() => {
					Helpers.validateName({
						name,
						collection
					})
				});

			});
			it('Should not throw an error if the name and the ui already exists in collection', () => {
				const name = 'Name 1';
				const uid = 'ABC123';
				should.doesNotThrow(() => {
					Helpers.validateName({
						name,
						uid,
						collection
					})
				});

			});
		});

		describe('#combine()', () => {
			it('Should combine simple arrays with equal amounts of items', () => {
				const input = [
					['a', 'b'],
					['c', 'd'],
					['e', 'f'],
				];

				const expected = [
					['a', 'c', 'e'],
					['a', 'c', 'f'],
					['a', 'd', 'e'],
					['a', 'd', 'f'],
					['b', 'c', 'e'],
					['b', 'c', 'f'],
					['b', 'd', 'e'],
					['b', 'd', 'f'],
				];

				const actual = Helpers.combine(input);
				actual.should.deepEqual(expected);
			});

			it('Should combine simple arrays with unequal amounts of items', () => {
				const input = [
					['a'],
					['c', 'd'],
					['e'],
				];

				const expected = [
					['a', 'c', 'e'],
					['a', 'd', 'e'],
				];

				const actual = Helpers.combine(input);
				actual.should.deepEqual(expected);
			});

			it('Should combine complex types of arrays', () => {
				const input = [
					['12', '24', '36'],
					['F', 'D', 'P'],
					['M', 'Q', 'SA', 'A'],
					[1, 2, 3, 4]
				];

				const result = Helpers.combine(input);

				result.should.be.an.Array();
				result.should.have.length(3 * 3 * 4 * 4);

				result.forEach(item => {
					item.should.be.an.Array();
					item.should.have.length(4);
					item[0].should.be.String();
					item[1].should.be.String();
					item[2].should.be.String();
					item[3].should.be.Number();
				});
			});
		})
	});
});
