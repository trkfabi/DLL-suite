import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChange, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { AppSettings, doLog } from '@core/app-settings';
import { GRID_COLLECTIONS } from '@core/collections';
import { GridFactory } from '@core/factories';
import { BusyService } from '@core/index';
import { ToastEventHandlerService, ToastService, WebServices } from '@core/services';
import { NumberHelper } from '@lib/index';
import { GridDataResult } from '@progress/kendo-angular-grid';
import { process, State } from '@progress/kendo-data-query';
import { IGridCollection } from '@shared/interfaces/grid-collection.interface';

import * as _ from 'lodash';
const LOG_TAG = '[components/shared/GridComponent]';

/**
 * @class GridComponent
 * Setup the grid component with custom values.
 * @uses @progress.kendoAngularGrid.GridDataResult
 * @uses shared.interfaces.GridColumn
 * @version 1.0.1
 */
@Component({
	selector: 'app-grid',
	templateUrl: './grid.component.html',
	styleUrls: ['./grid.component.scss'],
})
export class GridComponent implements OnInit, OnChanges, OnDestroy {
	/**
	 * @property {Object} sortable The Kendo-UI grid sort settings to enable sort.
	 */
	public sortable = true;

	/**
	 * @property {String} noRecordsMessage display message when there are not record available.
	 */
	public noRecordsMessage;

	/**
	 * @property {Boolean} isRendered detects if DOM is already rendered to avoid recreate grids if is not necessary.
	 */
	public isRendered: boolean = false;

	/**
	 * @property {Boolean} isLocked detects if the column is locked on the grid.
	 */
	public isLocked: boolean = false;

	/**
	 * @property {Object} grid Stores the grid data once is ready
	 */
	public grid;

	/**
	 * @property {Object[]} data Stores the rows data to display on grid.
	 */
	public data;

	/**
	 * @property {Object[]} columns Stores the columns to display on grid.
	 */
	public columns;

	/**
	 * @property {Object[]} columns Stores the columns grouped by terms to display on grid.
	 */
	public groupedColumns;

	/**
	 * @property {Boolean} isGroupable Validate the type of layout to display if grid has groupable columns or not.
	 */
	public isGroupable;

	/**
	 * @property {String} gridCollection Receives the IGridCollection Name where the grid belongs to use on gridFactory.
	 */
	@Input('gridCollection') public gridCollection: string;

	/**
	 * @property {Object} gridType Receives the IGridCollection Name where the grid belongs to use on gridFactory.
	 */
	@Input('gridType') public gridType: string;

	/**
	 * @property {Object} dataSource Receives the data from the webservices to process and generate the grid.
	 */
	@Input('dataSource') public dataSource;

	/**
	 * @property {Object[]} terms Receives the terms from the webservices
	 * to process and generate terms columns on the grid.
	 */
	@Input('terms') public terms;

	/**
	 * @property {Object[]} categories The categories list to populate the ratecards residuals grid.
	 */
	@Input('categories') public categories;

	/**
	 * @property {Object[]} filteredBy The filter selected in the dashboard component.
	 */
	@Input('filteredBy') public filteredBy;

	/**
	 * @property {Object} saveChanges Event Emitter to submit changes to save to parent component and trigger the saving method to API.
	 */
	@Output() private saveChanges: EventEmitter<any> = new EventEmitter<any>();

	/**
	 * @property {Object} finishedLoading Event Emitter to notify that the grid has finished loading.
	 */
	@Output() private finishedLoading: EventEmitter<any> = new EventEmitter<any>();

	/**
	 * @property {Object[]} gridCollections Get all the Grids Collections with default data as title.
	 * @property { String } gridCollections.gridType the Grid type to group columns with rows.
	 * @property { String } gridCollections.gridName The grid name to display as title.
	 * @property { String } gridCollections.gridFirstColumnName The grid firstColumnName to display as column title.
	 * @property { Boolean } gridCollectionseditable Enable the editable option on grid.
	 */
	private gridCollections: IGridCollection[] = GRID_COLLECTIONS;

	/**
	 * @property {Number} minValue Minimal=0 value accepted on editable cells on grid.
	 * @private
	 */
	private minValue = 0;

	/**
	 * @property {Number} maxValue Maximum=1 value accepted on editable cells on grid by terms columns.
	 * @private
	 */
	private maxValue = 100;

	/**
	 * @property {Number} maxItadValue Maximum=99999.99 value accepted on editable cells on grid by itadValue column.
	 * @private
	 */
	private maxItadValue = 99999.99;

	private subscriptions: any = {};

