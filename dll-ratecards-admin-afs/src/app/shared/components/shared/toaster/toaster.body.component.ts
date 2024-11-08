import { Component, ComponentRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ToastEventHandlerService } from '@core/services/toast.eventhandler.service';

import { doLog } from '@core/app-settings';

import { Toast } from 'angular2-toaster';

const LOG_TAG = '[layout/shared/ToasterBodyComponent]';

@Component({
	selector: 'app-toaster-body-component',
	templateUrl: './toaster.body.component.html',
})
/**
 * @class ToasterBodyComponent
 * Custom Component to use as Toast Body.
 * @uses core.services.ToastEventHandlerService
 * @uses core.appSettings.doLog
 * @uses angular2-toaster.Toast
 */
export class ToasterBodyComponent implements OnInit {
	/**
	 * @property {Object} toast attach the Toast Instance to retrieve the data.
	 */
	public toast: Toast;

	/**
	 * @property {Boolean} isErrorType stores the flag to validate the type of message to display
	 */
	public isErrorType: boolean = false;

	/**
	 * @method data
	 * Getter to obtain the toaster data.
	 * @return {void}
	 */
	get data() {
		return (this.toast as any).data;
	}

	constructor(private _toasterEventHandler?: ToastEventHandlerService) {}

	/**
	 * @method ngOnInit()
	 * Initialize the directive/component after Angular
	 * first displays the data-bound properties and sets the
	 * directive/component's input properties.
	 * Called once, after the first ngOnChanges()
	 */
	public ngOnInit() {
		if (this.data.type === 'error' || this.data.type === 'warning') {
			this.isErrorType = true;
		}
	}

	/**
	 * @method onSaveButtonClick
	 * Stream the `saveButton` click event to observable.
	 * @param _evt the `saveButton` click event
	 * @return {void}
	 */
	public onSaveButtonClick(_evt) {
		doLog && console.log(LOG_TAG, '- onSaveButtonClick', _evt);
		const _params = {
			log_tag: LOG_TAG,
			method: 'onSaveButtonClick',
			event: _evt,
		};
		this._toasterEventHandler.toasterEventHandler(_params);
	}

	/**
	 * @method onCancelButtonClick
	 * Stream the `cancelButton` click event to observable.
	 * @param _evt the `cancelButton` click event.
	 * @return {void}
	 */
	public onCancelButtonClick(_evt) {
		doLog && console.log(LOG_TAG, '- onCancelButtonClick', _evt);
		const _params = {
			log_tag: LOG_TAG,
			method: 'onCancelButtonClick',
			event: _evt,
		};
		this._toasterEventHandler.toasterEventHandler(_params);
	}
}
