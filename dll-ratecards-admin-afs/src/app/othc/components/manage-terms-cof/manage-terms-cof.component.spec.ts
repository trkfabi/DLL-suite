import { HttpBackend, HttpClient, HttpHandler } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppSettings } from '@core/index';
import { AuthService, BusyService, ErrorService, LayoutService, ToastEventHandlerService, ToastService, WebServices } from '@core/services';
import { DataManagerService } from '@core/services/data-manager.service';
import { RateCardsService } from '@core/services/rate-cards.service';
import { RateCardsWebService } from '@core/services/ratecards.webservice';
import { KendoUIModules, MaterialModules } from '@layout/index';
import { NumberHelper } from '@lib/index';
import { DialogService } from '@progress/kendo-angular-dialog';
import { SetupUnitTests } from '@shared/utils';
import { ToasterService } from 'angular2-toaster';
import { ManageTermsCofComponent } from './manage-terms-cof.component';

const setupUnitTests = new SetupUnitTests();

describe('[othc/components/dashboard/ManageTermsCofComponent]', () => {
	let component: ManageTermsCofComponent;
	let fixture: ComponentFixture<ManageTermsCofComponent>;
	let busyService: BusyService;
	let dataWeb: DataManagerService;

	beforeEach(async(() => {
		setupUnitTests.loginUser();
		TestBed.configureTestingModule({
			declarations: [ManageTermsCofComponent],
			imports: [KendoUIModules, RouterTestingModule],
			providers: [
				AppSettings,
				AuthService,
				WebServices,
				HttpClient,
				HttpHandler,
				DialogService,
				BusyService,
				LayoutService,
				ErrorService,
				ToastService,
				ToasterService,
				ToastEventHandlerService,
				RateCardsWebService,
				DataManagerService,
				RateCardsService,
				NumberHelper,
				HttpBackend,
			],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ManageTermsCofComponent);
		component = fixture.componentInstance;
		busyService = TestBed.inject(BusyService);
		dataWeb = TestBed.inject(DataManagerService);
		spyOn(dataWeb, 'fetchVersionSelected').and.returnValue(Promise.resolve());
		fixture.detectChanges();
	});

	afterAll(() => setupUnitTests.logout());

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('#loadVersionSelected', () => {
		it('should exist function loadVersionSelected', () => {
			const func = spyOn(component, 'loadVersionSelected');
			const version = {};
			component.loadVersionSelected(version);

			expect(func).toHaveBeenCalled();
		});

		it('should function loadVersionSelected call function updateMangeTermsCof', () => {
			const spyUpdate = spyOn(component, 'updateMangeTermsCof');
			const version = {
				terms: [{ term: 12, value: '' }],
				cofs: [{ term: 12, value: '' }],
			};
			component.loadVersionSelected(version);

			expect(spyUpdate).toHaveBeenCalled();
		});
	});

	describe('#updateMangeTermsCof', () => {
		it('should exist function updateMangeTermsCof', () => {
			const func = spyOn(component, 'updateMangeTermsCof');
			const terms = [];
			const cofs = [];
			component.updateMangeTermsCof(terms, cofs);

			expect(func).toHaveBeenCalled();
		});

		it('should function updateMangeTermsCof return terms and cof values', () => {
			const terms = [12, 48];
			const cofs = [
				{ term: '12', value: 0 },
				{ term: 48, value: 20 },
			];
			component.updateMangeTermsCof(terms, cofs);
			const expected = component.gridData;
			const actual = [
				{ term: 12, cof: 0 },
				{ term: 48, cof: 2000 },
			];

			expect(expected).toEqual(actual);
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
});
