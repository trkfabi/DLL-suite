import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsComponent } from './settings.component';

import { RouterTestingModule } from '@angular/router/testing';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { HttpBackend, HttpClient, HttpHandler } from '@angular/common/http';

import * as _ from 'lodash';

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

import { NumberHelper } from '@lib/index';

import { ToasterService } from 'angular2-toaster';

import { AppSettings } from '@core/index';

import { DialogCloseResult, DialogRef, DialogService } from '@progress/kendo-angular-dialog';

import { KendoUIModules } from '@layout/ui-modules';

import {
	ErrorDialogComponent,
	ProductCategoriesDialogComponent,
	SettingRateCardDialogComponent,
	SettingVendorCodesDialogComponent,
	TermsDialogComponent,
	VendorDialogComponent,
} from '@shared/components/shared';
import { SetupUnitTests, ToastServiceMock } from '@shared/utils';

const setupUnitTests = new SetupUnitTests();

describe('SettingsComponent', () => {
	let component: SettingsComponent;
	let fixture: ComponentFixture<SettingsComponent>;

	beforeEach(async(() => {
		setupUnitTests.loginUser();
		TestBed.configureTestingModule({
			declarations: [
				SettingsComponent,
				ErrorDialogComponent,
				ProductCategoriesDialogComponent,
				SettingRateCardDialogComponent,
				SettingVendorCodesDialogComponent,
				TermsDialogComponent,
				VendorDialogComponent,
			],
			providers: [
				AppSettings,
				AuthService,
				BusyService,
				ErrorService,
				DataManagerService,
				LayoutService,
				RateCardsWebService,
				ToastEventHandlerService,
				ToastService,
				WebServices,
				{ provide: ToastService, useFactory: () => ToastServiceMock.instance() },
				HttpClient,
				HttpHandler,
				RateCardsService,
				NumberHelper,
				HttpBackend,
			],
			imports: [FormsModule, ReactiveFormsModule, KendoUIModules, RouterTestingModule],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(SettingsComponent);
		component = fixture.componentInstance;
		spyOn<any>(component, 'initialize');
		fixture.detectChanges();
	});

	afterAll(() => setupUnitTests.logout());

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('#reorderRateCards', () => {
		it('should be defined function reorderRateCards', () => {
			const func = spyOn<any>(component, 'reorderRateCards');
			component.reorderRateCards();
			expect(func).toHaveBeenCalled();
		});

		it('should be defined function reorderRateCards and be equal to expected variable as rateCardList is not defined', () => {
			const expected = component.rateCardList;
			component.reorderRateCards();
			const actual = component.rateCardList;
			expect(expected).toEqual(actual);
		});

		it('should be defined function reorderRateCards and return the resorted data', () => {
			const expected = [
				{
					name: 'A1234',
				},
				{
					name: 'B1234',
				},
			];
			component.rateCardList = [
				{
					name: 'B1234',
				},
				{
					name: 'A1234',
				},
			];
			component.reorderRateCards();
			const actual = component.rateCardList;
			expect(expected).toEqual(actual);
		});
	});

	describe('#reorderVendors', () => {
		it('should be defined function reorderVendors', () => {
			const func = spyOn<any>(component, 'reorderVendors');
			component.reorderVendors();
			expect(func).toHaveBeenCalled();
		});

		it('should be defined function reorderVendors and be equal to reorderVendors as vendorsFiltered is not defined', () => {
			const expected = component.vendorsFiltered;
			component.reorderVendors();
			const actual = component.vendorsFiltered;
			expect(expected).toEqual(actual);
		});

		it('should be defined function reorderVendors and return the resorted data', () => {
			const expected = [
				{
					name: 'AEIOU',
				},
				{
					name: 'BEIOU',
				},
			];
			component.vendorsFiltered = [
				{
					name: 'BEIOU',
				},
				{
					name: 'AEIOU',
				},
			];
			component.reorderVendors();
			const actual = component.vendorsFiltered;
			expect(expected).toEqual(actual);
		});
	});

	describe('#filterVendors', () => {
		it('should be defined function filterVendors', () => {
			const func = spyOn<any>(component, 'filterVendors');
			component.filterVendors(null);
			expect(func).toHaveBeenCalled();
		});
		it('should be defined function filterVendors and return filteredVendors', () => {
			const rateCardsData = [
				{
					id: 'de81002f-dd71-439a-ad3d-161af809ff8a',
					name: '000A',
					vendorCodes: [
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
							name: 'ere',
							points: 4,
							deleted: false,
						},
					],
				},
			];
			// expecting to receive the same length in array because this vendors has not been reordered
			const expected = rateCardsData[0].vendorCodes.length;
			component.rateCardList = rateCardsData;
			component.vendorList = [];
			component.vendorsFiltered = [];
			_.each(rateCardsData, (_rateCard) => {
				if (_rateCard.vendorCodes) {
					component.vendorList.push(..._rateCard.vendorCodes);
				}
			});
			component.filterVendors(rateCardsData[0].id);
			// expecting to receive the same length in array because vendorsFiltered has been reordered already
			const actual = component.vendorsFiltered.length;
			expect(expected).toEqual(actual);
		});
	});

	describe('#isVendorActive', () => {
		it('should be defined function isVendorActive', () => {
			const func = spyOn<any>(component, 'isVendorActive');
			component.isVendorActive(null);
			expect(func).toHaveBeenCalled();
		});

		it('should be defined function filterVendors and return an active vendor', () => {
			const rateCardData = {
				id: 'de81002f-dd71-439a-ad3d-161af809ff8a',
				name: '000A',
				vendorCodes: [
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
						name: 'ere',
						points: 4,
						deleted: false,
					},
				],
			};
			component.rateCardSelected = rateCardData;
			const vendorSelected = rateCardData.vendorCodes[0];
			const result = component.isVendorActive(vendorSelected);
			expect(result).toBeTrue();
		});
	});

	describe('#hasVendorCodes', () => {
		it('should be defined function hasVendorCodes', () => {
			const func = spyOn<any>(component, 'hasVendorCodes');
			component.hasVendorCodes();
			expect(func).toHaveBeenCalled();
		});

		it('should be defined function hasVendorCodes and return true', () => {
			const rateCardsData = [
				{
					id: 'de81002f-dd71-439a-ad3d-161af809ff8a',
					name: '000A',
					vendorCodes: [
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
							name: 'ere',
							points: 4,
							deleted: false,
						},
					],
				},
			];
			component.rateCardList = rateCardsData;
			component.vendorList = [];
			component.vendorsFiltered = [];
			_.each(rateCardsData, (_rateCard) => {
				if (_rateCard.vendorCodes) {
					component.vendorList.push(..._rateCard.vendorCodes);
				}
			});
			component.filterVendors(rateCardsData[0].id);
			const result = component.hasVendorCodes();
			expect(result).toBeTrue();
		});

		it('should be defined function hasVendorCodes and return false', () => {
			component.vendorsFiltered = [];
			const result = component.hasVendorCodes();
			expect(result).toBeFalse();
		});
	});

	describe('#hasRateCards', () => {
		it('should be defined function hasRateCards', () => {
			const func = spyOn<any>(component, 'hasRateCards');
			component.hasRateCards();
			expect(func).toHaveBeenCalled();
		});

		it('should be defined function hasRateCards and return true', () => {
			const rateCardsData = [
				{
					id: 'de81002f-dd71-439a-ad3d-161af809ff8a',
					name: '000A',
					vendorCodes: [
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
							name: 'ere',
							points: 4,
							deleted: false,
						},
					],
				},
			];
			component.rateCardList = rateCardsData;
			const result = component.hasRateCards();
			expect(result).toBeTrue();
		});

		it('should be defined function hasRateCards and return false', () => {
			component.rateCardList = [];
			const result = component.hasRateCards();
			expect(result).toBeFalse();
		});
	});

	describe('#removeRateCardFromList()', () => {
		it('should be defined function removeRateCardFromList', () => {
			const func = spyOn<any>(component, 'removeRateCardFromList');
			component.removeRateCardFromList(null);
			expect(func).toHaveBeenCalled();
		});

		it('should be defined function and remove a rateCard from the list', () => {
			const rateCardsData = [
				{
					id: 'de81002f-dd71-439a-ad3d-161af809ff8a',
					name: '000A',
					vendorCodes: [
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
							name: 'ere',
							points: 4,
							deleted: false,
						},
					],
				},
			];
			component.rateCardList = rateCardsData;
			const expected = component.rateCardList.length - 1 || 0;
			component.vendorList = [];
			component.vendorsFiltered = [];
			_.each(rateCardsData, (_rateCard) => {
				if (_rateCard.vendorCodes) {
					component.vendorList.push(..._rateCard.vendorCodes);
				}
			});
			component.filterVendors(rateCardsData[0].id);
			component.removeRateCardFromList(rateCardsData[0]);
			const actual = component.rateCardList.length || 0;
			expect(expected).toEqual(actual);
		});
	});

	describe('#removeVendorFromList()', () => {
		it('should be defined function removeVendorFromList', () => {
			const func = spyOn<any>(component, 'removeVendorFromList');
			component.removeVendorFromList(null, null);
			expect(func).toHaveBeenCalled();
		});

		it('should be defined function and remove a vendor from the list', () => {
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
					name: 'ere',
					points: 4,
					deleted: false,
				},
			];
			const rateCardValue = { id: 1 };
			component.rateCardSelected = rateCardValue;
			component.vendorList = vendorCodes;
			const expected = component.vendorList.length - 1 || 0;
			component.removeVendorFromList(null, vendorCodes[0]);
			const actual = component.vendorList.length || 0;
			expect(expected).toEqual(actual);
		});
	});
});
