/**
 * @class GridColumn
 * @abstract
 * @version 1.0.0
 */
export interface IGridColumn {
	columnName: string;
	columnGroup: string;
	isEditable: boolean;
	isLockable: boolean;
	isSortable: boolean;
}
