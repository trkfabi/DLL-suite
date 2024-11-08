import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { doLog } from '@core/index';
import { IAmountProperties, IAmountRanges } from '@shared/interfaces';
import * as _ from 'lodash';

const MINIMUM_VALUE = 0;
const MAXIMUM_VALUE = 999999.99;
const MINIMUM_ADD = 'minimum_add';
const MAXIMUM_ADD = 'maximum_add';
const MINIMUM_FIELD = 'minimum';
const MAXIMUM_FIELD = 'maximum';
const NUMBER_REGEX = '[0-9]+(.[0-9][0-9]?)?';
const DECIMAL_VALUE = 0.01;
const LOG_TAG = '[components/shared/AmountFinanceComponent]';

@Component({
	selector: 'app-amount-finance',
	templateUrl: './amount-finance.component.html',
	styleUrls: ['./amount-finance.component.scss'],
})
export class AmountFinanceComponent implements OnDestroy, OnChanges, OnInit {
	/**
	 * @property {IAmountRanges} amountRanges receives amount ranges data from edit program
	 */
	@Input('amountRanges') amountRanges: IAmountRanges[] = [];
	/**
	 * @property {EventEmitter} amountRangesOutput return value from total to output
	 */
	@Output() amountRangesOutput: EventEmitter<IAmountProperties[]> = new EventEmitter();
	/**
	 * @property {FormGroup} amountsForm amount form
	 */
	public amountsForm: FormGroup;
	/**
	 * @property {boolean} displayInputText display input texsts minimum and maximum
	 */
	public displayInputText: boolean = false;
	/**
	 * @property {boolean} displayMinimumButton display minimum button in header amount list
	 */
	public displayMinimumButton: boolean = true;
	/**
	 * @property {boolean} disabledMinimumButton disabled minimum button in header amount list
	 */
	public disabledMinimumButton: boolean = false;
	/**
	 * @property {boolean} displayMaximumButton display maximum button in bottom amount list
	 */
	public displayMaximumButton: boolean = false;
	/**
	 * @property {boolean} disabledMaximumButton disabled maximum button in bottom amount list
	 */
	public disabledMaximumButton: boolean = false;
	/**
	 * @property {string} minimumAdd value for add maximum values
	 */
	public minimumAdd: string = MINIMUM_ADD;
	/**
	 * @property {string} maximumAdd value for add minimum values
	 */
	public maximumAdd: string = MAXIMUM_ADD;
	/**
	 * @property {IAmountProperties} amountProperties array data from amount properties
	 */
	public amountProperties: IAmountProperties[] = [];
	/**
	 * @property {array} subscriptionsArray array data with subscriptions from valueChanges
	 */
	public subscriptionsArray = [];

	constructor(private fb: FormBuilder) {}

	/**
	 * @method ngOnInit
	 * Respond when initialize app
	 * @return {void}
	 */
	public ngOnInit(): void {
		this.createForm();
	}

	/**
	 * Respond when destroy app
	 */
	public ngOnDestroy(): void {
		this.clearSubscriptions();
	}

	/**
	 * @method ngOnChanges
	 * Respond when change value from input amountRanges
	 * @param _changes receives changes in input amountRanges
	 * @return {void}
	 */
	public ngOnChanges(_changes): void {
		const amountChanges = _changes.amountRanges.currentValue;
		this.addAmountRanges(amountChanges);
	}

	/**
	 * @method amounts
	 * return amounts forms from amountsForm
	 * @return {FormArray}
	 */
	get amounts(): FormArray {
		return this.amountsForm.get('amounts') as FormArray;
	}

	/**
	 * @method amountsTotal
	 * return total from amount forms
	 * @return {number}
	 */
	get amountsTotal(): number {
		return this.amounts.length;
	}

