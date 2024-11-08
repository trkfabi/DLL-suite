import { AfterContentChecked, AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

import * as _ from 'lodash';

const PRODUCT_NAME_PATTERN = /^[A-Za-z0-9\#\%\&\*\(\/\_\-\=\+\'\"\.\) ]*$/;
const PRODUCT_NAME_DUPLICATED_MESSAGE_ERROR = 'This Product Name already exists.';
const PRODUCT_NAME_INVALID_CHARACTERS_MESSAGE_ERROR = 'This Product Name contains invalid characters.';

@Component({
	selector: 'app-product-dialog',
	templateUrl: './product-dialog.component.html',
	styleUrls: ['./product-dialog.component.scss'],
})
export class ProductDialogComponent implements OnDestroy, OnInit, AfterContentChecked, AfterViewInit {
	@Input('productCategories') public productCategories: any[];

	@Input('item') public item: any;

	@Input('productsList') public productsList: any[];

	@Input('isDelete') public isDelete: boolean;

	/**
	 * @property {boolean} setFocus is a flag to set the focus on input field
	 */
	public setFocus: boolean;

	public selectedProductCategoryItem: any;

	/**
	 * @property {Boolean} disableOkButton is a flag that indicate if the save button should be disabled or not
	 */
	public disableOkButton: boolean;

	/**
	 * @property {String} messageError stores the error message that should be displayed
	 */
	public messageError: string;

	/**
	 * @property {Boolean} productIsRepeated flag to detect repeated product names in the 'New Product"/"Edit Product" pop ups
	 */
	public productIsRepeated: boolean;

	/**
	 * @property {Object[]} productRateSelected stores the an array for active product rates
	 */
	public productRateSelected: any[] | string;

	/**
	 * @property {String} originalRateCardName stores the original RateCardName value
	 */
	private originalProductName: string;

	/**
	 * @property {String} originalProductCategoryId stores the original originalProductCategoryId value
	 */
	private originalProductCategoryId: boolean;

	/**
	 * @property {Boolean} showError is a flag that indicate if html error message should be displayed
	 */
	private showError: boolean;

	/**
	 * @property {Number} timerHandler a handler for a timer
	 */
	private timerHandler: any;

	/**
	 * @property {Number} maxLength the maxcharacters allowed
	 */
	public maxLength: number = 25;

	@ViewChild('productName') public productName: ElementRef;

	public ngOnInit() {
		if (!this.item.name) {
			this.item.name = '';
			this.disableOkButton = true;
		}

		if (this.productCategories) {
			this.productCategories = _.filter(this.productCategories, (_category) => {
				return !_category.deleted;
			});
		}

		this.originalProductName = this.item.name;
		this.originalProductCategoryId = this.item.categoryId;

		const { ratesEnabled = [] } = this.item || {};

		ratesEnabled.length > 1
			? (this.productRateSelected = ratesEnabled.join(',').toString())
			: (this.productRateSelected = ratesEnabled[0]);

		const tempCategoryProduct = _.find(this.productCategories, (_categoryProduct) => {
			return _categoryProduct.id === this.item.categoryId;
		});

		if (tempCategoryProduct) {
			this.selectedProductCategoryItem = tempCategoryProduct;
		}
	}

	public ngAfterViewInit() {
		this.setFocus = true;
	}

	public ngAfterContentChecked() {
		if (this.setFocus && this.productName && this.productName.nativeElement) {
			this.productName.nativeElement.focus();
			this.productName.nativeElement.select();
			this.timerHandler = setTimeout(() => {
				this.setFocus = false;
			}, 500);
		}
	}

	/**
	 * @method onRateProductChange
	 * Since the radio groups control binds a single value and the product rates is comming into
	 * an array, this method helps to transform the single option selected into the array value
	 * for the product rates property
	 * @param {Object} _evt the `radioItem` change event.
	 */
	public onRateProductChange(_evt) {
		this.productRateSelected === 'fmv,1out'
			? (this.item.ratesEnabled = this.productRateSelected.split(','))
			: (this.item.ratesEnabled = [this.productRateSelected]);
	}

	/**
	 * @method onProductCategoriesChange
	 * Since the dropdownlist control binds a object value and the product categoryId is comming into
	 * an simple type, this method helps to transform the dropdownlist option selected into the simple
	 * type for the categoryId property
	 * @param {Object} _evt the `dropdownlist` change event.
	 */
	public onProductCategoriesChange(_evt) {
		this.item.categoryId = this.selectedProductCategoryItem.id;
		this.validateForm();
	}

	/**
	 * @method onProductNameChange
	 * Handle the `Change` event for Product Name textbox to detect any value change and determinate
	 * if the name is empty to disable the save button
	 * @param {Object} _evt the `productName` change event.
	 * @return {void}
	 */
	public onProductNameChange(_evt) {
		this.productIsRepeated = false;
		this.validateForm();
	}

	/**
	 * @method onProductNameKeyPress
	 * Handle the `keyPress` event for Product Name textbox to detect the key pressed and
	 * validate if is an allowed character
	 * @param {Object} _evt the `productName` change event.
	 * @return {void}
	 */
	public onProductNameKeyPress(_evt) {
		const inputChar = String.fromCharCode(_evt.charCode);

		if (!PRODUCT_NAME_PATTERN.test(inputChar)) {
			// invalid character, prevent input
			_evt.preventDefault();
		}
	}

	/**
	 * @method isDuplicatedProduct
	 * This method checks if the product name is duplicated into the current category
	 * @param {Object} _evt the `productName` change event.
	 * @return {void}
	 */
	private isDuplicatedProduct() {
		const duplicatedProductTemp = _.find(this.productsList, (_product) => {
			return _product.name.trim().toLowerCase() === this.item.name.trim().toLowerCase();
		});

		if (duplicatedProductTemp) {
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
		} else {
			if (!PRODUCT_NAME_PATTERN.test(this.item.name)) {
				this.showMessageError(true, PRODUCT_NAME_INVALID_CHARACTERS_MESSAGE_ERROR);
				return;
			}
		}

		if (this.item.name.toLowerCase() !== this.originalProductName.toLowerCase() && this.isDuplicatedProduct()) {
			this.showMessageError(true, PRODUCT_NAME_DUPLICATED_MESSAGE_ERROR);
			this.productIsRepeated = true;
			return;
		}

		this.showMessageError(false, '');
	}

	public ngOnDestroy() {
		clearTimeout(this.timerHandler);
	}
}
