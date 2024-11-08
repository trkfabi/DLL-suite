import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { ICheckboxItem } from '@shared/interfaces';
import * as _ from 'lodash';

@Component({
	selector: 'app-checkbox-list',
	templateUrl: './checkbox-list.component.html',
	styleUrls: ['./checkbox-list.component.scss'],
})
export class CheckboxListComponent implements OnInit, OnChanges {
	/**
	 * @property {Object} itemList Receives the list of items to display in the checkbox module.
	 */
	@Input('itemList') public itemList: ICheckboxItem[];

	/**
	 * @property {EventEmitter} checkBoxClickEvent Stores the event emitter to process the
	 * checkbox click event and send it to the parent component.
	 */
	@Output() public checkBoxClickEvent: EventEmitter<ICheckboxItem[]> = new EventEmitter();

	/**
	 * @property {Boolean} hasItemsToDisplay Flag to validates if the `itemList` array has items in place so the list can be displayed. This
	 */
	public hasItemsToDisplay: boolean;

	/**
	 * @method ngOnInit
	 * Respond when initialize app
	 * @return {void}
	 */
	public ngOnInit(): void {
		this.hasItemsToDisplay = !!(this.itemList && this.itemList.length > 0) || false;
	}
	/**
	 * @method ngOnChanges
	 * Respond when change value from input itemList
	 * @param _changes receives changes in input itemList
	 */
	public ngOnChanges(_changes): void {
		this.itemList = _changes.itemList.currentValue;
	}

	/**
	 * @method onCheckboxClick
	 * Processes the click event on checkboxes and extends the item with the checked property boolean.
	 * It also, emits the event so the parent can process the action.
	 * @param {Boolean} _checked The boolean event of checkbox checked.
	 * @param {Object} _item The element checked to process and emits to parent.
	 * @return {void}
	 */
	public onCheckboxClick(_checked: boolean, _item: ICheckboxItem) {
		_.extend(_item, {
			checked: _checked,
		});
		this.checkBoxClickEvent.emit(this.itemList);
	}
}
