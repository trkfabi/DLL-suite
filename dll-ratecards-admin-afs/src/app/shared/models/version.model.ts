export interface IVersion {
	id: string;
	dateCreated: string;
	dateUpdated: string;
	rateCardId: string;
	terms: object;
	creditRatings: string[];
	canPublish: boolean;
	isArchived: boolean;
	deleted: boolean;
}
