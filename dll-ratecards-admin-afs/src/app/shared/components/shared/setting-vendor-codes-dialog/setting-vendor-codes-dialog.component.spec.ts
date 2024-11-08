import { HttpBackend, HttpClient, HttpHandler } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import {
	AppSettings,
	AuthService,
	BusyService,
	ErrorService,
	LayoutService,
	ToastEventHandlerService,
	ToastService,
	WebServices,
} from '@core/index';
import { NumberHelper } from '@lib/index';
import { DialogContainerService, DialogService } from '@progress/kendo-angular-dialog';
import { SetupUnitTests } from '@shared/utils';
import { ToasterService } from 'angular2-toaster';

import { SettingVendorCodesDialogComponent } from './setting-vendor-codes-dialog.component';

const setupUnitTests = new SetupUnitTests();

describe('SettingVendorCodesDialogComponent', () => {
	let component: SettingVendorCodesDialogComponent;
	let fixture: ComponentFixture<SettingVendorCodesDialogComponent>;

	beforeEach(async(() => {
		setupUnitTests.loginUser();
		TestBed.configureTestingModule({
			declarations: [SettingVendorCodesDialogComponent],
			imports: [RouterTestingModule],
			providers: [
				AppSettings,
				AuthService,
				BusyService,
				WebServices,
				HttpClient,
				HttpHandler,
				NumberHelper,
				HttpBackend,
				DialogService,
				DialogContainerService,
				ErrorService,
				ToastService,
				ToasterService,
				ToastEventHandlerService,
				LayoutService,
			],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(SettingVendorCodesDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	afterAll(() => setupUnitTests.logout());

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('#isDuplicatedVendorCode()', () => {
		it('should be defined function isDuplicatedVendorCode', () => {
			const func = spyOn<any>(component, 'isDuplicatedVendorCode');
			component.isDuplicatedVendorCode();
			expect(func).toHaveBeenCalled();
		});
		it('should be defined function isDuplicatedVendorCode and return vendor with same name', () => {
			const vendorCodes = [
				{
					id: '9a17112d-fb02-4342-a795-9e07c9eae1a0',
					versionId: '7903dd29-053c-4fc2-aa9c-2bfe8180efa5',
					rateCardId: 'de81002f-dd71-439a-ad3d-161af809ff8a',
					name: 'sis',
					points: 2,
					deleted: false,
				},
				{
					id: '77b8bab5-e78d-4a63-8952-162a4d106777',
					versionId: '7903dd29-053c-4fc2-aa9c-2bfe8180efa5',
					rateCardId: 'de81002f-dd71-439a-ad3d-161af809ff8a',
					name: 'egg',
					points: 4,
					deleted: false,
				},
			];
			component.vendorCodes = vendorCodes;
			component.vendorCodeName = 'sis';
			const expected = 'sis';
			const func = component.isDuplicatedVendorCode();
			const actual = func.name;
			expect(expected).toEqual(actual);
		});
	});

	describe('#validateForm()', () => {
		it('should be defined function validateForm', () => {
			const func = spyOn<any>(component, 'validateForm');
			component.validateForm();
			expect(func).toHaveBeenCalled();
		});
		it('should function validateForm set vendorCodename empty', () => {
			component.vendorCodeName = '';
			component.validateForm();
			const expectedButton = true;
			const expectedShowError = false;
			const actualButton = component.disableOkButton;
			const actualShowError = component.showError;

			expect(actualButton).toEqual(expectedButton);
			expect(actualShowError).toEqual(expectedShowError);
		});

		it('should function validateForm set vendorCodename wrong', () => {
			const spyShow = spyOn(component, 'showMessageError');
			component.isInputError = false;
			component.vendorCodeName = 'TestName ';
			component.validateForm();
			const expectedInputError = true;
			const actualInputError = component.isInputError;

			expect(actualInputError).toEqual(expectedInputError);
			expect(spyShow).toHaveBeenCalled();
		});

		it('should function validateForm set vendorCodename duplicate', () => {
			component.isInputError = false;
			const spyDuplicate = spyOn(component, 'isDuplicatedVendorCode').and.returnValue({});
			component.vendorCodeName = 'TestName';
			component.validateForm();
			const expectedInputError = true;
			const actualInputError = component.isInputError;

			expect(actualInputError).toEqual(expectedInputError);
			expect(spyDuplicate).toHaveBeenCalled();
		});

		it('should function validateForm have vendor points', () => {
			component.vendorPoints = 0;
			component.validateForm();
			const expectedButton = true;
			const expectedShowError = false;
			const actualButton = component.disableOkButton;
			const actualShowError = component.showError;

			expect(actualButton).toEqual(expectedButton);
			expect(actualShowError).toEqual(expectedShowError);
		});

		it('should function validateForm set an empty vendorCodename', () => {
			component.vendorCodeName = '';
			component.validateForm();
			const expectedButton = true;
			const expectedShowError = false;
			const actualButton = component.disableOkButton;
			const actualShowError = component.showError;

			expect(actualButton).toEqual(expectedButton);
			expect(actualShowError).toEqual(expectedShowError);
		});

		it('should function validateForm set vendorCodename invalid', () => {
			const spyError = spyOn(component, 'showMessageError');
			component.vendorCodeName = 'TestName-valid!!!';
			component.validateForm();
			const isInputError = true;
			const actualInput = component.isInputError;

			expect(actualInput).toEqual(isInputError);
			expect(spyError).toHaveBeenCalled();
		});

		it('should function validateForm set vendorCodename valid', () => {
			component.vendorCodeName = 'TestName-valid';
			component.validateForm();
			const expectedButton = false;
			const actualButton = component.disableOkButton;

			expect(actualButton).toEqual(expectedButton);
		});

		it('should function validateForm set vendorPoints invalid', () => {
			component.vendorPoints = null;
			component.maxPoints = 0;
			const expectedButton = true;
			const expectedShowError = false;
			component.validateForm();
			const actualButton = component.disableOkButton;
			const actualError = component.showError;

			expect(actualButton).toEqual(expectedButton);
			expect(actualError).toEqual(expectedShowError);
		});
	});
});
