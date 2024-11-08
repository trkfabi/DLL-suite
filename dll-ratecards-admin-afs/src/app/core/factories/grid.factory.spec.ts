import { async, fakeAsync, TestBed, tick } from '@angular/core/testing';
import * as _ from 'lodash';
import { BusyService, GridFactory, WebServices } from '..';
import { NumberHelper } from '../../lib/helpers/number.helper';
import { IGridCollection } from '../../shared/interfaces/grid-collection.interface';
import { IGridColumn } from '../../shared/interfaces/grid-columns.interface';
import { ITerm } from '../../shared/models/terms.model';
import { AppSettings, doLog } from '../app-settings';
import { GRID_COLLECTIONS } from '../collections';

xdescribe('[core/factories/GridFactory]', () => {
	let appSettings: AppSettings;
	let gridFactory: GridFactory;
	let numberHelper: NumberHelper;
	let webServices: WebServices;
	// let catalogueData;
	// let rateCardsInputData;
	let gridData;

	let expected;
	let actual;
	let input;

	gridData = {
		collection: GRID_COLLECTIONS[0].gridCollection,
		type: GRID_COLLECTIONS[0].gridType,
		terms: null,
		data: null,
	};

	beforeEach((_done) => {
		TestBed.configureTestingModule({
			providers: [AppSettings, GridFactory, NumberHelper, WebServices, BusyService],
		});

		appSettings = TestBed.inject(AppSettings);
		numberHelper = TestBed.inject(NumberHelper);
		webServices = TestBed.inject(WebServices);
		gridFactory = new GridFactory(appSettings, numberHelper);

		/*webServices.getCatalogueData().then((_catalogueDataResults) => {
			catalogueData = _catalogueDataResults;
			_.extend(gridData, { terms: catalogueData.terms });
		});

		webServices.getRateCardInputs().then((_rateCardsInputDataResults) => {
			rateCardsInputData = _.filter(_rateCardsInputDataResults, {
				type: GRID_COLLECTIONS[0].gridType,
			});
			_.extend(gridData, { data: rateCardsInputData });
		});*/
		_done();

		input = gridData;
	});

	describe('#createGrid()', () => {
		expected = {
			gridCollection: 'RateCardsInput',
			gridType: 'COF',
			gridName: 'Cost of Funds (COF)',
			columns: [
				{
					columnName: "12/1/16 COF's",
					columnGroup: 'cof',
					isEditable: false,
					isLockable: true,
					width: 420,
				},
				{
					columnName: 12,
					columnGroup: 'term12',
					isEditable: true,
					isLockable: false,
					width: 84,
				},
				{
					columnName: 24,
					columnGroup: 'term24',
					isEditable: true,
					isLockable: false,
					width: 84,
				},
				{
					columnName: 36,
					columnGroup: 'term36',
					isEditable: true,
					isLockable: false,
					width: 84,
				},
				{
					columnName: 48,
					columnGroup: 'term48',
					isEditable: true,
					isLockable: false,
					width: 84,
				},
				{
					columnName: 60,
					columnGroup: 'term60',
					isEditable: true,
					isLockable: false,
					width: 84,
				},
			],
			isEditable: true,
			rows: [
				{
					cof: 'FMV',
					term12: '12.13%',
					term18: '12.13%',
					term24: '12.13%',
					term36: '12.13%',
					term48: '12.13%',
					term60: '12.13%',
				},
				{
					cof: 'COF $1',
					term12: '12.13%',
					term18: '12.13%',
					term24: '12.13%',
					term36: '12.13%',
					term48: '12.13%',
					term60: '12.13%',
				},
			],
		};

		it('Should generate the grid data to populate grids with KendoUI.', () => {
			gridFactory.createGrid(input).then((_results) => {
				actual = _results;
				expect(expected).toEqual(actual);
			});
		});

		it('Columns from grid should have the same length of terms + (columns - hidden ones) from GridCollection.', () => {
			gridFactory.createGrid(input).then((_results) => {
				actual = _.filter(GRID_COLLECTIONS[0].columns, (_column) => {
					return !_column.isHidden;
				});
				expect(expected.columns.length).toEqual(input.terms.length + actual.length);
			});
		});

		it("Rows from grid should have the same length than RateCardsInput's records.", () => {
			gridFactory.createGrid(input).then((_results) => {
				actual = input.data;
				expect(expected.rows.length).toEqual(actual.length);
			});
		});

		it('Grid base properties should be equal to gridCollection base properties.', () => {
			gridFactory.createGrid(input).then((_results) => {
				input = _.clone(expected);
				expected = {};
				actual = {};
				_.each(_results, (_data, _key) => {
					if (_key === 'columns' || _key === 'rows') {
						return;
					}
					_.extend(actual, { [_key]: _data });
				});
				_.each(actual, (_data, _key) => {
					if (_key === 'columns' || _key === 'rows') {
						return;
					}
					_.extend(expected, { [_key]: _data });
				});
				expect(expected).toEqual(actual);
			});
		});
	});

	describe('#formatPercentage()', () => {
		it('Should format Rate Card figures correctly.', () => {
			const _term1 = 0.123456789;
			const _term2 = 0.1;
			const _term3 = 0.45;
			const _term4 = 0;

			expect(numberHelper.formatPercentage(_term1, 5, 'RC')).toEqual('0.12345');
			expect(numberHelper.formatPercentage(_term2, 5, 'RC')).toEqual('0.10000');
			expect(numberHelper.formatPercentage(_term3, 5, 'RC')).toEqual('0.45000');
			expect(numberHelper.formatPercentage(_term4, 5, 'RC')).toEqual('0.00000');
		});

		it('Should format non Rate Card as percentage.', () => {
			const _term1 = 0.123456789;
			const _term2 = 0.1;
			const _term3 = 0.45;

			expect(numberHelper.formatPercentage(_term1)).toEqual('12.34%');
			expect(numberHelper.formatPercentage(_term2)).toEqual('10.00%');
			expect(numberHelper.formatPercentage(_term3)).toEqual('45.00%');
		});
	});
});
