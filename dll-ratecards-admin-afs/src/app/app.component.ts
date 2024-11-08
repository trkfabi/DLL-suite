import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AppSettings, AuthService, BusyService, doLog } from './core';

const LOG_TAG = '[AppComponent]';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
	/**
	 * @property {Boolean} isBusy
	 * Vaidates if the app is busy waiting for some process to complete.
	 */
	public isBusy: boolean;

	/**
	 * @property {Boolean} isLoggedIn
	 * Vaidates if session is active and display private content.
	 */
	public isLoggedIn: boolean;

	/**
	 * @property {String} title
	 * The main title of the application.
	 */
	public title: string;

	/**
	 * @property {String} currentLocation the current path location from url
	 * @private
	 */
	private currentLocation: string;

	constructor(
		private _auth: AuthService,
		private _settings: AppSettings,
		private _titleService: Title,
		private _router: Router,
		private _location: Location,
		private _busyService: BusyService
	) {
		this.currentLocation = this._location.path();
		this.title = this._settings.appCustomOptions.appTitle;
	}

	/**
	 * @method ngOnInit()
	 * Initialize the directive/component after Angular
	 * Validates if the session is active or not.
	 * @return {void}
	 */
	public ngOnInit() {
		this.initializeTitle();
		this.isSessionActive();
	}

	/**
	 * @method setTitle
	 * Set the application title to browser tab.
	 * @return {void}
	 */
	public initializeTitle() {
		doLog && console.log(LOG_TAG, '- setTitle');
		const title = `${this._settings.appCustomOptions.appName} v.${
			this._settings.appCustomOptions.version
		} -- ${this._settings.getEnvironmentName()}`;
		const serviceTitle = this._titleService.setTitle(title);

		return serviceTitle;
	}

	/**
	 * @method isSessionActive
	 * description
	 * @return {void}
	 */
	public isSessionActive() {
		doLog && console.log(LOG_TAG, '- isSessionActive');
		this.isLoggedIn = this._auth.isSessionActive();
		if (this.currentLocation === this._settings.appCustomOptions.termsPagePath) {
			return;
		}
		if (!this.isLoggedIn) {
			this._router.navigate(['/login']);
			return;
		}
	}

	/**
	 * @method checkSession
	 * Checks the session status to define where to navigate to
	 * @return {void}
	 */
	public checkSession() {
		doLog && console.log(LOG_TAG, '- checkSession');

		const allowedRoutes = [this._settings.appCustomOptions.termsPagePath];

		if (allowedRoutes.includes(this.currentLocation)) {
			return;
		}

		this._auth
			.refreshToken()
			.then(() => {
				return true;
			})
			.catch((error) => {
				doLog && console.error(`${LOG_TAG} - checkSession - token not refreshed, logging out`);
				this._router.navigate(['/login']);
			});
	}
}
