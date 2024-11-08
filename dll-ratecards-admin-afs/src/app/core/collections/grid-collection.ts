import { IGridCollection } from '../../shared/interfaces/grid-collection.interface';

/**
 * @property {Object[]} GRID_COLLECTIONS Stores all the grids default data.
 * @property { String } gridCollections.gridType the Grid type to group columns with rows.
 * @property { String } gridCollections.gridName The grid name to display as title.
 * @property { String } gridCollections.columns The grid static columns to display.
 * @property { Boolean } gridCollections.isEditable Enable the editable option on grid.
 */
export const GRID_COLLECTIONS: IGridCollection[] = [
	{
		gridCollection: 'RateCardsInput',
		gridType: 'COF',
		gridName: 'Cost of Funds (COF)',
		columns: [
			{
				columnName: "COF's",
				columnGroup: 'name',
				isEditable: false,
				isLockable: true,
				isSortable: false,
			},
		],
		isEditable: true,
		isSortable: false,
	},
	{
		gridCollection: 'RateCardsInput',
		gridType: 'SPR',
		gridName: 'Spreads',
		columns: [
			{
				columnName: 'Rating',
				columnGroup: 'name',
				isEditable: false,
				isLockable: true,
				isSortable: false,
			},
		],
		isEditable: true,
		isSortable: false,
	},
	{
		gridCollection: 'RateCardsInput',
		gridType: 'FMV',
		gridName: 'ALL-IN FMV RATES',
		columns: [
			{
				columnName: 'Rating',
				columnGroup: 'name',
				isEditable: false,
				isLockable: true,
				isSortable: false,
			},
		],
		isEditable: false,
		isSortable: false,
	},
	{
		gridCollection: 'RateCardsInput',
		gridType: 'IN1',
		gridName: 'ALL-IN $1 OUT RATES',
		columns: [
			{
				columnName: 'Rating',
				columnGroup: 'name',
				isEditable: false,
				isLockable: true,
				isSortable: false,
			},
		],
		isEditable: false,
		isSortable: false,
	},
	{
		gridCollection: 'Residuals',
		gridType: 'RSD',
		gridName: 'Residuals',
		columns: [
			{
				columnName: 'CATEGORY',
				columnGroup: 'categoryName',
				isEditable: false,
				isLockable: true,
				isSortable: true,
			},
			{
				columnName: 'PRODUCT',
				columnGroup: 'name',
				isEditable: false,
				isLockable: true,
				isSortable: true,
			},
			{
				columnName: 'ITAD COST',
				columnGroup: 'itadValue',
				isEditable: true,
				isLockable: true,
				isSortable: false,
			},
			{
				columnName: '$1',
				columnGroup: 'ratesEnabled',
				isEditable: false,
				isLockable: true,
				isSortable: false,
			},
		],
		isEditable: true,
		isSortable: true,
	},
	{
		gridCollection: 'RatesCompare',
		gridType: 'RC',
		gridName: 'Rates',
		columns: [
			{
				columnName: 'CATEGORY',
				columnGroup: 'categoryName',
				isEditable: false,
				isLockable: true,
				isSortable: false,
			},
			{
				columnName: 'PRODUCT',
				columnGroup: 'name',
				isEditable: false,
				isLockable: true,
				isSortable: false,
			},
			{
				columnName: 'Credit Rating',
				columnGroup: 'creditRating',
				isEditable: false,
				isLockable: true,
				isSortable: false,
			},
		],
		isEditable: false,
		isSortable: false,
	},
	{
		gridCollection: 'RatesCompare',
		gridType: 'RCC',
		gridName: 'Rates',
		columns: [
			{
				columnName: 'Credit Rating',
				columnGroup: 'creditRating',
				isEditable: false,
				isLockable: true,
				isSortable: false,
			},
		],
		isEditable: false,
		isSortable: false,
	},
];