	/**
	 * @method onCheckInputTexts
	 * Check if input text field approved the value input
	 * @param {number} _index receive index position
	 * @return {void}
	 */
	public onCheckInputTexts(_index): void {
		if (_index === -1) {
			const minimumValue = Number(this.amountsForm.get(MINIMUM_FIELD).value) || 0;
			const maximumValue = Number(this.amountsForm.get(MAXIMUM_FIELD).value) || 0;
			this.addAmountToList(minimumValue, maximumValue, MAXIMUM_ADD);
			this.clearFieldsFormAmount();
			this.amountRangesOutput.emit(this.amountProperties);
			this.enabledAll();
		}

		if (_index >= 0) {
			if (!this.amountProperties[_index] || !this.amounts.controls[_index]) {
				return;
			}
			const minimumValue = Number(this.amounts.controls[_index].get(MINIMUM_FIELD).value) || 0;
			const maximumValue = Number(this.amounts.controls[_index].get(MAXIMUM_FIELD).value) || 0;
			const maximumDisabled = this.amountProperties[_index].disabledMaximum || false;

			if (!this.validateMaximumRange(_index, maximumValue)) {
				if (maximumDisabled) {
					this.addAmountToList(minimumValue, maximumValue, MINIMUM_ADD);
					this.amounts.removeAt(0);
					this.displayMinimumButton = true;
					this.updateAmountsPropertiesDefault(minimumValue, maximumValue, _index);
					_.defer(() => {
						this.addNewOrderSubscriptions();
					});
					this.amountRangesOutput.emit(this.amountProperties);
					this.enabledAll();
					return;
				}
				this.removeAmount(_index);
				this.addAmountToList(minimumValue, maximumValue, MAXIMUM_ADD);
				this.updateAmountsPropertiesDefault(minimumValue, maximumValue, _index);
				this.displayMaximumButton = true;
				this.amountRangesOutput.emit(this.amountProperties);
				this.enabledAll();
			}
		}
	}

	/**
	 * @method validateHiddenMinimum
	 * Validate if first value minimum is zero and hide add amount range button minimum
	 * @return {boolean}
	 */
	public validateHiddenMinimum(): boolean {
		if (this.amountsTotal === 0) {
			return false;
		}
		return !!(Number(this.amounts.controls[0].get(MINIMUM_FIELD).value) === 0);
	}

	/**
	 * @method removeAmount
	 * Remove amount and button display in current index position from amount list
	 * @param {number} _index receive index position
	 * @return {void}
	 */
	public removeAmount(_index: number): void {
		if (!this.amounts.controls[_index]) {
			return;
		}
		this.amounts.removeAt(_index);
		_.remove(this.amountProperties || [], (value, index) => index === _index);
	}

	/**
	 * @method updateAmountsPropertiesDefault
	 * update amountProperties properties to default values with current index position from amount list
	 * @param {number} _minValue receive minimum value from amount
	 * @param {number} _maxValue receive maximum value from amount
	 * @param {number} _index receive index position
	 * @return {void}
	 */
	public updateAmountsPropertiesDefault(_minValue: number, _maxValue: number, _index: number): void {
		if (!this.amountProperties[_index]) {
			return;
		}
		this.amountProperties[_index].minValue = _minValue || 0;
		this.amountProperties[_index].maxValue = _maxValue || 0;
		this.amountProperties[_index].check = false;
		this.amountProperties[_index].delete = true;
		this.amountProperties[_index].disabledMinimum = true;
		this.amountProperties[_index].disabledMaximum = false;
		this.amountProperties[_index].confirmMessage = false;
		this.amountProperties[_index].confirm = false;
		this.amountProperties[_index].deleteConfirm = false;
		this.amountProperties[_index].error = null;
	}

