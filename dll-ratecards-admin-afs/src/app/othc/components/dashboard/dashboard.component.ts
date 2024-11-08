import { Location } from '@angular/common';
import {
	Component,
	ElementRef,
	HostListener,
	Input,
	OnDestroy,
	OnInit,
	QueryList,
	Renderer2,
	TemplateRef,
	ViewChild,
	ViewChildren,
} from '@angular/core';
import { NavigationStart, Router } from '@angular/router';

import { DialogRef, DialogService } from '@progress/kendo-angular-dialog';

import {
	AppSettings,
	BusyService,
	doLog,
	EDITING_FROM_DASHBOARD,
	LayoutService,
	ToastEventHandlerService,
	ToastService,
	WebServices,
} from '@core/index';
import { AuthService, ErrorService } from '@core/services';
import { DataManagerService } from '@core/services/data-manager.service';
import { RateCardsWebService } from '@core/services/ratecards.webservice';
import { GridComponent } from '@shared/components/shared/grid';

import { DeleteVersionDialogComponent } from '@shared/components/shared/delete-version-dialog/delete-version-dialog.component';
import { ExportExcelDialogComponent } from '@shared/components/shared/export-excel-dialog/export-excel-dialog.component';
import { PublishDialogComponent } from '@shared/components/shared/publish-dialog/publish-dialog.component';
import { RatefactorsCompareDialogComponent } from '@shared/components/shared/ratefactors-compare-dialog/ratefactors-compare-dialog.component';
import { ReplaceDialogComponent } from '@shared/components/shared/replace-dialog/replace-dialog.component';

import { IFiltersRateFactors, IGridData, IRadioOptionItem, IRateProgram } from '@shared/interfaces';

import { IProductCategories } from '@shared/models/product-categories.model';
import { IProduct } from '@shared/models/product.model';
import { IRateCard } from '@shared/models/ratecard.model';

import * as _ from 'lodash';
import * as moment from 'moment';

import { NumberHelper } from '@lib/index';

const LOG_TAG = '[components/DashboardComponent]';
const TAB_SELECTED = 'tabSelected';
const windowObject = window;
const VENDOR_CODES_SELECTED = 'vendorCodesSelected';
const ALL_RATEPROGRAMS = 'All Programs';
const SELECTED_RATEPROGRAMS = 'Rate Programs';
const GRID_COFS = 'COF';
const GRID_ALL_RATES = 'ALL-IN-RATES';
const GRID_FMV = 'FMV';
const GRID_FPO = 'FPO';
const GRID_SPREADS = 'SPREADS';
const AMOUNT_TITLE = 'AMOUNT FINANCED';
const RATE_PROGRAMS_TITLE = 'RATE PROGRAMS';
const PURCHASE_OPTIONS_TITLE = 'PURCHASE OPTION';
const ADDITIONAL_POINTS = 'ADDITIONAL POINTS';
const DEFAULT_PAYMENTFREQUENCY = 'M';
const DEFAULT_SHOWS = 'rates';
const DEFAULT_ANNUALLY = 'A';
const RF_COLUMNS = {
	rateProgram: {
		title: RATE_PROGRAMS_TITLE,
		width: 217,
	},
	amountFinanced: {
		title: AMOUNT_TITLE,
		width: 236,
	},
	purchaseOption: {
		title: PURCHASE_OPTIONS_TITLE,
		width: 106,
	},
	points: {
		title: ADDITIONAL_POINTS,
		width: 100,
	},
};
const VENDOR_CODE_ID = 'vendorCodeId';
const WIDTH_FIRST_COLUMN = 300;
const NO_POINTS = 'base';
const RATE_PROGRAM_SELECTED = 'rateProgramSelected';
const PURCHASE_OPTION_FMV = 'F';
const PURCHASE_OPTION_FPO = 'P';
const DATA_DISPLAY_OPTIONS = {
	rates: 'Rate Factor',
	interest: 'Interest Rate',
};
const URL_EDIT_RATEPROGRAMS = 'edit-rate-programs';
const URL_MANAGE_RATEPROGRAMS = '/othc/manage-rate-programs';
const DEFAULTS_FILTERS_OPTIONS: {
	versionId: string;
	display: string;
	show: string;
	points: number;
	paymentFrequency: string;
	advancePayments: number;
	purchaseOption: string;
	ratePrograms: string[];
} = {
	versionId: null,
	display: 'admin',
	show: 'rates',
	points: 0,
	paymentFrequency: 'M',
	advancePayments: 0,
	purchaseOption: null,
	ratePrograms: [],
};

const DEFAULTS_FILTERS_PURCHASE_OPTIONS = [
	{ text: 'FMV', value: 'F' },
	{ text: 'FPO', value: 'P' },
	{ text: '$1', value: 'D' },
];

const DEFAULTS_FILTERS_PAYMENT_FREQUENCY = [
	{ text: 'Monthly', value: 'M' },
	{ text: 'Quarterly', value: 'Q' },
	{ text: 'Semi-Annually', value: 'SA' },
	{ text: 'Annually', value: 'A' },
];

/**
 * @class components.DashboardComponent
 * Dashboard component.
 * @version 1.0.0
 */
