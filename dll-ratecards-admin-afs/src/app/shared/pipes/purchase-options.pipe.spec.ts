import { PurchaseOptionsPipe } from './purchase-options.pipe';

describe('PurchaceOptionsPipe', () => {
	let pipe: PurchaseOptionsPipe;

	beforeEach(() => {
		pipe = new PurchaseOptionsPipe();
	});

	it('create an instance', () => {
		expect(pipe).toBeTruthy();
	});

	describe('#transform', () => {
		it('should function transform return a text with purchase option slist', () => {
			const PURCHASE_OPTIONS = ['F', 'P', 'D'];
			const expected = 'FMV, FPO, $1';
			const actual = pipe.transform(PURCHASE_OPTIONS);

			expect(expected).toEqual(actual);
		});

		it('should function transform return a text with purchase option from api values', () => {
			const PURCHASE_OPTIONS = ['fmv', 'fpo', 'd'];
			const expected = 'FMV, FPO, $1';
			const actual = pipe.transform(PURCHASE_OPTIONS);

			expect(expected).toEqual(actual);
		});
	});
});