	/**
	 * @method addAmountToList
	 * Add maximum and minimum values for create a new amount
	 * @param {string} _minValue receive minimum value from amount
	 * @param {string} _maxValue receive maximum value from amount
	 * @return {void}
	 */
	public addAmountToList(_minValue: string | number, _maxValue: string | number, _type: string): void {
		this.removeEmptyFormControls();
		let nameField = '';
		let position = 0;
		const amountProperty: IAmountProperties = {
			check: false,
			delete: true,
			minValue: _minValue,
			maxValue: _maxValue,
			error: null,
			confirm: false,
			confirmMessage: false,
			disabledMinimum: true,
			disabledMaximum: false,
			deleteConfirm: false,
		};
		const groupAmount = this.fb.group(
			{
				minimum: new FormControl(_minValue, [Validators.required, Validators.min(MINIMUM_VALUE), Validators.pattern(NUMBER_REGEX)]),
				maximum: new FormControl(_maxValue, [Validators.required, Validators.max(MAXIMUM_VALUE), Validators.pattern(NUMBER_REGEX)]),
			},
			{ validator: this.compareRangeValidator }
		);

		switch (_type) {
			case MAXIMUM_ADD:
				nameField = MAXIMUM_FIELD;
				this.amounts.push(groupAmount);
				this.amountProperties.push(amountProperty);
				position = this.amountsTotal - 1;
				break;
			case MINIMUM_ADD:
				nameField = MINIMUM_FIELD;
				const amountsData = this.amounts.controls;
				this.amounts.controls = _.concat(groupAmount, amountsData);
				this.amountProperties = _.concat(amountProperty, this.amountProperties);
				amountProperty.disabledMaximum = true;
				amountProperty.disabledMinimum = false;
				break;
		}

		if (_maxValue === '' || _minValue === '') {
			this.disabledAll();
			this.amountProperties[position].delete = false;
			this.amountProperties[position].check = true;
			this.amountProperties[position].disabledMaximum = _maxValue === '' ? false : true;
			this.amountProperties[position].disabledMinimum = _minValue === '' ? false : true;
		}
		_.defer(() => {
			this.addSubscription(position, nameField);
		});
	}

	/**
	 * @method clearSubscriptions
	 * Unsubscribe all subscriptions from subscriptionsArray
	 * @return {void}
	 */
	public clearSubscriptions(): void {
		_.map(this.subscriptionsArray, (_sub) => _sub.unsubscribe());
		this.subscriptionsArray = [];
	}

	/**
	 * @method addSubscription
	 * Add subscription for value changes to subscriptionsArray
	 * @param {number} _position receive index position
	 * @param {string} _nameField receive name field from amount
	 * @return {void}
	 */
	public addSubscription(_position: number, _nameField: string): void {
		doLog && console.log(LOG_TAG, '- addSubscription', _position, _nameField);
		if (!this.amounts.controls[_position] || !this.amountProperties[_position]) {
			return;
		}
		this.subscriptionsArray.push(
			this.amounts.controls[_position].get(_nameField).valueChanges.subscribe((changeValue) => {
				this.disabledAll();
				const { maxValue = 0, minValue = 0 } = this.amountProperties[_position];
				if (maxValue !== changeValue) {
					this.amountProperties[_position].check = true;
					this.amountProperties[_position].delete = false;
					this.amountProperties[_position].disabledMaximum = minValue === '' ? true : false;
				}
			})
		);
	}

	/**
	 * @method addNewOrderSubscriptions
	 * Clear subscriptions and add new subscriptions from amount list
	 * @return {void}
	 */
	public addNewOrderSubscriptions(): void {
		doLog && console.log(LOG_TAG, '- addNewOrderSubscriptions');
		const nameField = MAXIMUM_FIELD;
		this.clearSubscriptions();
		_.forEach(this.amountProperties, (_btn, _index) => {
			this.addSubscription(_index, nameField);
		});
	}

	/**
	 * @method removeEmptyFormControls
	 * Remove empty fields minimum or maximum in amountProperties array
	 * @return {void}
	 */
	public removeEmptyFormControls(): void {
		doLog && console.log(LOG_TAG, '- removeEmptyFormControls');
		_.remove(this.amountProperties || [], (_item) => _item.minValue === '' || _item.maxValue === '');
	}

	/**
	 * @method cleanFieldsFormAmount
	 * clear form controls minimum and maximum from amount form
	 * @return {void}
	 */
	public clearFieldsFormAmount(): void {
		this.amountsForm.get(MINIMUM_FIELD).setValue('');
		this.amountsForm.get(MAXIMUM_FIELD).setValue('');

		this.displayInputText = false;
		this.displayMinimumButton = true;

		if (this.amountsTotal > 0) {
			this.displayMaximumButton = true;
		}
	}

