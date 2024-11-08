import { AfterContentChecked, AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

import * as _ from 'lodash';

const CATEGORY_NAME_PATTERN = /^[A-Za-z0-9\#\%\&\*\(\/\_\-\=\+\'\"\.\) ]*$/;
const CATEGORY_NAME_DUPLICATED_MESSAGE_ERROR = 'This Category Name already exists.';
const CATEGORY_NAME_INVALID_CHARACTERS_MESSAGE_ERROR = 'This Category Name contains invalid characters.';

@Component({
	selector: 'app-terms-dialog',
	templateUrl: './product-categories-dialog.component.html',
	styleUrls: ['./product-categories-dialog.component.scss'],
})
export class ProductCategoriesDialogComponent implements OnDestroy, OnInit, AfterContentChecked, AfterViewInit {
	@Input('productCategoriesList')
	public productCategoriesList: any[];

	@Input('item')
	public item: any;

	@Input('isDelete')
	public isDelete: boolean;

	/**
	 * @property {boolean} edit is a flag to indicate if the category is being edited
	 */
	@Input('edit')
	public edit = false;
	/**
	 * @property {string} type is a flag for validate if have value "productCategory"
	 */
	@Input('type')
	public type: string;
	/**
	 * @property {boolean} setFocus is a flag to set the focus on input field
	 */
	public setFocus: boolean;

	/**
	 * @property {boolean} disableOkButton is a flag that indicate if the save button should be disabled or not
	 */
	public disableOkButton: boolean;

	/**
	 * @property {Object} inputCategory reference to input field in pop-up
	 */
	@ViewChild('input')
	public inputCategory: ElementRef;

	/**
	 * @property {String} originalRateCardName stores the original RateCardName value
	 */
	private originalCategoryProductName: string;

	/**
	 * @property {Boolean} isProductCategoryNameDuplicated is a flag that indicate if a productCategory was found in
	 * the current productCategoriesList and to display the message error
	 */
	public isProductCategoryNameDuplicated: boolean;

	/**
	 * @property {Number} timerHandler a handler for a timer
	 */
	private timerHandler: any;

	/**
	 * @property {Number} maxLength the maxcharacters allowed
	 */
	public maxLength: number = 25;

	/**
	 * @property {Boolean} showError is a flag that indicate if html error message should be displayed
	 */
	public showError: boolean;

	/**
	 * @property {String} messageError stores the error message that should be displayed
	 */
	public messageError: string;

	public ngOnInit() {
		if (!this.item.name) {
			this.item.name = '';
		}

		this.originalCategoryProductName = this.item.name;

		if (!this.originalCategoryProductName) {
			this.disableOkButton = true;
		}
	}

	public ngAfterViewInit() {
		this.setFocus = true;
	}

	public ngAfterContentChecked() {
		if (this.setFocus && this.inputCategory && this.inputCategory.nativeElement) {
			this.inputCategory.nativeElement.focus();
			this.inputCategory.nativeElement.select();
			this.timerHandler = setTimeout(() => {
				this.setFocus = false;
			}, 500);
		}
	}

	/**
	 * @method onProductCategoryNameChange
	 * Handle the `Change` event for Product Category textbox to detect any value change and determinate
	 * if the name is empty to disable the save button
	 * @param {Object} _evt the `productCategoryName` change event.
	 * @return {void}
	 */
	public onProductCategoryNameChange(_evt) {
		this.isProductCategoryNameDuplicated = false;
		this.validateForm();
	}

	/**
	 * @method onProductCategoryKeyPress
	 * Handle the `keyPress` event for Product Category textbox to detect the key pressed and
	 * validate if is an allowed character
	 * @param {Object} _evt the `productCategoryName` change event.
	 * @return {void}
	 */
	public onProductCategoryKeyPress(_evt) {
		this.validateForm();
	}

	/**
	 * @method isDuplicatedCategory
	 * This method checks if the product name is duplicated into the current category
	 * @return {void}
	 */
	private isDuplicatedCategory() {
		const name = this.item.name.trim();
		const myId = this.item.id;
		const duplicatedCategoryTemp = _.find(this.productCategoriesList, (_productCategory) => {
			const nameCategory = _productCategory.name.trim();
			if (this.edit) {
				return nameCategory.toLowerCase() === name.toLowerCase() && _productCategory.id !== myId;
			} else {
				return nameCategory.toLowerCase() === name.toLowerCase();
			}
		});
		if (duplicatedCategoryTemp && duplicatedCategoryTemp.id) {
			return true;
		}

		return false;
	}

	/**
	 * @method showMessageError
	 * This method helps to control if the the html error message element and Save button
	 * should be displayed or enabled since both components are in dependency
	 * @param {Object} _evt the `productName` change event.
	 * @return {void}
	 */
	private showMessageError(showError: boolean, messageError: string) {
		this.showError = showError;
		this.disableOkButton = showError;
		this.messageError = messageError;
	}

	/**
	 * @method validateForm
	 * This method helps encapsulate all the rules need to activated the save/update button
	 * @return {void}
	 */
	private validateForm() {
		if (!this.item.name || this.item.name.trim().length === 0) {
			this.disableOkButton = true;
			this.showError = false;
			return;
		}

		if (!CATEGORY_NAME_PATTERN.test(this.item.name)) {
			this.showMessageError(true, CATEGORY_NAME_INVALID_CHARACTERS_MESSAGE_ERROR);
			return;
		}

		if (this.item.name.toLowerCase() !== this.originalCategoryProductName.toLowerCase() && this.isDuplicatedCategory()) {
			this.showMessageError(true, CATEGORY_NAME_DUPLICATED_MESSAGE_ERROR);
			this.isProductCategoryNameDuplicated = true;
			return;
		}

		this.showMessageError(false, '');
	}

	public ngOnDestroy() {
		clearTimeout(this.timerHandler);
	}
}
