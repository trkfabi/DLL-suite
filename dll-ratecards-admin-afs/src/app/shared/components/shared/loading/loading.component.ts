import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BusyService } from '@core/index';
import { ILoadingStatus } from '@shared/interfaces';
import { Subscription } from 'rxjs';

import * as _ from 'lodash';

/**
 * @class LoadingComponent
 * Allows display the loading spinner on each long request to the API until wait the response.
 * @uses core.services.BusyService
 * @uses shared.interfaces.ILoadingStatus
 * @version 1.0.0
 */
@Component({
	selector: 'app-loading',
	templateUrl: './loading.component.html',
	styleUrls: ['./loading.component.scss'],
})
export class LoadingComponent implements OnInit, OnDestroy {
	private subscriptions: any = {};
	/**
	 * @property {Boolean} isBusy status to display or hide the `LoadingComponent`.
	 */
	@Input('isBusy') public isBusy: boolean;

	/**
	 * @property {String} message Stores the message to show while the view is busy.
	 */
	public message: string;

	/**
	 * @property {Subscription} busy Subscribes to the `_busyService` to detect the changes on the `isBusy` status.
	 * @private
	 */
	private busy;

	constructor(private _busyService: BusyService) {
		this.isBusy = false;
		this.message = 'Loading...';
	}

	/**
	 * @method ngOnInit()
	 * Initialize the subscription to the `busy` service to detect changes on it.
	 */
	public ngOnInit() {
		this.subscriptions.busyState = this._busyService.busyState.subscribe((_state: ILoadingStatus) => {
			this.isBusy = _state.busy;
		});
		this.subscriptions.busyMessage = this._busyService.busyStateMessage.subscribe((_message) => {
			this.message = _message;
		});
	}

	/**
	 * @method ngOnDestroy()
	 * Destroys the subscription to the `busy` service.
	 */
	public ngOnDestroy() {
		_.each(this.subscriptions, (subscription) => {
			subscription.unsubscribe();
		});
	}
}
