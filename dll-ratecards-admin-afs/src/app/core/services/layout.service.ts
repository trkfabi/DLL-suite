import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ILoadingStatus } from '../../shared/interfaces';
import { doLog } from '../app-settings';

const LOG_TAG = '[core/services/LayoutService]';

@Injectable()
/**
 * @class LayoutService
 * Creates an observable to subscribe the changes on modules in the app and detect when a ratecard and version are selected.
 * And avoid to duplicate calls.
 * @uses shared.interfaces.ILoadingStatus
 * @version 1.0.0
 */
export class LayoutService {
	/**
	 * @property {String} versionSelected
	 * Stores a string representation of the version selected.
	 * @private
	 */
	private versionSelected: string;

	/**
	 * @property {Subject} rateCardsSubject
	 * Creates a subject from the busy status.
	 * @private
	 */
	private rateCardsSubject = new Subject<{ displaySelectors: boolean }>();

	/**
	 * @property {Subject} rateCardsDataSubject
	 * Creates a subject from the data status.
	 * @private
	 */
	private rateCardsDataSubject = new Subject<{ rateCardsData: any }>();

	/**
	 * @property {Subject} setNavigationControlsVisibility
	 * Creates a subject from the visibility of navigation controls.
	 * @private
	 */
	private setNavigationControlsVisibility = new Subject<boolean>();

	/**
	 * @property {Subject} setNavigationControlsReadOnly
	 * Creates a subject from the read only dropdowns of navigation controls.
	 * @private
	 */
	private setNavigationControlsReadOnly = new Subject<boolean>();

	/**
	 * @property {Subject} trackExportVersionSubject
	 * Creates a subject for the date version selected in the 'Version' dropdown.
	 * @private
	 */
	private trackExportVersionSubject = new Subject<string>();

	/**
	 * @property {Observable} rateCardsState
	 * The observable to the `busySubject`
	 */
	public rateCardsState = this.rateCardsSubject.asObservable();

	/**
	 * @property {Observable} rateCardsDataState
	 * The observable to the `rateCardsDataSubject`
	 */
	public rateCardsDataState = this.rateCardsDataSubject.asObservable();

	/**
	 * @property {Observable} updateNavControlsVisibility
	 * The observable to the `setNavigationControlsVisibility`
	 */
	public updateNavControlsVisibility = this.setNavigationControlsVisibility.asObservable();

	/**
	 * @property {Observable} updateNavControlReadOnly
	 * The observable to the 'setNavigationControlsReadOnly'
	 */
	public updateNavControlReadOnly = this.setNavigationControlsReadOnly.asObservable();

	/**
	 * @property {Observable} trackExportVersionState
	 * The observable to the `trackExportVersionSubject`
	 */
	public trackExportVersionState = this.trackExportVersionSubject.asObservable();

	/**
	 * @property {Boolean} modalIsOpen a flag indicating if the error modal is open/closed
	 */
	public modalIsOpen = false;

	/**
	 * @method setNavControlsVisibility
	 * Sets the visibility for the navigation controls.
	 * @param {Boolean} _flag The value to set the visibility for navigation controls.
	 * @return {void}
	 */
	public setNavControlsVisibility(_flag: boolean) {
		this.setNavigationControlsVisibility.next(_flag);
	}

	/**
	 * @method setNavControlsReadOnly
	 * Set the read only dropdowns for the navigation controls.
	 * @param {boolean} _flag he value to set the read only to dropdowns  for navigation controls.
	 * @return {void}
	 */
	public setNavControlsReadOnly(_flag: boolean): void {
		this.setNavigationControlsReadOnly.next(_flag);
	}

	/**
	 * @method setVersionSelected
	 * Feeds the next version selected in the 'Version' dropdown in the navigation bar.
	 * @param {String} _version The value of the chosen date version.
	 * @return {void}
	 */
	public setVersionSelected(_version) {
		this.currentVersionSelected = _version;
		this.trackExportVersionSubject.next(_version);
	}

	public showRateCardSelectors() {
		this.rateCardsSubject.next({
			displaySelectors: true,
		});
	}

	public hideRateCardSelectors() {
		this.rateCardsSubject.next({
			displaySelectors: false,
		});
	}

	public loadRateCardsData(_rateCardSelected, _data) {
		if (!_rateCardSelected && !_data) {
			this.rateCardsDataSubject.next();
			return;
		}
		this.rateCardsDataSubject.next({
			rateCardsData: {
				data: _data['version-extended'],
				rateCardSelected: _rateCardSelected,
			},
		});
	}

	get currentVersionSelected() {
		return this.versionSelected;
	}

	set currentVersionSelected(_version: string) {
		this.versionSelected = _version;
	}
}
