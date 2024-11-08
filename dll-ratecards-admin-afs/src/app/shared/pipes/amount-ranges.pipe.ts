import { Pipe, PipeTransform } from '@angular/core';
import { NumberHelper } from '@lib/index';
import { IAmountRanges } from '@shared/interfaces/amount-ranges.interface';
import * as _ from 'lodash';

@Pipe({
	name: 'amountRanges',
})
export class AmountRangesPipe implements PipeTransform {
	constructor(private _numberHelper: NumberHelper) {}
	/**
	 * This pipe return a text with amount ranges oreder with min-max values
	 * @param {object[]} amounts
	 * @return {∫tring}
	 */
	public transform(amounts: IAmountRanges[]): string {
		return _.chain(amounts)
			.map((item) => {
				const min = this._numberHelper.formatNumber(item.min);
				const max = this._numberHelper.formatNumber(item.max);
				return ` $${min} - $${max}`;
			})
			.value();
	}
}