	constructor(
		private _appSettings: AppSettings,
		private _gridFactory: GridFactory,
		private _toasterEventHandler$: ToastEventHandlerService,
		private _formBuilder: FormBuilder,
		private _numberHelper: NumberHelper,
		private _busyService$: BusyService
	) {
		this.noRecordsMessage = this._appSettings.appMessages.noRecords;
	}

	/**
	 * @method ngOnChanges
	 * Validates if dataSource and terms is already received but the grid has not been rendered to
	 * process the data and call the createGrid method from grid factory.
	 * @return {void}
	 */
	public async ngOnChanges(changes: SimpleChanges) {
		if (changes && changes.dataSource && changes.dataSource.firstChange) {
			return;
		}

		const { dataSource: dataSource, terms: terms, categories: categories } = changes;
		if (dataSource === undefined) {
			return;
		}
		this.dataSource = dataSource.currentValue;

		if (terms) {
			this.terms = terms.currentValue;
		}

		if (
			this.dataSource &&
			this.dataSource.length > 0 &&
			(this.dataSource[0].type === 'allin-out' || this.dataSource[0].type === 'allin-fmv')
		) {
			this.updateAllInGridsData();
		}

		if (this.dataSource && (this.gridType === 'RC' || this.gridType === 'RCC')) {
			this.updateAllRateFactorData(dataSource);
		}

		if (this.dataSource && (this.gridType === 'RC' || this.gridType === 'RCC')) {
			this.updateAllRateFactorData(dataSource);
		}
	}

	/**
	 * @method ngOnInit
	 * Initializes services to subscribe to detect any changes on grid and start the toaster.
	 * @return {void}
	 */
	public async ngOnInit() {
		this.subscriptions.toaster = this._toasterEventHandler$.toasterEventObservable.subscribe((_event) => {
			if (_event.event === 'init') {
				// Avoid the toaster initializer event.
				return;
			}
		});

		if (this.dataSource && this.terms) {
			this.loadInitData();
		}
	}

	public ngOnDestroy() {
		_.each(this.subscriptions, (subscription) => {
			subscription.unsubscribe();
		});
	}

	/**
	 * @method updateAllInGridsData
	 * Update All In Grids data when user adds new values to Inputs.
	 * @return {void}
	 */
	private updateAllInGridsData() {
		_.each(this.dataSource, (_item) => {
			const row = _.find(this.grid.rows, (_row) => {
				return _item.name === _row.name;
			});
			_.extend(row, {
				terms: _item.terms,
			});
			_.each(row.terms, (_term, _key) => {
				const rowKey = `term${[_key]}`;
				_.extend(row, { [rowKey]: this._numberHelper.formatPercentage(_term) });
			});
		});
	}

	private updateAllRateFactorData(_dataSource: any) {
		const dataSource = _dataSource.currentValue;
		_.each(dataSource, (_row) => {
			_.each(_row.terms, (_term, _key) => {
				const rowKey = `term${[_key]}`;
				_.extend(_row, { [rowKey]: _term.toFixed(6) });
			});
		});
		this.data = dataSource;
	}

	/**
	 * @method loadInitData
	 * Update grid based on data source, terms and categories received from Inputs and Changes detected.
	 * @return {void}
	 */
	private async loadInitData() {
		this.terms.sort((a, b) => {
			return Number(a) > Number(b);
		});

		const _gridData = {
			collection: this.gridCollection,
			type: this.gridType,
			terms: this.terms,
			categories: this.categories,
			data: this.dataSource,
		};
		this.grid = await this._gridFactory.createGrid(_gridData);
		this.data = this.grid.rows;
		this.columns = this.grid.columns;
		if (this.grid.isGroupable) {
			this.isGroupable = true;
			this.groupedColumns = this.columns[1];
			this.columns = this.columns[0];
		}
		this.isLocked = !!(_gridData.type === 'RC' && _gridData.terms.length >= 6);
		this.finishedLoading.emit();
	}

	/**
	 * @method onCellClickEventHandler
	 * Executes the click handlter to create the form group to edit cell data.
	 * @param {Object} _evt The event handler to catch the cell data.
	 * @param {Object} _evt.sender The sender property of the cell to call editCell method.
	 * @param {Number} _evt.rowIndex The current row index of cell selected..
	 * @param {Number} _evt.columnIndex The current column index of cell selected.
	 * @param {Object} _evt.dataItem The data of the current cell clicked.
	 * @return {void}
	 */
	public onCellClickEventHandler(_evt, _gridData) {
		doLog && console.log(LOG_TAG, 'onCellClickEventHandler', _evt, _gridData);
		if (!_evt.isEdited) {
			const cellData: any = {
				currentIndex: _evt.column.field,
				dataItem: _evt.dataItem,
				gridData: _gridData,
			};
			if (_evt.column.field.substring(0, 4) !== 'term' && _evt.column.field !== 'itadValue') {
				return;
			}
			if (_gridData.gridType === 'IN1' || _gridData.gridType === 'FMV' || _gridData.gridType === 'RC') {
				return;
			}
			_evt.sender.editCell(_evt.rowIndex, _evt.columnIndex, this.createFormGroup(cellData));
		}
	}