@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
	private dataLoaded: boolean;
	private tempVersionSelected: any;
	private loadingTimes: number;
	private isLoaded: boolean;
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
	 * @property {Object} rateProgramSelected Stores the current rateProgram selected.
	 */
	public rateProgramSelected: IRateProgram;
	/**
	 * @property {Object} rateProgramsList Stores the rateProgram list.
	 */
	public rateProgramsList: IRateProgram[] = [];

	/**
	 * @property {String} title Module title.
	 */
	public title: string;

	/**
	 * @property {String} title Module title.
	 */
	public emptyStateMessage: string;

	/**
	 * @property {Object[]} rateCardsInputData Receives the `rateCardsInputData` from Webservices.
	 */
	public rateCardsInputData;

	/**
	 * @property {Object[]} residualsData  Receives the residuals Data.
	 */
	public residualsData = [];

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
	/**
	 * @property {boolean} gridLoading
	 */
	public gridLoading: boolean;
	/**
	 * @property {boolean} disableButton
	 */
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
	 * @property {Object} templateNoVersionSelected Contains the template for no version selected.
	 */
	private templateNoVersionSelected: TemplateRef<any>;

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
	 * @property {ElementRef} rateProgram Receives viewchild for button rate program
	 */
	@ViewChild('rateProgram', { read: ElementRef }) public rateProgram: ElementRef;
	/**
	 * @property {ElementRef} popupRateProgram Receives viewchild for popup rate program
	 */
	@ViewChild('popupRateProgram', { read: ElementRef }) public popupRateProgram: ElementRef;
	/**
	 * @property {ElementRef} filtersRateProgram Receives viewchildren from input checkbox rate program
	 */
	@ViewChildren('filtersRateProgram', { read: ElementRef }) filtersRateProgram: QueryList<ElementRef>;
	/**
	 * @property {any} docClickSubscription Stores the function for detecting the window click event.
	 */
	private docClickSubscription: any;
	/**
	 * @property {string} environmentName Stores the environmentName.
	 */
	private environmentName: string;
	/**
	 * @property {number} intervalTime Stores the interval time.
	 */
	private intervalTime: number = 15000;

	private authToken;
	private refreshToken;
	public filterMenu: boolean = false;
	private isPublished: boolean;

	public filterOptions = [];

	/**
	 * @property {IRadioOptionItem[]} displayDataOptions Stores the data to display in radio buttons filter
	 */
	public displayDataOptions: IRadioOptionItem[] = [];

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
	 * @property {string} vendorCodesSelected Selected vendor code.
	 */
	@Input('vendorCodesSelected') public vendorCodesSelected: string;

	/**
	 * @property {string} permission Receive user permission
	 */
	public userPermission: string;

	/**
	 * @property {string} currentLocation
	 */
	private currentLocation: string;

	/**
	 * @property {object} defaultItem Object with default values for dropdownlist
	 */
	public readonly defaultItem: IFiltersRateFactors = { text: 'All', value: null };

	/**
	 * @property {number} paymentSelected Default value to Advance Payment Frequency dropdown
	 */
	public paymentSelected: number;

	/**
	 * @property {number} paymentFrequencySelected Default value to payment Frequency dropdown
	 */
	public paymentFrequencySelected: number;

	/**
	 * @property {IFiltersRateFactors} filterRateProgram Array with values for rate program dropdownlist
	 */

	public filterRateProgram: IFiltersRateFactors[];

	/**
	 * @property {Boolean} filterAllRateProgramsIsSelected Stores flag to toggle display of multi-select options from rate programs in factors
	 */
	public filterAllRateProgramsIsSelected: boolean;

	/**
	 * @property {IFiltersRateFactors} valueRateProgram Array with value for rate program in  Rate Card Input section
	 */
	public readonly valueRateProgram: IFiltersRateFactors[] = [{ text: 'Standard Lease Rates 60', value: 1 }];

	/**
	 * @property {array} filterPurchaseOptions Array with values for purchase options dropdownlist
	 */
	public filterPurchaseOptions = [];

	/**
	 * @property {array} filterPaymentFrequency Array with values for payment frequency dropdownlist
	 */
	public filterPaymentFrequency = [];

	/**
	 * @property {array} filterAdvancedPayments Array with values for advanced payments dropdownlist
	 */
	public filterAdvancedPayments: number[];

	/**
	 * @property {number} showRates Receives values from show filter
	 */
	public showRates: number = 0;

	/**
	 * @property {IFiltersRateFactors} dataRateProgram Receives filters from rate program selected
	 */
	public dataRateProgram: IFiltersRateFactors[] = [];

	/**
	 * @property {boolean} showRateProgram Display pop-up with filters list from rate program
	 */
	public showRateProgram: boolean = false;

	/**
	 * @property {boolean} hasVersions Validates if RateCard has versions in place to render the grids.
	 */
	public hasVersions: boolean = false;

	/**
	 * @property {boolean} hasResiduals Validates if RateProgram has residuals in place to render the grids.
	 */
	public hasResiduals: boolean = false;
	/**
	 * @property {IGridData} cofsData receives COFS data for display in COFS Grid
	 */
	public cofsData: IGridData = { columns: [], rows: [], locked: false };
	/**
	 * @property {IGridData} allInRatesData receives all-in-rates data for display in All-in-Rates Grid
	 */
	public allInRatesData: IGridData = { columns: [], rows: [], locked: false };

	/**
	 * @property {IGridData} spreadsData receives spreads data for display in Spreads Grid
	 */
	public spreadsData: IGridData = { columns: [], rows: [], locked: false };

	/**
	 * @property {IGridData} residualFmvData receives residual fmv data for display in Residuals Percentages Grid
	 */
	public residualFmvData: IGridData = { columns: [], rows: [], locked: false };

	/**
	 * @property {IGridData} residualFpoData receives residual fpo data for display in Residuals Percentages Grid
	 */
	public residualFpoData: IGridData = { columns: [], rows: [], locked: false };

	/**
	 * @property {Object} filtersSelected Stores the user selection from filters to use as parameters on rateFactors.
	 */
	public filtersSelected = DEFAULTS_FILTERS_OPTIONS;

	/**
	 * @property {string} textSelectRateProgram store text from dropdown rate program filter from Rate factors
	 */
	public textSelectRateProgram: string = ALL_RATEPROGRAMS;

	/**
	 * @property {number} purchaseOptionSelected Default value to purchase options dropdown
	 */
	public purchaseOptionSelected: number;

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
		private _auth: AuthService,
		private _numberHelper: NumberHelper
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
		this._layoutService.setNavControlsReadOnly(false);

		this.subscriptions.rateCardSelected$ = this._dataManagerService.rateCardSelected$.subscribe((rateCardSelected) => {
			if (rateCardSelected) {
				this.loadRateCardSelected(rateCardSelected);
			}
		});

		this.subscriptions.versionSelected$ = this._dataManagerService.versionSelected$.subscribe((versionSelected) => {
			if (versionSelected) {
				this.loadVersionSelected(versionSelected);
			}
		});

		this.subscriptions.trackExportVersionState = this._layoutService.trackExportVersionState.subscribe((_version) => {
			this.versionDate = _version;
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

		this.subscriptions.routerEvent$ = this._router.events.subscribe((event) => {
			if (event instanceof NavigationStart) {
				if (event.url.indexOf(URL_MANAGE_RATEPROGRAMS) > -1) {
					localStorage.removeItem(RATE_PROGRAM_SELECTED);
				}
				const { id = 0 } = this.versionSelected || {};
				this._dataManagerService.fetchVersionSelected(id);
			}
		});

		this.docClickSubscription = this.renderer.listen('document', 'click', this.windowBlurToCloseMenus.bind(this));
		this.environmentName = this._appSettings.getEnvironmentName();
	}
	/**
	 * @method onRateProgramDisplay
	 * Display or hide popup with filters list and pre-select checkbox from dataRateProgram
	 * @return {void}
	 */
	public onRateProgramDisplay(): void {
		this.showRateProgram = !this.showRateProgram;
	}
	/**
	 * @method onRateProgramComplete
	 * Close popup rate program
	 * @return {void}
	 */
	public onRateProgramComplete(): void {
		this.showRateProgram = false;
		this.filterRateFactors();
	}

	/**
	 * @method onRateProgramClick
	 * Event click checked in rate program dropdown list
	 * @property {boolean} _checked Receives value if is checked checkbox
	 * @param {IFiltersRateFactors} _item Receives item from option
	 * @return {void}
	 */
	public onRateProgramClick(_checked: boolean, _item: IFiltersRateFactors): void {
		doLog && console.log(LOG_TAG, 'onRateProgramClick', _checked, _item);
		const { value = 0 } = _item || {};
		const allItemsOption = _.find(this.filterRateProgram || [], (rateProgram) => rateProgram.value === 0);
		let textSelect = '';

		if (!value) {
			this.rateProgramSelectAll(_checked);
		}
		_.extend(_item, {
			selected: _checked,
		});
		this.dataRateProgram = _.filter(
			this.filterRateProgram || [],
			(rateProgram) => rateProgram.selected === true && rateProgram.value !== 0
		);
		const allItemsSelected: boolean = this.dataRateProgram.length === this.filterRateProgram.length - 1;
		_.extend(allItemsOption, {
			selected: allItemsSelected,
		});
		this.filterAllRateProgramsIsSelected = allItemsSelected;
		textSelect = allItemsSelected ? ALL_RATEPROGRAMS : SELECTED_RATEPROGRAMS;

		this.textSelectRateProgram = textSelect;
		this.getFiltersRateProgram();
	}

	/**
	 * @method rateProgramSelectAll
	 * Event checked in All Programs check all or uncheck all rate programs dropdown
	 * @param _checked Receives value if is checked checkbox
	 * @return {void}
	 */
	public rateProgramSelectAll(_checked: boolean): void {
		this.filterRateProgram = _.map(this.filterRateProgram || [], (_data) => {
			_data.selected = _checked;
			return _data;
		});
		this.dataRateProgram = _.chain(this.filterRateProgram)
			.map((_data) => {
				if (_data.value !== 0 && _data.selected === true) {
					return {
						text: _data.text,
						value: _data.value,
					};
				}
			})
			.filter((_rate) => _rate)
			.value();
	}

	/**
	 * @method onOpenMultiselect
	 * disable open event from rate program list
	 * @param {object} _event receives event click from rate program list
	 * @return {void}
	 */
	public onOpenMultiselect(_event): void {
		_event.preventDefault();
	}

	/**
	 * @method onRemoveRateProgram
	 * remove rate program element from list and uncheck current id from rate program dropdown list
	 * @param {object} _rate receives rate program clicked to delete
	 * @return {void}
	 */
	public onRemoveRateProgram(_rate): void {
		const { dataItem } = _rate || {};
		const { value } = dataItem || {};
		_.each(this.filterRateProgram || [], (_item) => {
			if (_item.value === value) {
				_item.selected = false;
			}
		});
		this.dataRateProgram = _.filter(
			this.filterRateProgram || [],
			(rateProgram) => rateProgram.selected === true && rateProgram.value !== 0
		);
		const allItemsSelected: boolean = this.dataRateProgram.length === this.filterRateProgram.length - 1;
		const allItemsOption = _.find(this.filterRateProgram || [], (rateProgram) => rateProgram.value === 0);

		_.extend(allItemsOption, {
			selected: allItemsSelected,
		});
		this.filterAllRateProgramsIsSelected = allItemsSelected;
		this.textSelectRateProgram = SELECTED_RATEPROGRAMS;

		this.getFiltersRateProgram();
		this.filterRateFactors();
	}

	/**
	 * @method getFiltersRateProgram
	 * Get rate programs selected from list and set in property ratePrograms from filtersSelected
	 * @return {void}
	 */
	public getFiltersRateProgram(): void {
		this.filtersSelected.ratePrograms = _.map(this.dataRateProgram || [], (_data) => _data.value);
	}

	/**
	 * @method documentClick
	 * Event click on document container and validate if is out from popup
	 * This could be used for another popup or clicking in any other element
	 * @param {MouseEvent} event Receives element from mouse click
	 * @return {void}
	 */
	@HostListener('document:click', ['$event'])
	public documentClick(event): void {
		if (!this.containedInRateProgramPopup(event.target)) {
			this.showRateProgram = false;
		}
	}
	/**
	 * @method containedInRateProgramPopup
	 * Validate if nativeElement is rate program popup
	 * @param {ElementRef} containsTargetValue Receives DOM element
	 * @return {boolean}
	 */
	private containedInRateProgramPopup(containsTargetValue: ElementRef): boolean {
		if (!this.rateProgram && !this.popupRateProgram) {
			return false;
		}
		return (
			this.rateProgram.nativeElement.contains(containsTargetValue) ||
			(this.popupRateProgram ? this.popupRateProgram.nativeElement.contains(containsTargetValue) : false)
		);
	}
	/**
	 * @method ngOnDestroy
	 * Detect when destroy component
	 * @return {void}
	 */
	public ngOnDestroy(): void {
		_.each(this.subscriptions || {}, (_subscription) => _subscription.unsubscribe());
		localStorage.removeItem(VENDOR_CODES_SELECTED);
		this.vendorCodesSelected = null;
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
		if (_evt.index === 0) {
			localStorage.setItem(TAB_SELECTED, 'factors');
			this.tabSelected = 'factors';
			this.isRendered = false;
			this.loadRateFactors();
		} else {
			this.tabSelected = 'inputs';
			localStorage.setItem(TAB_SELECTED, 'inputs');
			this.isRendered = false;
			await this._dataManagerService.fetchVersionSelected(this.versionSelected.id);
			this._toaster.clear();
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
	 * @method onManageTermsCofButtonClick
	 * Redirect to manage terms and cof module.
	 * @param {Object} _evt the button click event.
	 * @return {void}
	 */
	public onManageTermsCofButtonClick(_evt) {
		doLog && console.log(LOG_TAG, 'onManageTermsCofButtonClick');
		this._toaster.clear();
		this.isRendered = true;
		this._router.navigate(['/othc/manage-terms-cof']);
	}
	/**
	 * @method onManageRateProgramsButtonClick
	 * Redirect to manage rate programs module.
	 * @param {Object} _evt the button click event.
	 * @return {void}
	 */
	public onManageRateProgramsButtonClick(_evt) {
		doLog && console.log(LOG_TAG, 'onManageRateProgramsButtonClick');
		this._toaster.clear();
		this.isRendered = true;
		this._router.navigate([URL_MANAGE_RATEPROGRAMS]);
	}
	/**
	 * @method onManageTermsCOFButtonClick
	 * Redirect to manage terms cof module.
	 * @param {Object} _evt the button click event.
	 * @return {void}
	 */
	public onManageTermsCOFButtonClick(_evt) {
		doLog && console.log(LOG_TAG, 'onManageTermsCOFButtonClick');
		this._toaster.clear();
		this.isRendered = true;
		this._router.navigate(['/othc/manage-terms-cof']);
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
			width: versionsLength === 0 ? 390 : 299,
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
	 * @param {string} _grid receives grid name
	 * @return {void}
	 */
	public async onSaveChanges(dataItem, _grid?) {
		this.isRendered = true;
		doLog && console.log(LOG_TAG, 'onSaveChanges', dataItem, _grid);
		if (dataItem.isResidual) {
			const {
				name,
				terms: { term, value },
			} = dataItem || {};
			const inputToSave = {
				versionId: this.versionSelected.id,
				rateProgramId: this.rateProgramSelected.id,
				term,
				purchaseOption: name === GRID_FMV ? PURCHASE_OPTION_FMV : PURCHASE_OPTION_FPO,
				value,
			};
			try {
				const rateProgram = await this._dataManagerService.saveResidualsRateProgramInput(inputToSave, this.rateProgramSelected);
				const { residuals = [], versionDuplicate = false } = rateProgram || {};
				this.rateProgramSelected = null;
				this.rateProgramSelected = rateProgram;
				if (versionDuplicate) {
					this.residualFmvData = this.generateGridReadonlyData(residuals, GRID_FMV);
				}
			} catch (_error) {
				this._errorService.validateResponseError(_error);
			}
		} else {
			const {
				rate: { amountRangeMin, amountRangeMax },
				terms: { term, value },
			} = dataItem || {};
			const inputToSave = {
				versionId: this.versionSelected.id,
				rateProgramId: this.rateProgramSelected.id,
				term,
				amountRangeMin,
				amountRangeMax,
				value,
			};
			try {
				const rateProgram = await this._dataManagerService.saveRateProgramInput(inputToSave, this.rateProgramSelected);
				const { allInRates = [], versionDuplicate = false } = rateProgram || {};
				this.rateProgramSelected = null;
				this.rateProgramSelected = rateProgram;
				if (versionDuplicate) {
					this.spreadsData = await this.generateSpreadsGridData();
				}
				if (_grid === GRID_SPREADS) {
					this.allInRatesData = this.generateGridReadonlyData(allInRates, GRID_ALL_RATES);
				}
			} catch (_error) {
				this._errorService.validateResponseError(_error);
			}
		}
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
	private toggleSelectAllButton() {
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
	private async cleanCheked(_items, _state) {
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
						this._router.navigate(['/compare-versions']);
					} catch (error) {
						this.hideLoader();
					}
				}
				break;
			case 'deleteVersion':
				this.rateFactorsData = null;
				this.isRendered = false;
				await this._dataManagerService.deleteVersion(this.versionSelected.id);
				this.rateProgramsList = [];
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
	 * @private
	 * Generates the string label for the export file name
	 * @param {object} _time the current rate card selected
	 * @return {String}
	 */
	private getHourMinuteSecondString(_time?: any) {
		const timeObj = moment(_time).isValid() ? moment(_time) : moment();
		return timeObj.format('HHmmss');
	}
	/**
	 * @method replaceVersion
	 * Display dialog for replace version
	 * @param _versionInProgress
	 * @param _versionId
	 * @param _dataItem
	 */
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
	private publishVersion() {
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
	 * @param {Object} _currentVersion
	 *  the current version to delete from database.
	 * @return {void}
	 */
	private deleteVersion(_currentVersion, _deleteVersionActionsTemplateref) {
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
	 * @return {void}
	 */
	private async recalculateFactors() {
		doLog && console.log(LOG_TAG, 'recalculateFactors', this.filtersSelected);
		if (!this.versionSelected) {
			return;
		}

		if (this.filtersSelected.ratePrograms.length > 0) {
			const params = {};
			_.each(this.filtersSelected || {}, (value, key) => {
				if (value && key !== 'versionId') {
					_.extend(params, {
						[key]: value,
					});
				}
			});

			const data = {
				versionId: this.versionSelected.id || null,
				params,
			};

			const rateFactorsResponse = await this._dataManagerService.recalculateFactorsOthc(data);
			this.rateFactorsData = this.generateRateFactorsData(rateFactorsResponse);
			this.populateFilters();
			doLog && console.log(LOG_TAG, 'recalculateFactors - rateFactorsData', rateFactorsResponse);
		} else {
			this.rateFactorsData = [];
			this.isRendered = true;
			this.hideLoader();
		}
	}

	/**
	 * @method generateRateFactorsData
	 * Generates the grid data to display on rateFactors
	 * @param {Object} _data The rate factors data to display in grid.
	 * @return {void}
	 */
	private generateRateFactorsData(_data) {
		const { terms, rateFactors } = _data || {};
		if (!rateFactors || !terms) {
			return;
		}
		const locked: boolean = rateFactors.length > 0;
		const maxColumnsDisplay = this._appSettings.getColumnsSettings().maxTermsColumns;
		const termColumns = this.getColumnsTerms(terms, false, true);
		const columns = _.map(RF_COLUMNS || [], (column, key) => {
			const { title, width } = column || {};
			return {
				title,
				field: key,
				width,
				locked,
			};
		});

		_.each(termColumns || [], (column) => {
			columns.push(column);
		});

		const rows = _.map(rateFactors || [], (rateFactor) => {
			const row = {};
			_.each(RF_COLUMNS || [], (column, key) => {
				if (rateFactor[key] || rateFactor[key] >= 0) {
					_.extend(row, {
						[key]: rateFactor[key],
					});
				}
				if (column.title === RF_COLUMNS.amountFinanced.title) {
					_.extend(row, {
						[key]: `$${this._numberHelper.formatNumber(rateFactor.amountRangeMin)} - $${this._numberHelper.formatNumber(
							rateFactor.amountRangeMax
						)}`,
					});
				}
			});

			_.each(terms || [], (column, key) => {
				const { terms: termsList } = rateFactor;
				const keyName = `term${column}`;
				const rateFactorValue =
					this.filtersSelected.show === 'interest'
						? this._numberHelper.formatPercentage(termsList[column] || 0)
						: termsList[column];
				_.extend(row || {}, {
					[keyName]: rateFactorValue,
				});
			});

			return row;
		});
		return {
			rows,
			columns,
			isLocked: locked,
			isRateFactors: true,
		};
	}

	/**
	 * @method populateFilters
	 * filter options data
	 * @return {void}
	 */
	private populateFilters(): void {
		this.disableButton = this.disableFilterCompareButtons();
		this.isRendered = true;
		this.hideLoader();
	}
	/**
	 * @method resetAttributes
	 * @private
	 * Workaround, call it everytime an update occurs to force the grids to update
	 * @return {void}
	 */
	private resetAttributes() {
		return new Promise((resolve) => {
			this.versionSelected && (this.versionSelected.inputsGrouped = false);
			this.versionSelected = false;
			// this.residualsData = false;

			_.delay(() => {
				resolve();
			}, 100);
		});
	}

	/**
	 * @method loadRateCardSelected
	 * @private
	 * Updates the template's rateCardSelected and delete Vendor Code ID from variable filtersSelected
	 * @param {IRateCard} rateCardSelected new rateCardSelected to load
	 * @return {void}
	 */
	private loadRateCardSelected(rateCardSelected: IRateCard) {
		delete this.filtersSelected[VENDOR_CODE_ID];
		this.rateCardSelected = rateCardSelected;
		if (this.isRendered && !this.rateCardSelected && !this.hasVersions) {
			this.emptyStateMessage = this.getEmptyStateMessage();
		}
	}
	/**
	 * @method loadVersionSelected
	 * @private
	 * Updates the template's versionSelected
	 * @param {object} versionSelected new versionSelected to load
	 * @return {void}
	 */
	private async loadVersionSelected(versionSelected: any) {
		doLog && console.log(LOG_TAG, 'loadVersionSelected', versionSelected);
		this.tabSelected = localStorage.getItem(TAB_SELECTED) || 'inputs';
		this.versionSelected = null;
		this.rateFactorsData = null;
		this.isRendered = false;
		this.isLoaded = false;
		this.vendorCodesList = null;
		this.vendorCodesSelected = null;
		this.noVendors = false;
		this.filtersSelected.versionId = null;
		this.filtersSelected.ratePrograms = [];
		this.hasVersions = !!(this.rateCardSelected && this.rateCardSelected.versions.length);

		try {
			await this.resetAttributes();
			this.rateProgramsList = [];
			this.versionSelected = versionSelected;
			if (this.versionSelected) {
				const { ratePrograms = [], id = null, canPublish = false, isPublishing = false, cofs = [], vendorCodes = [] } =
					versionSelected || {};
				if (isPublishing) {
					this.isPublished = false;
					this.setLoaderMessage('Please wait. This version is being published.');
					await this._dataManagerService.waitForVersionPublishing(id);
					this.isPublished = true;
					this.setLoaderMessage('Loading...');
					return await this._dataManagerService.fetchRateCardSelected(this.rateCardSelected.id);
				}
				this.vendorCodesList = vendorCodes || [];
				if (!(this.vendorCodesList && Array.isArray(this.vendorCodesList) && this.vendorCodesList.length > 0)) {
					this.noVendors = true;
				} else {
					this.vendorCodesSelected = _.find(this.vendorCodesList, { id: localStorage.getItem(VENDOR_CODES_SELECTED) });
					this.vendorCodesList = _.map(this.vendorCodesList || [], (_vendorCode) => {
						return _.extend(_vendorCode, { isNotBase: _vendorCode.id !== 'base' });
					});
				}
				if (ratePrograms && ratePrograms.length > 0) {
					this.textSelectRateProgram = ALL_RATEPROGRAMS;
					this.displayDataOptions = _.map(DATA_DISPLAY_OPTIONS || [], (name, value) => {
						return {
							name,
							value,
							group: 'displayDataOptions',
							checked: name === DATA_DISPLAY_OPTIONS.rates,
						};
					});
					this.rateProgramsList = ratePrograms;
					this.filterRateProgram = _.map(ratePrograms || [], (rateProgram: IRateProgram) => {
						return {
							text: rateProgram.name,
							value: rateProgram.id,
							selected: true,
						};
					});

					this.filterRateProgram.unshift({
						text: ALL_RATEPROGRAMS,
						value: 0,
						selected: true,
					});

					this.filtersSelected.ratePrograms = _.map(ratePrograms || [], (rateProgram: IRateProgram) => {
						return rateProgram.id;
					});

					this.filterAllRateProgramsIsSelected = true;

					this.filterPurchaseOptions = _.chain(ratePrograms || [])
						.flatMapDepth((rateProgram) => rateProgram.purchaseOptions)
						.uniq()
						.flatMapDepth((purchaseOption) => {
							return _.filter(DEFAULTS_FILTERS_PURCHASE_OPTIONS, (option) => option.value === purchaseOption);
						})
						.value();

					let annually = 0;
					const paymentFrequencyData = _.chain(ratePrograms || [])
						.flatMapDepth((rateProgram) => rateProgram.paymentFrequencies)
						.uniq()
						.sort()
						.flatMapDepth((paymentFrequency) => {
							if (paymentFrequency === DEFAULT_ANNUALLY) {
								annually++;
							}
							return _.filter(DEFAULTS_FILTERS_PAYMENT_FREQUENCY, (option) => option.value === paymentFrequency);
						})
						.value();
					if (annually > 0) {
						const first = paymentFrequencyData[0];
						paymentFrequencyData.shift();
						paymentFrequencyData.push(first);
					}
					this.filterPaymentFrequency = paymentFrequencyData;
					const valuesAdvancedPayments = _.chain(ratePrograms || [])
						.map((rateProgram) => rateProgram.advancePayments)
						.uniq()
						.sort()
						.reverse()
						.first()
						.value();
					this.filterAdvancedPayments = [...Array(valuesAdvancedPayments + 1).keys()];
					const defaultPaymentFrequency = _.chain(paymentFrequencyData)
						.map((_item) => _item.value)
						.first()
						.value();

					this.purchaseOptionSelected = null;
					this.paymentSelected = this.filterAdvancedPayments[0] || 0;
					this.paymentFrequencySelected = this.filterPaymentFrequency[0] || 0;
					this.filtersSelected.points = 0;
					this.filtersSelected.purchaseOption = null;
					this.filtersSelected.paymentFrequency = defaultPaymentFrequency;
					this.filtersSelected.show = DEFAULT_SHOWS;
				}

				const rateProgramSelected = localStorage.getItem(RATE_PROGRAM_SELECTED) || '';
				this.rateProgramSelected =
					_.filter(this.rateProgramsList, (rateProrgram) => {
						return rateProrgram.id === rateProgramSelected;
					})[0] ||
					ratePrograms[0] ||
					{};

				if (this.tabSelected === 'inputs') {
					this.loadRateProgramData();

					this.isRendered = true;
					this.setLoaderMessage('Loading...');
					this.hideLoader();
					this.isLoaded = true;
				} else {
					this.filtersSelected.versionId = this.versionSelected.id;
					this.loadRateFactors();
				}
			} else {
				this.emptyStateMessage = this.getEmptyStateMessage();
			}
		} catch (_error) {
			this._errorService.validateResponseError(_error);
		}
	}

	/**
	 * @method generateGridReadonlyData
	 * Generate object with columns and rows from input data from COFS and Residuals
	 * @param {object[]} _data receives array with data
	 * @param {string} _title receives title from grid
	 * @return {IGridData}
	 */
	public generateGridReadonlyData(_data, _title: string): IGridData {
		const maxColumnWidth = this._appSettings.getColumnsSettings().staticColumnsWidth;
		const maxColumnsDisplay = this._appSettings.getColumnsSettings().maxTermsColumns;

		let locked = _data && _data.length >= maxColumnsDisplay;
		const row = { name: _title };
		let titleColumn = '   ';
		let rows = [];
		let columns = [];
		switch (_title) {
			case GRID_COFS:
				columns = this.getColumnsTerms(_data);
				this.getRowTerms(_data, row);
				locked = columns.length >= maxColumnsDisplay;
				rows.push(row);
				break;
			case GRID_ALL_RATES:
				const { rows: rowsData, terms } = this.generateAmountFinanced(_data);
				rows = rowsData;
				columns = this.getColumnsTerms(terms);
				titleColumn = AMOUNT_TITLE;
				locked = columns.length >= maxColumnsDisplay;
				break;
			case GRID_FMV:
				columns = this.getColumnsTerms(_data);
				this.getRowTerms(_data, row);
				locked = columns.length > 0;
				rows.push(row);
				break;
			case GRID_FPO:
				const fpo = _.find(_data || [], { purchaseOption: PURCHASE_OPTION_FPO });
				if (!fpo) {
					return;
				}
				const value = this._numberHelper.formatPercentage(fpo.value || 0);
				titleColumn = GRID_FPO;
				columns = [{ title: 'Term', field: 'term', type: 'numeric', locked: false, width: maxColumnWidth }];
				_.extend(row || {}, {
					term: value,
				});
				rows.push(row);
				locked = columns.length > 0;
				break;
		}
		columns = _.concat({ title: titleColumn, field: 'name', type: 'text', locked, width: maxColumnWidth }, columns);
		doLog && console.log(LOG_TAG, 'generateGridReadonlyData', columns, rows, locked);
		return {
			columns,
			rows,
			locked,
		};
	}

	/**
	 * @method getColumnsTerms
	 * Generate columns from data for grid data
	 * @private
	 * @param {object[]} _data receives data for columns
	 * @return {object[]}
	 */
	private getColumnsTerms(_data, _editable = false, _rateFactor = false): object[] {
		const maxColumnWidth = this._appSettings.getColumnsSettings().staticColumnsWidth;
		const maxColumnsDisplay = this._appSettings.getColumnsSettings().maxTermsColumns;
		const maxWidthSuggested = 3.35; // Max width suggested to display 5 columns initially
		const dataLength = _data && _data.length ? _data.length : 0;
		const locked = dataLength >= maxColumnsDisplay;

		const width = locked ? maxColumnWidth / maxWidthSuggested : maxColumnWidth / dataLength;

		if (_rateFactor) {
			return _.chain(_data)
				.map((_item) => {
					if (!_item) {
						return;
					}
					return {
						title: _item,
						field: `term${_item}`,
						type: 'numeric',
						locked: false,
						width,
					};
				})
				.filter((_item) => _item)
				.value();
		}

		return _.chain(_data)
			.map((_item) => {
				if (!_item.term) {
					return;
				}
				return {
					title: _item.term,
					field: `term${_item.term}`,
					type: 'numeric',
					locked: false,
					format: '##.00 \\%',
					width,
					editable: _editable,
				};
			})
			.filter((_item) => _item)
			.value();
	}

	/**
	 * @method getRowTerms
	 * Generate rows from data for grid data
	 * @private
	 * @param _data receives data for rows
	 * @param _row receives row from grid
	 * @return {void}
	 */
	private getRowTerms(_data, _row) {
		_.each(_data || [], (_term, _key) => {
			if (!_term.term) {
				return;
			}
			const keyName = `term${_term.term}`;
			_.extend(_row || {}, {
				[keyName]: this._numberHelper.formatPercentage(_term.value || 0),
			});
		});
	}

	/**
	 * @method generateAmountFinanced
	 * Generate amounts and terms to display amount financed data
	 * @param {object[]} _data receives amount financed data
	 * @return {object}
	 */
	private generateAmountFinanced(_data): { rows: object[]; terms: object[] } {
		doLog && console.log(LOG_TAG, 'generateAmountFinanced', _data);
		const terms = [];
		const mapRows = _.chain(_data || [])
			.map((item) => {
				const term = { term: item.term, value: item.value };
				if (
					!_.find(terms, (termData) => {
						return termData.term === item.term;
					})
				) {
					terms.push(term);
				}
				return {
					name: `$${this._numberHelper.formatNumber(item.amountRangeMin)} - $${this._numberHelper.formatNumber(
						item.amountRangeMax
					)}`,
					rate: {
						amountRangeMin: item.amountRangeMin,
						amountRangeMax: item.amountRangeMax,
					},
					[`term${item.term}`]: this._numberHelper.formatPercentage(item.value || 0),
				};
			})
			.groupBy('name')
			.value();

		const rows = _.map(mapRows || [], (item) => {
			const rowData = {};
			_.each(item || [], (data) => {
				_.merge(rowData, data);
			});
			return rowData;
		});
		return {
			rows,
			terms,
		};
	}

	/**
	 * @method versionCanBePublished
	 * @private
	 * Shows the toaster about a version in progress to be deleted or published
	 * @param {Object} _versionSelected new versionSelected to load
	 * @param {Object} _rateCardSelected new rate card selected to load
	 * @param {Object} _isRendered flag indicating the rendered state
	 */
	private versionCanBePublished(_versionSelected, _rateCardSelected, _isRendered) {
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
	 * @private
	 * Shows the toaster about a version in progress to be deleted or published
	 * @return {void}
	 */
	private loadPublishDeleteToaster() {
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
	 * @method loadPublishedToaster
	 * @private
	 * Shows the toaster about a published version
	 * @return {void}
	 */
	private loadPublishedToaster() {
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
	private hideLoader() {
		if (this.isRendered) {
			this._busyService$.hideLoading();
		}
	}

	/**
	 * @method showLoader
	 * Displays the `LoadingComponent` subscribing as true the observable value.
	 * @return {void}
	 */
	private showLoader() {
		this._busyService$.showLoading();
	}
	/**
	 * @method setLoaderMessage
	 * Set loading message
	 * @param {string} _message
	 */
	private setLoaderMessage(_message: string) {
		this._busyService$.setLoaderMessage(_message);
	}

	/**
	 * @method disableFilterCompareButtons
	 * Enable or Disable buttons to filter or compare data from version selected.
	 * @return {Boolean}
	 */
	public disableFilterCompareButtons() {
		// TODO: validate if the grid component has data
		return true;
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
	 * @method onSelectionChange
	 * Execute event based on type of selected dropdown changes.
	 * @param {Object} _evt The event change returns the ratecard selected or the version selected.
	 * @return {void}
	 */
	public async onRateProgramSelectChange(_rateProgramSelected) {
		doLog && console.log(LOG_TAG, 'onRateProgramSelectChange', _rateProgramSelected);
		this.isRendered = false;
		this.showLoader();
		localStorage.removeItem(RATE_PROGRAM_SELECTED);
		localStorage.setItem(RATE_PROGRAM_SELECTED, _rateProgramSelected.id);
		this.rateProgramSelected = _rateProgramSelected;
		await this._dataManagerService.fetchVersionSelected(this.versionSelected.id);
	}

	/**
	 * @method editRateProgram
	 * Redirects user to edit the rate program selected
	 * @param {Object} _evt The default event
	 * @return {void}
	 */
	public editRateProgram(_evt) {
		this._router.navigate(['othc', URL_EDIT_RATEPROGRAMS, this.rateProgramSelected.id]);
		const editingFromDashboardValue = 'yes';
		localStorage.setItem(EDITING_FROM_DASHBOARD, editingFromDashboardValue);
	}

	/**
	 * @method loadRateProgramData
	 * Loads all the rate programs data to the grids.
	 * @return {void}
	 */
	private loadRateProgramData() {
		doLog && console.log(LOG_TAG, 'loadRateProgramData', this.rateProgramSelected);
		if (!this.rateCardSelected || !this.rateProgramsList.length) {
			this.emptyStateMessage = this.getEmptyStateMessage();
			return;
		}
		const { allInRates, residuals = [], terms = [] } = this.rateProgramSelected || {};
		const { cofs = [] } = this.versionSelected || {};
		const cofsData = _.filter(cofs || [], (_cof) => _.includes(terms, _cof.term));
		this.cofsData = this.generateGridReadonlyData(cofsData, GRID_COFS);
		this.allInRatesData = this.generateGridReadonlyData(allInRates, GRID_ALL_RATES);
		this.residualFmvData = this.generateGridReadonlyData(residuals, GRID_FMV);
		this.residualFpoData = this.generateGridReadonlyData(residuals, GRID_FPO);
		this.spreadsData = this.generateSpreadsGridData();
		this.rateProgramSelectAll(true);
		this.hasResiduals = residuals.length > 0;
		if (this.tabSelected === 'inputs') {
			this.isRendered = true;
			this.emptyStateMessage = '';
			this.hideLoader();
		}
	}

	/**
	 * @method generateSpreadsGridData
	 * Creates the grid data to display in Spreads grid.
	 * @return {Object} {rows, columns}
	 */
	private generateSpreadsGridData() {
		const maxColumnWidth = this._appSettings.getColumnsSettings().staticColumnsWidth;
		const maxColumnsDisplay = this._appSettings.getColumnsSettings().maxTermsColumns;
		const { spreads } = this.rateProgramSelected || {};
		const { rows, terms } = this.generateAmountFinanced(spreads) || {};
		const columns = this.getColumnsTerms(terms, true) || [];
		const locked = terms.length >= maxColumnsDisplay || false;

		const firstColumn = {
			title: AMOUNT_TITLE,
			field: 'name',
			width: maxColumnWidth,
			format: null,
			filter: null,
			locked,
		};
		columns.unshift(firstColumn);
		return {
			rows,
			columns,
			locked,
		};
	}

	/**
	 * @method loadRateFactors
	 * Loads or recalculates the rate factors.
	 * @return {void}
	 */
	private loadRateFactors() {
		if (this.tabSelected === 'factors') {
			this.loadPublishDeleteToaster();
			return this.recalculateFactors();
		}
	}

	/**
	 * @method getEmptyStateMessage
	 * Returns the empty state message to display in template
	 * @return {string}
	 */
	private getEmptyStateMessage() {
		if (this.rateCardSelected && this.versionSelected && !this.rateProgramsList.length) {
			return `There are not Rate Programs created yet`;
		}
		return `There are not Rate Cards created yet`;
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

	/**
	 * @method filterBySelector
	 * is calling from dropdownlist to filter by a value selected
	 * @param _filter The value selected from dropdownlist
	 * @param _selector the filter dropdown where the event is coming
	 * @return {void}
	 */
	public filterBySelector(_filter: IFiltersRateFactors | any, _selector: string = null): void {
		doLog && console.log(LOG_TAG, 'filterBySelector', _filter, _selector);
		if (!_selector) {
			return;
		}
		switch (_selector) {
			case 'advancePayments':
				_.extend(this.filtersSelected || {}, {
					[_selector]: _filter,
				});
				break;
			case 'vendorCodeId':
				const { id = '' } = _filter || {};
				if (id === NO_POINTS) {
					delete this.filtersSelected[_selector];
					break;
				}
				_.extend(this.filtersSelected || {}, {
					[_selector]: id,
				});
				break;
			default:
				const { value } = _filter || {};
				_.extend(this.filtersSelected || {}, {
					[_selector]: value,
				});
				break;
		}
		this.filterRateFactors();
	}

	/**
	 * @method displayDataSwitcher
	 * Switch the data to display in rate factors grid based on user selection.
	 * @param {Object} _evt The native angular event received by the radio button emition.
	 * @return {void}
	 */
	public displayDataSwitcher(_evt) {
		doLog && console.log(LOG_TAG, 'displayDataSwitcher', _evt);
		const { value = DEFAULTS_FILTERS_OPTIONS.show } = _evt || {};
		this.filtersSelected.show = value;
		this.filterRateFactors();
	}

	/**
	 * @method filterRateFactors
	 * Recalculates the rateFactos based on filters selected.
	 * @return {void}
	 */
	private filterRateFactors(): void {
		this.isRendered = false;
		this.showLoader();
		this.recalculateFactors();
	}
}
