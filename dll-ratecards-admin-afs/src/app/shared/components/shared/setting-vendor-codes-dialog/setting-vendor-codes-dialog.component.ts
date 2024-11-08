import { AfterContentChecked, AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

import * as _ from 'lodash';

import { AuthService } from '@core/services';
import { IDialogActionType } from '@shared/interfaces';

const VENDOR_CODE_NAME_PATTERN = RegExp('^[a-zA-Z0-9-]+(s+[a-zA-Z0-9]+)*$');
const VENDOR_POINTS_PATTERN = /^[0-9\.]*$/;
const VENDOR_CODE_NAME_DUPLICATED_MESSAGE_ERROR = 'This Vendor Name already exists.';
const VENDOR_CODE_NAME_INVALID_CHARACTERS_MESSAGE_ERROR = 'This Vendor Name contains invalid characters or blank spaces.';
const VENDOR_POINTS_MAX_VALUE_AFS = 100;
const VENDOR_POINTS_MAX_VALUE_OTHC = 12;
const USER_GROUP = 'user_group';

@Component({
	selector: 'app-setting-vendor-codes-dialog',
	templateUrl: './setting-vendor-codes-dialog.component.html',
	styleUrls: ['./setting-vendor-codes-dialog.component.scss'],
})
export class SettingVendorCodesDialogComponent implements OnDestroy, OnInit, AfterContentChecked, AfterViewInit {
	@Input('rateCardList') public rateCardList: any[];
	@Input('vendorCodes') public vendorCodes: any[];
	@Input('item') public item: any;
	@Input('actionType') public actionType: IDialogActionType;

	/**
	 * @property {boolean} setFocus is a flag to set the focus on input field
	 */
	public setFocus: boolean;

	/**
	 * @property {Object} selectedRateCardItem stores the dropdown value selected by the user
	 */
	public selectedRateCardItem: any;

	/**
	 * @property {Boolean} disableOkButton is a flag that indicate if the save button should be disabled or not
	 */
	public disableOkButton: boolean;

	/**
	 * @property {Boolean} isInputError flag indicating the user is trying to add a repeated vendor code
	 */
	public isInputError: boolean;

	/**
	 * @property {String} vendorCodeName stores the original VendorCodeName value
	 */
	public vendorCodeName: string;

	/**
	 * @property {Number} vendorPoints stores the original vendorPoints value
	 */
	public vendorPoints: number;

	/**
	 * @property {Object} inputVendor reference to input field in pop-up
	 */
	@ViewChild('inputVendor') public inputVendor: ElementRef;

	/**
	 * @property {Number} originalVendorCodeName stores the original VendorCodeName value
	 */
	private originalVendorCodeName: string;

	/**
	 * @property {String} messageError stores the error message that should be displayed
	 */
	public messageError: string;

	/**
	 * @property {Boolean} showError is a flag that indicate if html error message should be displayed
	 */
	public showError: boolean;

	/**
	 * @property {Boolean} isDelete is a flag that indicate if action is deleting
	 */
	public isDelete: boolean;

	/**
	 * @property {Boolean} isEdit is a flag that indicate if action is editing
	 */
	public isEdit: boolean;

	/**
	 * @property {Number} timerHandler a handler for a timer
	 */
	private timerHandler: any;

	/**
	 * @property {Number} maxPoints a handler for the allowed max points number
	 */
	public maxPoints: number;

	/**
	 * @property {string} permission Receive user permission
	 */
	public userPermission: string;

	constructor(private _auth: AuthService) {
		this.userPermission = this._auth.getUserPermissions();
	}

	public ngOnInit() {
		if (!this.item) {
			this.item = {
				id: null,
				name: '',
				points: 0,
				rateCardId: null,
				vendorId: null,
			};
		}
		this.vendorCodeName = '';

		// Be sure it is a number
		this.item.points = Number(this.item.points);
		if (this.item && this.item.name) {
			this.originalVendorCodeName = this.item.name;
			this.vendorCodeName = this.item.name;
		}

		this.vendorPoints = this.item && this.item.points ? this.item.points : 0.0;

		this.isEdit = (this.actionType && this.actionType.action === 'edit') || false;

		this.isDelete = (this.actionType && this.actionType.action === 'delete') || false;

		if (!this.originalVendorCodeName) {
			this.disableOkButton = true;
		}

		// The rate card for vendor code is stored as simple data type but currently this screen
		// show them as dropdownlist selection, we have the the posibility to select only one of the rateCardList
		const rateCardItem = _.find(this.rateCardList, (_rateCard) => {
			return _rateCard.id === this.item.rateCardId;
		});

		if (rateCardItem) {
			this.selectedRateCardItem = rateCardItem;
		}

		this.maxPoints = this.userPermission === 'afs' ? VENDOR_POINTS_MAX_VALUE_AFS : VENDOR_POINTS_MAX_VALUE_OTHC;
	}

	public ngAfterViewInit() {
		this.setFocus = true;
	}

	public ngAfterContentChecked() {
		if (this.setFocus && this.inputVendor.nativeElement && this.inputVendor.nativeElement.querySelector('input')) {
			this.inputVendor.nativeElement.querySelector('input').focus();
			this.inputVendor.nativeElement.querySelector('input').select();
			this.timerHandler = _.defer(() => {
				this.setFocus = false;
			});
		}
	}

	/**
	 * @method onRateCardChange
	 * Since the dropdownlist control binds a object value and the rateCardId is coming into
	 * an simple type, this method helps to transform the dropdownlist option selected into the simple
	 * type for the rateCardId property
	 * @param {Object} _evt the `dropdownlist` change event.
	 */
	public onRateCardChange(_evt) {
		const rateCard = _evt;
		this.item.rateCardId = rateCard.id || this.selectedRateCardItem.id;
	}

	/**
	 * @method onVendorCodeNameChange
	 * Handle the `Change` event for VendorCodeName textbox to detect any value change and determinate
	 * if the vendor code name exists into the current vendorCodesList
	 * @param {Object} _evt the `VendorCodeName` change event.
	 * @return {void}
	 */
	public onVendorCodeNameChange(_evt) {
		this.isInputError = false;
		this.validateForm();
	}

	/**
	 * @method isDuplicatedVendorCode
	 * This method help to identify if the vendor code name is duplicated
	 * @return {void}
	 */
	public isDuplicatedVendorCode() {
		const currentVendorNameTrimmed = this.vendorCodeName.trim();
		const duplicatedVendorCodeTemp = _.find(this.vendorCodes, (_vendorCode) => {
			if (this.actionType && this.actionType.action === 'edit' && _vendorCode.id === this.item.id) {
				return _vendorCode.name.trim() === currentVendorNameTrimmed;
			}
			return _vendorCode.name.trim().toLowerCase() === currentVendorNameTrimmed.toLowerCase();
		});
		return duplicatedVendorCodeTemp;
	}

	/**
	 * @method onVendorCodeNameKeyUp
	 * Handle the `keyUp` event for Rate Card Name textbox to detect the key pressed and
	 * validate if is an allowed character
	 * @param {Object} _evt the `VendorCodeName` change event.
	 * @return {void}
	 */
	public onVendorCodeNameKeyPress(_evt) {
		const inputChar = String.fromCharCode(_evt.charCode);

		if (!VENDOR_CODE_NAME_PATTERN.test(inputChar)) {
			// invalid character, prevent input
			_evt.preventDefault();
		}
	}

	/**
	 * @method onVendorPointsChange
	 * Handle the `Change` event for VendorPoints textbox to detect any value change and determinate
	 * if the points is into the range
	 * @param {Object} _evt the `VendorPoints` change event.
	 * @return {void}
	 */
	public onVendorPointsChange(_evt) {
		this.validateForm();
	}

	/**
	 * @method onVendorPointsKeyPress
	 * Handle the `keyUp` event for vendor points textbox to detect the key pressed and
	 * validate if is an allowed character
	 * @param {Object} _evt the `VendorPoints` change event.
	 * @return {void}
	 */
	public onVendorPointsKeyPress(_evt) {
		const inputChar = String.fromCharCode(_evt.charCode);

		if (!VENDOR_POINTS_PATTERN.test(inputChar)) {
			// invalid character, prevent input
			_evt.preventDefault();
		}
	}

	/**
	 * @method showMessageError
	 * This method helps to control if the the html error message element and Save button
	 * should be displayed or enabled since both components are in dependency
	 * @param {Object} _evt the `productName` change event.
	 * @return {void}
	 */
	public showMessageError(showError: boolean, messageError: string) {
		this.showError = showError;
		this.disableOkButton = showError;
		this.messageError = messageError;
	}

	/**
	 * @method validateForm
	 * This method helps encapsulate all the rules need to activated the save/update button
	 * @return {void}
	 */
	public validateForm() {
		if (!this.vendorCodeName || this.vendorCodeName.trim().length === 0) {
			this.disableOkButton = true;
			this.showError = false;
			return;
		}

		if (!VENDOR_CODE_NAME_PATTERN.test(this.vendorCodeName)) {
			this.isInputError = true;
			this.showMessageError(true, VENDOR_CODE_NAME_INVALID_CHARACTERS_MESSAGE_ERROR);
			return;
		}

		if (this.vendorCodeName !== this.originalVendorCodeName && this.isDuplicatedVendorCode()) {
			this.isInputError = true;
			this.showMessageError(true, VENDOR_CODE_NAME_DUPLICATED_MESSAGE_ERROR);
			return;
		}

		if (isNaN(this.vendorPoints) || this.vendorPoints === null || this.vendorPoints > this.maxPoints) {
			this.disableOkButton = true;
			this.showError = false;
			return;
		}

		this.disableOkButton = false;
		this.showMessageError(false, '');
	}

	public ngOnDestroy() {
		clearTimeout(this.timerHandler);
	}

	/**
	 * @method handleBlur
	 * This method adds a default point if vendorPoints = null and activate save button
	 * @return {void}
	 */
	public handleBlur() {
		if (!this.vendorPoints) {
			this.vendorPoints = 0;
			this.disableOkButton = false;
		}
	}
}
