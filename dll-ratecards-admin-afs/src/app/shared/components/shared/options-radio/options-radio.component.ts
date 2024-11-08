import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { IRadioOptionItem } from '@shared/interfaces';
import * as _ from 'lodash';

@Component({
	selector: 'app-options-radio',
	templateUrl: './options-radio.component.html',
})
export class OptionsRadioComponent implements OnChanges {
	/**
	 * @property {Object} editable Shows the list with the ability to remove options
	 */
	@Input('editable') public editable: boolean;

	/**
	 * @property {Object} itemList Receives the list of items to display in the checkbox module.
	 */
	@Input('itemList') public itemList: IRadioOptionItem[];

	/**
	 * @property {EventEmitter} radioOptionClickEvent Stores the event emitter to process the
	 * radio option click event and send it to the parent component.
	 */
	@Output() public radioOptionClickEvent: EventEmitter<IRadioOptionItem> = new EventEmitter();

	/**
	 * @property {EventEmitter} deleteClickEvent Stores the event emitter to process the
	 * delete click event and send it to the parent component.
	 */
	@Output() public deleteClickEvent: EventEmitter<IRadioOptionItem> = new EventEmitter();

	/**
	 * @property {string} inputValue input valut to display in input text
	 */
	public deferrals: string[];

	/**
	 * @property {string} inputValue input valut to display in input text
	 */
	public selectedDeferral: string;

	/**
	 * @property {Boolean} hasItemsToDisplay Flag to validates if the `itemList` array has items in place so the list can be displayed. This
	 */
	public hasItemsToDisplay: boolean;

	/**
	 * @method ngOnChanges
	 * Respond when changes are made to the component
	 * @return {void}
	 */
	public ngOnChanges() {
		this.hasItemsToDisplay = !!(this.itemList && this.itemList.length > 0) || false;
	}

	/**
	 * @method onRadioClick
	 * Processes the click event on radio options and extends the item with the checked property boolean.
	 * It also, emits the event so the parent can process the action.
	 * @param {Boolean} _checked The boolean event of checkbox checked.
	 * @param {Object} _item The element checked to process and emits to parent.
	 * @return {void}
	 */
	public onRadioClick(_checked: boolean, _item: IRadioOptionItem) {
		_.extend(_item, {
			checked: _checked,
		});
		this.radioOptionClickEvent.emit(_item);
	}

	/**
	 * @method onDeleteRadioClick
	 * Processes the click event on the delete button.
	 * It also, emits the event so the parent can process the action.
	 * @param {Object} _item The element checked to process and emits to parent.
	 * @return {void}
	 */
	public onDeleteRadioClick(_item: IRadioOptionItem) {
		this.deleteClickEvent.emit(_item);
	}
}
