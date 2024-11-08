import { NumberToArrayPipe } from './number-to-array.pipe';

describe('NumberToArrayPipe', () => {
	let pipe: NumberToArrayPipe;

	beforeEach(() => {
		pipe = new NumberToArrayPipe();
	});

	it('create an instance', () => {
		expect(pipe).toBeTruthy();
	});

	describe('#transform', () => {
		it('should function transform return array in line text', () => {
			const value = 5;
			const expected = '0, 1, 2, 3, 4, 5';
			const actual = pipe.transform(value);

			expect(expected).toEqual(actual);
		});

		it('should function transform return array in line text and extra param with ".00"', () => {
			const value = 5;
			const expected = '0.00, 1.00, 2.00, 3.00, 4.00, 5.00';
			const extra = '.00';
			const actual = pipe.transform(value, extra);

			expect(expected).toEqual(actual);
		});
	});
});
