import { forwardRef, Inject, Injectable, OnInit } from '@angular/core';
import { Subject } from 'rxjs';

import { IGridCollection } from '../../shared/interfaces/grid-collection.interface';
import { IGridColumn } from '../../shared/interfaces/grid-columns.interface';
import { ITerm } from '../../shared/models/terms.model';
import { GRID_COLLECTIONS } from '../collections';

import { NumberHelper } from '../../lib/helpers/number.helper';
import { AppSettings, doLog } from '../app-settings';

import * as _ from 'lodash';
import { log } from 'util';

const LOG_TAG = '[core/factories/GridFactory]';

/**
 * @class GridFactory
 * Creates the data structure to generate the Grids.
 * @uses shared.interfaces.IGridCollection
 * @uses collections.GRID_COLLECTIONS
 */
@Injectable()
export class GridFactory {
	/**
	 * @property {Object[]} gridCollections Get all the Grids Collections with default data as title.
	 * @property { String } gridCollections.gridType the Grid type to group columns with rows.
	 * @property { String } gridCollections.gridName The grid name to display as title.
	 * @property { String } gridCollections.gridFirstColumnName The grid firstColumnName to display as column title.
	 * @property { Boolean } gridCollectionseditable Enable the editable option on grid.
	 */
	private gridCollections: IGridCollection[] = GRID_COLLECTIONS;

	/**
	 * @property {Object} grid stores the grid data and structure.
	 */
	private grid;

	constructor(
		@Inject(forwardRef(() => AppSettings))
		private _appSettings: AppSettings,
		@Inject(forwardRef(() => NumberHelper))
		private _numberHelper: NumberHelper
	) {}

	/**
	 * @method createGrid
	 * Create the grids data structure based on the grid data received from GridComponent.
	 * @param {Object} _gridData Grid Data information.
	 */
	public createGrid(_gridData) {
		doLog && console.log(LOG_TAG, ' - createGrids');
		let gridCollection;
		let columns;
		let rows;
		gridCollection = _.find(GRID_COLLECTIONS, (_collection) => {
			return _collection.gridCollection === _gridData.collection && _collection.gridType === _gridData.type;
		});
		this.grid = _.clone(gridCollection);
		columns = this.generateColumns(gridCollection, _gridData);
		rows = this.generateRows(_gridData.data, columns, gridCollection);
		_.extend(this.grid, {
			columns,
			rows,
		});
		this.grid = this.calculateColumnsWidth(this.grid);
		if (this.grid.isGroupable) {
			const groupedColumns = _.map(_.groupBy(columns, { isGroupable: true }), (_groups, _key) => {
				return ([_key] = _groups);
			});
			this.grid.columns = groupedColumns;
		}
		return new Promise((_resolve, _error) => {
			if (!this.grid) {
				_error();
			}
			_resolve(this.grid);
		});
	}

	/**
	 * @method generateColumns
	 * Generates the columns data.
	 * @param _gridCollectionData Grid collection and static data.
	 * @param _data The terms list generate the dynamic columns.
	 * @return {Object[]}
	 */
	private generateColumns(_gridCollectionData, _data) {
		doLog && console.log(LOG_TAG, ' - generateColumns');
		let columns = [];

		const column: IGridColumn = {
			columnName: null,
			columnGroup: null,
			isEditable: !!_gridCollectionData.isEditable,
			isLockable: true,
			isSortable: false,
		};

		if (_data.data && _data.data.length > 0) {
			const categories = _data.categories;
			let category;
			const firstRecord = _data.data[0];
			_.each(firstRecord, (_record, _recordKey) => {
				const isColumn = _.find(_gridCollectionData.columns, {
					columnGroup: _recordKey,
				});
				if (!isColumn) {
					return;
				}

				if (categories && firstRecord.categoryId) {
					category = _.find(categories, {
						id: firstRecord.categoryId,
					});
				}
				// Replace category Id by Category name in order to display the category name on the columns.
				if (category) {
					_.extend(firstRecord, { categoryName: category.name });
				}

				const newColumn = _.clone(column);
				_.extend(newColumn, {
					columnName: isColumn.columnName.toUpperCase(),
					columnGroup: isColumn.columnGroup,
					sortable: isColumn.isSortable,
					isEditable: isColumn.isEditable,
				});
				columns.push(newColumn);
			});
		} else {
			// Gather header for empty columns
			_gridCollectionData.columns.forEach((element) => {
				const newColumn = _.clone(column);
				_.extend(newColumn, {
					columnName: element.columnName.toUpperCase(),
					columnGroup: element.columnGroup,
					sortable: element.isSortable,
					isEditable: element.isEditable,
				});
				columns.push(newColumn);
			});
		}

		if (_data.terms) {
			_.each(_data.terms, (_term) => {
				const newColumn = _.clone(column);
				_.extend(newColumn, {
					columnName: _term.toString(),
					columnTerm: parseInt(_term, 10),
					columnGroup: 'term' + _term.toString(),
					isEditable: !!_gridCollectionData.isEditable,
					isLockable: false,
					sortable: false,
				});
				if (_data.categories) {
					_.extend(this.grid, {
						isGroupable: true,
					});
					_.extend(newColumn, {
						isGroupable: true,
					});
				}
				columns.push(newColumn);
			});
			columns = _.orderBy(columns, ['columnTerm'], ['asc']);
		}
		return this.resortColumns(columns, _gridCollectionData);
	}

