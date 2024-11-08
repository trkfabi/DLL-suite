import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivatedRoute, Router } from '@angular/router';

import { RouterTestingModule } from '@angular/router/testing';

import { HttpBackend, HttpClient, HttpHandler } from '@angular/common/http';

import {
	AuthService,
	BusyService,
	DataManagerService,
	ErrorService,
	LayoutService,
	RateCardsService,
	RateCardsWebService,
	ToastEventHandlerService,
	ToastService,
	WebServices,
} from '@core/services';

import { AddEditRateProgramsComponent } from './add-edit-rate-programs.component';

import { KendoUIModules } from '@layout/ui-modules';

import { AppSettings } from '@core/app-settings';

import { ToasterService } from 'angular2-toaster';

import { NumberHelper } from '@lib/helpers';

import { IRateProgram } from '@shared/interfaces';

import { SetupUnitTests } from '@shared/utils';

const setupUnitTests = new SetupUnitTests();

describe('AddEditRateProgramsComponent', () => {
	let component: AddEditRateProgramsComponent;
	let fixture: ComponentFixture<AddEditRateProgramsComponent>;

	const fakeActivatedRoute = ({
		snapshot: { data: { id: '' } },
	} as unknown) as ActivatedRoute;

	beforeEach(async(() => {
		setupUnitTests.loginUser();
		TestBed.configureTestingModule({
			imports: [RouterTestingModule, KendoUIModules],
			providers: [
				{ provide: ActivatedRoute, useValue: fakeActivatedRoute },
				AppSettings,
				AuthService,
				BusyService,
				WebServices,
				HttpClient,
				HttpHandler,
				ErrorService,
				ToasterService,
				ToastService,
				ToastEventHandlerService,
				RateCardsWebService,
				DataManagerService,
				RateCardsService,
				LayoutService,
				NumberHelper,
				HttpBackend,
			],
			declarations: [AddEditRateProgramsComponent],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(AddEditRateProgramsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	afterAll(() => setupUnitTests.logout());

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('#submitValidator()', () => {
		it('should validate the inputs with a new rate program and return false disabled button', () => {
			const rateProgramSelected = component.rateProgramSelected;
			component.isValidName = true;
			const validateData = ['name', 'purchaseOptions', 'terms', 'paymentFrequencies', 'defaults', 'amountRanges'];
			rateProgramSelected.name = 'TestName';
			rateProgramSelected.purchaseOptions = ['F'];
			rateProgramSelected.terms = ['12'];
			rateProgramSelected.defaults = { term: '12' };
			rateProgramSelected.paymentFrequencies = ['Q'];
			rateProgramSelected.amountRanges = [{ min: 1000, max: 9999.99 }];
			component.submitValidator();
			component.name.setValue('TestName');
			const actual = component.disabledButton;
			expect(actual).toBeFalsy();
		});

		it('should validate the inputs with an edit rate program and return false for enabled button', () => {
			const rateProgramSelected = component.rateProgramSelected;
			component.isValidName = true;
			const validateData = ['name', 'purchaseOptions', 'terms', 'paymentFrequencies', 'defaults', 'amountRanges'];
			rateProgramSelected.name = 'TestName';
			rateProgramSelected.purchaseOptions = ['F'];
			rateProgramSelected.terms = ['12'];
			rateProgramSelected.defaults = { term: '12' };
			rateProgramSelected.paymentFrequencies = ['Q'];
			rateProgramSelected.amountRanges = [{ min: 1000, max: 9999.99 }];
			component.originalRateProgram = rateProgramSelected;
			component.submitValidator();
			component.name.setValue('TestName');
			const actual = component.disabledButton;
			expect(actual).toBeFalse();
		});

		it('should validate the inputs and return true disabled button for name Invalid', () => {
			const rateProgramSelected = component.rateProgramSelected;
			const validateData = ['name', 'purchaseOptions', 'terms', 'paymentFrequencies', 'defaults'];
			rateProgramSelected.name = '';
			component.isValidName = false;
			component.name.setValue('1@Test');
			rateProgramSelected.purchaseOptions = ['F'];
			rateProgramSelected.terms = ['12'];
			rateProgramSelected.defaults = { term: '12' };
			rateProgramSelected.paymentFrequencies = ['Q'];
			component.submitValidator();
			const actual = component.disabledButton;
			expect(actual).toBeTrue();
		});

		it('should validate the inputs and return true disabled button for none purchase Options', () => {
			const rateProgramSelected = component.rateProgramSelected;
			const validateData = ['name', 'purchaseOptions', 'terms', 'paymentFrequencies', 'defaults'];
			rateProgramSelected.name = 'TestName';
			component.isValidName = true;
			component.name.setValue('TestName');
			rateProgramSelected.purchaseOptions = [];
			rateProgramSelected.terms = ['12'];
			rateProgramSelected.defaults = { term: '12' };
			rateProgramSelected.paymentFrequencies = ['Q'];
			component.submitValidator();
			const actual = component.disabledButton;
			expect(actual).toBeTrue();
		});

		it('should validate the inputs and return true disabled button for none terms', () => {
			const rateProgramSelected = component.rateProgramSelected;
			const validateData = ['name', 'purchaseOptions', 'terms', 'paymentFrequencies', 'defaults'];
			rateProgramSelected.name = 'TestName';
			component.isValidName = true;
			component.name.setValue('TestName');
			rateProgramSelected.purchaseOptions = ['12'];
			rateProgramSelected.terms = [];
			rateProgramSelected.defaults = { term: '12' };
			rateProgramSelected.paymentFrequencies = ['Q'];
			component.submitValidator();
			const actual = component.disabledButton;
			expect(actual).toBeTrue();
		});

		// TODO: Uncomment this if the rule is approved by Architecture Team
		//  it('should validate the inputs and return true disabled button for no default term', () => {
		// 	const rateProgramSelected = component.rateProgramSelected;
		// 	const validateData = ['name', 'purchaseOptions', 'terms', 'paymentFrequencies', 'defaults'];
		// 	rateProgramSelected.name = 'TestName';
		// 	component.isValidName = true;
		// 	component.name.setValue('TestName');
		// 	rateProgramSelected.purchaseOptions = ['12'];
		// 	rateProgramSelected.terms = ['12'];
		// 	rateProgramSelected.defaults = { term: '' };
		// 	rateProgramSelected.paymentFrequencies = ['Q'];
		// 	component.submitValidator();
		// 	const actual = component.disabledButton;
		// 	expect(actual).toBeTrue();
		// });

		it('should validate the inputs and return true disabled button for none payment frequencies', () => {
			const rateProgramSelected = component.rateProgramSelected;
			const validateData = ['name', 'purchaseOptions', 'terms', 'paymentFrequencies', 'defaults'];
			rateProgramSelected.name = 'TestName';
			component.isValidName = true;
			component.name.setValue('TestName');
			rateProgramSelected.purchaseOptions = ['12'];
			rateProgramSelected.terms = ['12'];
			rateProgramSelected.defaults = { term: '12' };
			rateProgramSelected.paymentFrequencies = [];
			component.submitValidator();
			const actual = component.disabledButton;
			expect(actual).toBeTrue();
		});
		it('should validate if the original rate program and rate program selected objects are equal and return true', () => {
			component.originalRateProgram = component.rateProgramSelected;
			component.submitValidator();
			const actual = component.disabledButton;
			expect(actual).toBeTrue();
		});
		it('should validate the double quotes in the Rate Program Name', () => {
			component.rateProgramSelected = ({
				name: '"TestName"',
				terms: [12, 48, 24],
				amountRanges: [{ min: 1000, max: 1999.99 }],
				purchaseOptions: [0, 1, 2],
				paymentFrequencies: ['A', 'SA'],
				deferrals: 0,
			} as any) as IRateProgram;
			component.name.setValue('"TestName"');
			component.submitValidator();
			const actual = component.disabledButton;
			expect(actual).toBeFalse();
		});
		it('should validate the simple quotes in the Rate Program Name', () => {
			component.rateProgramSelected = ({
				name: "'TestName'",
				terms: [12, 48, 24],
				amountRanges: [{ min: 1000, max: 1999.99 }],
				purchaseOptions: [0, 1, 2],
				paymentFrequencies: ['A', 'SA'],
				deferrals: 0,
			} as any) as IRateProgram;
			component.name.setValue("'TestName'");
			component.submitValidator();
			const actual = component.disabledButton;
			expect(actual).toBeFalse();
		});
	});

	describe('#hasDataToDisplay()', () => {
		it('should validate the inputs and return true if has name', () => {
			const rateProgramSelected = component.rateProgramSelected;
			component.name.setValue('TestName');
			rateProgramSelected.name = 'TestName';
			const actual = component.hasDataToDisplay();
			expect(actual).toBeTrue();
		});
		it('should validate the inputs and return true if has advance payment more than 0', () => {
			const rateProgramSelected = component.rateProgramSelected;
			rateProgramSelected.advancePayments = 1;
			const actual = component.hasDataToDisplay();
			expect(actual).toBeTrue();
		});
		it('should validate the inputs and return true if has advance security payment more than 0', () => {
			const rateProgramSelected = component.rateProgramSelected;
			rateProgramSelected.advanceSecurityPayments = 1;
			const actual = component.hasDataToDisplay();
			expect(actual).toBeTrue();
		});
		it('should validate the inputs and return true if has at least 1 purchase option', () => {
			const rateProgramSelected = component.rateProgramSelected;
			rateProgramSelected.purchaseOptions = ['F'];
			const actual = component.hasDataToDisplay();
			expect(actual).toBeTrue();
		});
		it('should validate the inputs and return true if has at least 1 payment frequency', () => {
			const rateProgramSelected = component.rateProgramSelected;
			rateProgramSelected.paymentFrequencies = ['Q'];
			const actual = component.hasDataToDisplay();
			expect(actual).toBeTrue();
		});
		it('should validate the inputs and return true if has at least 1 term', () => {
			const rateProgramSelected = component.rateProgramSelected;
			rateProgramSelected.terms = ['12'];
			const actual = component.hasDataToDisplay();
			expect(actual).toBeTrue();
		});
		it('should validate the inputs and return true if has deferrals', () => {
			const rateProgramSelected = component.rateProgramSelected;
			rateProgramSelected.deferrals = 30;
			const actual = component.hasDataToDisplay();
			expect(actual).toBeTrue();
		});
		it('should validate the inputs and return false or undefined if has not deferrals', () => {
			const rateProgramSelected = component.rateProgramSelected;
			rateProgramSelected.deferrals = 0;
			const actual = component.hasDataToDisplay();
			expect(actual).toBeFalsy();
		});
		it('should validate the inputs and return true if has additional points more than 0', () => {
			const rateProgramSelected = component.rateProgramSelected;
			rateProgramSelected.points = 1;
			const actual = component.hasDataToDisplay();
			expect(actual).toBeTrue();
		});
		it('should validate the inputs and return true if has at least one amount ranges', () => {
			const rateProgramSelected = component.rateProgramSelected;
			rateProgramSelected.amountRanges = [{ min: 1000, max: 9999.99 }];
			const actual = component.hasDataToDisplay();
			expect(actual).toBeTrue();
		});
	});

	describe('#checkDefaultTermExists', () => {
		it('should exist function checkDefaultTermExists', () => {
			const func = spyOn(component, 'checkDefaultTermExists');
			component.checkDefaultTermExists();

			expect(func).toHaveBeenCalled();
		});

		it('should function call functions populateRadioLists and getDefaultTermValue', () => {
			const spyPopulate = spyOn<any>(component, 'populateRadioLists');
			const spyTerm = spyOn<any>(component, 'getDefaultTermValue');
			component.rateProgramSelected = ({
				name: "'TestName'",
				terms: [12, 48, 24],
				amountRanges: [{ min: 1000, max: 1999.99 }],
				purchaseOptions: [0, 1, 2],
				paymentFrequencies: ['A', 'SA'],
				deferrals: 0,
			} as any) as IRateProgram;
			component.currentRateProgramId = null;
			component.checkDefaultTermExists();

			expect(spyTerm).toHaveBeenCalled();
			expect(spyPopulate).toHaveBeenCalled();
		});
	});

	describe('#getDefaultTermValue', () => {
		it('should exist function getDefaultTermValue', () => {
			const func = spyOn(component, 'getDefaultTermValue');
			const values = ['2', '12', '60'];
			component.getDefaultTermValue(values);

			expect(func).toHaveBeenCalled();
		});

		it('should function getDefaultTermValue return value 60', () => {
			const values = ['2', '12', '60'];
			const expected = '60';
			const actual = component.getDefaultTermValue(values);

			expect(expected).toEqual(actual);
		});

		it('should function getDefaultTermValue return value 42', () => {
			const values = ['2', '12', '42', '72'];
			const expected = '42';
			const actual = component.getDefaultTermValue(values);

			expect(expected).toEqual(actual);
		});

		it('should function getDefaultTermValue return value 72', () => {
			const values = ['72', '82', '92'];
			const expected = '72';
			const actual = component.getDefaultTermValue(values);

			expect(expected).toEqual(actual);
		});
	});

	describe('#disabledPaymentFrequency', () => {
		it('should exist function disabledPaymentFrequency', () => {
			const func = spyOn(component, 'disabledPaymentFrequency');
			const values = '0';
			component.disabledPaymentFrequency(values);

			expect(func).toHaveBeenCalled();
		});

		it('should function disabledPaymentFrequency set value "0"', () => {
			const values = '0';
			const data = [
				{ name: 'Monthly', value: 'M', checked: false, disabled: false },
				{ name: 'Quarterly', value: 'Q', checked: false, disabled: false },
				{ name: 'Semi-Annually', value: 'SA', checked: false, disabled: false },
				{ name: 'Annually', value: 'A', checked: false, disabled: false },
			];
			const expected = [
				{ name: 'Monthly', value: 'M', checked: false, disabled: false },
				{ name: 'Quarterly', value: 'Q', checked: false, disabled: false },
				{ name: 'Semi-Annually', value: 'SA', checked: false, disabled: false },
				{ name: 'Annually', value: 'A', checked: false, disabled: false },
			];
			component.paymentFrequencies = data;
			component.disabledPaymentFrequency(values);
			const actual = component.paymentFrequencies;

			expect(actual).toEqual(expected);
		});

		it('should function disabledPaymentFrequency set value "30"', () => {
			const values = '30';
			const data = [
				{ name: 'Monthly', value: 'M', checked: false, disabled: false },
				{ name: 'Quarterly', value: 'Q', checked: false, disabled: false },
				{ name: 'Semi-Annually', value: 'SA', checked: false, disabled: false },
				{ name: 'Annually', value: 'A', checked: false, disabled: false },
			];
			const expected = [
				{ name: 'Monthly', value: 'M', checked: true, disabled: false },
				{ name: 'Quarterly', value: 'Q', checked: false, disabled: true },
				{ name: 'Semi-Annually', value: 'SA', checked: false, disabled: true },
				{ name: 'Annually', value: 'A', checked: false, disabled: true },
			];
			component.paymentFrequencies = data;
			component.disabledPaymentFrequency(values);
			const actual = component.paymentFrequencies;

			expect(actual).toEqual(expected);
		});

		it('should function disabledPaymentFrequency set value "0" and paymentValue = "Q"', () => {
			const values = '0';
			const paymentValue = ['Q'];
			const data = [
				{ name: 'Monthly', value: 'M', checked: false, disabled: false },
				{ name: 'Quarterly', value: 'Q', checked: false, disabled: false },
				{ name: 'Semi-Annually', value: 'SA', checked: false, disabled: false },
				{ name: 'Annually', value: 'A', checked: false, disabled: false },
			];
			const expected = [
				{ name: 'Monthly', value: 'M', checked: false, disabled: false },
				{ name: 'Quarterly', value: 'Q', checked: true, disabled: false },
				{ name: 'Semi-Annually', value: 'SA', checked: false, disabled: false },
				{ name: 'Annually', value: 'A', checked: false, disabled: false },
			];
			component.paymentFrequencies = data;
			component.disabledPaymentFrequency(values, paymentValue);
			const actual = component.paymentFrequencies;

			expect(actual).toEqual(expected);
		});
	});
});
