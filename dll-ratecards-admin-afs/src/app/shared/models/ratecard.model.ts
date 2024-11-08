export interface IRateCard {
	id?: string;
	name: string;
	versionInProgress: string;
	versionPublished: string;
	order: number;
	lastPublished: string;
	lastUpdated: string;
	isPublished: boolean;
	isLoading?: boolean;
}
