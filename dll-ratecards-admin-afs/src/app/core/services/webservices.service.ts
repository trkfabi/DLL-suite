import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { AppSettings, doLog } from '../app-settings';
import { BusyService } from './busy.service';
import { ErrorService } from './error.service';
import { LayoutService } from './layout.service';

import { HttpClient, HttpHeaders } from '@angular/common/http';

import { DialogCloseResult, DialogRef, DialogService } from '@progress/kendo-angular-dialog';
import { ErrorDialogComponent } from '@shared/components/shared/error-dialog/error-dialog.component';

import * as _ from 'lodash';
import * as moment from 'moment';

const LOG_TAG = '[core/services/WebServices]';
const API_PATH = 'api/afs_rate_cards/';

/**
 * @class core.services.WebServices
 * List of API webservices to be consumed by the app
 * @uses angular.core.Injectable
 * @uses moment
 * @version 1.0.0
 */
@Injectable()
export class WebServices {
	/**
	 * @property {string} authToken Current token to use for all requests; get, set.
	 */
	private _authToken: string;

	/**
	 * @property {Function} handleAuthError Function to call on error 401; set.
	 */
	private _handleAuthError: () => Promise<any>;

	/**
	 * @property {Object} dialogRef stores the reference to the dialog generated by the `DialogService`
	 * @private
	 */
	private dialogRef: DialogRef;

	/**
	 * @property {Object} dialogRefComponent stores the instance reference from the dialog component generated by the `DialogService`
	 * @private
	 */
	private dialogRefComponent;

	/**
	 * @method constructor
	 * @return {void}
	 */
	constructor(
		private _busyService: BusyService,
		private _http: HttpClient,
		private _router: Router,
		private _dialogService: DialogService,
		private _errorService: ErrorService,
		private _layoutService: LayoutService,
		private _settings?: AppSettings
	) {}

	get authToken() {
		return this._authToken || null;
	}

	set authToken(newToken: string) {
		this._authToken = newToken;
	}

	set handleAuthError(newHandler: () => Promise<any>) {
		this._handleAuthError = newHandler;
	}

	/**
	 * @method request
	 * Performs a request that will automatically add tokens and will try to validate its errors
	 * @param {object} params Options for request
	 * @param {string} params.api API to call
	 * @param {object} [params.headers={}] Extra Headers to use, besides authentication
	 * @param {sring} [params.method='GET'] HTTP Method
	 * @param {string} [params.responseType=''] Responsetype to send to Angular's HTTPClient
	 * @return {Promise}
	 */
	public request(params) {
		doLog && console.debug(`${LOG_TAG} - request`);
		const { api = '', body, headers = {}, method = 'GET', queryParams = {}, responseType = 'json' } = params;

		if (!api) {
			throw Error('missing api for request');
		}

		const url = this._settings.getApiCredentials().hostUrl + api;

		_.extend(headers, this.createAuthHeader());
		return this._http
			.request(method, url, {
				body,
				headers,
				responseType,
				params: queryParams,
			})
			.toPromise()
			.catch((error) => {
				doLog && console.debug(`${LOG_TAG} - error: ${JSON.stringify(error)}`);
				const { status } = error;

				if (status === 401 && this._handleAuthError) {
					return this._handleAuthError()
						.then(() => {
							doLog && console.debug(`${LOG_TAG} - final #then()`);
							return this.request(params);
						})
						.catch((errorResponse) => {
							doLog && console.error(`${LOG_TAG} - error refreshing token: ${JSON.stringify(errorResponse)}`);
						});
				} else {
					this.errorMessageHandler(error);
					return error;
				}
			});
	}

	/**
	 * @method authenticate
	 * Authenticates against POST api/authenticate/
	 * @param {String} _username username param
	 * @param {String} _password password param
	 * @return {Promise}
	 */
	public authenticate(_username, _password) {
		this.showLoader();
		const authenticatePath = 'api/gateway/authenticate?include=rcmPermissions';
		const apiCredentials = this._settings.getApiCredentials();
		if (_username && _password) {
			const headers = new HttpHeaders({
				Authorization: 'Basic ' + btoa(`${apiCredentials.apiKey}:`),
			});
			return this._http
				.post(
					apiCredentials.hostUrl + authenticatePath,
					{
						username: _username,
						password: _password,
					},
					{
						headers,
					}
				)
				.toPromise();
		}
	}

	/**
	 * @method refreshToken
	 * Refresh AuthToken to keep the session updated.
	 * @return {Promise}
	 */
	public refreshToken(rToken: string) {
		doLog && console.log(LOG_TAG, 'refreshToken');
		const refreshTokenPath = 'api/gateway/refreshToken?include=rcmPermissions';
		const apiCredentials = this._settings.getApiCredentials();

		return Promise.resolve(true).then(() => {
			if (!rToken) {
				throw Error('missing refreshToken.');
			}

			const headers = new HttpHeaders({
				Authorization: 'Basic ' + btoa(`${apiCredentials.apiKey}:`),
			});
			return this._http
				.post(
					apiCredentials.hostUrl + refreshTokenPath,
					{
						authToken: this._authToken,
						refreshToken: rToken,
					},
					{
						headers,
					}
				)
				.toPromise();
		});
	}

	/**
	 * @method createAuthHeader
	 * @private
	 * Generates the authenticat header based on the current authToken
	 * @return {object} header for authorization
	 */
	private createAuthHeader() {
		const authToken = this.authToken;
		return {
			Authorization: `Bearer ${authToken}`,
		};
	}

	/**
	 * @method showLoader
	 * Display the `LoadingComponent` with a true `isBusy`
	 * @return {void}
	 */
	private showLoader(): void {
		doLog && console.log(LOG_TAG, ' - showLoader');
		this._busyService.showLoading();
	}

	/**
	 * @method hideLoader
	 * Hide the `LoadingComponent` with a true `isBusy`
	 * @return {void}
	 */
	private hideLoader(): void {
		doLog && console.log(LOG_TAG, ' - hideLoader');
		this._busyService.hideLoading();
	}

	/**
	 * @method errorMessageHandler
	 * Manages error messages from API request when fails prompting an error dialog.
	 * @return {void}
	 */
	private errorMessageHandler(_error) {
		doLog && console.error(_error.message, _error.stack);
		this._errorService.validateResponseError(_error);
	}
}