	/**
	 * @method generateRows
	 * Generates the rows mapping the data received from webservices and columns generated.
	 * @param _data Records received from GET webservices.
	 * @param _columns Columns generated by the `generateColumns()` method
	 * @return {Object[]}
	 */
	private generateRows(_data, _columns, _gridCollectionData) {
		doLog && console.log(LOG_TAG, ' - generateRows');
		let rows;
		rows = [];
		rows = _.map(_data, (_row) => {
			let row;
			row = {};
			_.each(_row.terms, (_term, _key) => {
				let rowKey;
				rowKey = `term${[_key]}`;
				if (_.isNumber(_term)) {
					if (_gridCollectionData.gridType === 'RSD') {
						_term = this._numberHelper.formatResidual(_term || 0, 2);
					} else if (_gridCollectionData.gridType === 'RC' || _gridCollectionData.gridType === 'RCC') {
						_term = this._numberHelper.formatPercentage(_term || 0, 6, _gridCollectionData.gridType);
					} else {
						_term = this._numberHelper.formatPercentage(_term || 0);
					}
				}
				_.extend(row, {
					[rowKey]: _term,
				});
			});
			_.each(_columns, (_column) => {
				if (
					_gridCollectionData.gridType !== 'RCC' &&
					_gridCollectionData.gridType !== 'RC' &&
					_column.columnGroup.includes('term') &&
					!_.find(_row.terms, (_term, _key) => {
						return _key === _column.columnName;
					})
				) {
					if (_gridCollectionData.gridType === 'RSD') {
						_.extend(row, {
							[_column.columnGroup]: this._numberHelper.formatResidual(0),
						});
					} else {
						_.extend(row, {
							[_column.columnGroup]: this._numberHelper.formatPercentage(0),
						});
					}
				}
			});
			_.each(_row, (_rowData, _key) => {
				if (_key !== 'terms') {
					if (_key === 'itadValue') {
						_rowData =
							_rowData !== null
								? this._numberHelper.currenctyFormat(_rowData, true)
								: this._numberHelper.currenctyFormat(0, true);
					}
					_.extend(row, {
						[_key]: _rowData,
					});
				}
			});
			_.extend(row, { terms: _row.terms });
			return row;
		});

		return rows;
	}

	/**
	 * @method calculateColumnsWidth
	 * Calculates the width of the columns.
	 * @param {Object} _grid The grid object with all the data needed to calculate the columns.
	 * @return {Object}
	 */
	private calculateColumnsWidth(_grid) {
		const maxColumnsDisplay = this._appSettings.getColumnsSettings().maxTermsColumns;
		const maxColumnWidth = this._appSettings.getColumnsSettings().staticColumnsWidth;
		const lockableColumns = _.filter(_grid.columns, (_column) => {
			return _column.isLockable;
		});
		const termColumns = _.filter(_grid.columns, (_column) => {
			return !_column.isLockable;
		});
		let lockableColumnWidth;
		let termColumnWidth;
		lockableColumnWidth = maxColumnWidth / lockableColumns.length;
		termColumnWidth = maxColumnWidth / termColumns.length;
		_.each(_grid.columns, (_column) => {
			if (_column.isLockable) {
				let isLockable;
				let columnWidth;
				isLockable = false;
				columnWidth = lockableColumnWidth;
				if (lockableColumns.length > 1) {
					if (_column.columnName.length > 10) {
						columnWidth = lockableColumnWidth * 1.8;
					}
					if (_column.columnName.length < 10) {
						columnWidth = lockableColumnWidth * 1.15;
					}
					if (_column.columnName.length < 5) {
						columnWidth = lockableColumnWidth * 0.6;
					}
				}
				if (termColumns.length >= 5) {
					isLockable = true;
				}

				if (_grid.gridType === 'RC' || _grid.gridType === 'RSD') {
					if (_column.columnName === 'PRODUCT' && _grid.gridType === 'RSD') {
						columnWidth = termColumns.length > 3 ? columnWidth * 1.55 : columnWidth * 1.35;
					}

					if (_column.columnName === 'PRODUCT' && _grid.gridType === 'RC') {
						columnWidth = termColumns.length > 3 ? columnWidth * 1.25 : columnWidth * 1.15;
					}

					if (_column.columnName === 'CREDIT RATING') {
						columnWidth = termColumns.length > 3 ? columnWidth * 0.3 : columnWidth * 0.35;
					}
				}

				if (_grid.gridType === 'RCC') {
					if (_column.columnName === 'CREDIT RATING') {
						const numTerms = termColumns.length;
						columnWidth = numTerms >= 1 && numTerms <= 3 ? columnWidth * 1.27 : columnWidth * 1.05;
					}
				}

				_.extend(_column, {
					width: columnWidth,
					isLockable,
				});
			} else {
				_.extend(_column, {
					width: termColumnWidth,
				});
			}
		});
		return _grid;
	}

	/**
	 * @method resortColumns
	 * @private
	 * Resort the columns based on _gridCollectionData.columns order to display grids properly.
	 * @param {Object[]} _columns Columns array to populate in the grid.
	 * @param {Object} _gridCollectionData Stores the grid collection data to validate the order of columns be the same as the collection.
	 * @return {void}
	 */
	private resortColumns(_columns, _gridCollectionData) {
		doLog && console.log(LOG_TAG, 'resortColumns');
		_columns = _.orderBy(_columns, (_column) => {
			let index = _.findIndex(_gridCollectionData.columns, (_columnCollection) => {
				return _columnCollection.columnGroup === _column.columnGroup;
			});
			// Validate index value is -1 then assign index value as length of the array
			if (index === -1) {
				index = _columns.length;
			}
			return index;
		});
		return _columns;
	}
}
