/**
 * @class IFiltersRateFactors
 * @abstract
 * Filter properties for Rate Factors dropdowns
 * FiltersRateFactors `Interface`
 * @property {string}
 * @version 1.0.0
 */
export interface IFiltersRateFactors {
	text: string;
	value: number | string;
	selected?: boolean;
}
