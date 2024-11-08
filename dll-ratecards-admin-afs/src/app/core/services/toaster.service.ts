import { Injectable, OnInit } from '@angular/core';
import { Subject } from 'rxjs';

import { BodyOutputType, Toast, ToasterConfig, ToasterService } from 'angular2-toaster';
import * as _ from 'lodash';

import { doLog } from '../app-settings';
import { ToastEventHandlerService } from './toast.eventhandler.service';

import { ToasterBodyComponent } from '@shared/components/shared/toaster';

const LOG_TAG = '[core/services/ToastService]';

/**
 * @class ToastService
 * @uses angular2-toaster.ToasterService
 * @uses core.services.ToastEventHandlerService
 * @uses layout.shared.ToasterBodyComponent
 * @uses core.appSettings.doLog
 */

@Injectable()
export class ToastService {
	/**
	 * @property {Object} toastConfig
	 * @readonly
	 * Overrides the defaults values from `ToasterConfig`
	 */
	public readonly toastConfig: ToasterConfig = new ToasterConfig({
		positionClass: 'toast-top-full-width',
		showCloseButton: true,
		tapToDismiss: false,
		timeout: 0,
		preventDuplicates: true,
	});

	private toast: Toast;

	/* Customize the ToasterService to use a CustomTemplate to display the notifications.
	 * To use:
	 * ```
	 *   let data: ToasterData = {};
	 *   data = {
	 *		type: 'info',
	 *		event: 'pop',
	 *		message: 'Hello World! This is message sample',
	 *		hasButtons: true,
	 *		hasIcon: true,
	 *		saveButtonText: 'Publish',
	 *		cancelButtonText: 'Dismiss'
	 *	}
	 *   this._toasterService.pop(data);
	 * ```
	 */

	constructor(private _toaster: ToasterService, private _toastEventHandlerService: ToastEventHandlerService) {}

	/**
	 * @method pop
	 * Displays the notifications through pop method from `ToasterService`.
	 * @param {Object} _data ToasterData to manage the notification messages.
	 * @return {void}
	 */
	public pop(_data) {
		doLog && console.log(LOG_TAG, '- pop');
		if (this.toast) {
			return;
		}
		const toast: Toast = {
			type: _data.type,
			body: ToasterBodyComponent,
			bodyOutputType: BodyOutputType.Component,
			data: _data,
			clickHandler: (t, isClosed): boolean => {
				if (isClosed) {
					this.clear();
				}
				return true;
			},
		};
		if (!_data.hasButtons) {
			toast.showCloseButton = true;
		}
		this._toastEventHandlerService.toasterEventHandler(toast.data);
		this._toastEventHandlerService.hasToasterEventHandler(toast.data);
		this._toaster.pop(toast);
		this.toast = toast;
	}

	/**
	 * @method clear
	 * Clear toasters displayed.
	 * @param {Object} _data ToasterData to manage the notification messages.
	 * @return {void}
	 */
	public clear() {
		doLog && console.log(LOG_TAG, '- clear');
		this._toastEventHandlerService.hasToasterEventHandler({ event: null });
		this.toast = null;
		this._toaster.clear();
	}
}
