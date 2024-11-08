export interface IProduct {
	productID: number;
	seqID: string;
	categoryId: number;
	catName: string;
	type: string;
	name: string;
	index: number;
	itad: boolean;
	itadCost: number;
	terms: {};
	date: Date;
	status: string | number;
}
