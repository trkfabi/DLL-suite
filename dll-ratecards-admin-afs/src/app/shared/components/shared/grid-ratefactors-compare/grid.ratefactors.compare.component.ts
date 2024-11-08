import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { AppSettings, doLog } from '@core/app-settings';
import { GridFactory } from '@core/factories';
import { ToastEventHandlerService, ToastService, WebServices } from '@core/services';
import { NumberHelper } from '@lib/index';
import { GridDataResult } from '@progress/kendo-angular-grid';
import { process, State } from '@progress/kendo-data-query';
import { Subscription } from 'rxjs';

import * as _ from 'lodash';
const LOG_TAG = '[components/shared/GridRatefactorsCompareComponent]';

/**
 * @class GridRatefactorsCompareComponent
 * Setup the grid component with custom values.
 * @uses @progress.kendoAngularGrid.GridDataResult
 * @uses shared.interfaces.GridColumn
 * @version 1.0.1
 */
@Component({
	selector: 'app-grid-ratefactors-compare',
	templateUrl: './grid.ratefactors.compare.component.html',
	styleUrls: ['./grid.ratefactors.compare.component.scss'],
})
export class GridRatefactorsCompareComponent implements OnInit, OnDestroy {
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

	private toasterEventSubscription: Subscription;

	/**
	 * @property {Object} dataSource Receives the data from the webservices to process and generate the grid.
	 */
	@Input('dataSource') public dataSource;

	/**
	 * @property {Object[]} terms Receives the terms from the webservices
	 * to process and generate terms columns on the grid.
	 */
	@Input('terms') public terms;

	constructor(
		private _appSettings: AppSettings,
		private _gridFactory: GridFactory,
		private _toasterEventHandler$: ToastEventHandlerService,
		private _formBuilder: FormBuilder,
		private _numberHelper: NumberHelper
	) {
		this.noRecordsMessage = this._appSettings.appMessages.noRecordstoCompare;
	}

	/**
	 * @method ngOnInit
	 * Initializes services to subscribe to detect any changes on grid and start the toaster.
	 * @return {void}
	 */
	public ngOnInit() {
		this.toasterEventSubscription = this._toasterEventHandler$.toasterEventObservable.subscribe((_event) => {
			if (_event.event === 'init') {
				// Avoid the toaster initializer event.
				return;
			}
		});
	}

	public ngOnDestroy() {
		this.toasterEventSubscription.unsubscribe();
	}
}
