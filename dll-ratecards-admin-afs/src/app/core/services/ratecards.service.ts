import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { doLog } from '../app-settings';

const LOG_TAG = '[core/services/RateCardsService]';

@Injectable()
/**
 * @class RateCardsService
 * Creates an observable to subscribe the changes on modules in the app and detect when a ratecard and version are selected.
 * And avoid to duplicate calls.
 * @uses shared.interfaces.ILoadingStatus
 * @version 1.0.0
 */
export class RateCardsService {
	/**
	 * @property {Subject} rateCardsSubject
	 * Creates a subject from tphe busy status.
	 * @private
	 */
	private rateCardsSubject = new Subject<{ isDashboard: boolean }>();

	/**
	 * @property {Observable} rateCardsState
	 * The observable to the `busySubject`
	 */
	public rateCardsState = this.rateCardsSubject.asObservable();

	public isDashboard() {
		this.rateCardsSubject.next({
			isDashboard: true,
		});
		doLog && console.log('isDashboard true');
	}

	public noDashboard() {
		this.rateCardsSubject.next({
			isDashboard: false,
		});
	}
}
