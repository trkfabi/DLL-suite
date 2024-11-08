import { HttpBackend, HttpClient, HttpHandler } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { AppSettings } from '@core/index';
import { AuthService, BusyService, ErrorService, LayoutService, ToastEventHandlerService, ToastService, WebServices } from '@core/services';
import { DataManagerService } from '@core/services/data-manager.service';
import { RateCardsService } from '@core/services/rate-cards.service';
import { RateCardsWebService } from '@core/services/ratecards.webservice';
import { KendoUIModules, MaterialModules } from '@layout/index';
import { NumberHelper } from '@lib/index';
import { DialogService } from '@progress/kendo-angular-dialog';
import { GridComponent, LoadingComponent } from '@shared/components';
import { IFiltersRateFactors } from '@shared/interfaces';
import { SetupUnitTests } from '@shared/utils';
import { ToasterService } from 'angular2-toaster';
import { DashboardComponent } from './dashboard.component';

import * as _ from 'lodash';

const setupUnitTests = new SetupUnitTests();

describe('DashboardComponent', () => {
	let component: DashboardComponent;
	let fixture: ComponentFixture<DashboardComponent>;

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
		fixture = TestBed.createComponent(DashboardComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	afterAll(() => setupUnitTests.logout());

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('#generateGridReadonlyData', () => {
		it('should exist function generateGridReadonlyData', () => {
			const func = spyOn(component, 'generateGridReadonlyData');
			const data = [
				{
					name: 'test',
				},
			];
			const title = 'Test';
			component.generateGridReadonlyData(data, title);

			expect(func).toHaveBeenCalled();
		});

		it('should function generateGridReadonlyData return columns and rows', () => {
			const data = [
				{
					term: 4,
					value: 1,
				},
			];
			const title = 'COF';
			const expectedColumns = [
				{
					field: 'name',
					locked: false,
					title: '   ',
					type: 'text',
					width: 370,
				},
				{
					editable: false,
					field: 'term4',
					format: '##.00 \\%',
					locked: false,
					title: 4,
					type: 'numeric',
					width: 370,
				},
			];
			const expectedRows = [
				{
					name: 'COF',
					term4: '100.00%',
				},
			];
			const actual = component.generateGridReadonlyData(data, title);
			const actualColumns = actual.columns;
			const actualRows = actual.rows;

			expect(actualColumns).toEqual(expectedColumns);
			expect(actualRows).toEqual(expectedRows);
		});
	});

	describe('#displayDataSwitcher', () => {
		it('should exist function displayDataSwitcher', () => {
			const func = spyOn(component, 'displayDataSwitcher');
			const data = {
				value: 'rates',
			};
			component.displayDataSwitcher(data);
			expect(func).toHaveBeenCalled();
		});
		it('should exist function displayDataSwitcher and show property is `interest`', () => {
			const data = {
				value: 'interest',
			};
			component.displayDataSwitcher(data);
			const actual = data.value;
			const expected = component.filtersSelected.show;
			expect(actual).toEqual(expected);
		});
	});

	describe('#getFiltersRateProgram', () => {
		it('should exist function getFiltersRateProgram', () => {
			const func = spyOn(component, 'getFiltersRateProgram');
			component.getFiltersRateProgram();

			expect(func).toHaveBeenCalled();
		});

		it('should function getFiltersRateProgram create an array with id values from dataRateProgram', () => {
			const data = [
				{
					text: 'Test 1',
					value: '1',
				},
				{
					text: 'Test 2',
					value: '2',
				},
			];
			const expected = ['1', '2'];
			component.dataRateProgram = data;
			component.getFiltersRateProgram();
			const { ratePrograms: actual } = component.filtersSelected;

			expect(expected).toEqual(actual);
		});
	});

	describe('#rateProgramSelectAll', () => {
		it('should exist function rateProgramSelectAll', () => {
			const func = spyOn(component, 'rateProgramSelectAll');
			const checked = true;
			component.rateProgramSelectAll(checked);

			expect(func).toHaveBeenCalled();
		});

		it('should function rateProgramSelectAll return all dataRateProgram', () => {
			const data = [
				{
					text: 'Test 1',
					value: '1',
				},
				{
					text: 'Test 2',
					value: '2',
				},
			];
			component.filterRateProgram = data;
			const checked = true;
			component.rateProgramSelectAll(checked);
			_.each(component.dataRateProgram || [], (_data, _index) => {
				const { text: actualText, value: actualValue } = _data;
				const expectedText = 'Test ' + _index + 1;
				const expectedValue = _index + 1;
				expect(expectedText).toEqual(expectedText);
				expect(expectedValue).toEqual(expectedValue);
			});
		});

		it('should function rateProgramSelectAll return empty array', () => {
			const data = [
				{
					text: 'Test 1',
					value: '1',
				},
				{
					text: 'Test 2',
					value: '2',
				},
			];
			component.filterRateProgram = data;
			const checked = false;
			component.rateProgramSelectAll(checked);
			const expected = [];
			const actual = component.dataRateProgram;

			expect(expected).toEqual(actual);
		});
	});

	describe('#filterBySelector', () => {
		it('should exist function filterBySelector', () => {
			const func = spyOn(component, 'filterBySelector');
			const data: IFiltersRateFactors = {
				text: 'FMV',
				value: 'F',
			};
			component.filterBySelector(data, null);

			expect(func).toHaveBeenCalled();
		});

		it('should exist function filterBySelector with purchaseOption and show property is `F`', () => {
			const data: IFiltersRateFactors = {
				text: 'FMV',
				value: 'F',
			};
			component.filterBySelector(data, 'purchaseOption');
			const actual = data.value;
			const expected = component.filtersSelected.purchaseOption;
			expect(actual).toEqual(expected);
		});

		it('should exist function filterBySelector with paymentFrequency and show property is `Q`', () => {
			const data: IFiltersRateFactors = {
				text: 'Quarterly',
				value: 'Q',
			};
			component.filterBySelector(data, 'paymentFrequency');
			const actual = data.value;
			const expected = component.filtersSelected.paymentFrequency;
			expect(actual).toEqual(expected);
		});

		it('should exist function filterBySelector and  with advancePayments show property is `3`', () => {
			const data = 3;
			component.filterBySelector(data, 'advancePayments');

			const actual = data;
			const expected = component.filtersSelected.advancePayments;

			expect(actual).toEqual(expected);
		});

		it('should exist function filterBySelector and  with points show property is `4`', () => {
			const data = 4;
			component.filtersSelected.points = data;
			component.filterBySelector(data, 'vendorPoints');

			const actual = data;
			const expected = component.filtersSelected.points;

			expect(actual).toEqual(expected);
		});
	});
});
