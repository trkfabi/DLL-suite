export interface ICompareRates {
	productID: number;
	catID: number;
	type: string;
	creditRating: string;
	terms: {};
	date: () => number | string;
	status: string | number;
}