	/**
	 * @method cellCloseHandler
	 * @param {Object} _evt The event handler to catch the args to process the request.
	 * @param {Object} _evt.formGroup The form group object with all the current values expected to update.
	 * @param {Object} _evt.dataItem The data of the current cell clicked.
	 * @param {Object} _evt.column The current column data from the cell clicked.
	 * Executes the close handler to set the new values to the current dataItem.
	 * @return {void}
	 */
	public onCellCloseHandler(_evt) {
		const { formGroup, dataItem, column } = _evt;
		if (formGroup && !formGroup.valid) {
			_evt.preventDefault();
			return;
		}
		if (formGroup && formGroup.dirty) {
			const currentIndex = _.findKey(formGroup.value, (_value, _key) => {
				return _key === column.field;
			});
			if (!formGroup.value[currentIndex]) {
				formGroup.value[currentIndex] = 0;
			}
			formGroup.value[currentIndex] = formGroup.value[currentIndex].toString();
			const PREVIOUS_VALUE = dataItem[currentIndex];
			formGroup.value[currentIndex] =
				typeof formGroup.value[currentIndex] === 'string'
					? formGroup.value[currentIndex].replace(/\s+/g, '')
					: formGroup.value[currentIndex];
			dataItem[currentIndex] = !this.isValidEntry(formGroup.value[currentIndex], dataItem[currentIndex])
				? 0
				: formGroup.value[currentIndex];
			if (!this.isMinMaxAllowed(dataItem, currentIndex)) {
				const maxValue = currentIndex === 'itadValue' ? this.maxItadValue : this.maxValue;
				if (dataItem[currentIndex] > maxValue) {
					dataItem[currentIndex] = maxValue;
				} else {
					dataItem[currentIndex] = PREVIOUS_VALUE;
					return;
				}
			}
			if (currentIndex.includes('term')) {
				const term = currentIndex.replace('term', '').toString();
				if (dataItem.terms === undefined) {
					_.extend(dataItem, { terms: {} });
				}
				dataItem[currentIndex] = Number(this._numberHelper.moveDecimalPoint(formGroup.value[currentIndex]));

				_.extend(dataItem.terms, { [term]: dataItem[currentIndex] });
			}

			this.saveItem(dataItem, currentIndex);
		}
	}

	/**
	 * @method parseValues
	 * Format values to display on cells based on specs.
	 * @param {Object} _dataItem The current cell data to display.
	 * @param {String} _currentIndex The current index from the cell selected.
	 * @return {Object}
	 */
	public parseValues(_dataItem, _currentIndex) {
		if (_currentIndex.includes('term')) {
			_dataItem[_currentIndex] = _dataItem.isResidual
				? this._numberHelper.formatResidual(_dataItem[_currentIndex], 2)
				: this._numberHelper.formatPercentage(_dataItem[_currentIndex]);
		}
		if (_dataItem.itadValue !== undefined) {
			_dataItem.itadValue = this._numberHelper.currenctyFormat(_dataItem.itadValue, true);
		}
		return _dataItem;
	}

	/**
	 * @method displayCellContent
	 * Validate the content to display on cell depending of rules
	 * @param {Object} _dataItem The current cell data to display.
	 * @param {String} _currentIndex The current index from the cell selected.
	 * @return {String | null}
	 */
	public displayCellContent(_currentIndex, _dataItem) {
		if (_currentIndex === 'ratesEnabled') {
			return null;
		}
		if (_currentIndex === 'itadValue' && !_dataItem.hasItad) {
			return null;
		}
		if (!_dataItem.ratesEnabled.includes('fmv') && _currentIndex.includes('term')) {
			return null;
		}
		return _dataItem[_currentIndex];
	}

	/**
	 * @method isOneInOut
	 * Validate if the row has 1 in Out value in the object.
	 * @param {Object} _dataItem The current cell data to display.
	 * @param {String} _currentIndex The current index from the cell selected.
	 * @return {void}
	 */
	public isOneInOut(_currentIndex, _dataItem) {
		return _currentIndex === 'ratesEnabled' && _dataItem[_currentIndex].includes('1out');
	}

