import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'numberToArray',
})
export class NumberToArrayPipe implements PipeTransform {
	/**
	 * This pipe return an string line from number
	 * @param {number} values receives number value
	 * @param {string} extra receives extra value for numbers
	 * @return {string}
	 */
	public transform(values: number, ...extra): string {
		if (values > 0) {
			const limitValue = values + 1;
			let result = [...Array(limitValue).keys()].join(', ');
			if (extra.length > 0) {
				result = result.replace(/,/g, `${extra[0]},`) + extra[0];
			}
			return result;
		}
		return '';
	}
}
