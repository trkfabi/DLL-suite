import { TestBed } from '@angular/core/testing';
import { NumberHelper } from '@lib/index';
import { IAmountRanges } from '@shared/interfaces/index';
import { AmountRangesPipe } from './amount-ranges.pipe';

describe('AmountRangesPipe', () => {
	let pipe: AmountRangesPipe;
	let numberHelper: NumberHelper;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [NumberHelper],
		});
		numberHelper = TestBed.inject(NumberHelper);
		pipe = new AmountRangesPipe(numberHelper);
	});

	it('create an instance', () => {
		expect(pipe).toBeTruthy();
	});

	describe('#transform', () => {
		it('should function transform return amount rates in line text', () => {
			const amounts: IAmountRanges[] = [{ min: 10000, max: 20000 }];
			const expected = [' $10,000.00 - $20,000.00'];
			const actual = pipe.transform(amounts);

			expect(expected).toEqual(actual);
		});
	});
});
