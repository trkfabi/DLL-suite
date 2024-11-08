import { Location } from '@angular/common';
import { AfterContentInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import {
	AppSettings,
	AuthService,
	BusyService,
	doLog,
	LayoutService,
	ToastEventHandlerService,
	ToastService,
	WebServices,
} from '@core/index';
import { Layout } from '@progress/kendo-drawing';
import { ToasterConfig } from 'angular2-toaster';

import { DataManagerService } from '@core/services/data-manager.service';

import * as _ from 'lodash';

const LOG_TAG = '[layout/AppLayoutComponent]';

/**
 * @class layout.AppLayoutComponent
 * Shared Layout Component on Application Dashboard.
 * @uses core.services.AuthService
 * @uses core.AppSettings
 * @uses angular.Router
 * @version 1.0.0
 */
@Component({
	selector: 'app-app-layout',
	templateUrl: './app-layout.component.html',
	styleUrls: ['./app-layout.component.css'],
})
export class AppLayoutComponent implements OnInit, AfterContentInit, OnDestroy {
	@ViewChild('sidenav') public sidenav;

	/**
	 * @property {Boolean} isLoggedIn
	 * Vaidates if session is active and display private content.
	 */
	public isLoggedIn: boolean;

	/**
	 * @property {Boolean} hasToast Flag to validate if toaster is present in layout or not, and display block or none based on status.
	 */
	public hasToast: boolean = false;

	/**
	 * @property {Boolean} isDashboard
	 * Vaidates if session is active and display private content.
	 */
	public isDashboard: boolean;

	/**
	 * @property {String} enableSideNav
	 * Enable sidebar component.
	 */
	public enableSideNav: boolean;

	/**
	 * @property {String} title
	 * The main title of the application.
	 */
	public title: string;

	/**
	 * @property {String} templateName
	 * The main templateName of the application.
	 */
	public templateName: string;

	/**
	 * @property {Boolean} isRendered toggle display loading component.
	 */
	public isRendered: boolean;

	/**
	 * @property {ToasterConfig} toastConfig
	 * The global settings for ToasterService
	 */
	public toastConfig: ToasterConfig;

	public versionSelected;
	public rateCardSelected;
	public rateCards;
	public rateCardsVersionList;

	/**
	 * @property {String} environment Environment variable value.
	 */
	public environment: string;

	private subscriptions: any = {};

	constructor(
		private _auth: AuthService,
		private _settings: AppSettings,
		private _router: Router,
		private _toaster: ToastService,
		private _layoutService: LayoutService,
		private _webServices: WebServices,
		private _toasterHandler: ToastEventHandlerService,
		private _dataManagerService: DataManagerService,
		private _busyService$: BusyService,
		private _location: Location
	) {
		this.title = this._settings.appCustomOptions.appTitle;
		this.templateName = this._settings.appCustomOptions.templateName;
		this.enableSideNav = this._settings.hasSideNav();
		this.toastConfig = this._toaster.toastConfig;
		this.environment = this._settings.appCustomOptions.env;
	}

	/**
	 * @method handleOpenSideNavButtonClick
	 * Toggle display the sideNav.
	 * @param _evt The openSideNavButton click event.
	 * @return {void}
	 */
	public handleOpenSideNavButtonClick(_evt) {
		this.sidenav.toggle();
	}

	/**
	 * @method handleLogoutButtonClick
	 * Logout the user and destroy the session.
	 * @param _evt The logoutButton click event.
	 * @return {void}
	 */
	public handleLogoutButtonClick(_evt) {
		this._auth.logout();
	}

	/**
	 * @method ngOnInit()
	 * Initialize the directive/component after Angular
	 * Validates if the session is active or not.
	 * @return {void}
	 */
	public async ngOnInit() {
		this.isSessionActive();
		this._layoutService.setNavControlsVisibility(true);
		this.subscriptions.toaster = this._toasterHandler.hasToasterEvent.subscribe((_toastEvent) => {
			this.hasToast = _toastEvent.event === 'pop';
		});
		const locationPath = this._location.path().toString();
		if (locationPath.includes('manage-rate-cards-vendor')) {
			return;
		}
		await this._dataManagerService.fetchRateCardsWithVersion();
	}

	public ngOnDestroy() {
		_.each(this.subscriptions, (subscription) => {
			subscription.unsubscribe();
		});
	}

	/**
	 * @method isSessionActive
	 * @private
	 * description
	 * @return {void}
	 */
	private isSessionActive() {
		doLog && console.log(LOG_TAG, '- isSessionActive');
		this.isLoggedIn = this._auth.isSessionActive();
		if (!this.isLoggedIn) {
			this._router.navigate(['/login']);
			return;
		}
	}

	public ngAfterContentInit() {
		this.subscriptions.rateCards$ = this._dataManagerService.rateCards$.subscribe((rateCards) => {
			this.rateCards = rateCards;
		});

		this.subscriptions.rateCardSelected$ = this._dataManagerService.rateCardSelected$.subscribe((rateCardSelected) => {
			this.rateCardSelected = rateCardSelected || null;
			this.rateCardsVersionList = rateCardSelected ? rateCardSelected.versions : [];
		});

		this.subscriptions.versionSelected$ = this._dataManagerService.versionSelected$.subscribe((versionSelected) => {
			this.versionSelected = versionSelected;
		});
	}
}
