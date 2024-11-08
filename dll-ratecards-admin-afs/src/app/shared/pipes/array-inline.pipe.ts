import { Pipe, PipeTransform } from '@angular/core';

const PAYMENT_FREQUENCIES = 'paymentFrequencies';
const DEFAULT_ANNUALLY = 'A';

@Pipe({
	name: 'arrayInline',
})
export class ArrayInlinePipe implements PipeTransform {
	/**
	 * This pipe return an array in line with separtions
	 * @param {any[]} _values Array with different values
	 * @param {string} _separation Separation for array
	 * @param {string} _type optionam param receives type for validate
	 * @return {string}
	 */
	public transform(_values: any[], _separation: string, _type?: string): string {
		if (_values.length > 0 && _type && _type === PAYMENT_FREQUENCIES) {
			_values.sort();
			if (_values.indexOf(DEFAULT_ANNUALLY) > -1) {
				const annually = _values[0];
				_values.shift();
				_values.push(annually);
			}
		}
		if (_values.length > 0) {
			return _values.join(_separation);
		}
		return '';
	}
}
