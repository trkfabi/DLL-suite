import {
	AfterViewInit,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	Renderer2,
	SimpleChanges,
	ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { AppSettings, AuthService, BusyService, doLog, LayoutService, WebServices } from '@core/index';
import { DataManagerService } from '@core/services/data-manager.service';
import { RateCardsWebService } from '@core/services/ratecards.webservice';
import { ToastService } from '@core/services/toaster.service';
import { DialogCloseResult, DialogRef, DialogService } from '@progress/kendo-angular-dialog';
import { DataEvent, DragEndEvent } from '@progress/kendo-angular-sortable';
import { ExportAuditLogDialogComponent } from '@shared/components/shared/export-audit-log-dialog/export-audit-log-dialog.component';
import { ImportRatecardDialogComponent } from '@shared/components/shared/import-ratecard-dialog/import-ratecard-dialog.component';
import { LogoutDialogComponent } from '@shared/components/shared/logout-dialog/logout-dialog.component';
import { ReplaceDialogComponent } from '@shared/components/shared/replace-dialog/replace-dialog.component';

import * as _ from 'lodash';
import * as moment from 'moment';
const LOG_TAG = '[layout/shared/NavToolbarComponent]';

const VENDOR_CODES_SELECTED = 'vendorCodesSelected';
const DASHBOARD_PROGRAMS_PATH = '/othc/dashboard';
const RATE_PROGRAM_SELECTED = 'rateProgramSelected';

/**
 * @class layout.NavToolbarComponent
 * NavToolbar layout is the header on dashboard.
 * @uses angular.core.EventEmitter
 * @version 1.0
 */
@Component({
	selector: 'app-nav-toolbar',
	templateUrl: './nav-toolbar.component.html',
	styleUrls: ['./nav-toolbar.component.css'],
})
export class NavToolbarComponent implements OnInit, OnChanges, OnDestroy {
	@Input('rateCardSelected') public rateCardSelected?: any = null;

	/**
	 * @property appTitle
	 * `@Input` method to get the `appTitle` from the parent component.
	 */
	@Input('appTitle') public appTitle: string;

	/**
	 * @property templateName
	 * `@Input` method to get the `templateName` from the parent component.
	 */
	@Input('templateName') public templateName: string;

	/**
	 * @property isLoggedIn
	 * `@Input` Vaidates if session is active and display private content.
	 */
	@Input('isLoggedIn') public isLoggedIn: boolean;

	/**
	 * @property {String} environment
	 * `@Input` Environment variable value.
	 */
	@Input('environment') public environment: any;

	// TODO: Integrate API Call to get RateCardsList and RateCardsVersionList
	/**
	 * @property {String} rateCardsList
	 * `@Input` rateCardsList values
	 */
	@Input('rateCardsList') public rateCardsList;

	/**
	 * @property {String} rateCardsVersionList
	 * `@Input` rateCardsVersionList values
	 */
	@Input('rateCardsVersionList') public rateCardsVersionList;

	/**
	 * @property openSideNavButtonClick
	 * `@Output` to emit an event when the sideNavButton is clicked to the parent component.
	 */

	@Output('openSideNavButtonClick') public openSideNavButtonClick: EventEmitter<any> = new EventEmitter();
	/**
	 * @property logoutButtonClick
	 * `@Output` to emit an event when the logoutbutton is clicked to the parent component.
	 */
	@Output('logoutButtonClick') public logoutButtonClick: EventEmitter<any> = new EventEmitter();

	/**
	 * @property isClickable
	 * Validates if the element is clickable or not.
	 */
	public isClickable: boolean;

	/**
	 * @property displayMenu
	 * Displays or not the settings menu.
	 */
	public displayMenu: boolean = false;

	/**
	 * @property {Boolean} displayAddVersionsMenu Display Add version on click.
	 */
	public displayAddVersionsMenu: boolean = false;

	/**
	 * @property displaySelectors
	 * Displays ratecards selectors only on dashboard.
	 */
	public displaySelectors: boolean;

	/**
	 * @property {String} buttonAction Dialog button action texts
	 */
	public buttonAction: string;

	/**
	 * @property {String} dialogAction Dialog action to execute on button submit.
	 */
	public dialogAction: string;

	/**
	 * @property {Object} versionSelected stores the current version of the ratecard selected
	 */
	@Input('versionSelected') public versionSelected = null;

	/**
	 * @property {Object} environmentList creates the environment list to populate dropdown.
	 */
	public environmentList;

	/**
	 * @property {Boolean} isRendered toggle display loading component.
	 */
	public isRendered: boolean;

	/**
	 * @property {Boolean} dataLoaded Flag to disable loading when data is already loaded.
	 */
	public dataLoaded: boolean;

	/**
	 * @property {Boolean} disabledVersionList Flag to enable / disable dropdown when no versions are available.
	 */
	public disabledVersionList: boolean;

	/**
	 * @property {Boolean} disabledRateCardList Flag to enable / disable dropdown when no RateCards are available.
	 */
	public disabledRateCardList: boolean;

	/**
	 * @property {Boolean} showNavigationControls Flag to enable / disable visibility of navigation controls.
	 */
	public showNavigationControls = true;

	/**
	 * @property {boolean} readonlyNavigationControls Flag to read only dropdowns of navigation controls
	 */
	public readonlyNavigationControls = false;

	/**
	 * @property {String} appVersion Displays the current environment version.
	 */
	public appVersion: string;

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
	 * @property {Object} docClickSubscription stores the handler for clicks
	 * @private
	 */
	private docClickSubscription: any;

	/**
	 * @property {Object[]} rateFactorsList Stores the rateFactorsList data from the current ratecard selected.
	 */
	private rateFactorsList = [];

	/**
	 * @property {Object[]} downloadExportLink Gets the link from the View DOM that matches downloadExportLink.
	 */
	@ViewChild('downloadExportLink')

	/**
	 * @property {ElementRef} downloadExportLink Contains the link -DOM element- to save the data from Audit Logs into a CSV file.
	 */
	private downloadExportLink: ElementRef;

	/**
	 * @property {String} userPermission Contains user permissions based on user group data.
	 */
	private userPermission: string;

	private rateCardsImportList;
	private importList;
	private subscriptions: any = {};

	constructor(
		private _router: Router,
		private _layoutService: LayoutService,
		private _dialogService: DialogService,
		private _rateCardsWebService: RateCardsWebService,
		private _webServices: WebServices,
		private _authService: AuthService,
		private _dataManagerService: DataManagerService,
		private _toaster: ToastService,
		private _busyService$: BusyService,
		private _appSettings: AppSettings,
		private renderer: Renderer2
	) {
		this.dataLoaded = false;
		this.environmentList = this._appSettings.environmentList;
	}

	public ngOnInit() {
		this.docClickSubscription = this.renderer.listen('document', 'click', this.windowBlurToCloseMenus.bind(this));
		this.isRendered = true;

		this.subscriptions.updateNavControlsVisibility = this._layoutService.updateNavControlsVisibility.subscribe((_flag) => {
			this.showNavigationControls = _flag;
		});

		this.subscriptions.updateNavControlReadOnly = this._layoutService.updateNavControlReadOnly.subscribe((_flag) => {
			this.readonlyNavigationControls = _flag;
		});

		this.subscriptions.rateCardsState = this._layoutService.rateCardsState.subscribe((_response) => {
			this.displaySelectors = _response.displaySelectors;
		});

		this.subscriptions.version = this._dataManagerService.versionSelected$.subscribe((versionSelected) => {
			this.versionSelected = versionSelected || this.rateCardsVersionList[0];
		});

		if (!this._authService.isSessionActive()) {
			return;
		}

		this.userPermission = this._authService.getUserPermissions();
	}

	/**
	 * @method ngOnChanges
	 * Detects if option is clickable.
	 */
	public ngOnChanges(changes: SimpleChanges) {
		if (changes.rateCardSelected && changes.versionSelected) {
			const rateCardSelected = changes.rateCardSelected.currentValue;
			const versionSelected = changes.versionSelected.currentValue;
			this.loadRateCardSelected(rateCardSelected);
			this.loadVersionSelected(versionSelected);
		}

		this.isClickable = !this.isLoggedIn;

		if (changes.environment) {
			const environment = changes.environment.currentValue;
			this.environment = _.find(this.environmentList, {
				code: environment.toLowerCase(),
			});

			this.appVersion = `v.${this._appSettings.appCustomOptions.version}`;
		}
	}

	/**
	 * @method windowBlurToCloseMenus
	 * Closes the 'Add card version' and the 'Settings Menu' when user clicks outside of them.
	 * @param _evt The click event to emit to close the menus.
	 * @return {void}
	 */
	public windowBlurToCloseMenus(_evt: any) {
		const target = _evt.target as HTMLElement;
		const targetId = target.id;
		if (!(targetId === 'add-button' || targetId === 'add-button-img') && this.displayAddVersionsMenu) {
			this.displayAddVersionsMenu = false;
		}

		if (targetId !== 'icon-gear' && this.displayMenu) {
			this.displayMenu = false;
		}
	}

	/**
	 * @method onOpenSideNavButtonClick
	 * Handle the OpenSideNav ButtonClick and Emit event to the parent component.
	 * @param _evt The click event to emit to display the sideNav.
	 * @return {void}
	 */
	public onOpenSideNavButtonClick(_evt) {
		this.openSideNavButtonClick.emit(_evt);
	}

	/**
	 * @method onSettingsMenuClickEvent
	 * Handle Settings Menu ButtonClick and Display Menu list.
	 * @return {void}
	 */
	public onSettingsMenuClickEvent(_evt) {
		doLog && console.log(LOG_TAG, 'onSettingsMenuClickEvent');
		this.displayMenu = !this.displayMenu;
		this._toaster.clear();
	}

	/**
	 * @method onAddButtonClick
	 * Displays the add and import ratecards menu.
	 * @return {void}
	 */
	public onAddButtonClick(_evt) {
		doLog && console.log(LOG_TAG, 'onSettingsMenuClickEvent');
		this.displayAddVersionsMenu = !this.displayAddVersionsMenu;
	}

	/**
	 * @method onSettingsMenuClickEvent
	 * Handle Settings Menu ButtonClick and Display Menu list.
	 * @return {void}
	 */
	public onManageRateCardsButtonClick(_evt) {
		doLog && console.log(LOG_TAG, 'onManageRateCardsButtonClick');
		const validPath = `/${this.userPermission}/manage-rate-cards-vendor`;
		this._router.navigate([validPath]);
		this.displayMenu = false;
	}

	/**
	 * @method onExportAuditLogButtonClick
	 * Handle Export Audit Logs to excel.
	 * @param {Object} _evt the button click event.
	 * @param {Object} _templateActions the template actions to pass through the dialog and manage the submission.
	 * @return {void}
	 */
	public onExportAuditLogButtonClick(_evt, _templateActions) {
		doLog && console.log(LOG_TAG, 'onExportAuditLogButtonClick');
		this.displayMenu = false;

		this.dialogRef = this._dialogService.open({
			title: 'Export Audit Logs to Excel',
			content: ExportAuditLogDialogComponent,
			actions: _templateActions,
			height: 150,
		});
		this.dialogRefComponent = this.dialogRef.content.instance;
		this.buttonAction = 'Export';
		this.dialogAction = 'export';
		this._toaster.clear();
	}

	/**
	 * @method onLogoutButtonClick
	 * Handle the Logout Button Click and call dialog window to confirm.
	 * @param _evt The click event to emit to logout.
	 * @return {void}
	 */
	public onLogoutButtonClick(_evt, _templateActions, _title) {
		this.displayMenu = false;
		this.dialogRef = this._dialogService.open({
			content: LogoutDialogComponent,
			title: _title,
			height: 150,
		});
		this.dialogRefComponent = this.dialogRef.content.instance;
		this.dialogRefComponent.dialogRefComponentReference = this.dialogRef;
		this.dialogRefComponent.logoutButtonClick = this.logoutButtonClick;
	}

	/**
	 * @method onSelectionChange
	 * Execute event based on type of selected dropdown changes.
	 * @param {Object} _evt The event change returns the ratecard selected or the version selected.
	 * @param {String} _type The type of action to execute, if is ratecard or version
	 * @return {void}
	 */
	public async onSelectionChange(_evt, _type, _previousValue?) {
		doLog && console.log(LOG_TAG, 'onSelectionChange', _evt, _previousValue, _type);
		localStorage.removeItem(VENDOR_CODES_SELECTED);
		if (_evt.id === _previousValue.id) {
			return;
		}
		this._toaster.clear();
		this._busyService$.showLoading();

		let { id: rateCardId = null } = this.rateCardSelected || {};

		let { id: versionId = null } = this.versionSelected || {};

		switch (_type) {
			case 'ratecard':
				rateCardId = _evt.id;
				versionId = null;
				await this._dataManagerService.fetchRateCardSelected(rateCardId);
				break;
			case 'version':
				versionId = _evt.id;
				if (this.rateCardSelected) {
					this.updateVersionSelectedForExportDialog(this.rateCardSelected, _evt);
				}
				await this._dataManagerService.fetchVersionSelected(versionId);
				break;
		}

		localStorage.setItem('rateCardId', rateCardId);
		if (this.versionSelected.id) {
			localStorage.setItem('versionId', versionId);
		}
		localStorage.removeItem('categorySelected');
		localStorage.removeItem(RATE_PROGRAM_SELECTED);
	}

	/**
	 * @method onLogoClick
	 * Back to home page.
	 * @param _evt The click event to return to home.
	 * @return {void}
	 */
	public async onLogoClick(_evt) {
		if (!this.isLoggedIn) {
			this._router.navigate(['/login']);
			return;
		}
		const rateCardId = localStorage.getItem('rateCardId');
		const versionId = localStorage.getItem('versionId');
		const validPath = `/${this.userPermission}/dashboard`;
		this._router.navigate([validPath]);
		this._busyService$.showLoading();
		await this._dataManagerService.fetchVersionSelected(versionId);
		this._router.navigate([DASHBOARD_PROGRAMS_PATH]);
	}

	/**
	 * @method onImportVersionButtonClick
	 * Populate dialog on Import version click
	 * @param {Object} _evt the event button click
	 * @param {String} _templateAction the template with buttons to action on dialog.
	 * @return {void}
	 */
	public async onImportVersionButtonClick(_evt, _templateActions) {
		if (this.rateCardSelected) {
			this._busyService$.showLoading();
			this.importList = await this._dataManagerService.importList();
			this._busyService$.hideLoading();
		}
		this._toaster.clear();
		this.dialogRef = this._dialogService.open({
			title: 'Import Version',
			content: ImportRatecardDialogComponent,
			actions: _templateActions,
		});
		this.dialogRefComponent = this.dialogRef.content.instance;
		this.dialogRefComponent.importList = this.importList;
		this.dialogRefComponent.rateCardSelected = this.rateCardSelected;
		this.dialogRefComponent.environmentList = this.environmentList;
		this.dialogRefComponent.environment = this.environment;
		this.buttonAction = 'Import';
		this.dialogAction = 'import';
		this.displayAddVersionsMenu = false;
	}

	/**
	 * @method onCreateNewVersionClick
	 * Populate dialog on Create version click
	 * @param {Object} _evt the event button click
	 * @param {String} _templateAction the template with buttons to action on dialog.
	 * @return {void}
	 */
	public async onCreateNewVersionClick(_evt, _templateActions) {
		doLog && console.log(`${LOG_TAG} - onCreateNewVersionClick`, _evt);
		this._toaster.clear();
		this.displayAddVersionsMenu = false;
		const { versionInProgress = null } = this.rateCardSelected || {};
		this._busyService$.showLoading();
		await this._dataManagerService.createVersion(this.rateCardSelected.id);
		this._busyService$.hideLoading();
		this.displayAddVersionsMenu = false;
	}

	/**
	 * @method handleDialogSubmitButtonClick
	 * Handle the Dialog Submit Button Click and Emit event to the parent component.
	 * @param _evt The click event to emit to logout.
	 * @return {void}
	 */
	public handleDialogSubmitButtonClick(_evt) {
		this.isRendered = false;
		this._busyService$.showLoading();
		switch (this.dialogAction) {
			case 'logout':
				this.logoutButtonClick.emit(_evt);
				break;
			case 'import':
				const versionImport = {
					environment: this.dialogRefComponent.environment.code,
					toRateCardId: this.rateCardSelected.id,
					fromVersionId: this.dialogRefComponent.selectedVersion.id,
				};
				this.importVersion(versionImport);
				break;
			case 'replace':
				const newVersion = {
					rateCardId: this.rateCardSelected.id,
					versionId: this.rateCardSelected.versionInProgress,
				};
				this._dataManagerService.createVersion(this.rateCardSelected.id);
				break;
			case 'export':
				// use the webapi to export the audit logs selected

				this._dataManagerService
					.exportAuditLogs()
					.then((_response: any) => {
						const blob = _response;
						const url = window.URL.createObjectURL(blob);
						const link = this.downloadExportLink.nativeElement;
						link.href = url;
						this.isRendered = true;
						link.download = `auditLogs_${moment().format('YYYYMMDDhhmm')}.csv`;
						link.click();
						window.URL.revokeObjectURL(url);
						this._busyService$.hideLoading();
					})
					.catch((_error) => {
						doLog && console.log(LOG_TAG, 'handleDialogSubmitButtonClick - Error', _error);
						this._busyService$.hideLoading();
						this._busyService$.setLoaderMessage('Loading...');
						return;
					});
				break;
			default:
				// nothing to do
				break;
		}
		setTimeout(() => {
			this.isRendered = true;
		}, 500);
		this.dialogRef.close();
	}

	/**
	 * @method handleDialogCloseButtonClick
	 * Handle the Dialog Cancel Button Click and close dialog window.
	 * @param _evt The click event to close dialog.
	 * @return {void}
	 */
	public handleDialogCloseButtonClick(_evt) {
		this.dialogRef.close();
	}

	/**
	 * @method isVersionInProgress
	 * Validates if version provided is in progresss.
	 * @param _versionId The version Id provided by template.
	 * @return {void}
	 */
	public isVersionInProgress(_versionId: string): boolean {
		if (!_versionId || !this.rateCardSelected) {
			return false;
		}
		return this.rateCardSelected.versionInProgress === _versionId;
	}

	/**
	 * @method isVersionPublished
	 * Validates if version provided is already published.
	 * @param _versionId The version Id provided by template.
	 * @return {void}
	 */
	public isVersionPublished(_versionId: string): boolean {
		if (!_versionId || !this.rateCardSelected) {
			return false;
		}
		return this.rateCardSelected.versionPublished === _versionId;
	}

	/**
	 * @method filterVersions
	 * Filter versions from ratecard selected
	 * @param {Object} _ratecard the ratecard selected
	 * @return {Object[]} ratecard's versions array.
	 */
	private filterVersions(_ratecard) {
		if (_ratecard.versions.length === 0) {
			this.cleanVersion();
			return;
		}
	}

	/**
	 * @method cleanVersion
	 * Clean version options to disable dropdown.
	 * @return {void}
	 */
	private cleanVersion() {
		doLog && console.log(LOG_TAG, 'cleanVersion');
		this.rateCardsVersionList = null;
		this.versionSelected = null;
		this.disabledVersionList = true;
		this.isRendered = true;
	}

	/**
	 * @method loadRateCards
	 * @private
	 * Updates the UI based on a new list of rateCards
	 * @param {object} rateCards new rateCards to load
	 * @return {void}
	 */
	private loadRateCards(rateCards?: any[]) {
		doLog && console.debug(`${LOG_TAG} - loadRateCards - ${JSON.stringify(rateCards)}`);

		this.rateCardsList = null;

		if (!rateCards) {
			this.isRendered = false;
			this.rateCardsList = [];
			return;
		}

		this.rateCardsList = rateCards;
		const { length = 0 } = rateCards;

		if (this.rateCardsList.length === 0) {
			this.disabledRateCardList = true;
			this.cleanVersion();
			return;
		}

		this.isRendered = true;
	}

	/**
	 * @method loadRateCardSelected
	 * @private
	 * Updates the UI based on a new rateCard selected
	 * @param {object} rateCardSelected new rateCardSelected to load
	 * @return {void}
	 */
	private async loadRateCardSelected(rateCardSelected?: any) {
		doLog && console.debug(`${LOG_TAG} - loadRateCardSelected - ${JSON.stringify(rateCardSelected)}`);

		this.rateCardSelected = null;

		if (!rateCardSelected) {
			this.rateCardSelected = { name: 'N/A' };
			this.disabledRateCardList = true;
			this.rateCardsVersionList = [];
			return;
		}

		const { versions = [] } = rateCardSelected;

		if (versions && versions.length > 0) {
			const rateCardsVersionList = _.map(versions, (version) => {
				if (!version) {
					return version;
				}
				const isPublished = (version.published === true || version.archived === true) && version.datePublished;
				version.versionDate = moment(isPublished ? version.datePublished : version.created_at).format('MM/DD/YYYY LT');
				return version;
			});
			this.rateCardsVersionList = _.orderBy(rateCardsVersionList, ['created_at'], ['desc']);
		}

		this.rateCardSelected = rateCardSelected;
		this.disabledRateCardList = false;
	}

	/**
	 * @method loadVersionSelected
	 * @private
	 * Updates the UI based on a new version selected
	 * @param {object} versionSelected new versionSelected to load
	 * @return {void}
	 */
	private loadVersionSelected(versionSelected?: any) {
		doLog && console.debug(`${LOG_TAG} - loadVersionSelected - ${JSON.stringify(versionSelected)}`);

		this.versionSelected = null;

		if (!versionSelected) {
			this.versionSelected = { versionDate: 'N/A' };
			this.disabledVersionList = true;
			return;
		}

		const { created_at = '', datePublished = '' } = versionSelected;
		if ((versionSelected.published === true || versionSelected.archived === true) && datePublished) {
			versionSelected.versionDate = moment(datePublished).format('MM/DD/YYYY LT');
		} else if (created_at) {
			versionSelected.versionDate = moment(created_at).format('MM/DD/YYYY');
		} else {
			const _newDate = new Date();
			versionSelected.versionDate = moment(_newDate).format('MM/DD/YY LT');
		}

		this.versionSelected = versionSelected;
		if (this.rateCardSelected && versionSelected) {
			this.updateVersionSelectedForExportDialog(this.rateCardSelected, versionSelected);
		}
		this.disabledVersionList = false;
	}

	/**
	 * @method updateVersionSelectedForExportDialog
	 * @private
	 * Generates the string label to be shown in the 'Export to Excel' pop up
	 * @param {object} _rateCard the rate card selected
	 * @param {object} _version the version selected
	 * @return {void}
	 */
	private updateVersionSelectedForExportDialog(_rateCard: any, _version: any) {
		if (_rateCard && _rateCard.versions && _version && _version.id) {
			if (_rateCard.versionPublished === _version.id) {
				this._layoutService.setVersionSelected(_version.versionDate + '(Current)');
			} else if (_rateCard.versionInProgress === _version.id) {
				this._layoutService.setVersionSelected(_version.versionDate + '(In-Progress)');
			} else {
				this._layoutService.setVersionSelected(_version.versionDate);
			}
		}
	}

	/**
	 * @method importVersion
	 * @private
	 * Import the versions to be shown in the 'Import Version' pop up
	 * @param {object} _importData the rate card selected
	 * @return {Object}
	 */
	private async importVersion(_importData) {
		const response = await this._dataManagerService.importVersion(_importData);
		return response;
	}

	public ngOnDestroy(): void {
		_.each(this.subscriptions, (subscription) => {
			subscription.unsubscribe();
		});
		this.docClickSubscription();
	}
}
