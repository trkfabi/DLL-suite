import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	SimpleChange,
	SimpleChanges,
} from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { AppSettings, doLog } from '@core/app-settings';
import { GRID_COLLECTIONS } from '@core/collections';
import { GridFactory } from '@core/factories';
import { BusyService } from '@core/index';
import { ToastEventHandlerService, ToastService, WebServices } from '@core/services';
import { NumberHelper } from '@lib/index';
import { GridDataResult } from '@progress/kendo-angular-grid';
import { process, State } from '@progress/kendo-data-query';
import { IGridCollection } from '@shared/interfaces/grid-collection.interface';

import * as _ from 'lodash';
const LOG_TAG = '[components/shared/GridComponent]';

/**
 * @class GridRatefactorsComponent
 * Setup the grid component with custom values.
 * @uses @progress.kendoAngularGrid.GridDataResult
 * @uses shared.interfaces.GridColumn
 * @version 1.0.1
 */
@Component({
	selector: 'app-ratefactors-grid',
	templateUrl: './grid.ratefactors.component.html',
	styleUrls: ['./grid.ratefactors.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridRatefactorsComponent implements OnInit, OnChanges, OnDestroy {
	/**
	 * @property {Object} sortable The Kendo-UI grid sort settings to enable sort.
	 */
	public sortable = true;

	/**
	 * @property {String} noRecordsMessage display message when there are not record available.
	 */
	public noRecordsMessage;

	/**
	 * @property {Boolean} isRendered detects if DOM is already rendered to avoid recreate grids if is not necessary.
	 */
	public isRendered: boolean = false;

	/**
	 * @property {Boolean} isLocked detects if the column is locked on the grid.
	 */
	public isLocked: boolean = false;

	/**
	 * @property {Boolean} isReadOnly detects if the grid is readOnly.
	 */
	public isReadOnly: boolean = true;

	/**
	 * @property {Object} grid Stores the grid data once is ready
	 */
	public grid;

	/**
	 * @property {Object[]} data Stores the rows data to display on grid.
	 */
	public data;

	/**
	 * @property {Object[]} columns Stores the columns to display on grid.
	 */
	public columns;

	/**
	 * @property {String} gridCollection Receives the IGridCollection Name where the grid belongs to use on gridFactory.
	 */
	@Input('gridCollection') public gridCollection: string;

	/**
	 * @property {Object} gridType Receives the IGridCollection Name where the grid belongs to use on gridFactory.
	 */
	@Input('gridType') public gridType: string;

	/**
	 * @property {Object} dataSource Receives the data from the webservices to process and generate the grid.
	 */
	@Input('dataSource') public dataSource;

	/**
	 * @property {Object[]} terms Receives the terms from the webservices
	 * to process and generate terms columns on the grid.
	 */
	@Input('terms') public terms;

	/**
	 * @property {Object[]} categories The categories list to populate the ratecards residuals grid.
	 */
	@Input('categories') public categories;

	/**
	 * @property {Object[]} filteredBy The filter selected in the dashboard component.
	 */
	@Input('filteredBy') public filteredBy;

	/**
	 * @property {Object} saveChanges Event Emitter to submit changes to save to parent component and trigger the saving method to API.
	 */
	@Output() private saveChanges: EventEmitter<any> = new EventEmitter<any>();

	/**
	 * @property {Object} finishedLoading Event Emitter to notify that the grid has finished loading.
	 */
	@Output() private finishedLoading: EventEmitter<any> = new EventEmitter<any>();

	/**
	 * @property {Object[]} gridCollections Get all the Grids Collections with default data as title.
	 * @property { String } gridCollections.gridType the Grid type to group columns with rows.
	 * @property { String } gridCollections.gridName The grid name to display as title.
	 * @property { String } gridCollections.gridFirstColumnName The grid firstColumnName to display as column title.
	 * @property { Boolean } gridCollectionseditable Enable the editable option on grid.
	 */
	private gridCollections: IGridCollection[] = GRID_COLLECTIONS;

	private subscriptions: any = {};

	constructor(
		private _appSettings: AppSettings,
		private _gridFactory: GridFactory,
		private _toasterEventHandler$: ToastEventHandlerService,
		private _numberHelper: NumberHelper,
		private _busyService$: BusyService
	) {
		this.noRecordsMessage = this._appSettings.appMessages.noRecords;
	}

	/**
	 * @method ngOnChanges
	 * Validates if dataSource and terms is already received but the grid has not been rendered to
	 * process the data and call the createGrid method from grid factory.
	 * @return {void}
	 */
	public async ngOnChanges(changes: SimpleChanges) {
		if (changes && changes.dataSource && changes.dataSource.firstChange) {
			return;
		}

		const { dataSource: dataSource, terms: terms, categories: categories } = changes;
		if (dataSource === undefined) {
			return;
		}
		this.dataSource = dataSource.currentValue;

		if (terms) {
			this.terms = terms.currentValue;
		}

		if (this.dataSource) {
			this.updateAllRateFactorData(dataSource);
		}

		if (this.dataSource) {
			this.updateAllRateFactorData(dataSource);
		}
	}

	/**
	 * @method ngOnInit
	 * Initializes services to subscribe to detect any changes on grid and start the toaster.
	 * @return {void}
	 */
	public async ngOnInit() {
		this.subscriptions.toaster = this._toasterEventHandler$.toasterEventObservable.subscribe((_event) => {
			if (_event.event === 'init') {
				// Avoid the toaster initializer event.
				return;
			}
		});

		if (this.dataSource && this.terms) {
			this.loadInitData();
		}
	}

	public ngOnDestroy() {
		_.each(this.subscriptions, (subscription) => {
			subscription.unsubscribe();
		});
	}

	private updateAllRateFactorData(_dataSource: any) {
		const dataSource = _dataSource.currentValue;
		_.each(dataSource, (_row) => {
			_.each(_row.terms, (_term, _key) => {
				const rowKey = `term${[_key]}`;
				_.extend(_row, { [rowKey]: _term.toFixed(6) });
			});
		});
		this.data = dataSource;
	}

	/**
	 * @method loadInitData
	 * Update grid based on data source, terms and categories received from Inputs and Changes detected.
	 * @return {void}
	 */
	private async loadInitData() {
		this.terms.sort((a, b) => {
			return Number(a) > Number(b);
		});

		const _gridData = {
			collection: this.gridCollection,
			type: this.gridType,
			terms: this.terms,
			categories: this.categories,
			data: this.dataSource,
		};
		this.grid = await this._gridFactory.createGrid(_gridData);
		this.data = this.grid.rows;
		this.columns = this.grid.columns;
		this.isLocked = !!(_gridData.type === 'RC' && _gridData.terms.length >= 6);
		this.finishedLoading.emit();
	}

	/**
	 * @method parseValues
	 * Format values to display on cells based on specs.
	 * @param {Object} _dataItem The current cell data to display.
	 * @param {String} _currentIndex The current index from the cell selected.
	 * @return {Object}
	 */
	public parseValues(_dataItem, _currentIndex) {
		if (_currentIndex.includes('term')) {
			_dataItem[_currentIndex] = _dataItem.isResidual
				? this._numberHelper.formatResidual(_dataItem[_currentIndex])
				: this._numberHelper.formatPercentage(_dataItem[_currentIndex]);
		}
		if (_dataItem.itadValue !== undefined) {
			_dataItem.itadValue = this._numberHelper.currenctyFormat(_dataItem.itadValue, true);
		}
		return _dataItem;
	}

	/**
	 * @method displayCellContent
	 * Validate the content to display on cell depending of rules
	 * @param {Object} _dataItem The current cell data to display.
	 * @param {String} _currentIndex The current index from the cell selected.
	 * @return {String | null}
	 */
	public displayCellContent(_currentIndex, _dataItem) {
		if (_currentIndex === 'ratesEnabled') {
			return null;
		}
		if (_currentIndex === 'itadValue' && !_dataItem.hasItad) {
			return null;
		}
		if (!_dataItem.ratesEnabled.includes('fmv') && _currentIndex.includes('term')) {
			return null;
		}
		return _dataItem[_currentIndex];
	}

	/**
	 * @method displayRFTermHeader
	 * Displays RateFactors Terms header template.
	 * @return {void}
	 */
	public displayRFTermHeader(_column, _gridType) {
		return _column.columnGroup.includes('term');
	}
}
