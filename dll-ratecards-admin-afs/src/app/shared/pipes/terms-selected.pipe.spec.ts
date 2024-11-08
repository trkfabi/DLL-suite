import { TermsSelectedPipe } from './terms-selected.pipe';

describe('TermsSelectedPipe', () => {
	let pipe: TermsSelectedPipe;

	beforeEach(() => {
		pipe = new TermsSelectedPipe();
	});

	it('create an instance', () => {
		expect(pipe).toBeTruthy();
	});

	describe('#transform', () => {
		it('should function transform return a text with terms and add a span to terms default', () => {
			const terms: string[] = ['1', '2', '3', '4', '5'];
			const selected = { term: '2' };
			const expected = [' 1', ' <span class="selected">2</span>', ' 3', ' 4', ' 5'];
			const actual = pipe.transform(terms, selected);

			expect(expected).toEqual(actual);
		});
	});
});
