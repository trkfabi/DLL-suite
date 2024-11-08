/**
 * @class IAmountProperties
 * @abstract
 * Amount properties from Rate Program
 * Amount Properties `Interface`
 * @property {number} min
 * @property {number} max
 * @version 1.0.0
 */
export interface IAmountProperties {
	check: boolean;
	delete: boolean;
	minValue: number | string;
	maxValue: number | string;
	error: string | null;
	confirm: boolean;
	confirmMessage: boolean;
	disabledMinimum: boolean;
	disabledMaximum: boolean;
	deleteConfirm: boolean;
}
