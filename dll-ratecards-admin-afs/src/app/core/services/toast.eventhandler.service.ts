import { Injectable, OnInit } from '@angular/core';
import { Subject } from 'rxjs';

import { doLog } from '../app-settings';

const LOG_TAG = '[core/services/ToastEventHandlerService]';

/**
 * @class ToastEventHandlerService
 * Creates an observable to watch the events/actions from toaster.
 */

@Injectable()
export class ToastEventHandlerService {
	/**
	 * @property {Object} hasToasterEventSubject
	 * Creates a subject to validate if toaster is present in body or not.
	 * @private
	 */
	private hasToasterEventSubject = new Subject<any>();

	/**
	 * @property {Object} toasterEventsSubject
	 * Creates a subject from the busy status.
	 * @private
	 */
	private toasterEventsSubject = new Subject<any>();

	/**
	 * @property {Object} toasterEventObservable
	 * The observable to the `toasterEventsSubject`
	 */
	// tslint:disable-next-line:member-ordering
	public toasterEventObservable = this.toasterEventsSubject.asObservable();

	/**
	 * @property {Object} hasToasterEvent
	 * The observable to the `hasToasterEventSubject`
	 */
	// tslint:disable-next-line:member-ordering
	public hasToasterEvent = this.hasToasterEventSubject.asObservable();

	/**
	 * @method toastEventHandler
	 * @private
	 * Subject to observate changes on subscription, it allow comunicate components related to the toaster events across the application.
	 * @param {Object} _params the params received to observate.
	 * @return {void}
	 */
	public toasterEventHandler(_params) {
		doLog && console.log(LOG_TAG, ' - toasterEventHandler');
		this.toasterEventsSubject.next(_params);
	}

	/**
	 * @method toastEventHandler
	 * @private
	 * Subject to observate changes on subscription, it allow comunicate components related to the toaster events across the application.
	 * @param {Object} _params the params received to observate.
	 * @return {void}
	 */
	public hasToasterEventHandler(_params) {
		doLog && console.log(LOG_TAG, ' - hasToasterEventHandler');
		this.hasToasterEventSubject.next(_params);
	}
}
