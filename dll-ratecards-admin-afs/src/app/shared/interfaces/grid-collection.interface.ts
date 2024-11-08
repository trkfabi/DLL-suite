/**
 * @class GridCollection
 * @abstract
 * @property { String } gridCollections.gridType the Grid type to group columns with rows.
 * @property { String } gridCollections.gridName The grid name to display as title.
 * @property { String } gridCollections.gridFirstColumnName The grid firstColumnName to display as column title.
 * @property { Boolean } gridCollections.editable Enable the editable option on grid.
 * @version 1.0.0
 */
export interface IGridCollection {
	gridCollection: string;
	gridType: string;
	gridName: string;
	columns: {};
	isEditable: boolean;
	isSortable: boolean;
}