	/**
	 * @method displayRFTermHeader
	 * Displays RateFactors Terms header template.
	 * @return {void}
	 */
	public displayRFTermHeader(_column, _gridType) {
		return _column.columnGroup.includes('term') && (_gridType === 'RC' || _gridType === 'RCC');
	}

	/**
	 * @method isEditable
	 * Validate if field is read only based on business rules.
	 * @return {Boolean}
	 */
	public isEditable(_cellData) {
		if (_cellData.gridData && _cellData.gridData.gridType !== 'RSD' && _cellData.currentIndex.includes('term')) {
			_cellData.dataItem.isEditable = true;
			return true;
		}
		if (_cellData.gridData && _cellData.gridData.gridType === 'RSD') {
			if (_cellData.dataItem.hasItad && _cellData.currentIndex === 'itadValue') {
				_cellData.dataItem.isEditable = true;
				return true;
			}
			if (_cellData.dataItem.ratesEnabled.includes('fmv') && _cellData.currentIndex.includes('term')) {
				_cellData.dataItem.isEditable = true;
				return true;
			}
		}
		_cellData.dataItem.isEditable = false;
		return false;
	}

	/**
	 * @method onCancelHandler
	 * Close cell without apply any changes.
	 * @param {Object} sender stores the method to close edition on row
	 * @param {Number} rowIndex stores the current row index to edit.
	 * @return {void}
	 */
	public onCancelHandler({ sender, rowIndex }) {
		sender.closeRow(rowIndex);
	}

	/**
	 * @method createFormGroup
	 * Generates the inputs to edit the cell via formBuilder.
	 * @param {Object} _dataItem The data of the current cell to edit.
	 * @param {Object} _gridData
	 * @return {void}
	 */
	private createFormGroup(_cellData): FormGroup {
		const gridCollection = _.find(GRID_COLLECTIONS, { gridType: _cellData.gridData.gridType });
		const formFields = {};
		if (gridCollection) {
			const editableColumns = _.filter(gridCollection.columns, { isEditable: true });
			_.each(editableColumns, (_column, _key) => {
				_.extend(formFields, {
					[_column.columnGroup]: _cellData.dataItem[_column.columnGroup]
						? this._numberHelper.parseToNumber(_cellData.dataItem[_column.columnGroup].toString())
						: null,
				});
			});
		}
		if (_cellData.gridData.terms && gridCollection.isEditable) {
			_.each(_cellData.gridData.terms, (_term, _key) => {
				_.extend(formFields, {
					['term' + _term]: new FormControl(
						_cellData.dataItem['term' + _term] ? parseFloat(_cellData.dataItem['term' + _term]) : 0.0,
						[Validators.pattern('[0-9]+(.[0-9][0-9]?)?'), Validators.maxLength(5)]
					),
				});
			});
		}

		if (!this.isEditable(_cellData)) {
			return;
		}
		return this._formBuilder.group(formFields);
	}

	/**
	 * @method isValidEntry
	 * Validate if entry is acceptable to submit into the database.
	 * @param {Object} _value The value received from the grid input.
	 * @param {Object} _prevValue The previous value to compare if is different and process it.
	 * @return {void}
	 */
	private isValidEntry(_value, _prevValue) {
		return _value !== _prevValue && _value !== null && _value !== '' && !_.isNaN(_value);
	}

	/**
	 * @method saveItem
	 * @private
	 * Sends the event emitter to parent to process saving data of input or products in grid.
	 * @param {Object} _dataItem The data of the current cell edited.
	 * @return {void}
	 */
	private saveItem(_dataItem, _currentIndex) {
		doLog && console.log(LOG_TAG, 'saveItem', _dataItem);
		if (_dataItem.itadValue !== undefined) {
			_dataItem.itadValue = this._numberHelper.parseToNumber(_dataItem.itadValue.toString());
		}
		this.saveChanges.emit(_dataItem);
		this.parseValues(_dataItem, _currentIndex);
	}

	/**
	 * @method isMinMaxAllowed
	 * Validate if value is allowed between min and max values ranges.
	 * @param _dataItem The data of the current cell clicked to validate
	 * @param _currentIndex The current index of the cell clicked tovalidate.
	 * @return {Boolean}
	 */
	private isMinMaxAllowed(_dataItem, _currentIndex) {
		if (_currentIndex.includes('term')) {
			return _dataItem[_currentIndex] >= this.minValue && _dataItem[_currentIndex] <= this.maxValue;
		}
		if (_currentIndex === 'itadValue') {
			return Number(_dataItem[_currentIndex]) >= this.minValue && Number(_dataItem[_currentIndex]) <= this.maxItadValue;
		}
		doLog && console.log(LOG_TAG, 'isMinMaxAllowed', _currentIndex, _dataItem[_currentIndex]);
		return false;
	}
}
