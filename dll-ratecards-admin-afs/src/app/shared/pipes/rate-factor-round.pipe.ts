import { Pipe, PipeTransform } from '@angular/core';
import { NumberHelper } from '@lib/index';

const DEFAULT_DECIMALS = 6;
const DEFAULT_POINTS = 'points';

@Pipe({
	name: 'rateFactorRound',
})
export class RateFactorRoundPipe implements PipeTransform {
	constructor(private _numberHelper: NumberHelper) {}
	/**
	 * This pipe return a text or number rounded
	 * @param {string|number} _value receives value from rate factor row value
	 * @param {string} _field receives field name from column
	 * @return {string|number}
	 */
	transform(_value, _field?: string) {
		if (isNaN(_value) || (_field && _field === DEFAULT_POINTS)) {
			return _value;
		}
		return this._numberHelper.formatToFixed(_value, DEFAULT_DECIMALS);
	}
}
