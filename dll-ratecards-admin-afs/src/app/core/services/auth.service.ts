import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { IUser } from '../../shared/interfaces';

import { AppSettings, DEFAULT_PERMISSION, doLog, USER_PERMISSION } from '../app-settings';

import { WebServices } from '../services/webservices.service';

import { ErrorService } from './error.service';

import * as _ from 'lodash';
import * as moment from 'moment';
import { Subject } from 'rxjs';

const LOG_TAG = '[core/services/AuthService]';

const USER_DATA = 'user_data';

/**
 * @class core.services.AuthService
 * General manager for the session of the app. Including login, logout, persist the app upon close/reopen.
 * This object is not intended to replace `webservices` or `dataManager` but to work with them instead.
 * @uses angular.core.Injectable
 * @uses angular.router.Router
 * @uses core.services.WebServices
 * @uses shared.interfaces.IUser
 * @uses moment
 * @version 1.0.0
 */
@Injectable()
export class AuthService {
	/**
	 * @property {String} message stores the message of authenticate service
	 */
	protected message: string;

	/**
	 * @property {Object} user IUser object from IUser Interface; get, set
	 */
	protected _user: any;

	/**
	 * @property {Subject} handleErrorSubect Handle error message subject from observable.
	 */
	private handleErrorSubject = new Subject<{ message: string }>();

	/**
	 * @property {Observable} errorMessage watch changes in the handleErrorSubject to handle the error messages from authenticate method.
	 */
	// tslint:disable-next-line:member-ordering
	public errorMessage = this.handleErrorSubject.asObservable();

	/**
	 * @property {Object} currentLocation Stores the current location path.
	 */
	private currentLocation: string;

	constructor(
		private _router: Router,
		private _webservices: WebServices,
		private _settings: AppSettings,
		private _location: Location,
		private _errorService: ErrorService
	) {
		this.currentLocation = this._location.path();

		const self = this;

		this._webservices.handleAuthError = () => {
			return self.refreshToken().catch((error) => {
				self.logout();

				throw error;
			});
		};

		this._user = this.getSessionSaved();

		this.validateSession();
	}

	get user() {
		return this._user;
	}

	set user(newParams) {
		if (!this._user) {
			this._user = {};
		}

		_.extend(this._user, newParams);

		this.saveSession();
	}

	/**
	 * @method authenticate
	 * Autheticates a given user against the identity provided
	 * @param {Object} _options
	 * @param {String} _options.username IUsername to authenticate
	 * @param {String} _options.password IUser's password to use
	 * @return {void}
	 */
	public authenticate(_options) {
		doLog && console.log(LOG_TAG, '- authenticate');
		let _optionsData: { username: string; password: string };
		_optionsData = _options;
		if (!_optionsData) {
			this.handleError({ message: 'Error on authenticate' });
			return;
		}

		return this._webservices
			.authenticate(_optionsData.username, _optionsData.password)
			.then((_response: any) => {
				const {
					result: { userId, refreshToken, authToken, rcmPermissions },
				} = _response;

				this.user = {
					username: userId,
					authToken,
					refreshToken,
					sessionCreated: moment().format(),
					rcmPermissions,
				};

				this.validateSession();

				return this._user;
			})
			.catch((_err) => {
				if (_err.status === 401) {
					return this.handleError({
						message: 'UserID or password incorrect. Please try again or contact your Administrator.',
					});
				} else {
					this._errorService.validateResponseErrorLogin(_err);
				}
			});
	}

	/**
	 * @method isSessionActive
	 * Determines if there is a current active session
	 * @return {void}
	 */
	public isSessionActive(): boolean {
		return !!this._user;
	}

	/**
	 * @method logout
	 * Logs out the current user, removing the active sessions and its info
	 * @return {void}
	 */
	public logout() {
		this.destroySession();
	}

	/**
	 * @method refreshToken
	 * Updates the current token for the user
	 * @return {void}
	 */
	public refreshToken() {
		const { refreshToken = '' } = this._user || {};

		return Promise.resolve()
			.then(() => {
				if (!refreshToken) {
					throw Error('no refresh token');
				}

				return this._webservices.refreshToken(refreshToken);
			})
			.then((response: any) => {
				const {
					result: { authToken, refreshToken: newRefreshToken },
				} = response;

				this.user = {
					authToken,
					refreshToken: newRefreshToken,
				};

				this.validateSession();
			});
	}

	/**
	 * @method getUserPermissions
	 * Get user permission to manage the data and access based on it.
	 * @param {String} _permission Receives the optional parameter to compare a permission to validate.
	 * @return {String}
	 */
	public getUserPermissions(_permission?) {
		if (!this.user) {
			return;
		}
		const userPermission = _permission || this.user.rcmPermissions;
		const permission = userPermission.split('_')[0] || DEFAULT_PERMISSION;
		return USER_PERMISSION[permission];
	}

	/**
	 * @method validateSession
	 * @private
	 * Validates the user has the required fields, otherwise, forces a logout
	 * @return {void}
	 */
	private validateSession() {
		const { authToken = '' } = this._user || {};

		if (!authToken) {
			if (this.currentLocation === this._settings.appCustomOptions.termsPagePath) {
				return;
			}
			this.logout();
			return;
		}
		this._webservices.authToken = authToken;
	}

	/**
	 * @method getSessionSaved
	 * @private
	 * Retrieves the persisted session.
	 * @return {Object}
	 */
	private getSessionSaved() {
		doLog && console.log(LOG_TAG, '- getSessionSaved');
		let user = null;

		try {
			user = JSON.parse(localStorage.getItem(USER_DATA));
		} catch (error) {
			user = null;
		}

		return user;
	}

	/**
	 * @method saveSession
	 * @private
	 * Saves the current logged in user to be persisted
	 * @param {Object} _authResult IUser logged in's properties
	 * @return {void}
	 */
	private saveSession() {
		localStorage.setItem(USER_DATA, JSON.stringify(this._user));
		doLog && console.log(LOG_TAG, '- saveSession - ', JSON.stringify(this._user));
	}

	/**
	 * @method destroySession
	 * @private
	 * Removes the session saved on the local storage
	 * @return {void}
	 */
	private destroySession() {
		doLog && console.log(LOG_TAG, '- destroySession');
		this._user = null;
		localStorage.removeItem(USER_DATA);
		localStorage.clear();

		this._router.navigate(['/login']);
	}

	/**
	 * @method handleError
	 * Handles error message from authenticate method.
	 * @param {Object} _error Error object contains the error message.
	 * @return {void}
	 */
	private handleError(_error) {
		doLog && console.log(LOG_TAG, '- handleError');
		this.handleErrorSubject.next(_error.message);
	}
}
