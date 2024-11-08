import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { IAmountProperties } from '@shared/interfaces';
import { SetupUnitTests } from '@shared/utils';
import { AmountFinanceComponent } from './amount-finance.component';

const setupUnitTests = new SetupUnitTests();

describe('AmountFinanceComponent', () => {
	let component: AmountFinanceComponent;
	let fixture: ComponentFixture<AmountFinanceComponent>;

	beforeEach(async(() => {
		setupUnitTests.loginUser();
		TestBed.configureTestingModule({
			declarations: [AmountFinanceComponent],
			providers: [FormBuilder],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(AmountFinanceComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	afterAll(() => setupUnitTests.logout());

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('#updateAmountsPropertiesDefault', () => {
		it('should exist function updateAmountsPropertiesDefault', () => {
			const func = spyOn(component, 'updateAmountsPropertiesDefault');
			const maxValue = 9999.99;
			const minValue = 50000;
			const index = 0;
			component.updateAmountsPropertiesDefault(minValue, maxValue, index);

			expect(func).toHaveBeenCalled();
		});

		it('should function updateAmountsPropertiesDefault insert values minValue and maxValue with index', () => {
			const maxValue = 9999.99;
			const minValue = 50000;
			const index = 0;
			const data: IAmountProperties = {
				minValue: 0,
				maxValue: 0,
				check: false,
				delete: true,
				disabledMinimum: true,
				disabledMaximum: false,
				confirmMessage: false,
				confirm: false,
				deleteConfirm: false,
				error: null,
			};
			const expected: IAmountProperties = {
				minValue,
				maxValue,
				check: false,
				delete: true,
				disabledMinimum: true,
				disabledMaximum: false,
				confirmMessage: false,
				confirm: false,
				deleteConfirm: false,
				error: null,
			};
			component.amountProperties = [data];

			component.updateAmountsPropertiesDefault(minValue, maxValue, index);
			const actual = component.amountProperties[index];

			expect(expected).toEqual(actual);
		});
	});

	describe('#addAmountToList', () => {
		it('should exist function addAmountToList', () => {
			const func = spyOn(component, 'addAmountToList');
			const maxValue = 9999.99;
			const minValue = 50000;
			const type = 'maximum_add';
			component.addAmountToList(minValue, maxValue, type);

			expect(func).toHaveBeenCalled();
		});

		it('should function addAmountToList add new data to amountProperties', () => {
			const maxValue = 9999.99;
			const minValue = 50000;
			const type = 'maximum_add';
			const expected: IAmountProperties[] = [
				{
					minValue,
					maxValue,
					check: false,
					delete: true,
					disabledMinimum: true,
					disabledMaximum: false,
					confirmMessage: false,
					confirm: false,
					deleteConfirm: false,
					error: null,
				},
			];
			component.addAmountToList(minValue, maxValue, type);
			const actual = component.amountProperties;

			expect(expected).toEqual(actual);
		});
	});

	describe('#clearSubscriptions', () => {
		it('should exist function clearSubscriptions', () => {
			const func = spyOn(component, 'clearSubscriptions');
			component.clearSubscriptions();

			expect(func).toHaveBeenCalled();
		});

		it('should function clearSubscriptions clear to empty subscriptionsArray', () => {
			const expected = [];
			component.subscriptionsArray = [{ unsubscribe: () => {} }];
			component.clearSubscriptions();
			const actual = component.subscriptionsArray;

			expect(expected).toEqual(actual);
		});
	});

	describe('#addSubscription', () => {
		it('should exist function addSubscription', () => {
			const func = spyOn(component, 'addSubscription');
			const position = 0;
			const nameField = 'maximum';
			component.addSubscription(position, nameField);

			expect(func).toHaveBeenCalled();
		});
	});

	describe('#addNewOrderSubscriptions', () => {
		it('should exist function addNewOrderSubscriptions', () => {
			const func = spyOn(component, 'addNewOrderSubscriptions');
			component.addNewOrderSubscriptions();

			expect(func).toHaveBeenCalled();
		});

		it('should function addNewOrderSubscriptions call functions clearSubscriptions and addSubscription', () => {
			const spyClear = spyOn(component, 'clearSubscriptions');
			const spyAdd = spyOn(component, 'addSubscription');
			const data: IAmountProperties = {
				minValue: 10000.0,
				maxValue: 19999.99,
				check: false,
				delete: true,
				disabledMinimum: true,
				disabledMaximum: false,
				confirmMessage: false,
				confirm: false,
				deleteConfirm: false,
				error: null,
			};
			component.amountProperties = [data];
			component.addNewOrderSubscriptions();

			expect(spyClear).toHaveBeenCalled();
			expect(spyAdd).toHaveBeenCalled();
		});
	});

	describe('#removeEmptyFormControls', () => {
		it('should exist function removeEmptyFormControls', () => {
			const func = spyOn(component, 'removeEmptyFormControls');
			component.removeEmptyFormControls();

			expect(func).toHaveBeenCalled();
		});

		it('should function removeEmptyFormControls clear to empty array amountProperties', () => {
			const data: IAmountProperties = {
				minValue: '',
				maxValue: '',
				check: false,
				delete: true,
				disabledMinimum: true,
				disabledMaximum: false,
				confirmMessage: false,
				confirm: false,
				deleteConfirm: false,
				error: null,
			};
			const expected = [];
			component.amountProperties = [data];
			component.removeEmptyFormControls();

			const actual = component.amountProperties;

			expect(expected).toEqual(actual);
		});
	});

	describe('#clearFieldsFormAmount', () => {
		it('should exist function clearFieldsFormAmount', () => {
			const func = spyOn(component, 'clearFieldsFormAmount');
			component.clearFieldsFormAmount();

			expect(func).toHaveBeenCalled();
		});
	});

	describe('#createForm', () => {
		it('should exist function createForm', () => {
			const func = spyOn(component, 'createForm');
			component.createForm();

			expect(func).toHaveBeenCalled();
		});

		it('should function createForm call function addAmountRanges', () => {
			const spyAdd = spyOn(component, 'addAmountRanges');
			component.createForm();

			expect(spyAdd).toHaveBeenCalled();
		});
	});

	describe('#addAmountRanges', () => {
		it('should exist function addAmountRanges', () => {
			const func = spyOn(component, 'addAmountRanges');
			const data = [{ min: 10000, max: 19999.99 }];
			component.addAmountRanges(data);

			expect(func).toHaveBeenCalled();
		});

		it('should function addAmountRanges call function addAmountToList', () => {
			const spyAdd = spyOn(component, 'addAmountToList');
			const data = [{ min: 10000, max: 19999.99 }];
			component.addAmountRanges(data);

			expect(spyAdd).toHaveBeenCalled();
		});
	});

	describe('#getCurrentAmountForInputText', () => {
		it('should exist function getCurrentAmountForInputText', () => {
			const func = spyOn(component, 'getCurrentAmountForInputText');
			const type = 'minimum_add';
			component.getCurrentAmountForInputText(type);

			expect(func).toHaveBeenCalled();
		});
	});

	describe('#validateUpAndDownValues', () => {
		it('should exist function validateUpAndDownValues', () => {
			const func = spyOn(component, 'validateUpAndDownValues');
			const position = 0;
			component.validateUpAndDownValues(position);

			expect(func).toHaveBeenCalled();
		});
	});

	describe('#updateUpAndDownValues', () => {
		it('should exist function updateUpAndDownValues', () => {
			const func = spyOn(component, 'updateUpAndDownValues');
			const position = 0;
			component.updateUpAndDownValues(position);

			expect(func).toHaveBeenCalled();
		});
	});

	describe('#validateMaximumRange', () => {
		it('should exist function validateMaximumRange', () => {
			const func = spyOn(component, 'validateMaximumRange');
			const maxValue = 19999.99;
			const position = 0;
			component.validateMaximumRange(position, maxValue);

			expect(func).toHaveBeenCalled();
		});
	});

	describe('#restoreAllDeleteConfirm', () => {
		it('should exist function restoreAllDeleteConfirm', () => {
			const func = spyOn(component, 'restoreAllDeleteConfirm');
			component.restoreAllDeleteConfirm();

			expect(func).toHaveBeenCalled();
		});

		it('should function restoreAllDeleteConfirm change to false property deleteConfirm and true property delete', () => {
			const data: IAmountProperties = {
				minValue: '',
				maxValue: '',
				check: false,
				delete: false,
				disabledMinimum: true,
				disabledMaximum: false,
				confirmMessage: false,
				confirm: false,
				deleteConfirm: true,
				error: null,
			};
			component.amountProperties = [data];
			component.restoreAllDeleteConfirm();
			const actualDelete = component.amountProperties[0].delete;
			const actualConfirm = component.amountProperties[0].deleteConfirm;

			expect(actualDelete).toBeTruthy();
			expect(actualConfirm).toBeFalsy();
		});
	});

	describe('#updateNewMinimumDown', () => {
		it('should exist function updateNewMinimumDown', () => {
			const func = spyOn(component, 'updateNewMinimumDown');
			const maxValue = 19999.99;
			const position = 0;
			component.updateNewMinimumDown(maxValue, position);

			expect(func).toHaveBeenCalled();
		});
	});

	describe('#updateNewMaximumValue', () => {
		it('should exist funttion updateNewMaximumValue', () => {
			const func = spyOn(component, 'updateNewMaximumValue');
			const index = 0;
			component.updateNewMaximumValue(index);
		});

		it('should function updateNewMaximumValue call function updateNewMinimumDown', () => {
			const spyMin = spyOn(component, 'updateNewMinimumDown');
			const index = 0;
			const form = new FormGroup({
				amounts: new FormArray([
					new FormGroup({
						maximum: new FormControl(1000),
					}),
				]),
			});
			const data: IAmountProperties = {
				minValue: '',
				maxValue: '',
				check: false,
				delete: false,
				disabledMinimum: true,
				disabledMaximum: false,
				confirmMessage: false,
				confirm: false,
				deleteConfirm: true,
				error: null,
			};
			component.amountProperties = [data];
			component.amountsForm = form;
			component.updateNewMaximumValue(index);

			expect(spyMin).toHaveBeenCalled();
		});

		it('should function updateNewMaximumValue update maxValue from amountProperties with position index', () => {
			const index = 0;
			const expected = 1000;
			const form = new FormGroup({
				amounts: new FormArray([
					new FormGroup({
						maximum: new FormControl(expected),
					}),
				]),
			});
			const data: IAmountProperties = {
				minValue: '',
				maxValue: '',
				check: false,
				delete: false,
				disabledMinimum: true,
				disabledMaximum: false,
				confirmMessage: false,
				confirm: false,
				deleteConfirm: true,
				error: null,
			};
			component.amountProperties = [data];
			component.amountsForm = form;
			component.updateNewMaximumValue(index);
			const actual = component.amountProperties[index].maxValue;

			expect(actual).toEqual(expected);
		});
	});

	describe('#compareRangeValidator', () => {
		it('should exist function compareRangeValidator', () => {
			const func = spyOn(component, 'compareRangeValidator');
			const form = new FormGroup({
				minimum: new FormControl(10000),
				maximum: new FormControl(100),
			});
			component.compareRangeValidator(form);

			expect(func).toHaveBeenCalled();
		});

		it('should function compareRangeValidator return message "Max value shouldn’t be less than Min Value"', () => {
			const form = new FormGroup({
				minimum: new FormControl(10000),
				maximum: new FormControl(100),
			});
			const expected = { range: 'Max value shouldn’t be less than Min Value' };
			const actual = component.compareRangeValidator(form);

			expect(actual).toEqual(expected);
		});

		it('should function compareRangeValidator return message "Max values shouldn’t be more than 999,999.99"', () => {
			const form = new FormGroup({
				minimum: new FormControl(1000),
				maximum: new FormControl(10000000000),
			});
			const expected = { range: 'Max values shouldn’t be more than 999999.99' };
			const actual = component.compareRangeValidator(form);

			expect(actual).toEqual(expected);
		});

		it('should function compareRangeValidator return null', () => {
			const form = new FormGroup({
				minimum: new FormControl(0),
				maximum: new FormControl(0),
			});
			const actual = component.compareRangeValidator(form);

			expect(actual).toBeNull();
		});
	});

	describe('#disabledAll', () => {
		it('should exist function disabledAll', () => {
			const func = spyOn(component, 'disabledAll');
			component.disabledAll();

			expect(func).toHaveBeenCalled();
		});

		it('should function disabledAll and disabed textbox', () => {
			const data: IAmountProperties = {
				minValue: '',
				maxValue: '',
				check: true,
				delete: true,
				disabledMinimum: true,
				disabledMaximum: true,
				confirmMessage: false,
				confirm: false,
				deleteConfirm: true,
				error: null,
			};
			const expected: IAmountProperties = {
				minValue: '',
				maxValue: '',
				check: false,
				delete: false,
				disabledMinimum: true,
				disabledMaximum: true,
				confirmMessage: false,
				confirm: false,
				deleteConfirm: true,
				error: null,
			};
			component.amountProperties = [data];
			component.disabledAll();
			const actual = component.amountProperties[0];

			expect(actual).toEqual(expected);
		});
	});

	describe('#enabledAll', () => {
		it('should exist function enabledAll', () => {
			const func = spyOn(component, 'enabledAll');
			component.enabledAll();

			expect(func).toHaveBeenCalled();
		});

		it('should function enabledAll and enabled textbox', () => {
			const data: IAmountProperties = {
				minValue: '',
				maxValue: '',
				check: true,
				delete: false,
				disabledMinimum: true,
				disabledMaximum: true,
				confirmMessage: true,
				confirm: true,
				deleteConfirm: true,
				error: null,
			};
			const expected: IAmountProperties = {
				minValue: '',
				maxValue: '',
				check: false,
				delete: true,
				disabledMinimum: true,
				disabledMaximum: false,
				confirmMessage: false,
				confirm: false,
				deleteConfirm: false,
				error: null,
			};
			component.amountProperties = [data];
			component.enabledAll();
			const actual = component.amountProperties[0];

			expect(actual).toEqual(expected);
		});
	});
});
