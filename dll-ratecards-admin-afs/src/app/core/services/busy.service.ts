import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ILoadingStatus } from '../../shared/interfaces';
import { doLog } from '../app-settings';

const LOG_TAG = '[core/services/BusyService]';

@Injectable()
/**
 * @class BusyService
 * Creates an observable to subscribe with the `busy` status to wait until the application be available again.
 * And avoid to duplicate calls.
 * @uses shared.interfaces.LoadingStatus
 * @version 1.0.0
 */
export class BusyService {
	/**
	 * @property {Subject} busySubject
	 * Creates a subject from the busy status.
	 * @private
	 */
	private busySubject = new Subject<{ busy: boolean }>();

	/**
	 * @property {Subject} busySubjectMessage
	 * Creates a subject from the message status.
	 * @private
	 */
	private busySubjectMessage = new Subject<string>();

	/**
	 * @property {Observable} busyState
	 * The observable to the `busySubject`
	 */
	// tslint:disable-next-line:member-ordering
	public busyState = this.busySubject.asObservable();

	/**
	 * @property {Observable} busyStateMessage
	 * The observable to the `busySubjectMessage`
	 */
	public busyStateMessage = this.busySubjectMessage.asObservable();

	/**
	 * @method showLoading
	 * Displays the `LoadingComponent` subscribing as true the observable value.
	 * @return {void}
	 */
	public showLoading() {
		doLog && console.log(LOG_TAG, 'showLoading');
		const isBusy: ILoadingStatus = { busy: true };
		this.busySubject.next(isBusy);
	}

	/**
	 * @method hideLoading
	 * Hide the `LoadingComponent` subscribing as true the observable value.
	 * @return {void}
	 */
	public hideLoading() {
		doLog && console.log(LOG_TAG, 'hideLoading');
		const isBusy: ILoadingStatus = { busy: false };
		this.busySubject.next(isBusy);
	}

	/**
	 * @method setLoaderMessage
	 * Sets the string message displayed by the loader.
	 * @param {String} _message the value of the string message to show.
	 * @return {void}
	 */
	public setLoaderMessage(_message) {
		doLog && console.log(LOG_TAG, 'setMessage');
		this.busySubjectMessage.next(_message);
	}
}
