import { HttpBackend, HttpClient, HttpHandler } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppSettings } from '@core/index';
import { AuthService, BusyService, ErrorService, LayoutService, ToastEventHandlerService, ToastService, WebServices } from '@core/services';
import { DataManagerService } from '@core/services/data-manager.service';
import { RateCardsService } from '@core/services/rate-cards.service';
import { RateCardsWebService } from '@core/services/ratecards.webservice';
import { KendoUIModules } from '@layout/index';
import { NumberHelper } from '@lib/index';
import { DialogContainerService, DialogService } from '@progress/kendo-angular-dialog';
import { SetupUnitTests } from '@shared/utils';
import { ToasterService } from 'angular2-toaster';
import { ManageTermsComponent } from './manage-terms.component';

const setupUnitTests = new SetupUnitTests();

describe('[afs/components/manage-terms/ManageTermsComponent]', () => {
	let component: ManageTermsComponent;
	let fixture: ComponentFixture<ManageTermsComponent>;
	let busyService: BusyService;

	beforeEach(async(() => {
		setupUnitTests.loginUser();
		TestBed.configureTestingModule({
			declarations: [ManageTermsComponent],
			imports: [RouterTestingModule, KendoUIModules],
			providers: [
				AppSettings,
				AuthService,
				BusyService,
				WebServices,
				HttpClient,
				HttpHandler,
				DialogService,
				DialogContainerService,
				ErrorService,
				ToastService,
				ToasterService,
				ToastEventHandlerService,
				LayoutService,
				RateCardsWebService,
				DataManagerService,
				RateCardsService,
				NumberHelper,
				HttpBackend,
			],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ManageTermsComponent);
		component = fixture.componentInstance;
		busyService = TestBed.inject(BusyService);
		fixture.detectChanges();
	});

	afterAll(() => setupUnitTests.logout());

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('#countTerms', () => {
		it('should be defined function countTerms', () => {
			const func = spyOn(component, 'countTerms');
			component.countTerms();

			expect(func).toHaveBeenCalled();
		});

		it('should function countTerms return value "false"', () => {
			component.isDisabled = true;
			component.countTerms();
			const expected = component.isDisabled;

			expect(expected).toBeFalsy();
		});
	});

	describe('#isValidEntry', () => {
		it('should be defined function isValidEntry', () => {
			const func = spyOn(component, 'isValidEntry');
			const value = { name: 1 };
			component.isValidEntry(value);

			expect(func).toHaveBeenCalled();
		});

		it('should function isValidEntry input value 1 and return value "true"', () => {
			const value = { name: 1 };
			const expected = component.isValidEntry(value);

			expect(expected).toBeTruthy();
		});

		it('should function isValidEntry input value 0 and return value "false"', () => {
			const value = { name: 0 };
			const expected = component.isValidEntry(value);

			expect(expected).toBeFalsy();
		});
	});

	describe('#displayDeleteTermDialogNoRemove', () => {
		it('should be defined function displayDeleteTermDialogNoRemove', () => {
			const func = spyOn(component, 'displayDeleteTermDialogNoRemove');
			const template = {};
			const params = { item: {} };
			component.displayDeleteTermDialogNoRemove(template, params);

			expect(func).toHaveBeenCalled();
		});

		it('should function displayDeleteTermDialogNoRemove assign values to variables buttonAction and dialogAction', () => {
			const template = {};
			const params = { item: {} };
			const actualButton = 'OK';
			const actualDialog = null;
			component.displayDeleteTermDialogNoRemove(template, params);
			const expectedButton = component.buttonAction;
			const expectedDialog = component.dialogAction;

			expect(expectedDialog).toEqual(actualDialog);
			expect(expectedButton).toEqual(actualButton);
		});
	});

	describe('#displayDeleteTermDialog', () => {
		it('should be defined function displayDeleteTermDialog', () => {
			const func = spyOn(component, 'displayDeleteTermDialog');
			const template = {};
			const params = { item: {} };
			component.displayDeleteTermDialog(template, params);

			expect(func).toHaveBeenCalled();
		});

		it('should function displayDeleteTermDialog assign values to variables buttonAction and dialogAction', () => {
			const template = {};
			const params = { item: {} };
			const actualButton = 'Delete';
			const actualDialog = 'delete';
			component.displayDeleteTermDialog(template, params);
			const expectedButton = component.buttonAction;
			const expectedDialog = component.dialogAction;

			expect(expectedDialog).toEqual(actualDialog);
			expect(expectedButton).toEqual(actualButton);
		});
	});

	describe('#validateSubmitAction', () => {
		it('should be defined function validateSubmitAction', () => {
			const func = spyOn(component, 'validateSubmitAction');
			const type = 'add';
			component.validateSubmitAction(type);

			expect(func).toHaveBeenCalled();
		});

		it('should function validateSubmitAction and call function validateSubmitAction', () => {
			spyOn(component, 'isValidEntry').and.returnValue(true);
			const spyCount = spyOn(component, 'countTerms');
			const type = 'add';
			const valueTerms = [{ termID: 1 }];
			const valueDialog = { item: { termID: 1, name: '', status: 1 }, errorMessage: '', showErrorMessage: false };
			component.terms = valueTerms;
			component.dialogRefComponent = valueDialog;
			component.validateSubmitAction(type);

			expect(spyCount).toHaveBeenCalled();
		});
	});

	describe('#updateTermsVersion', () => {
		it('should be defined function updateTermsVersion', () => {
			const func = spyOn(component, 'updateTermsVersion');
			const terms = {};
			component.updateTermsVersion(terms);

			expect(func).toHaveBeenCalled();
		});

		it('should function updateTermsVersion set value to variable terms', () => {
			const terms = { value: 1 };
			const actualName = '1';
			const actualTermID = 1001;
			component.updateTermsVersion(terms);
			const expectedName = component.terms[0].name;
			const expectedTermID = component.terms[0].termID;

			expect(expectedName).toEqual(actualName);
			expect(expectedTermID).toEqual(actualTermID);
		});
	});

	describe('#loadVersionSelected', () => {
		it('should exist function loadVersionSelected', () => {
			const func = spyOn(component, 'loadVersionSelected');
			const version = { terms: {} };
			component.loadVersionSelected(version);

			expect(func).toHaveBeenCalled();
		});

		it('should function loadVersionSelected call functions updateTermsVersion and countTerms', () => {
			const version = { terms: {} };
			const spyUpdate = spyOn(component, 'updateTermsVersion');
			const spyCount = spyOn(component, 'countTerms');
			component.loadVersionSelected(version);
			expect(spyUpdate).toHaveBeenCalled();
			expect(spyCount).toHaveBeenCalled();
		});

		it('should function loadVersionSelected assign values to variables terms with empty array and versionSelected with null', () => {
			const actualTerms = [];
			const actualVersion = null;
			component.loadVersionSelected();
			const expectedTerms = component.terms;
			const expectedVersion = component.versionSelected;

			expect(expectedTerms).toEqual(actualTerms);
			expect(expectedVersion).toEqual(actualVersion);
		});
	});

	describe('#hideLoader', () => {
		it('should exist function hideLoader', () => {
			const func = spyOn(component, 'hideLoader');
			component.hideLoader();

			expect(func).toHaveBeenCalled();
		});

		it('should function hideLoader call function hideLoading in variable _busyService$', () => {
			const spyHide = spyOn(busyService, 'hideLoading');
			component.hideLoader();

			expect(spyHide).toHaveBeenCalled();
		});
	});

	describe('#showLoader', () => {
		it('should exist function showLoader', () => {
			const func = spyOn(component, 'showLoader');
			component.showLoader();

			expect(func).toHaveBeenCalled();
		});

		it('should function showLoader call function showLoading in variable _busyService$', () => {
			const spyShow = spyOn(busyService, 'showLoading');
			component.showLoader();

			expect(spyShow).toHaveBeenCalled();
		});
	});
});
