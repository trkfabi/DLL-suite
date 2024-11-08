import { AfterContentChecked, AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

import * as _ from 'lodash';

import { IDialogActionType } from '@shared/interfaces';

const RATE_CARD_NAME_PATTERN = RegExp('^[a-zA-Z0-9]+(s+[a-zA-Z0-9]+)*$');
const RATE_CARD_NAME_DUPLICATED_MESSAGE_ERROR = 'This Rate Card Name already exists.';
const RATE_CARD_NAME_INVALID_CHARACTERS_MESSAGE_ERROR = 'This Rate Card Name contains invalid characters or blank spaces.';

@Component({
	selector: 'app-setting-rate-card-dialog',
	templateUrl: './setting-rate-card-dialog.component.html',
	styleUrls: ['./setting-rate-card-dialog.component.scss'],
})
export class SettingRateCardDialogComponent implements AfterContentChecked, AfterViewInit, OnDestroy, OnInit {
	@Input('rateCardList') public rateCardList: any[];
	@Input('item') public item: any;
	@Input('actionType') public actionType: IDialogActionType;

	/**
	 * @property {boolean} setFocus is a flag to set the focus on input field
	 */
	public setFocus: boolean;

	/**
	 * @property {Boolean} disableOkButton is a flag that indicate if the save button should be disabled or not
	 */
	public disableOkButton: boolean;

	/**
	 * @property {Object} manageRateCard reference to input field in pop-up
	 */
	@ViewChild('manageRateCard') public manageRateCard: ElementRef;

	/**
	 * @property {String} originalRateCardName stores the original RateCardName value
	 */
	public originalRateCardName: string;

	/**
	 * @property {String} rateCardName='' stores the RateCardName value
	 */
	public rateCardName: string = '';

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
	 * @property {Number} timerHandler a handler for a timer
	 */
	private timerHandler: any;

	public ngOnInit() {
		if (this.item && this.item.name) {
			this.originalRateCardName = this.item.name;
			this.rateCardName = this.item.name;
			this.isDelete = this.actionType.action === 'delete' || false;
		}

		if (!this.originalRateCardName) {
			this.disableOkButton = true;
		}
	}

	public ngAfterViewInit() {
		this.setFocus = true;
	}

	public ngAfterContentChecked() {
		if (this.setFocus && this.manageRateCard && this.manageRateCard.nativeElement.querySelector('input')) {
			this.manageRateCard.nativeElement.querySelector('input').focus();
			this.manageRateCard.nativeElement.querySelector('input').select();
			this.timerHandler = _.defer(() => {
				this.setFocus = false;
			});
		}
	}

	/**
	 * @method onRateCardNameChange
	 * Handle the `Change` event for RateCardName textbox to detect any value change and determinate
	 * if the rate card name exists into the current rateCardList
	 * @param {Object} _evt the `RateCardName` change event.
	 * @return {void}
	 */
	public onRateCardNameChange(_evt) {
		if (!RATE_CARD_NAME_PATTERN.test(this.rateCardName)) {
			this.showMessageError(true, RATE_CARD_NAME_INVALID_CHARACTERS_MESSAGE_ERROR);
			return;
		}
		if (!this.rateCardName || this.rateCardName.trim().length === 0) {
			this.showMessageError(true, '');
			return;
		}
		if (this.rateCardName !== this.originalRateCardName && this.isDuplicatedRateCard()) {
			this.showMessageError(true, RATE_CARD_NAME_DUPLICATED_MESSAGE_ERROR);
			return;
		}
		this.showMessageError(false, '');
	}

	/**
	 * @method isDuplicatedRateCard
	 * Validates if the rate card name is duplicated
	 * @return {void}
	 */
	public isDuplicatedRateCard() {
		const currentRateCardNameTrimmed = this.rateCardName.trim();
		return _.find(this.rateCardList, (_rateCard) => {
			if (this.actionType.action === 'edit') {
				return _rateCard.name.trim() === currentRateCardNameTrimmed || false;
			}
			return _rateCard.name.trim().toLowerCase() === currentRateCardNameTrimmed.toLowerCase() || false;
		});
	}

	/**
	 * @method onRateCardNameKeyPress
	 * Handle the `keyPress` event for Rate Card Name textbox to detect the key pressed and
	 * validate if is an allowed character
	 * @param {Object} _evt the `rateCardName` change event.
	 * @return {void}
	 */
	public onRateCardNameKeyPress(_evt) {
		const inputChar = String.fromCharCode(_evt.charCode);

		if (!RATE_CARD_NAME_PATTERN.test(inputChar)) {
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
	private showMessageError(showError: boolean, messageError: string) {
		this.showError = showError;
		this.disableOkButton = showError;
		this.messageError = messageError;
	}

	public ngOnDestroy() {
		clearTimeout(this.timerHandler);
	}
}