	/**
	 * @method onRemoveConfirm
	 * Display confirm delete buttons
	 * @param _index receive index position
	 * @return {void}
	 */
	public onRemoveConfirm(_index: number): void {
		if (!this.amountProperties[_index]) {
			return;
		}
		this.disabledAll();
		this.amountProperties[_index].confirm = true;
	}

	/**
	 * @method onCancelInputTexts
	 * Cancel values and restore to old value and display delete button
	 * @param {number} _index receive index position
	 * @return {void}
	 */
	public onCancelInputTexts(_index = null): void {
		this.displayInputText = false;
		this.displayMinimumButton = true;

		if (this.amountsTotal > 0) {
			this.displayMaximumButton = true;
		}

		if (_index === -1) {
			this.clearFieldsFormAmount();
		}

		if (_index >= 0 && this.amounts.controls[_index]) {
			const { maxValue, minValue } = this.amountProperties[_index];
			if (maxValue === '' || minValue === '') {
				this.removeAmount(_index);
				_.defer(() => {
					this.addNewOrderSubscriptions();
				});
				this.enabledAll();
				return;
			}
			this.amounts.controls[_index].get(MAXIMUM_FIELD).setValue(maxValue);
			this.amountProperties[_index].check = false;
			this.amountProperties[_index].delete = true;
			this.amountProperties[_index].confirm = false;
			this.amountProperties[_index].confirmMessage = false;
			_.defer(() => {
				this.enabledAll();
			});
		}
	}

	/**
	 * @method createForm
	 * Create a new form group for amount form
	 * @return {void}
	 */
	public createForm(): void {
		this.amountsForm = this.fb.group(
			{
				minimum: new FormControl('', [Validators.required, Validators.min(MINIMUM_VALUE), Validators.pattern(NUMBER_REGEX)]),
				maximum: new FormControl('', [
					Validators.required,
					Validators.min(1),
					Validators.max(MAXIMUM_VALUE),
					Validators.pattern(NUMBER_REGEX),
				]),
				amounts: this.fb.array([]),
			},
			{ validator: this.compareRangeValidator }
		);

		this.addAmountRanges(this.amountRanges);
	}

	/**
	 * @method addAmountRanges
	 * Add amount ranges data to amount form for display in amount list
	 * @param {IAmountRanges[]} _amountData receives amount ranges data from rate program
	 * @return {void}
	 */
	public addAmountRanges(_amountData: IAmountRanges[]): void {
		if (_amountData.length > 0) {
			_.forEach(_amountData || [], (_amount) => this.addAmountToList(_amount.min, _amount.max, MAXIMUM_ADD));
			this.displayMaximumButton = true;
		}
	}

	/**
	 * @method onAddAmountRange
	 * Add amount with empty value in minimum or maximum for new amounts
	 * when click button Add Amount Range and validate if already exist another
	 * text box with empty value in position last or start
	 * @param {string} _type receive type value maximum or minimum
	 * @return {void}
	 */
	public onAddAmountRange(_type: string): void {
		this.restoreAllDeleteConfirm();
		if (_type === MINIMUM_ADD) {
			this.displayMinimumButton = false;
		}

		if (_type === MAXIMUM_ADD) {
			this.displayMaximumButton = false;
		}

		if (this.amountsTotal > 0) {
			if (_type === MINIMUM_ADD) {
				const last = this.amountsTotal - 1;
				const { maxValue } = this.amountProperties[last];
				if (maxValue === '') {
					this.removeAmount(last);
					this.displayMaximumButton = true;
				}
				const minValue = this.getCurrentAmountForInputText(MINIMUM_ADD);
				this.addAmountToList('', minValue, MINIMUM_ADD);
			}

			if (_type === MAXIMUM_ADD) {
				const { minValue } = this.amountProperties[0];
				if (minValue === '') {
					this.removeAmount(0);
					this.displayMinimumButton = true;
				}
				const maxValue = this.getCurrentAmountForInputText(MAXIMUM_ADD);
				this.addAmountToList(maxValue, '', MAXIMUM_ADD);
			}
		} else {
			this.displayInputText = true;
		}
	}

