export interface ITerm {
	termID: number;
	name: string; // must be a string due kendo-ui requirements.
	value: number;
	date: Date;
	index: number;
	status: number;
}
