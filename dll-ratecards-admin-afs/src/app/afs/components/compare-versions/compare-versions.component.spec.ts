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
import { DialogContainerService, DialogRef, DialogService } from '@progress/kendo-angular-dialog';
import { GridComponent, LoadingComponent } from '@shared/components';
import { SetupUnitTests, ToastServiceMock } from '@shared/utils';
import { ToasterService } from 'angular2-toaster';
import { Observable } from 'rxjs';
import { CompareVersionsComponent } from './compare-versions.component';

const setupUnitTests = new SetupUnitTests();

describe('afs/components/compare-versions/CompareVersionsComponent', () => {
	let component: CompareVersionsComponent;
	let fixture: ComponentFixture<CompareVersionsComponent>;
	let toaster: ToastService;
	let busyService: BusyService;

	beforeEach(async(() => {
		setupUnitTests.loginUser();
		TestBed.configureTestingModule({
			declarations: [CompareVersionsComponent, LoadingComponent, GridComponent],
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
		fixture = TestBed.createComponent(CompareVersionsComponent);
		component = fixture.componentInstance;
		toaster = TestBed.inject(ToastService);
		busyService = TestBed.inject(BusyService);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('#ngAfterContentChecked', () => {
		it('should exist function ngAfterContentChecked', () => {
			const func = spyOn(component, 'ngAfterContentChecked');
			component.ngAfterContentChecked();
			expect(func).toHaveBeenCalled();
		});

		it('should check if there is not grid data, function ngAfterContentChecked should return Undefined', () => {
			component.grid = null;
			const res = component.ngAfterContentChecked();
			expect(res).toBeUndefined();
		});
	});

	describe('#onCompareRatesButtonClick', () => {
		it('should exist function onCompareRatesButtonClick', () => {
			const func = spyOn(component, 'onCompareRatesButtonClick');
			const _evt = {};
			const _templateActions = {};
			const _templateNoVersion = {};
			component.onCompareRatesButtonClick(_evt, _templateActions, _templateNoVersion);
			expect(func).toHaveBeenCalled();
		});

		it('should check if rateCardSelected has not version data, function onCompareRatesButtonClick should return null', () => {
			const _evt = {};
			const _templateActions = {};
			const _templateNoVersion = {};
			component.rateCardSelected = null;
			const res = component.onCompareRatesButtonClick(_evt, _templateActions, _templateNoVersion);
			expect(res).toBeNull();
		});
	});

	describe('#handleDialogSubmitButtonClick', () => {
		it('should exist function handleDialogSubmitButtonClick', () => {
			const func = spyOn(component, 'handleDialogSubmitButtonClick');
			const _evt = {};
			component.handleDialogSubmitButtonClick(_evt);
			expect(func).toHaveBeenCalled();
		});
	});

	describe('#loadRateCardSelected', () => {
		it('should exist function loadRateCardSelected', () => {
			const func = spyOn(component, 'loadRateCardSelected');
			const rateCardSelected = {};
			component.loadRateCardSelected(rateCardSelected);
			expect(func).toHaveBeenCalled();
		});

		it('should function loadRateCardSelected assign the parameter value to rateCardSelected', () => {
			const rateCardSelectedParameter = { name: 'test' };
			component.loadRateCardSelected(rateCardSelectedParameter);
			expect(rateCardSelectedParameter).toEqual(component.rateCardSelected);
		});
	});

	describe('#loadVersionSelected', () => {
		it('should exist function loadVersionSelected', () => {
			const func = spyOn(component, 'loadVersionSelected');
			const rateCardSelected = {};
			component.loadVersionSelected(rateCardSelected);
			expect(func).toHaveBeenCalled();
		});

		it('should return an Undefined if there is not version selected', () => {
			const loadVersionSelectedParameter = null;
			const result = component.loadVersionSelected(loadVersionSelectedParameter);
			expect(result).toBeUndefined();
		});

		it('if there is comparedData, should sort it and assig to versionSelected', () => {
			const loadVersionSelectedParameter = {
				comparedData: {
					items: {
						rvm: 'rvm',
						out: 'out',
					},
					terms: {
						term1: 'term1',
						term2: 'term2',
						term3: 'term3',
						term4: 'term4',
						term5: 'term15',
					},
				},
			};
			component.versionSelected = { value: 'data' };
			component.loadVersionSelected(loadVersionSelectedParameter);
			expect(loadVersionSelectedParameter).toEqual(component.versionSelected);
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
			const spyHide = spyOn(busyService, 'showLoading');
			component.showLoader();

			expect(spyHide).toHaveBeenCalled();
		});
	});
});