	/**
	 * @method getCurrentAmountForInputText
	 * Get current amount value to minimum or maximum with type variable
	 * @param {string} _type receive type value maximum or minimum
	 * @return {number}
	 */
	public getCurrentAmountForInputText(_type: string): number {
		switch (_type) {
			case MINIMUM_ADD:
				const { minimum } = this.amounts.controls[0].value || 0;
				return Number(minimum) - DECIMAL_VALUE;
			case MAXIMUM_ADD:
				const position = this.amountsTotal - 1;
				const { maximum } = this.amounts.controls[position].value || 0;
				return Number(maximum) + DECIMAL_VALUE;
		}
	}

	/**
	 * @method onRemoveAmount
	 * Remove one amount range from amount range list
	 * @param {number} _index receive index position
	 * @return {void}
	 */
	public onRemoveAmount(_index: number): void {
		const validation = this.validateUpAndDownValues(_index);
		if (validation) {
			this.updateUpAndDownValues(_index);
		}
		this.removeAmount(_index);
		_.defer(() => {
			this.addNewOrderSubscriptions();
		});
		this.displayMaximumButton = false;
		if (this.amountsTotal > 0) {
			this.displayMinimumButton = true;
			this.displayMaximumButton = true;
		}
		this.amountRangesOutput.emit(this.amountProperties);
		this.enabledAll();
	}

	/**
	 * @method validateUpAndDownValues
	 * Validate if exist rows up and down from index position
	 * @param {number} _index index position from amounts list
	 * @return {boolean}
	 */
	public validateUpAndDownValues(_index: number): boolean {
		const positionUp = _index - 1;
		const positionDown = _index + 1;
		return this.amountProperties[positionUp] !== undefined && this.amountProperties[positionDown] !== undefined;
	}

	/**
	 * @method updateUpAndDownValues
	 * Update minimum value in down row with maximum value from up row started index
	 * @param {number} _index index position from amounts list
	 * @return {void}
	 */
	public updateUpAndDownValues(_index: number): void {
		const positionUp = _index - 1;
		const maximum = Number(this.amounts.controls[positionUp].get(MAXIMUM_FIELD).value) || 0;
		this.updateNewMinimumDown(maximum, _index);
	}

	/**
	 * @method compareRangeValidator
	 * validator form control comparing range minimum and maximum from amount
	 * @param {AbstractControl} form receive form from formgrup in formArray
	 * @return{ValidationErrors|null}
	 */
	public compareRangeValidator(form: AbstractControl): ValidationErrors | null {
		const minimum = Number(form.get(MINIMUM_FIELD).value) || 0;
		const maximum = Number(form.get(MAXIMUM_FIELD).value) || 0;
		const message = 'Max value shouldn’t be less than Min Value';
		const maximumMessage = `Max values shouldn’t be more than ${MAXIMUM_VALUE}`;

		if (maximum > MAXIMUM_VALUE || minimum > MAXIMUM_VALUE) {
			return { range: maximumMessage };
		}

		if (maximum > 0 && minimum > 0) {
			return minimum <= maximum ? null : { range: message };
		}
		return null;
	}

	/**
	 * @method validateMaximumRange
	 * Validate if have more values ranges from maximum amount index and display confirm message to delete
	 * @param {number} _index  index position from amounts list
	 * @param {number} _maxValue maximum value from amount
	 * @return {boolean}
	 */
	public validateMaximumRange(_index: number, _maxValue: number): boolean {
		let position = _index + 1;
		const maximumValue = this.amountProperties[_index].maxValue || 0;
		while (this.amounts.controls[position] && this.amounts.controls[position].get(MAXIMUM_FIELD).value < _maxValue) {
			this.amountProperties[position].deleteConfirm = true;
			this.amountProperties[position].delete = false;
			position++;
		}
		position--;

		if (position > _index) {
			this.disabledAll();
			this.amountProperties[_index].confirm = true;
			this.amountProperties[_index].confirmMessage = true;
			return true;
		}

		if ((_maxValue > 0 && maximumValue > _maxValue) || maximumValue < _maxValue) {
			this.updateNewMinimumDown(_maxValue, _index);
			this.amountProperties[_index].maxValue = _maxValue;
			this.amountProperties[_index].check = false;
			this.amountProperties[_index].delete = true;
			this.displayMaximumButton = true;
			this.enabledAll();
			this.amountRangesOutput.emit(this.amountProperties);
			return true;
		}

		return false;
	}

