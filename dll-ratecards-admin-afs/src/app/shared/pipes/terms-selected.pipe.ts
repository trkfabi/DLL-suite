import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';

@Pipe({
	name: 'termsSelected',
})
export class TermsSelectedPipe implements PipeTransform {
	/**
	 * This pipe return a text with terms and add a span to terms default
	 * @param {string[]} terms Receives terms list
	 * @param {object[]} selected Receives default value from terms
	 * @return {string}
	 */
	public transform(terms: string[], ...selected): string {
		terms.sort((_a, _b) => Number(_a) - Number(_b));
		return _.chain(terms)
			.map((item) => {
				if (selected && selected[0].term === item) {
					return ` <span class="selected">${item}</span>`;
				}
				return ` ${item}`;
			})
			.value();
	}
}
