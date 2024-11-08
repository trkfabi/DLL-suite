import { CommonModule } from '@angular/common';

import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';

const PURCHASE_OPTIONS = [
	{ name: 'FMV', value: 'F', param: 'fmv' },
	{ name: 'FPO', value: 'P', param: 'fpo' },
	{ name: '$1', value: 'D', param: 'd' },
];

@Pipe({
	name: 'purchaseOptions',
})
export class PurchaseOptionsPipe implements PipeTransform {
	/**
	 * This pipe return a text with purchase options list
	 * @param {string[]} values Receives terms list
	 * @return {string}
	 */
	transform(values: string[]): string {
		return _.chain(values)
			.map((_item) => {
				const item = _.find(PURCHASE_OPTIONS, (option) => {
					if (_item === option.value || _item === option.param) {
						return option;
					}
				});
				if (item) {
					return item.name;
				}
			})
			.value()
			.join(', ');
	}
}
