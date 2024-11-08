import { IAmountRanges } from './amount-ranges.interface';

/**
 * @class IRateProgram
 * @abstract
 * Rate Program properties
 * Rate Program `Interface`
 * @property {string} id
 * @property {string} versionId
 * @property {string} name
 * @property {boolean} promo
 * @property {number} order
 * @property {number} points
 * @property {string[]} terms
 * @property {object} defaults
 * @property {object[]} amountRanges
 * @property {string[]} purchaseOptions
 * @property {number[]} advancePayments
 * @property {number[]} advanceSecurityPayments
 * @property {string[]} paymentFrequencies
 * @property {number} deferrals
 * @property {object[]} residuals
 * @property {object[]} spreads
 * @property {object[]} allInRates
 * @property {boolean} deleted
 * @version 1.0.0
 */
export interface IRateProgram {
	id?: string;
	versionId: string;
	name: string;
	promo: boolean;
	order: number;
	points: number;
	terms?: string[];
	defaults: { term: string };
	amountRanges: IAmountRanges[];
	purchaseOptions: string[];
	advancePayments: number;
	advanceSecurityPayments: number;
	paymentFrequencies: string[];
	deferrals: number;
	residuals?: object[];
	spreads?: object[];
	allInRates?: object[];
	deleted?: boolean;
	selected?: boolean;
	versions?: [];
}
