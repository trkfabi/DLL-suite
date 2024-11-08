import { TestBed } from '@angular/core/testing';
import { NumberHelper } from '@lib/index';
import { RateFactorRoundPipe } from './rate-factor-round.pipe';

describe('RateFactorRoundPipe', () => {
	let pipe: RateFactorRoundPipe;
	let numberHelper: NumberHelper;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [NumberHelper],
		});
		numberHelper = TestBed.inject(NumberHelper);
		pipe = new RateFactorRoundPipe(numberHelper);
	});

	it('create an instance', () => {
		expect(pipe).toBeTruthy();
	});

	describe('#transform', () => {
		it('should function transform return text value', () => {
			const value = 'F';
			const expected = 'F';
			const actual = pipe.transform(value);

			expect(expected).toEqual(actual);
		});

		it('should function transform return same number value', () => {
			const value = 0.5030021;
			const expected = '0.503002';
			const actual = pipe.transform(value);

			expect(expected).toEqual(actual);
		});

		it('should function transform return rounded number value', () => {
			const value = 0.5030028;
			const expected = '0.503003';
			const actual = pipe.transform(value);

			expect(expected).toEqual(actual);
		});

		it('should function transform input field and return number value', () => {
			const field = 'points';
			const value = 1;
			const expected = 1;
			const actual = pipe.transform(value, field);

			expect(expected).toEqual(actual);
		});
	});
});
