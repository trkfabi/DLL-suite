import { HttpBackend, HttpClient, HttpHandler } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { AppSettings, doLog } from '@core/index';
import { AuthService, BusyService, ErrorService, LayoutService, ToastEventHandlerService, ToastService, WebServices } from '@core/services';
import { DataManagerService } from '@core/services/data-manager.service';
import { RateCardsService } from '@core/services/rate-cards.service';
import { RateCardsWebService } from '@core/services/ratecards.webservice';
import { KendoUIModules, MaterialModules } from '@layout/index';
import { NumberHelper } from '@lib/index';
import { DialogContainerService, DialogService } from '@progress/kendo-angular-dialog';
import { GridComponent, LoadingComponent } from '@shared/components';
import { SetupUnitTests, ToastServiceMock } from '@shared/utils';
import { ToasterService } from 'angular2-toaster';
import { Observable } from 'rxjs';
import { DashboardComponent } from './dashboard.component';

const setupUnitTests = new SetupUnitTests();

describe('[afs/components/dashboard/DashboardComponent]', () => {
	let component: DashboardComponent;
	let fixture: ComponentFixture<DashboardComponent>;
	let toaster: ToastService;
	let busyService: BusyService;

	beforeEach(async(() => {
		setupUnitTests.loginUser();
		TestBed.configureTestingModule({
			declarations: [DashboardComponent, LoadingComponent, GridComponent],
			imports: [KendoUIModules, MaterialModules, BrowserAnimationsModule, RouterTestingModule],
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
				{ provide: ToastService, useFactory: () => ToastServiceMock.instance() },
				ToasterService,
				ToastEventHandlerService,
				RateCardsWebService,
				DataManagerService,
				RateCardsService,
				LayoutService,
				NumberHelper,
				HttpBackend,
			],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(DashboardComponent);
		component = fixture.componentInstance;
		toaster = TestBed.inject(ToastService);
		busyService = TestBed.inject(BusyService);
		fixture.detectChanges();
	});

	afterAll(() => setupUnitTests.logout());

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('#cleanCheked', () => {
		it('should exist function cleanCheked', () => {
			const func = spyOn(component, 'cleanCheked');
			const items = [{ checked: false, disabled: false }];
			const state = false;
			component.cleanCheked(items, state);

			expect(func).toHaveBeenCalled();
		});

		it('should function cleanCheked assign values false after first element in input items', () => {
			component.filterOptions = [
				{ checked: true, disabled: true },
				{ checked: true, disabled: true },
			];
			const status = false;
			const actualOne = { checked: true, disabled: true };
			const actualTwo = { checked: false, disabled: false };
			const state = false;
			component.cleanCheked(component.filterOptions, state);
			const expectedOne = component.filterOptions[0];
			const expectedTwo = component.filterOptions[1];

			expect(expectedOne).toEqual(actualOne);
			expect(expectedTwo).toEqual(actualTwo);
		});
	});

	describe('#toggleSelectAllButton', () => {
		it('should exist function toggleSelectAllButton', () => {
			const func = spyOn(component, 'toggleSelectAllButton');
			component.toggleSelectAllButton();

			expect(func).toHaveBeenCalled();
		});

		it('should function toggleSelectAllButton validate result checked "true" and disabled "false"', () => {
			const values = [
				{ checked: true, disabled: true },
				{ checked: true, disabled: true },
			];
			component.filterOptions = values;
			const actual = { checked: true, disabled: false };
			component.toggleSelectAllButton();
			const expected = component.filterOptions[0];

			expect(expected).toEqual(actual);
		});

		it('should function toggleSelectAllButton validate result checked "false" and disabled "true"', () => {
			const values = [
				{ checked: true, disabled: true },
				{ checked: false, disabled: true },
			];
			component.filterOptions = values;
			const actual = { checked: false, disabled: true };
			component.toggleSelectAllButton();
			const expected = component.filterOptions[0];

			expect(expected).toEqual(actual);
		});
	});

	describe('#getHourMinuteSecondString', () => {
		it('should exist function getHourMinuteSecondString', () => {
			const func = spyOn(component, 'getHourMinuteSecondString');
			const time = new Date();
			component.getHourMinuteSecondString(time);

			expect(func).toHaveBeenCalled();
		});

		it('should function getHourMinuteSecondString return time value formated', () => {
			const time = new Date();
			const expected = component.getHourMinuteSecondString(time);
			const actualHours = time.getHours().toString();
			const actualMinutes = time.getMinutes().toString();

			expect(expected).toContain(actualHours);
			expect(expected).toContain(actualMinutes);
		});
	});

	describe('#publishVersion', () => {
		it('should exist function publishVersion', () => {
			const func = spyOn(component, 'publishVersion');
			component.publishVersion();

			expect(func).toHaveBeenCalled();
		});

		it('should function publishVersion assign values to dialogAction and buttonAction', () => {
			const actualDialog = 'publish';
			const actualButton = 'Publish';
			component.publishVersion();
			const expectedDialog = component.dialogAction;
			const expectedButton = component.buttonAction;

			expect(expectedDialog).toEqual(actualDialog);
			expect(expectedButton).toEqual(actualButton);
		});
	});

	describe('#deleteVersion', () => {
		it('should exist function deleteVersion', () => {
			const func = spyOn(component, 'deleteVersion');
			const current = {};
			const deleteVersion = {};
			component.deleteVersion(current, deleteVersion);

			expect(func).toHaveBeenCalled();
		});

		it('should function deleteVersion assign values to dialogAction and buttonAction', () => {
			const current = {};
			const deleteVersion = {};
			const actualDialog = 'deleteVersion';
			const actualButton = 'Delete';
			component.deleteVersion(current, deleteVersion);
			const expectedDialog = component.dialogAction;
			const expectedButton = component.buttonAction;

			expect(expectedDialog).toEqual(actualDialog);
			expect(expectedButton).toEqual(actualButton);
		});
	});

	describe('#populateFilters', () => {
		it('should exist function populateFilters', () => {
			const func = spyOn(component, 'populateFilters');
			component.populateFilters();

			expect(func).toHaveBeenCalled();
		});

		it('should function populateFilters assign default values to filterOptions', () => {
			const func = spyOn<any>(component, 'disableFilterCompareButtons');
			const actual = { label: 'Show All', checked: true, disabled: false };
			component.rateFactorsData = { out: [] };
			component.populateFilters();
			const expected = component.filterOptions[0];

			expect(func).toHaveBeenCalled();
			expect(expected).toEqual(actual);
		});
	});

	describe('#getRateFactors', () => {
		it('should exist function getRateFactors', () => {
			const func = spyOn(component, 'getRateFactors');
			const versionData = {};
			component.getRateFactors(versionData);

			expect(func).toHaveBeenCalled();
		});

		it('should function getRateFactors have value in tabSelected', () => {
			const actual = 'inputs';
			component.getRateFactors(null);
			const expected = component.tabSelected;

			expect(expected).toEqual(actual);
		});
	});

	describe('#resetAttributes', () => {
		it('should exist function resetAttributes', () => {
			const func = spyOn(component, 'resetAttributes');
			component.resetAttributes();

			expect(func).toHaveBeenCalled();
		});

		it('should function resetAttributes set values "false" to variables versionSelected and residualsData', async () => {
			await component.resetAttributes();
			const versionSelected = component.versionSelected;
			const residual = component.residualsData;

			expect(versionSelected).toBeFalsy();
			expect(residual).toBeFalsy();
		});
	});

	describe('#loadRateCardSelected', () => {
		it('should exist function loadRateCardSelected', () => {
			const func = spyOn(component, 'loadRateCardSelected');
			const rateCard = {};
			component.loadRateCardSelected(rateCard);

			expect(func).toHaveBeenCalled();
		});

		it('should function loadRateCardSelected set value to variable rateCardSelected', () => {
			const rateCard = { rate: 1 };
			component.loadRateCardSelected(rateCard);
			const expected = component.rateCardSelected;
			const actual = rateCard;

			expect(expected).toEqual(actual);
		});
	});

	describe('#loadVersionSelected', () => {
		it('should exist function loadVersionSelected', () => {
			const func = spyOn(component, 'loadVersionSelected');
			const version = { inputs: [], id: 1, canPublish: false, isPublishing: true };
			component.loadVersionSelected(version);

			expect(func).toHaveBeenCalled();
		});

		it('should function loadVersionSelected call function resetAttributes', () => {
			const spyReset = spyOn(component, 'resetAttributes');
			const version = { inputs: [], id: 1, canPublish: false, isPublishing: false, vendorCodes: [] };
			component.loadVersionSelected(version);

			expect(spyReset).toHaveBeenCalled();
		});
	});

	describe('#versionCanBePublished', () => {
		it('should exist function versionCanBePublished', () => {
			const func = spyOn(component, 'versionCanBePublished');
			const version = {};
			const rate = {};
			const render = false;
			component.versionCanBePublished(version, rate, render);

			expect(func).toHaveBeenCalled();
		});

		it('should function versionCanBePublished return value true', () => {
			const version = { canPublish: true, id: 1 };
			const rateCard = { versionInProgress: 1 };
			const render = false;
			const result = component.versionCanBePublished(version, rateCard, render);

			expect(result).toBeTruthy();
		});

		it('should function versionCanBePublished return value false', () => {
			const version = { canPublish: true, id: 1 };
			const rateCard = { versionInProgress: 2 };
			const render = false;
			const expected = component.versionCanBePublished(version, rateCard, render);

			expect(expected).toBeFalsy();
		});
	});

	describe('#loadPublishDeleteToaster', () => {
		it('should exist function loadPublishDeleteToaster', () => {
			const func = spyOn(component, 'loadPublishDeleteToaster');
			component.loadPublishDeleteToaster();

			expect(func).toHaveBeenCalled();
		});

		it('should function loadPublishDeleteToaster set value true to variable isRendered', () => {
			const spyVersion = spyOn(component, 'versionCanBePublished').and.returnValue(true);
			const url = '/afs/dashboard';
			component.currentLocation = url;
			component.loadPublishDeleteToaster();
			const expected = component.isRendered;

			expect(spyVersion).toHaveBeenCalled();
			expect(expected).toBeTruthy();
		});
	});

	describe('#loadPublishedToaster', () => {
		it('should exist function loadPublishedToaster', () => {
			const func = spyOn(component, 'loadPublishedToaster');
			component.loadPublishedToaster();

			expect(func).toHaveBeenCalled();
		});

		it('should function loadPublishedToaster call function pop in _toaster', () => {
			component.hasToast = false;
			component.loadPublishedToaster();
			const expected = toaster.pop;

			expect(expected).toHaveBeenCalled();
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
			component.isRendered = true;
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

	describe('#setLoaderMessage', () => {
		it('should exist function setLoaderMessage', () => {
			const func = spyOn(component, 'setLoaderMessage');
			const message = 'Loading...';
			component.setLoaderMessage(message);

			expect(func).toHaveBeenCalled();
		});

		it('should function setLoaderMessage call function setLoaderMessage in variable _busyService$', () => {
			const spyMessage = spyOn(busyService, 'setLoaderMessage');
			const message = 'Loading...';
			component.setLoaderMessage(message);

			expect(spyMessage).toHaveBeenCalled();
		});
	});

	describe('#loadRateFactors', () => {
		it('should exist function loadRateFactors', () => {
			const func = spyOn(component, 'loadRateFactors');
			component.loadRateFactors();

			expect(func).toHaveBeenCalled();
		});

		it('should function loadRateFactors call functions loadPublishDeleteToaster and recalculateFactors', () => {
			const spyLoad = spyOn(component, 'loadPublishDeleteToaster');
			const spyRecal = spyOn(component, 'recalculateFactors');
			const valueCard = { versionInProgress: 1 };
			const valueVersion = { id: 1 };
			component.rateCardSelected = valueCard;
			component.versionSelected = valueVersion;
			component.tabSelected = 'factors';
			component.isRendered = false;
			component.loadRateFactors();

			expect(spyLoad).toHaveBeenCalled();
			expect(spyRecal).toHaveBeenCalled();
		});

		it('should function loadRateFactors call functions loadPublishDeleteToaster and getRateFactors', () => {
			const spyLoad = spyOn(component, 'loadPublishDeleteToaster');
			const spyRete = spyOn(component, 'getRateFactors');
			const valueCard = { versionInProgress: 1 };
			const valueVersion = { id: 2 };
			component.rateCardSelected = valueCard;
			component.versionSelected = valueVersion;
			component.tabSelected = 'factors';
			component.isRendered = false;
			component.loadRateFactors();

			expect(spyLoad).toHaveBeenCalled();
			expect(spyRete).toHaveBeenCalled();
		});
	});
});
