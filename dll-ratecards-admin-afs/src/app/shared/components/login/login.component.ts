import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AppSettings, AuthService, doLog, ErrorService } from '@core/index';
import { AppConfigService } from '@core/services/app.config.service';
import * as _ from 'lodash';
import * as moment from 'moment';

const LOG_TAG = '[component/LoginComponent]';
const ACCOUNT_LOCKED_MSG = 'Your account has been locked. Please contact your Administrator.';

/**
 * @class components.LoginComponent
 * Login component to process authenticate service.
 * @uses core.services.AuthService
 * @uses core.services.AppSettings
 * @uses angular.forms.FormControl
 * @uses angular.forms.FormGroup
 * @uses angular.forms.Validators
 * @uses core.AppSettings
 * @version 1.0.0
 */
@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnDestroy, OnInit {
	/**
	 * @property {Object} appTitle stores the app title;
	 */
	public appTitle: string = null;
	public appSubTitle: string = null;

	/**
	 * @property {Object} templateName stores the template name to locate images;
	 */
	public templateName: string = null;

	/**
	 * @property {String} termsPath stores the terms and conditions path
	 */
	public termsPath: string = null;

	/**
	 * @property {String} usernameValue Stores the dummy login credentials.
	 */
	public usernameValue: string = null;

	/**
	 * @property {String} passwordValue Stores the dummy password credentials.
	 */
	public passwordValue: string = null;

	/**
	 * @property {FormGroup} loginForm Form controls to login form.
	 */
	public loginForm: FormGroup;

	/**
	 * @property {String} errorMessage Display error message from auth.errorMessage observable.
	 */
	public errorMessage: string = null;

	/**
	 * @property {number} lockedTime Stores cookie to validate if session is locked out due login attempts.
	 */
	public lockedTime: any = null;

	/**
	 * @property {Number} loginAttempts Stores the number of login attempts.
	 */
	public loginAttempts: number = 1;

	/**
	 * @property {Boolean} isRendered Validate if app is completely rendered or not.
	 */
	public isRendered: boolean = false;
	/**
	 * @property {String} URL of Privacy Statement webpage
	 */
	public privacyStatementUrl: string = null;

	private subscriptions: any = {};
	/**
	 * @property {AppConfigService}
	 */
	private appConfig: AppConfigService;

	constructor(private _auth: AuthService, private _settings: AppSettings, private _router: Router, private _appConfig: AppConfigService) {
		this.appTitle = this._settings.appCustomOptions.appTitle;
		this.appSubTitle = this._settings.appCustomOptions.appSubTitle;
		this.termsPath = this._settings.appCustomOptions.termsPagePath;
		this.templateName = this._settings.appCustomOptions.templateName;
		this.privacyStatementUrl = this._settings.appCustomOptions.privacyStatementUrl;
		this.appConfig = this._appConfig;
	}

	public ngOnInit() {
		this.loginForm = new FormGroup({
			username: new FormControl(this.usernameValue, [Validators.required]),
			password: new FormControl(this.passwordValue, [Validators.required, Validators.minLength(8)]),
		});
		this.subscriptions.errorMessage = this._auth.errorMessage.subscribe((_error: any) => {
			this.errorMessage = _error;
			if (this.loginAttempts >= 3 && !this.lockedTime) {
				this.errorMessage = 'You have failed to login 3 times. After 5 attempts your account will be locked.';
			}
			if (this.loginAttempts >= 5 && !this.lockedTime) {
				doLog && console.log(LOG_TAG, 'Account is Locked');
				const date = moment().add(5, 'minutes').unix();
				this.lockedTime = date;
				this.errorMessage = ACCOUNT_LOCKED_MSG;
			}
			this.loginAttempts++;
			if (this.loginForm) {
				this.loginForm.controls.password.reset();
			}
		});
	}

	public ngOnDestroy() {
		_.each(this.subscriptions, (subscription) => {
			subscription.unsubscribe();
		});
	}

	/**
	 * @method onValidateForm
	 * Validate inputs and return error messages in case them fail.
	 * @return {String}
	 */
	public onValidateForm() {
		if (!this.isRendered) {
			return;
		}
		doLog && console.log(LOG_TAG, '- onValidateForm');
		let message: string = null;
		this.errorMessage = null;
		if (this.loginForm.controls.username.hasError('required') && this.loginForm.controls.password.hasError('required')) {
			message = 'UserID or password incorrect. Please try again or contact your Administrator.';
			return message;
		}
		_.forEach(this.loginForm.controls, (_control, _key) => {
			if (_key === 'username' && _control.invalid) {
				message = 'You must enter a valid UserID';
			}
			if (_key === 'password' && _control.invalid) {
				message = 'You must enter an eight (8) characters password.';
			}
		});
		return message;
	}

	/**
	 * @method onLoginButtonClick
	 * Validate data submitted to authorize login
	 * @param _evt the Login Button click event.
	 * @return {void}
	 */
	public onLoginButtonClick(_evt) {
		doLog && console.log(LOG_TAG, '- onLoginButtonClick', _evt);
		_evt.preventDefault();

		if (!this.loginForm.valid) {
			return;
		}
		this.login({
			username: this.loginForm.controls.username.value,
			password: this.loginForm.controls.password.value,
		});
		if (!this.lockedTime) {
			this.errorMessage = '';
		}
	}

	/**
	 * @method validateLockedAccount
	 * Validate if account is locked comparing current date with local storage value and current is Locked value.
	 * @return {Bolean}
	 */
	public validateLockedAccount() {
		doLog && console.log(LOG_TAG, '- validateLockedAccount');
		const currentDate = moment().unix();
		return this.lockedTime && this.lockedTime >= currentDate;
	}

	/**
	 * @method login
	 * @private
	 * Handles the login event after form validation.
	 * @param {Object} _options username and password to authenticate
	 */
	private async login(_options) {
		doLog && console.log(LOG_TAG, '- login');
		if (this.validateLockedAccount()) {
			this.errorMessage = ACCOUNT_LOCKED_MSG;
			return;
		}
		const user = await this._auth.authenticate({ username: _options.username, password: _options.password });
		if (user) {
			const permissions = this._auth.getUserPermissions(user.rcmPermissions);
			if (!permissions) {
				throw Error('User does not have enough permissions to access.');
			}
			const validPath = `/${permissions}/dashboard`;
			await this.appConfig.loadApiModulePath(permissions);
			return this._router.navigate([validPath]);
		}
		return;
	}
}
