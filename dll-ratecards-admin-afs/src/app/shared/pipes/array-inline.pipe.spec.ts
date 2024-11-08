import { ArrayInlinePipe } from './array-inline.pipe';

describe('ArrayInlinePipe', () => {
	let pipe: ArrayInlinePipe;

	beforeEach(() => {
		pipe = new ArrayInlinePipe();
	});

	it('create an instance', () => {
		expect(pipe).toBeTruthy();
	});

	describe('#transform', () => {
		it('should function transform return array in line text', () => {
			const value: number[] = [1, 2, 3, 4, 5];
			const expected = '1, 2, 3, 4, 5';
			const separator = ', ';
			const actual = pipe.transform(value, separator);

			expect(expected).toEqual(actual);
		});

		it('should function transform input type "paymentFrequencies"', () => {
			const type = 'paymentFrequencies';
			const value = ['Q', 'SA', 'A'];
			const expected = 'Q, SA, A';
			const separator = ', ';
			const actual = pipe.transform(value, separator, type);

			expect(expected).toEqual(actual);
		});
	});
});
