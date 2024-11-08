import { AfterViewChecked, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { doLog } from '@core/index';
import { NumberHelper } from '@lib/helpers/number.helper';
import { DialogCloseResult, DialogRef, DialogService } from '@progress/kendo-angular-dialog';
import { DataEvent, DragEndEvent } from '@progress/kendo-angular-sortable';
import { IProductCategories } from '@shared/models/product-categories.model';
import { IProduct } from '@shared/models/product.model';
import { ITerm } from '@shared/models/terms.model';

import * as _ from 'lodash';
import * as moment from 'moment';

const LOG_TAG = '[components/shared/TermsDialogComponent]';
const COF_ORIGIN = 'COF';
const MANAGE_TERMS_ORIGIN = 'manageTerms';

@Component({
	selector: 'app-terms-dialog',
	templateUrl: './terms-dialog.component.html',
	styleUrls: ['./terms-dialog.component.scss'],
})
export class TermsDialogComponent implements OnInit, AfterViewChecked {
	/**
	 * @property {Object[]} products receive via `Input` the producs list from `CatalogueData`
	 */
	@Input('products') public products: IProduct[];

	/**
	 * @property {Object[]} productCategories receive via `Input` the productCategories list from `CatalogueData`
	 */
	@Input('productCategories') public productCategories: IProductCategories[];

	/**
	 * @property {Object[]} terms receive via `Input` the terms list from `CatalogueData`
	 */
	@Input('terms') public terms: ITerm[];

	/**
	 * @property {String} removeMessage stores message to display on remove event.
	 */
	@Input('removeMessage') public removeMessage: string;

	/**
	 * @property {String} item stores item to display on terms list.
	 */
	@Input('item') public item;

	/**
	 * @property {Boolean} isDelete stores value to call delete dialog.
	 */
	@Input('isDelete') public isDelete;

	/**
	 * @property {Boolean} showErrorMessage toggle display error messages
	 */
	@Input('showErrorMessage') public showErrorMessage: boolean;

	/**
	 * @property {String} origin It stores a value to know where come from delete request, COF or Manage Terms
	 */
	@Input('origin') public origin: string;

	/**
	 * @property {Boolean} setFocus toggle cursor focus
	 */
	public setFocus: boolean;

	/**
	 * @property {Boolean} disableOkButton is a flag that indicate if the save button should be disabled or not
	 */
	public disableOkButton: boolean;

	/**
	 * @property {Object} isEditing stores the item object to edit.
	 */
	public isEditing: ITerm;

	/**
	 * @property {Object} isRemoving stores the item object to remove.
	 */
	public isRemoving: ITerm;

	/**
	 * @property {String} errorMessage stores message to display on errors event.
	 */
	public errorMessage: string;

	/**
	 * @property {Number} lastIndex stores the lastIndex value from the `DragDropEvent`.
	 */
	public lastIndex: number = 0;

	/**
	 * @property {Boolean} termIsRepeated flag to detect repeated terms after an 'onTermsDialogChange' event.
	 */
	public termIsRepeated: boolean;

	/**
	 * @property {String} cof It stores the value of COF_ORIGIN constant
	 * @public
	 */
	public cof: string = COF_ORIGIN;

	/**
	 * @property {String} manageTerms It stores the value of MANAGE_TERMS_ORIGIN constant
	 * @public
	 */
	public manageTerms: string = MANAGE_TERMS_ORIGIN;

	/**
	 * @property {Object} termsDialog reference to input field in pop-up
	 */
	@ViewChild('termsDialog', { read: ElementRef }) public termsDialog: ElementRef;

	/**
	 * @property {Object} tempValue stores temprorary an object to prevent edit and lose the original data, used on cancel edition.
	 * @private
	 */
	private tempValue: ITerm;

	constructor(private _numberHelper: NumberHelper) {}

	public ngOnInit() {
		if (!this.item.name) {
			this.item.name = null;
		}
		this.disableOkButton = true;
	}
	/**
	 * @method ngAfterViewChecked
	 * Load function after view checked
	 * @return {void}
	 */
	public ngAfterViewChecked() {
		if (this.termsDialog.nativeElement && this.termsDialog.nativeElement.querySelector('.edit-dialog .k-input')) {
			_.defer(() => this.termsDialog.nativeElement.querySelector('.edit-dialog .k-input').focus());
		}
	}

	/**
	 * @method onDragEventStart
	 * Initialize the DragEvent.
	 * @param {Number} _src the initial value to compare the position.
	 * @param {Object} _evt the `DragDropEvent` `dragStart` returns the index value where the item starts.
	 * @return {void}
	 */
	public onDragEventStart(_src: number, _evt: DragEndEvent) {
		doLog && console.log(LOG_TAG, '-onDragEventStart', _evt.index);
	}

	/**
	 * @method onDragEventEnds
	 * Initialize the DragEvent and calls the `resortIndexes()` method to re-map index values on terms array.
	 * @param {Number} _src the initial value to compare the position.
	 * @param {Object} _evt the `DragDropEvent` `dragEnd` returns the index value where the item ends.
	 * @return {void}
	 */
	public onDragEventEnds(_src: number, _evt: DragEndEvent) {
		doLog && console.log(LOG_TAG, '-onDragEventEnds', _evt.index);
		this.reSortIndexes();
	}

	/**
	 * @method onAddNewItemButtonClick
	 * Add a term to terms array list  calls the `resortIndexes()` method to re-map index values on terms array.
	 * @param {Object} _evt The `AddNewItemButton` click event.
	 * @return {void}
	 */
	public onAddNewItemButtonClick(_evt) {
		doLog && console.log(LOG_TAG, '-onAddNewItemButtonClick', _evt);
		let newTerm;
		const TERM = _.clone(_.last(this.terms));

		newTerm = {
			termID: TERM ? TERM.termID + 1 : 101,
			name: null, // must be a string due kendo-ui requirements.
			value: null,
			date: moment().toDate,
			index: null,
			status: 1,
		};
		this.terms.push(newTerm);
		this.isEditing = newTerm;
		this.reSortIndexes();
	}

	/**
	 * @method onTermsDialogChange
	 * Handle the `Change` event for AddTerm textbox to validate if the 'Save' button should be disabled
	 * @param {Object} _evt the `AddTerm` change event.
	 * @return {void}
	 */
	public onTermsDialogChange(_evt) {
		this.termIsRepeated = false;
		_.forEach(this.terms, (term) => {
			if (_evt && '' + _evt === term.name && term.status !== -1) {
				this.termIsRepeated = true;
				this.errorMessage = 'This Term already exists';
			}
		});
		this.showErrorMessage = this.termIsRepeated;
		this.disableOkButton = this.item.name === null || this.termIsRepeated;
	}

	/**
	 * @method onEditItemButtonClick
	 * Initializes the edit mode of the object.
	 * @param {Object} _evt the `EditItemButton` click event.
	 * @param {Object} _params the item object with data to compare and find the element to edit.
	 * @param {Object} _params.item the item object to find and edit.
	 * @param {Number} _params.item.termID the term ID to find the term to edit.
	 * @return {void}
	 */
	public onEditItemButtonClick(_evt, _params) {
		doLog && console.log(LOG_TAG, '-onEditItemButtonClick', _evt);
		const TERM_TEMP = _.find(this.terms, (_term) => {
			return _term.termID === _params.item.termID;
		});
		this.isEditing = TERM_TEMP;
		this.tempValue = _.clone(TERM_TEMP);
	}

	/**
	 * @method onSaveItemButtonClick
	 * Save the new data into the item.
	 * @param {Object} _evt the `SaveItemButton` click event.
	 * @param {Object} _params.item the item object to find and save.
	 * @param {Number} _params.item.termID the term ID to find the term to save.
	 * @return {void}
	 */
	public onSaveItemButtonClick(_evt, _params) {
		doLog && console.log(LOG_TAG, '-onSaveItemButtonClick', _evt);
		const TERM_TEMP = _.find(this.terms, (_term) => {
			return _term.termID === _params.item.termID;
		});
		this.isEditing = null;
		this.tempValue = null;
		_.extend(TERM_TEMP, {
			value: this._numberHelper.parseToNumber(TERM_TEMP.value),
			name: `term${TERM_TEMP.value}`,
			date: moment().toDate(),
		});
	}

	/**
	 * @method onRemoveItemButtonClick
	 * Request to remove item from array and display message to confirm.
	 * @param {Object} _evt the `RemoveItemButton` click event.
	 * @param {Object} _params.item the item object to find and remove.
	 * @param {Number} _params.item.termID the term ID to find the term to remove.
	 * @return {void}
	 */
	public onRemoveItemButtonClick(_evt, _params) {
		doLog && console.log(LOG_TAG, '-onRemoveItemButtonClick', _evt);
		this.isEditing = null;
		this.isRemoving = _params.item;
		this.removeMessage = `Delete this term and its ratings: ${_params.item.termID}`;
	}

	/**
	 * @method onConfirmRemoveItemButtonClick
	 * Confirm to remove the item from the array updating the status to -1.
	 * @param {Object} _evt the `RemoveItemButton` click event.
	 * @param {Object} _params.item the item object to find and remove.
	 * @param {Number} _params.item.termID the term ID to find the term to remove.
	 * @return {void}
	 */
	public onConfirmRemoveItemButtonClick(_evt, _params) {
		doLog && console.log(LOG_TAG, '-onRemoveItemButtonClick', _evt);
		const TERM_TEMP = _.find(this.terms, (_term) => {
			return _term.termID === _params.item.termID;
		});
		_.extend(TERM_TEMP, { status: -1, date: moment().toDate() });
	}

	/**
	 * @method onCancelEditItemButtonClick
	 * Cancel the edit item request.
	 * @param {Object} _evt the `CancelEditItemButton` click event.
	 * @return {void}
	 */
	public onCancelEditItemButtonClick(_evt) {
		doLog && console.log(LOG_TAG, '-onCancelEditItemButtonClick', _evt);
		const TERM_TEMP = _.find(this.terms, (_term) => {
			return _term.termID === this.tempValue.termID;
		});
		_.extend(TERM_TEMP, this.tempValue);
		this.isEditing = null;
		this.tempValue = null;
	}

	/**
	 * @method onCancelRemoveItemButtonClick
	 * Cancel the remove item request.
	 * @param {Object} _evt the `CancelRemoveItemButton` click event.
	 * @return {void}
	 */
	public onCancelRemoveItemButtonClick(_evt) {
		doLog && console.log(LOG_TAG, '-onCancelRemoveItemButtonClick', _evt);
		this.isRemoving = null;
		this.removeMessage = null;
	}

	/**
	 * @method reSortIndexes
	 * Map index values from terms array based on sort order from `DragDropEvent`
	 * @return {void}
	 */
	private reSortIndexes() {
		this.terms = _.map(this.terms, (_term, _index) => {
			return _.extend(_term, { index: _index });
		});
	}
}
