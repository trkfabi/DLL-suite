import { Location } from '@angular/common';
import {
	AfterViewChecked,
	AfterViewInit,
	Component,
	ElementRef,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	QueryList,
	Renderer2,
	TemplateRef,
	ViewChild,
	ViewChildren,
} from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';

import { DialogCloseResult, DialogRef, DialogService } from '@progress/kendo-angular-dialog';
// import { DataEvent, DragEndEvent, SortableComponent } from '@progress/kendo-angular-sortable';

import { AppSettings, BusyService, doLog, LayoutService, ToastEventHandlerService, ToastService, WebServices } from '@core/index';
import { AuthService, ErrorService } from '@core/services';
import { DataManagerService } from '@core/services/data-manager.service';
import { RateCardsWebService } from '@core/services/ratecards.webservice';
import { GridComponent } from '@shared/components/shared/grid';

import { DeleteVersionDialogComponent } from '@shared/components/shared/delete-version-dialog/delete-version-dialog.component';
import { ExportExcelDialogComponent } from '@shared/components/shared/export-excel-dialog/export-excel-dialog.component';
import { ProductCategoriesDialogComponent } from '@shared/components/shared/product-categories-dialog/product-categories-dialog.component';
import { PublishDialogComponent } from '@shared/components/shared/publish-dialog/publish-dialog.component';
import { RatefactorsCompareDialogComponent } from '@shared/components/shared/ratefactors-compare-dialog/ratefactors-compare-dialog.component';
import { ReplaceDialogComponent } from '@shared/components/shared/replace-dialog/replace-dialog.component';
import { TermsDialogComponent } from '@shared/components/shared/terms-dialog/terms-dialog.component';
import { IProductCategories } from '@shared/models/product-categories.model';
import { IProduct } from '@shared/models/product.model';
import { ITerm } from '@shared/models/terms.model';

import * as _ from 'lodash';
import * as moment from 'moment';

const LOG_TAG = '[components/DashboardComponent]';
const TAB_SELECTED = 'tabSelected';
const windowObject = window;
const VENDOR_CODES_SELECTED = 'vendorCodesSelected';
const COMPARE_VERSION_PATH = '/afs/compare-versions';

/**
 * @class components.DashboardComponent
 * Dashboard component.
 * @version 1.0.0
 */