	/**
	 * @method restoreAllDeleteConfirm
	 * Restore all amount properties to default in deleteConfirm and delete
	 * @return {void}
	 */
	public restoreAllDeleteConfirm(): void {
		_.forEach(this.amountProperties || [], (_amount, _index) => {
			this.amountProperties[_index].deleteConfirm = false;
			this.amountProperties[_index].delete = true;
			this.amountProperties[_index].confirm = false;
		});
	}

	/**
	 * @method onRemoveAmounts
	 * Remove amounts with property deleteConfirm from amountProperties and amounts form
	 * @param _index index position from amounts list
	 * @return {void}
	 */
	public onRemoveAmounts(_index: number): void {
		if (!this.amountProperties[_index]) {
			return;
		}
		_.remove(this.amountProperties || [], (_amount) => {
			if (_amount.deleteConfirm === true) {
				_.remove(this.amounts.controls || [], (_ctrl) => _ctrl.controls.maximum.value === _amount.maxValue);
				return true;
			}
		});
		this.updateNewMaximumValue(_index);
		this.enabledAll();
		this.amountRangesOutput.emit(this.amountProperties);
	}

	/**
	 * @method updateNewMaximumValue
	 * update maximum value in amountProperties after update minimum value from down index position
	 * and update subscriptions orders
	 * @param {number} _index index position from amounts list
	 * @return {void}
	 */
	public updateNewMaximumValue(_index: number): void {
		if (!this.amounts.controls[_index]) {
			return;
		}
		const maximum = Number(this.amounts.controls[_index].get(MAXIMUM_FIELD).value) || 0;
		this.amountProperties[_index].maxValue = maximum;
		this.updateNewMinimumDown(maximum, _index);
		_.defer(() => {
			this.addNewOrderSubscriptions();
		});
	}

	/**
	 * @method updateNewMinimumDown
	 * update new minimum value with maximun increase 0.01 in index position down from amount list
	 * @param {number} _maximum receives maximum value from amount
	 * @param {number} _index index position from amounts list
	 * @return {void}
	 */
	public updateNewMinimumDown(_maximum: number, _index: number): void {
		const newMinimum = _maximum + DECIMAL_VALUE;
		const positionDown = _index + 1;
		if (!this.amounts.controls[positionDown]) {
			return;
		}
		this.amounts.controls[positionDown].get(MINIMUM_FIELD).setValue(newMinimum);
		this.amountProperties[positionDown].minValue = newMinimum;
	}

	/**
	 * @method onAmountChange
	 * validate if value is less than zero and display error message
	 * @param {number} _value receives value from value change
	 * @param {any} form receives form from amount
	 * @return {void}
	 */
	public onAmountChange(_value: number, form: any): void {
		if (!isNaN(_value) && _value < 0) {
			const message = `Value shouldn’t be less than ${MINIMUM_VALUE}`;
			form.errors = { range: message };
		}
	}

	/**
	 * @method disabledAll
	 * Disabled all buttons and textbox in amount list
	 * @return {void}
	 */
	public disabledAll(): void {
		doLog && console.log(LOG_TAG, '- disabledAll');
		this.disabledMaximumButton = true;
		this.disabledMinimumButton = true;

		_.forEach(this.amountProperties || [], (_item) => {
			_item.confirm = false;
			_item.check = false;
			_item.disabledMaximum = true;
			_item.delete = false;
		});
	}

	/**
	 * @method enabledAll
	 * Enabled buttons and texbox to default values in amount list
	 * @return {void}
	 */
	public enabledAll(): void {
		doLog && console.log(LOG_TAG, '- enabledAll');
		this.disabledMaximumButton = false;
		this.disabledMinimumButton = false;

		_.forEach(this.amountProperties || [], (_item) => {
			_item.confirmMessage = false;
			_item.deleteConfirm = false;
			_item.confirm = false;
			_item.disabledMaximum = false;
			_item.disabledMinimum = true;
			_item.delete = true;
			_item.check = false;
		});
	}
}
