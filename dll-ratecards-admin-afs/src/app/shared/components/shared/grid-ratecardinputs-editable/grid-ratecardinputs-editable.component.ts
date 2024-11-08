import { AfterContentChecked, Component, ElementRef, EventEmitter, Input, OnChanges, Output, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { doLog } from '@core/app-settings';
import { NumberHelper } from '@lib/index';
import { ColumnSortSettings, GridDataResult } from '@progress/kendo-angular-grid';
import { process, State } from '@progress/kendo-data-query';
import { IGridCollection } from '@shared/interfaces/grid-collection.interface';

import * as _ from 'lodash';
const LOG_TAG = '[components/shared/GridComponent]';

@Component({
	selector: 'app-grid-ratecardinputs-editable',
	templateUrl: './grid-ratecardinputs-editable.component.html',
	styleUrls: ['./grid-ratecardinputs-editable.component.scss'],
})
export class GridRatecardinputsEditableComponent implements AfterContentChecked, OnChanges {
	public scrollWidth = [];
	/**
	 * @property {ColumnSortSettings[]} rows receives columns data for display in grid
	 */
	@Input('columns') columns: ColumnSortSettings[] | any[];
	/**
	 * @property {object[]} rows receives rows data for display in grid
	 */
	@Input('rows') rows: object[];

	/**
	 * @property {Boolean} isResidual receives isResidual data for display in grid
	 */
	@Input('isResidual') isResidual: boolean = false;

	/**
	 * @property {Boolean} isLocked receives isLocked data for display in grid
	 */
	@Input('isLocked') isLocked: boolean = false;

	/**
	 * @property {Number} minValue Minimum=-100 value accepted on editable cells on grid by terms columns.
	 */
	@Input('minValue') minValue: number = -100;
	/**
	 * @property {Number} maxValue Maximum=100 value accepted on editable cells on grid by terms columns.
	 */
	@Input('maxValue') maxValue: number = 100;

	/**
	 * @property {Object} saveChanges Event Emitter to submit changes to save to parent component and trigger the saving method to API.
	 */
	@Output() private saveChanges: EventEmitter<any> = new EventEmitter<any>();

	/**
	 * @property {Object} finishedLoading Event Emitter to notify that the grid has finished loading.
	 */
	@Output() private finishedLoading: EventEmitter<any> = new EventEmitter<any>();

	/**
	 * @property {QueryList<ElementRef>} scroll stores the dom element of the scrollbar
	 */
	@ViewChildren('scroll')
	private scroll: QueryList<ElementRef>;

	/**
	 * @property {QueryList<ElementRef>} grid stores the dom element of the grid
	 */
	@ViewChildren('grid')
	private grid: QueryList<ElementRef>;

	/**
	 * @property {Boolean} autoCorrect Autocorrect an invalid entry fixing the value to closer min or max valid value
	 * @public
	 */
	public autoCorrect: boolean = true;

	constructor(private _formBuilder: FormBuilder, private _numberHelper: NumberHelper) {
		const scrollWith = '551px';
		this.scrollWidth = [scrollWith, scrollWith];
	}

	/**
	 * @method ngOnChanges
	 * Respond when change value from inputs columns and rows
	 * @param changes receives values changes from columns and rows
	 * @return {void}
	 */
	public ngOnChanges(changes): void {
		this.columns = changes.columns.currentValue;
		this.rows = changes.rows.currentValue;
		this.isLocked = changes.isLocked ? changes.isLocked.currentValue : this.columns[0].locked;
	}

	public ngAfterContentChecked() {
		if (!this.grid) {
			return;
		}

		const grids = this.grid.toArray();
		const scrolls = this.scroll.toArray();
		// Validate if scrolls exists on grid based on terms columns length and then apply the scroll functionality.
		if (scrolls && scrolls.length > 0) {
			_.each(grids || [], (_grid, _index) => {
				const tempGrid: ElementRef | any = _grid;
				const scrollableGrid: ElementRef | any = tempGrid.wrapper.nativeElement.children[0].children[1].children[1];
				const scrollerElement: ElementRef | any = scrolls[_index].nativeElement;
				this.scrollWidth[_index] = scrollableGrid.children[0].children[0].clientWidth + 'px';
				scrollerElement.onscroll = (_event) => {
					const scrollPosition = _event.srcElement.scrollLeft;
					scrollableGrid.scrollTo(scrollPosition, 0);
				};
				scrollableGrid.onscroll = (_event) => {
					const scrollPosition = _event.srcElement.scrollLeft;
					scrollerElement.scrollTo(scrollPosition, 0);
				};
			});
		}
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
	public onCellClickEventHandler({ sender, rowIndex, columnIndex, dataItem, isEdited }) {
		doLog && console.log(LOG_TAG, 'onCellClickEventHandler', { sender, rowIndex, columnIndex, dataItem, isEdited });
		if (!isEdited) {
			const cellData: any = {
				currentIndex: columnIndex,
				dataItem,
				isResidual: this.isResidual,
			};
			// Validates if is the first column in table to prevent edit.
			if (columnIndex === 0) {
				return;
			}
			sender.editCell(rowIndex, columnIndex, this.createFormGroup(cellData));
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
		doLog && console.log(LOG_TAG, 'onCellCloseHandler', _evt);
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
				const maxValue = this.maxValue;
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

				_.extend(dataItem.terms, { term, value: dataItem[currentIndex] });
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
			_dataItem[_currentIndex] = this._numberHelper.formatPercentage(_dataItem[_currentIndex]);
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
		return _dataItem[_currentIndex];
	}

	/**
	 * @method isEditable
	 * Validate if field is read only based on business rules.
	 * @param {Object} _cellData Receives the data from the grid's cell clicked to validate if is editable or not.
	 * @return {Boolean}
	 */
	public isEditable(_cellData) {
		if (_cellData.column.field === 'name') {
			_cellData.dataItem.isEditable = false;
			return false;
		}
		_cellData.dataItem.isEditable = true;
		return true;
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
	 * @param {Object} _cellData The data of the current cell to edit.
	 * @param {Object} _gridData
	 * @return {void}
	 */
	private createFormGroup(_cellData): FormGroup {
		const formFields = {};

		_.each(this.columns || [], (_column, _key) => {
			_.extend(formFields || {}, {
				[_column.field]: new FormControl(
					_cellData.dataItem[_column.field] ? parseFloat(_cellData.dataItem[_column.field]) || 0 : 0.0,
					[Validators.pattern('^-?[0-9]+(.[0-9][0-9]?)?'), Validators.maxLength(5)]
				),
			});
		});

		return this._formBuilder.group(formFields);
	}

	/**
	 * @method isValidEntry
	 * Validate if entry is acceptable to submit into the database.
	 * @param {Object} _value The value received from the grid input.
	 * @param {Object} _prevValue The previous value to compare if is different and process it.
	 * @return {void}
	 */
	public isValidEntry(_value, _prevValue) {
		return _value !== _prevValue && _value !== null && _value !== '' && !_.isNaN(_value) && _value !== undefined;
	}

	/**
	 * @method saveItem
	 * @private
	 * Sends the event emitter to parent to process saving data of input or products in grid.
	 * @param {Object} _dataItem The data of the current cell edited.
	 * @param {Nuber} _currentIndex The current cell index of cell selected.
	 * @return {void}
	 */
	private saveItem(_dataItem, _currentIndex) {
		doLog && console.log(LOG_TAG, 'saveItem', _dataItem);
		_.extend(_dataItem, { isResidual: this.isResidual });
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
	public isMinMaxAllowed(_dataItem, _currentIndex) {
		console.log('isMinMaxAllowed', _dataItem, _currentIndex);
		if (_currentIndex.includes('term')) {
			return _dataItem[_currentIndex] >= this.minValue && _dataItem[_currentIndex] <= this.maxValue;
		}
		doLog && console.log(LOG_TAG, 'isMinMaxAllowed', _currentIndex, _dataItem[_currentIndex]);
		return false;
	}
}