@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, AfterViewChecked, OnDestroy {
	private dataLoaded: boolean;
	private tempVersionSelected: any;
	private loadingTimes: number;
	private isLoaded: boolean;
	private rateCards: any;
	private rateCardsSubscription: Subscription;
	/**
	 * @property {Boolean} hasToast Flag to validate if toaster is present in layout or not, and push content to down using css classes.
	 */
	public hasToast: boolean;

	/**
	 * @property {Object} rateFactorsData Stores the ratefactors data from API request.
	 */
	public rateFactorsData: any;

	/**
	 * @property {Object} rateFactorsDataFilter Stores the ratefactors data from rateFactorsData.
	 */
	public rateFactorsDataFilter: any;
	/**
	 * @property {Object} versionSelected Stores the current version selected.
	 */
	public versionSelected: any;

	/**
	 * @property {String} title Module title.
	 */
	public title: string;

	/**
	 * @property {Object[]} rateCardsInputData Receives the `rateCardsInputData` from Webservices.
	 */
	public rateCardsInputData;

	/**
	 * @property {Object[]} residualsData  Receives the `residualsData` from Webservices.
	 */
	public residualsData;

	/**
	 * @property {Object[]} rateCardsData  Receives the `rateCardsData` from Webservices.
	 */
	public rateCardsData;

	/**
	 * @property {Object[]} catalogueData  Receives the `catalogueData` from Webservices.
	 */
	public catalogueData;

	/**
	 * @property {Object[]} compareData  Receives the `compareData` from Webservices.
	 */
	public compareData;

	/**
	 * @property {Object[]} terms  Receives the `terms` from Webservices.
	 */
	public terms;

	/**
	 * @property {Object[]} productCategories Receives the `productCategories` from `catalogueData`.
	 */

	public productCategories: IProductCategories[];

	/**
	 * @property {Object[]} products Receives the `products` from `catalogueData`.
	 */

	public products: IProduct[];

	/**
	 * @property {Boolean} toggleToolbar Toggle display the toolbar on `Compare Grid`.
	 */
	public toggleToolbar: boolean = false;

	/**
	 * @property {Boolean} isRendered DOM Status to display/hide the loader.
	 */
	public isRendered: boolean = false;

	/**
	 * @property {Boolean} isEditingTerms DOM Status to display/hide the loader.
	 */
	public isEditingTerms: boolean = false;

	/**
	 * @property {String} buttonAction button action text to display on dialogs
	 */
	public buttonAction;

	/**
	 * @property {String} dialogAction dialog action to execute depending of the dialog opened.
	 */
	public dialogAction;

	/**
	 * @property {Object[]} gridsComponentArray Add the QueryList for GridsComponent into an Array to subcribe changes.
	 */
	@ViewChildren('app-grid') public gridsComponentArray: QueryList<GridComponent>;

	public gridLoading: boolean;

	public disableButton: boolean;

	/**
	 * @property {Object} dialogRef stores the reference to the dialog generated by the `DialogService`
	 * @private
	 */
	private dialogRef: DialogRef;

	/**
	 * @property {Object} dialogRefComponent stores the instance reference from the dialog component generated by the `DialogService`
	 * @private
	 */
	public dialogRefComponent;

	/**
	 * @property {Object} rateCardSelected reference to the current rateCard selected from the data manager
	 * @private
	 */
	public rateCardSelected: any;

	/**
	 * @property {Object} versionToRemove stores the instance reference from the dialog component generated by the `Delete-In-Progress`
	 * @private
	 */
	private versionToRemove;

	/**
	 * @property {String} versionDate stores a string representation for the selected date in the 'Version' dropdown
	 * @private
	 */
	private versionDate: string;

	/**
	 * @property {Object[]} downloadExportLink Gets the link from the View DOM that matches downloadExportLink.
	 */
	@ViewChild('downloadExportLink')

	/**
	 * @property {ElementRef} downloadExportLink Contains the link -DOM element- to save the data from a RateCard into a CSV file.
	 */
	private downloadExportLink: ElementRef;

	private subscriptions: any = {};

	/**
	 * @property {any} templateNoVersionSelected Contains the template for no version selected.
	 */
	private templateNoVersionSelected: any;

	/**
	 * @property {any} templateNoVersion Contains the template for no version at all.
	 */
	private templateNoVersion: any;

	/**
	 * @property {any} templateActions Contains template for all actions.
	 */
	private templateActions: any;

	/**
	 * @property {Object} dialogRefNoVersionSelected stores the reference to the dialog generated by the `DialogService`
	 * @private
	 */
	private dialogRefNoVersionSelected: DialogRef;

	/**
	 * @property {string} tabSelected sets if the tab 1 is the default to be selected or not
	 * @private
	 */
	public tabSelected: string;

	/**
	 * @property {String} versionSelectedId version Id from version selected
	 */
	public versionSelectedId: string = null;

	/**
	 * @property {string} versionCurrentId version current if to compare vs version selected
	 */
	public versionCurrentId: string = null;

	/**
	 * @property {string} versionSelectedName version name from version selected
	 */
	public versionSelectedName: string = null;

	/**
	 * @property {string} versionCurrentName version current name if to compare vs version selected
	 */
	public versionCurrentName: string = null;

	/**
	 * @property {Object[]} deleteVersionMessage Stores the reference template for delete version message.
	 */
	@ViewChild('deleteVersionMessage') private deleteVersionMessageTemplateref: TemplateRef<any>;
	@ViewChild('dialogAllActions') private dialogAllActionsButtonsTempRef: TemplateRef<any>;

	/**
	 * @property {any} docClickSubscription Stores the function for detecting the window click event.
	 */
	private docClickSubscription: any;

	/**
	 * @property {any} environmentName Stores the environmentName.
	 */
	private environmentName: string;

	/**
	 * @property {number} intervalTime Stores the interval time.
	 */
	private intervalTime: number = 15000;
	/**
	 * @property {string} permission Receive user permission
	 */
	public userPermission: string;

	private authToken;
	private refreshToken;
	public filterMenu: boolean = false;
	private isPublished: boolean;

	public filterOptions = [];

	/**
	 * @property {String} vendorCodesList
	 * `@Input` vendorCodesList values
	 */
	@Input('vendorCodesList') public vendorCodesList;

	/**
	 * @property {Object} defaultVendor default vendor to select
	 */
	public defaultVendor = {
		name: 'Base (No points added)',
		id: 'base',
	};

	/**
	 * @property {Boolean} noVendors Status to display No-Vendors message and disable selector.
	 */
	public noVendors: boolean;

	/**
	 * @property {Strings} vendorCodesSelected Selected vendor code.
	 */
	@Input('vendorCodesSelected') public vendorCodesSelected: string;
	/**
	 * @property {string} currentLocation Receives current location from URL path
	 */
	public currentLocation: string;

	constructor(
		private _appSettings: AppSettings,
		private _busyService$: BusyService,
		private _dialogService: DialogService,
		private _layoutService: LayoutService,
		private _rateCardsWebService: RateCardsWebService,
		private _router: Router,
		private _toaster: ToastService,
		private _toasterHandler: ToastEventHandlerService,
		private _dataManagerService: DataManagerService,
		private _location: Location,
		private _errorService: ErrorService,
		private renderer: Renderer2,
		private _auth: AuthService
	) {
		this.title = this._appSettings.appCustomOptions.appName;
		this.currentLocation = this._location.path();
		this.isRendered = false;
		this.isLoaded = false;
		this.isPublished = false;
		this.userPermission = this._auth.getUserPermissions();
	}

	/**
	 * @method ngOnInit
	 * Detect any changes on the component after the content has been initialized.
	 * @return {void}
	 */
	public async ngOnInit() {
		this.showLoader();
		this.loadingTimes = 0;
		this._busyService$.setLoaderMessage('Loading...');
		this._layoutService.setNavControlsVisibility(true);
		this.subscriptions.versionSelected$ = this._dataManagerService.versionSelected$.subscribe((versionSelected) => {
			this.loadVersionSelected(versionSelected);
		});

		this.subscriptions.rateCardSelected$ = this._dataManagerService.rateCardSelected$.subscribe((rateCardSelected) => {
			this.loadRateCardSelected(rateCardSelected);
		});

		this.subscriptions.trackExportVersionState = this._layoutService.trackExportVersionState.subscribe((_version) => {
			this.versionDate = _version;
		});

		this.subscriptions.rateCards$ = this._dataManagerService.rateCards$.subscribe((rateCards) => {
			if (rateCards && rateCards.length === 0) {
				this.isRendered = true;
				this.hideLoader();
			}
		});

		this.subscriptions.toasterEventObservable = this._toasterHandler.toasterEventObservable.subscribe((_toastEvent) => {
			const { method = null } = _toastEvent || {};

			switch (method) {
				case 'onSaveButtonClick':
					this.publishVersion();
					break;
				case 'onCancelButtonClick':
					this.deleteVersion(this.versionSelected, this.dialogAllActionsButtonsTempRef);
					break;
				default:
					// nothing to do
					break;
			}
			this._toaster.clear();
		});

		this.subscriptions.hasToasterEvent = this._toasterHandler.hasToasterEvent.subscribe((_toastEvent) => {
			this.hasToast = !!(_toastEvent.event === 'pop');
		});
		this.docClickSubscription = this.renderer.listen('document', 'click', this.windowBlurToCloseMenus.bind(this));
		this.environmentName = this._appSettings.getEnvironmentName();
	}

	public ngOnDestroy() {
		_.each(this.subscriptions, (subscription) => {
			subscription.unsubscribe();
		});
		this.docClickSubscription();
		localStorage.removeItem(VENDOR_CODES_SELECTED);
		this.vendorCodesSelected = null;
	}

	public ngAfterViewChecked() {
		// if (this.isLoaded) {
		// 	this.hideLoader();
		// }
	}

	/**
	 * @method onTabSelect
	 * Prevent change the tab to validate if there are changes on data or not.
	 * @param {Object} _evt the tab select event emitted.
	 * @return {void}
	 */
	public async onTabSelect(_evt) {
		doLog && console.log(LOG_TAG, ' - onTabSelect');
		if ((_evt.index === 0 && this.tabSelected === 'factors') || (_evt.index === 1 && this.tabSelected === 'inputs')) {
			return;
		}
		_evt.prevented = true;
		this.showLoader();
		localStorage.removeItem(VENDOR_CODES_SELECTED);
		// TODO: validate with telerik kendo the best approach to avoid rendering on tab change.
		if (_evt.index === 1 && this.rateFactorsData && !this.dataLoaded) {
			await this._dataManagerService.fetchVersionSelected(this.versionSelected.id);
			this.dataLoaded = true;
		}
		if (_evt.index === 0) {
			localStorage.setItem(TAB_SELECTED, 'factors');
			this.tabSelected = 'factors';
		} else {
			this.tabSelected = 'inputs';
			localStorage.setItem(TAB_SELECTED, 'inputs');
			this._toaster.clear();
		}
		this.isRendered = false;
		if (_evt.index === 0 && !this.rateFactorsData) {
			this.isLoaded = false;
			this.loadRateFactors();
		}

		_evt.prevented = false; // Should go after setTimeOut to display the loading mean the tab is changing or tabs wont work in safari.
	}

	/**
	 * @method windowBlurToCloseMenus
	 * Closes the fiter-menu when user clicks outside of them.
	 * @param _evt The click event to emit to close the menus.
	 * @return {void}
	 */
	public windowBlurToCloseMenus(_event): void {
		if (this.filterMenu) {
			const target = _event.target as HTMLElement;
			const targetId = target.className;
			const parent = target.offsetParent.className;
			this.filterMenu = this.filterMenuIsClosed(parent, targetId);
		}
	}

	/**
	 * @method filterMenuIsClosed
	 * Determines if the filter widget should be closed
	 * @param {Object} _parent A representation of a DOM element.
	 * @param {Object} _targetId A representation of a DOM element.
	 * @return {Boolean}
	 */
	public filterMenuIsClosed(_parent, _targetId): boolean {
		if (
			_targetId !== 'mat-button-wrapper' &&
			_targetId !== 'filter-link' &&
			_parent !== 'buttons-toolbar' &&
			_parent !== 'menu-fiter'
		) {
			return false;
		}
		return true;
	}

	/**
	 * @method onManageProductsButtonClick
	 * Redirect to manage products module.
	 * @param {Object} _evt the button click event.
	 * @return {void}
	 */
	public onManageProductsButtonClick(_evt) {
		doLog && console.log(LOG_TAG, 'onManageProductsButtonClick');
		const validPath = `/${this.userPermission}/manage-products`;
		this._toaster.clear();
		this.isRendered = true;
		this._router.navigate([validPath]);
	}

	/**
	 * @method onManageTermsButtonClick
	 * Redirect to manage terms module.
	 * @param {Object} _evt the button click event.
	 * @return {void}
	 */
	public onManageTermsButtonClick(_evt) {
		doLog && console.log(LOG_TAG, 'onManageTermsButtonClick');
		const validPath = `/${this.userPermission}/manage-terms`;
		this._toaster.clear();
		this.isRendered = true;
		this._router.navigate([validPath]);
	}

	/**
	 * @method onExportToExcelButtonClick
	 * Export rates to excel.
	 * @param {Object} _evt the button click event.
	 * @param {Object} _templateActions the template actions to pass through the dialog and manage the submission.
	 * @return {void}
	 */
	public onExportToExcelButtonClick(_evt, _templateActions) {
		doLog && console.log(LOG_TAG, 'onExportToExcelButtonClick');
		if (!this.versionDate) {
			this.versionDate = this._layoutService.currentVersionSelected;
		}

		this.dialogRef = this._dialogService.open({
			title: 'Export to Excel',
			content: ExportExcelDialogComponent,
			actions: _templateActions,
			height: 270,
		});
		this.dialogRefComponent = this.dialogRef.content.instance;
		this.dialogRefComponent.item = {
			env: this.environmentName,
			ratecard: this.rateCardSelected,
			versionDate: this.versionDate,
		};
		this.dialogRefComponent.vendorCodesList = this.versionSelected.vendorCodes || [];
		this.buttonAction = 'Export';
		this.dialogAction = 'export';
		this._toaster.clear();
	}

	/**
	 * @method onCompareRatesButtonClick
	 * Compare rate cards.
	 * @param {Object} _evt the button click event.
	 * @param {Object} _templateActions the template actions to pass through the dialog and manage the submission.
	 * @param {Object} _templateNoVersion the template actions to pass through the dialog if there's no more than one version.
	 * @param {Object} _templateNoVersionSelected the template actions to pass through the dialog if there's no version selected
	 * @return {void}
	 */
	public onCompareRatesButtonClick(_evt, _templateActions, _templateNoVersion, _templateNoVersionSelected) {
		this._toaster.clear();
		this.filterMenu = false;
		this.versionSelectedId = 'NoSelected';
		this.templateNoVersionSelected = _templateNoVersionSelected;
		this.templateNoVersion = _templateNoVersion;
		this.templateActions = _templateActions;
		const versionsLength =
			this.rateCardSelected.versions && this.rateCardSelected.versions.length > 1 ? this.rateCardSelected.versions.length : 0;
		this.dialogRef = this._dialogService.open({
			width: versionsLength === 0 ? 390 : 300,
			height: versionsLength === 0 ? 150 : 380,
			title: versionsLength === 0 ? 'No Versions to compare' : 'Compare Rate Card',
			content: RatefactorsCompareDialogComponent,
			actions: versionsLength === 0 ? _templateNoVersion : _templateActions,
		});
		this.dialogRefComponent = this.dialogRef.content.instance;
		this.dialogRefComponent.currentRateCard = this.rateCardSelected;
		this.dialogRefComponent.versionSelected = this.versionSelected;
		this.dialogRefComponent.environment = {
			name: this._appSettings.appCustomOptions.env,
		};
		this.buttonAction = 'Compare';
		this.dialogAction = 'compare';
	}

	/**
	 * @method onSaveChanges
	 * Save changes from the grid into database and fires toaster to publish.
	 * @return {void}
	 */
	public async onSaveChanges(_evt) {
		this.versionSelected.rateFactors = null;
		this.rateFactorsData = null;
		const dataItem = _evt;
		if (dataItem.isInput) {
			const version = await this._dataManagerService.saveInput(dataItem);
			if (version && version.id != null) {
				this.versionSelected = version;
				this.versionSelected.inputsGrouped = _.groupBy(version.inputs, 'type');
				_.each(this.versionSelected.inputs, (input) => {
					input.isInput = true;
				});
				_.each(this.versionSelected.products, (product) => {
					product.isResidual = true;
					const category = _.find(this.versionSelected.categories, { id: product.categoryId });
					product.categoryName = category.name;
				});
			}
		} else if (dataItem.isResidual) {
			await this._dataManagerService.saveResidual(dataItem);
		}
		this.isRendered = false;
	}

	/**
	 * @method onFilterRateFactorsClick
	 * Displays filter menu to filter data on ratefactors grid.
	 * @param {Object} _evt The on Filter RateFactors click button event.
	 * @return {void}
	 */
	public onFilterRateFactorsClick(_evt): void {
		this.filterMenu = this.filterMenu ? false : true;
	}

	/**
	 * @method onFilterChecked
	 * Displays filter menu to filter data on ratefactors grid.
	 * @param {Object} _evt _index _item The on Filter RateFactors click button event index item.
	 * @return {void}
	 */
	public onFilterChecked(_evt, i, item) {
		item.checked = !item.checked;
		if (i === 0 && item.checked === true) {
			this.cleanCheked(this.filterOptions, true);
			this.filterOptions[0].checked = true;
			this.filterOptions[0].disabled = false;
			this.rateFactorsDataFilter.fmv = this.rateFactorsData.fmv;
			this.rateFactorsDataFilter.out = this.rateFactorsData.out;
		} else if (i === 0 && item.checked === false) {
			this.cleanCheked(this.filterOptions, false);
			this.rateFactorsDataFilter.fmv = [];
			this.rateFactorsDataFilter.out = [];
			this.filterOptions[0].disabled = false;
		} else {
			this.filterOptions[0].checked = false;
			this.filterOptions[0].disabled = true;
			const options = _.filter(this.filterOptions, (_option) => {
				return _option.checked === true;
			});

			const results = { fmv: [], out: [] };
			_.each(this.rateFactorsData, (_factorsGroup) => {
				_.each(_factorsGroup, (_factor) => {
					return _.each(options, (_option) => {
						if (_factor.creditRating === _option.label) {
							results[_factor.rate].push(_factor);
						}
					});
				});
			});
			this.toggleSelectAllButton();
			this.rateFactorsDataFilter = results;
		}
	}

	/**
	 * @method toggleSelectAllButton
	 *  Validates length of current options checked and toggle select all button
	 * @return {void}
	 */
	public toggleSelectAllButton() {
		const checked = _.filter(this.filterOptions, (_item, _index) => {
			return _item.checked === true && _index !== 0;
		});
		if (checked.length === this.filterOptions.length - 1) {
			this.filterOptions[0].checked = true;
			this.filterOptions[0].disabled = false;
		} else {
			this.filterOptions[0].checked = false;
			this.filterOptions[0].disabled = true;
		}
	}

	/**
	 * @method cleanCheked
	 * clear all checked options in the menu filter.
	 * @param {Object} _items the list of filtersoptions filterOptions.
	 * @return {void}
	 */
	public async cleanCheked(_items, _state) {
		_items.forEach((element, index) => {
			if (index !== 0) {
				element.checked = _state;
				element.disabled = false;
			}
		});
		return;
	}

	/**
	 * @method changeCompareComponent
	 * Return true to parent to hide the component.
	 * @param _evt The button click event.
	 * @return {void}
	 */
	public changeCompareComponent(_evt) {
		document.getElementById('divTab').style.display = 'block';
		document.getElementById('btnsToolbar').style.display = 'block';
		switch (_evt) {
			case 'NoSelected':
				this.versionSelectedId = 'NoSelected';
				break;
			case 'NewComparison':
				this.versionSelectedId = 'NoSelected';
				// launch the click on the button for new comparison
				this.onCompareRatesButtonClick(null, this.templateActions, this.templateNoVersion, this.templateNoVersionSelected);
				break;
		}
	}

	/**
	 * @method handleDialogSubmitButtonClick
	 * Handle the `DialogSubmitButton` click to save the data from the dialog into the catalogueData
	 * and stores it into localstorage to regenerate the grids.
	 * @param {Object} _evt the `DialogSubmitButton` click event.
	 * @return {void}
	 */
	public async handleDialogSubmitButtonClick(_evt) {
		// gets the versionId from localStorage
		const versionId = this.versionSelected ? this.versionSelected.id : null;
		this.showLoader();
		this.dialogRef.close();
		if (!versionId) {
			this.hideLoader();
			return;
		}
		switch (this.dialogAction) {
			case 'export':
				// use the webapi to export the versionId selected
				let vendorName = null;

				if (this.dialogRefComponent.selectedVendorCode && this.dialogRefComponent.selectedVendorCode.name) {
					vendorName = this.dialogRefComponent.selectedVendorCode.name;
				}
				this._dataManagerService
					.exportVersion(versionId, vendorName)
					.then((_response: any) => {
						const blob = _response;
						const url = window.URL.createObjectURL(blob);
						const link = this.downloadExportLink.nativeElement;
						link.href = url;
						if (!vendorName) {
							vendorName = 'Base (No points added)';
						}
						const createdAt = this.getHourMinuteSecondString(this.versionSelected.created_at);
						const exportedAt = this.getHourMinuteSecondString();
						this.isRendered = true;
						link.download =
							this.rateCardSelected.name +
							'_' +
							vendorName +
							'_' +
							this.versionDate +
							'_' +
							createdAt +
							'_' +
							exportedAt +
							'.csv';
						link.click();
						window.URL.revokeObjectURL(url);
						this.hideLoader();
					})
					.catch((_error) => {
						doLog && console.log(LOG_TAG, 'handleDialogSubmitButtonClick - Error', _error);
						this.hideLoader();
						this._busyService$.setLoaderMessage('Loading...');
						return;
					});
				break;
			case 'compare':
				this._busyService$.setLoaderMessage('Comparing Rates...');
				if (!this.dialogRefComponent.versionSelectedId || this.dialogRefComponent.versionSelectedId === 'NoSelected') {
					this.dialogRefNoVersionSelected = this._dialogService.open({
						title: 'Compare Rate Card',
						content: 'You must select a version to compare',
						actions: this.templateNoVersionSelected,
					});
					this.isRendered = true;
					this.hideLoader();
					this._toaster.clear();
					this._busyService$.setLoaderMessage('Loading...');
					return;
				} else {
					this.versionCurrentId = this.dialogRefComponent.versionCurrentId;
					this.versionSelectedId = this.dialogRefComponent.versionSelectedId;
					this.versionCurrentName = this.dialogRefComponent.versionCurrentName;
					this.versionSelectedName = this.dialogRefComponent.versionSelectedName;
					try {
						const compareResponse = await this._dataManagerService.compareVersions({
							versionId: this.versionSelectedId,
							versionToCompare: this.versionCurrentId,
							versionCurrentName: this.versionCurrentName,
							versionSelectedName: this.versionSelectedName,
						});
						this._toaster.clear();
						this.isRendered = true;
						this.hideLoader();
						this._busyService$.setLoaderMessage('Loading...');
						this._router.navigate([COMPARE_VERSION_PATH]);
					} catch (error) {
						this.hideLoader();
					}
				}
				break;
			case 'deleteVersion':
				this.rateFactorsData = null;
				this.isRendered = false;
				await this._dataManagerService.deleteVersion(this.versionSelected.id);
				break;
			case 'publish':
				this.isPublished = false;
				this.setLoaderMessage('Please wait. This version is being published.');
				this.rateFactorsData = null;
				await this._dataManagerService.publishVersion(this.rateCardSelected.id);
				this.setLoaderMessage('Loading...');
				this.isPublished = true;
				break;
			default:
				// nothing to do
				break;
		}
	}

	/**
	 * @method handleDialogCloseButtonClick
	 * Handle the `DialogCloseButton` click to close the dialog
	 * @param {Object} _evt the `DialogCloseButton` click event.
	 * @return {void}
	 */
	public handleDialogCloseButtonClick(_evt) {
		if (this.tabSelected === 'factors') {
			this.isRendered = false;
			this.loadPublishDeleteToaster();
		}
		this.dialogRef.close();
	}

	/**
	 * @method getHourMinuteSecondString
	 * Generates the string label for the export file name
	 * @param {object} _time the current rate card selected
	 * @return {String}
	 */
	public getHourMinuteSecondString(_time?: any) {
		const timeObj = moment(_time).isValid() ? moment(_time) : moment();
		return timeObj.format('HHmmss');
	}

	private replaceVersion(_versionInProgress, _versionId, _dataItem?) {
		doLog && console.log(LOG_TAG, 'replaceVersion', _versionInProgress, _versionId);
		this.dialogRef = this._dialogService.open({
			title: 'Replace In-Progress Version',
			content: ReplaceDialogComponent,
			actions: this.dialogAllActionsButtonsTempRef,
		});
		this.dialogRefComponent = this.dialogRef.content.instance;
		this.dialogRefComponent.versionToReplace = _versionId;
		this.dialogRefComponent.item = _dataItem;
		this.buttonAction = 'Replace';
		this.dialogAction = 'replace';
	}

	/**
	 * @method handleDialogNoVersionSelectedCloseButtonClick
	 * Handle the `DialogCloseButton` click to close the dialog for no version selected
	 * @param {Object} _evt the `DialogCloseButton` click event.
	 */
	public handleDialogNoVersionSelectedCloseButtonClick(_evt) {
		if (this.tabSelected === 'factors') {
			this.loadPublishDeleteToaster();
		}
		this.dialogRefNoVersionSelected.close();
	}

	/**
	 * @method publishVersion
	 * Sends the request to publish current version selected.
	 * @return {void}
	 */
	public publishVersion() {
		doLog && console.log(LOG_TAG, 'publishVersion');
		this.dialogRef = this._dialogService.open({
			title: 'Publish Rate Card Version',
			content: PublishDialogComponent,
			actions: this.dialogAllActionsButtonsTempRef,
			height: 220,
		});
		this.dialogRefComponent = this.dialogRef.content.instance;
		this.dialogRefComponent.item = {
			environment: this.environmentName,
			rateCard: this.rateCardSelected,
		};
		this.dialogAction = 'publish';
		this.buttonAction = 'Publish';
		this._toaster.clear();
	}

	/**
	 * @method deleteVersion
	 * Shows the dialog to delete the version selected.
	 * @param {Object} _currentVersion Receives object with current version
	 * @param {Object} _deleteVersionActionsTemplateref Receives delete version actions template
	 *  the current version to delete from database.
	 * @return {void}
	 */
	public deleteVersion(_currentVersion, _deleteVersionActionsTemplateref) {
		this.dialogRef = this._dialogService.open({
			title: 'Delete In-Progress Version',
			content: DeleteVersionDialogComponent,
			actions: _deleteVersionActionsTemplateref,
		});
		this.versionToRemove = _currentVersion;
		this.dialogAction = 'deleteVersion';
		this.buttonAction = 'Delete';
		this._toaster.clear();
	}

	/**
	 * @method recalculateFactors
	 * Call API to recalculate ratefactors table and display on grid.
	 * @param {Object} _rateCardData The current ratecard data to calculate.
	 * @return {void}
	 */
	public async recalculateFactors(_rateCardData) {
		if (!_rateCardData) {
			this.tabSelected = 'inputs';
			return;
		}
		this.showLoader();
		this.rateFactorsData = null;
		let vendor = _.find(this.vendorCodesList, { id: localStorage.getItem(VENDOR_CODES_SELECTED) });
		if (!vendor) {
			vendor = 'base';
			localStorage.setItem(VENDOR_CODES_SELECTED, vendor);
		}
		const _recalculatedFactorsResponse = await this._dataManagerService.recalculateFactors(_rateCardData, vendor);
		const { fmv = [], out = [] } = _recalculatedFactorsResponse;
		this.rateFactorsData = {
			fmv,
			out,
		};
		this.populateFilters();
		this.isRendered = true;

		doLog && console.log(LOG_TAG, 'recalculateFactors', this.rateFactorsData, _recalculatedFactorsResponse);
	}
	/**
	 * @method populateFilters
	 * Fill filters from Filter by Credit Rating
	 * @return {void}
	 */
	public populateFilters(): void {
		this.rateFactorsDataFilter = _.clone(this.rateFactorsData);
		if (this.filterOptions.length > 0) {
			this.filterOptions = [];
		}
		this.filterOptions.push({ label: 'Show All', checked: true, disabled: false });
		if (this.rateFactorsData.out) {
			this.rateFactorsData.out.forEach((element) => {
				this.filterOptions.push({
					label: element.creditRating,
					checked: true,
					disabled: false,
				});
			});
		}
		this.filterOptions[0].disabled = false;
		this.disableButton = this.disableFilterCompareButtons();
		this.isRendered = true;
	}
	/**
	 * @method getRateFactors
	 * Call API to recalculate ratefactors table and display on grid.
	 * @param {Object} _versionData The current ratecard data to calculate.
	 * @return {void}
	 */
	public async getRateFactors(_versionData) {
		if (!_versionData) {
			this.tabSelected = 'inputs';
			return;
		}
		this.showLoader();
		const vendorName = _.find(this.vendorCodesList, { id: localStorage.getItem(VENDOR_CODES_SELECTED) });
		const _rateFactorsResponse = await this._dataManagerService.getRateFactors(
			_versionData,
			vendorName ? vendorName.name : 'Base (No points added)'
		);
		const { fmv = [], out = [] } = _rateFactorsResponse;
		this.rateFactorsData = {
			fmv,
			out,
		};
		this.populateFilters();
		doLog && console.log(LOG_TAG, 'getRateFactors', _rateFactorsResponse);
	}

	/**
	 * @method resetAttributes
	 * Workaround, call it everytime an update occurs to force the grids to update
	 * @return {void}
	 */
	public resetAttributes() {
		return new Promise((resolve) => {
			this.versionSelected && (this.versionSelected.inputsGrouped = false);
			this.versionSelected = false;
			this.residualsData = false;

			_.delay(() => {
				resolve();
			}, 100);
		});
	}

	/**
	 * @method loadRateCardSelected
	 * Updates the template's rateCardSelected
	 * @param {object} rateCardSelected new rateCardSelected to load
	 * @return {void}
	 */
	public loadRateCardSelected(rateCardSelected: any) {
		this.rateCardSelected = rateCardSelected;
	}

	/**
	 * @method loadVersionSelected
	 * Updates the template's versionSelected
	 * @param {object} versionSelected new versionSelected to load
	 * @return {void}
	 */
	public async loadVersionSelected(versionSelected: any) {
		doLog && console.log('loadVersionSelected', versionSelected);
		this.tabSelected = localStorage.getItem(TAB_SELECTED) || 'inputs';
		this.versionSelected = null;
		this.rateFactorsData = null;
		this.isRendered = false;
		this.isLoaded = false;
		this.residualsData = [];

		if (versionSelected) {
			try {
				await this.resetAttributes();
				const { inputs = [], id = null, canPublish = false, isPublishing = false } = versionSelected || {};
				if (isPublishing) {
					this.isPublished = false;
					this.setLoaderMessage('Please wait. This version is being published.');
					await this._dataManagerService.waitForVersionPublishing(id);

					this.isPublished = true;
					this.setLoaderMessage('Loading...');

					return await this._dataManagerService.fetchRateCardSelected(this.rateCardSelected.id);
				}
				if (!versionSelected.inputsGrouped) {
					versionSelected.inputsGrouped = _.groupBy(inputs, 'type');
				}
				_.each(versionSelected.products, (_product) => {
					const tempCategory = _.find(versionSelected.categories, (_category) => {
						return _category.id === _product.categoryId;
					});
					_.extend(_product, {
						categoryName: tempCategory.name,
						isResidual: true,
					});
				});

				_.each(versionSelected.inputs, (_input) => {
					_.extend(_input, {
						isInput: true,
					});
				});
				this.vendorCodesList = null;
				this.vendorCodesSelected = null;
				this.noVendors = false;
				this.vendorCodesList = versionSelected.vendorCodes || [];
				if (!(this.vendorCodesList && Array.isArray(this.vendorCodesList) && this.vendorCodesList.length > 0)) {
					this.noVendors = true;
				} else {
					this.vendorCodesSelected = _.find(this.vendorCodesList, { id: localStorage.getItem(VENDOR_CODES_SELECTED) });
					this.vendorCodesList = _.map(this.vendorCodesList, (_vendorCode) => {
						return _.extend(_vendorCode, { isNotBase: _vendorCode.id !== 'base' });
					});
				}
				this.versionSelected = versionSelected;

				this.loadRateFactors();
				if (this.versionSelected && this.tabSelected === 'inputs') {
					this.isRendered = true;
					this.setLoaderMessage('Loading...');
					this.hideLoader();
					this.isLoaded = true;
				}

				if (this.isPublished && this.versionSelected.published) {
					this.loadPublishedToaster();
					this.isPublished = false;
				}
			} catch (_error) {
				this._errorService.validateResponseError(_error);
			}
		}
	}

	/**
	 * @method versionCanBePublished
	 * Shows the toaster about a version in progress to be deleted or published
	 * @param {Object} _versionSelected new versionSelected to load
	 * @param {Object} _rateCardSelected new rate card selected to load
	 * @param {Object} _isRendered flag indicating the rendered state
	 */
	public versionCanBePublished(_versionSelected, _rateCardSelected, _isRendered) {
		if (
			_versionSelected &&
			_versionSelected.canPublish &&
			_rateCardSelected &&
			_versionSelected.id === _rateCardSelected.versionInProgress &&
			!_isRendered
		) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 *
	 * @method loadPublishDeleteToaster
	 * Shows the toaster about a version in progress to be deleted or published
	 * @return {void}
	 */
	public loadPublishDeleteToaster() {
		const validPath = `/${this.userPermission}/dashboard`;
		if (this.currentLocation !== validPath) {
			return;
		}
		if (this.versionCanBePublished(this.versionSelected, this.rateCardSelected, this.isRendered)) {
			this._toaster.pop({
				type: 'warning',
				event: 'pop',
				message: 'VERSION IN-PROGRESS: Rate Card Inputs have been edited. Select Publish once you are done with rate card edits.',
				hasButtons: true,
				hasIcon: false,
				saveButtonText: 'Publish',
				cancelButtonText: 'Delete Version',
				animation: 'fade',
			});
			this.isRendered = true;
		} else {
			this._toaster.clear();
		}
	}

	/**
	 *
	 * @method loadPublishedToaster
	 * Shows the toaster about a published version
	 * @return {void}
	 */
	public loadPublishedToaster() {
		if (this.hasToast) {
			return;
		}
		this._toaster.pop({
			type: 'info',
			event: 'pop',
			message: 'This Rate Card has been published successfully.',
			hasButtons: false,
			hasIcon: true,
			animation: 'fade',
		});
	}

	/**
	 * @method hideLoader
	 * Hides the `LoadingComponent` subscribing as true the observable value.
	 * @return {void}
	 */
	public hideLoader() {
		if (this.isRendered) {
			this._busyService$.hideLoading();
		}
	}

	/**
	 * @method showLoader
	 * Displays the `LoadingComponent` subscribing as true the observable value.
	 * @return {void}
	 */
	public showLoader() {
		this._busyService$.showLoading();
	}
	/**
	 * @method setLoaderMessage
	 * Set messate to loader
	 * @param {string} _message Receives messate to diplay in loader
	 * @return {void}
	 */
	public setLoaderMessage(_message: string): void {
		this._busyService$.setLoaderMessage(_message);
	}

	/**
	 * @method disableFilterCompareButtons
	 * Enable or Disable buttons to filter or compare data from version selected.
	 * @return {Boolean}
	 */
	public disableFilterCompareButtons() {
		return !this.rateFactorsData.out.length && !this.rateFactorsData.fmv.length;
	}

	/**
	 * @method onSelectionChange
	 * Execute event based on type of selected dropdown changes.
	 * @param {Object} _evt The event change returns the ratecard selected or the version selected.
	 * @return {void}
	 */
	public onSelectionChange(_evt) {
		doLog && console.log(LOG_TAG, 'onSelectionChange', _evt);
		this.isRendered = false;
		if (_evt.id === localStorage.getItem(VENDOR_CODES_SELECTED)) {
			return;
		}
		localStorage.setItem(VENDOR_CODES_SELECTED, _evt.id);
		this.loadRateFactors();
	}

	/**
	 * @method loadRateFactors
	 * Loads or recalculates the rate factors.
	 * @return {void}
	 */
	public loadRateFactors() {
		if (this.tabSelected === 'factors') {
			if (this.rateCardSelected.versionInProgress === this.versionSelected.id) {
				if (!this.isRendered) {
					this.loadPublishDeleteToaster();
					this.isRendered = true;
					return this.recalculateFactors(this.rateCardSelected);
				}
			} else {
				if (!this.rateCardsData && !this.isRendered) {
					this.loadPublishDeleteToaster();
					this.isRendered = true;
					return this.getRateFactors(this.versionSelected.id);
				}
			}
		} else {
			_.defer(() => {
				this.hideLoader();
				this.isLoaded = true;
				this.dataLoaded = false;
			});
		}
	}

	/**
	 * @method onFinishedLoadingGrid
	 * Execute event based when the FMV grid is finished loading.
	 * @return {void}
	 */
	public onFinishedLoadingGrid() {
		_.defer(() => {
			this.hideLoader();
			this.isLoaded = true;
			this.dataLoaded = false;
		});
	}
}
