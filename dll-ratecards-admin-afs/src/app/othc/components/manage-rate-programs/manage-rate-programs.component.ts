import { AfterContentInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DEFAULT_PERMISSION } from '@core/index';
import { AuthService, BusyService, DataManagerService, LayoutService } from '@core/services';
import { IRateProgram } from '@shared/interfaces/rate-program.interface';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { ManageRateProgramDialogComponent, RateProgramDialogComponent } from '@shared/components';

import { doLog } from '@core/app-settings';

import { IDialogActionType } from '@shared/interfaces';

import { DialogCloseResult, DialogRef, DialogService } from '@progress/kendo-angular-dialog';

const LOG_TAG = '[othc/components/manage-rate-programs]';
const DASHBOARD_PROGRAMS_PATH = '/othc/dashboard';
const ALREADY_EXIST_MESSAGE = 'already exists';
const DUPLICATE_TITLE = 'Duplicate Rate Program';
const ERROR_TITLE = 'Error Rate Program';

@Component({
	selector: 'app-manage-rate-programs',
	templateUrl: './manage-rate-programs.component.html',
	styleUrls: ['./manage-rate-programs.component.scss'],
})
export class ManageRateProgramsComponent implements OnInit, OnDestroy, AfterContentInit {
	/**
	 * @property {Object} versionSelected Stores the current version data.
	 */
	public versionSelected;
	/**
	 * @property {Boolean} isDisabled flag is is disabled
	 */
	public isDisabled: boolean;

	/**
	 * @property {string} permission Receive user permission
	 */
	public userPermission: string;

	/**
	 * @property {string} validPath Receive Url with user permission
	 */
	public validPath: string;

	/**
	 * @property {Object} versionSelectedSubscription
	 * @private
	 */
	private versionSelectedSubscription: Subscription;

	/**
	 * @property {ElementRef} sortable Receives viewchild for kendo sorrtable element
	 */
	@ViewChild('sortable') public sortable: any;
	/**
	 * @property {Object[]} ratePrograms rate program data for list
	 */
	public ratePrograms: IRateProgram[] = [];
	/**
	 * @property {String} buttonAction Stores the action text to display in the dialog's submit button.
	 */
	public buttonAction: string;

	/**
	 * @property {Object} dialogRefComponent stores the instance reference from the dialog component generated by the `DialogService`
	 * @private
	 */
	private dialogRefComponent;

	/**
	 * @property {Object} dialogRef stores the reference to the dialog generated by the `DialogService`
	 */
	public dialogRef: DialogRef;
	/**
	 * @property {Boolean} edited flag is is edit
	 */
	private edited: boolean = false;

	/**
	 * @property {ElementRef} dialogActionsErrorDisplay Receives viewchild for ng-template
	 */
	@ViewChild('dialogActionsErrorDisplay') public dialogActionsErrorDisplay: any;

	constructor(
		private _auth: AuthService,
		private _busyService$: BusyService,
		private _dataManagerService: DataManagerService,
		private _dialogService: DialogService,
		private _router: Router,
		private _layoutService: LayoutService
	) {
		this.userPermission = this._auth.getUserPermissions() || DEFAULT_PERMISSION;
		this.validPath = `/${this.userPermission}/dashboard`;
	}

	/**
	 * @method ngOnInit
	 * Respond when initialize app
	 * @return {void}
	 */
	public ngOnInit() {
		this.showLoader();
		this._layoutService.setNavControlsReadOnly(true);
	}

	/* @method ngOnDestroy
	 * Respond when destroy component
	 * @return {void}
	 */
	public ngOnDestroy() {
		this.versionSelectedSubscription.unsubscribe();
	}

	/**
	 * @method ngAfterContentInit
	 * Respond after Angular projects external content into the component's view / the view that a directive is in.
	 * @return {void}
	 */
	public ngAfterContentInit() {
		this.versionSelectedSubscription = this._dataManagerService.versionSelected$.subscribe((versionSelected) => {
			if (versionSelected && !this.versionSelected) {
				this.versionSelected = versionSelected;
				this.loadRatePrograms(versionSelected.id);
			}
		});
	}

	/**
	 * @method hideLoader
	 * Hides the `LoadingComponent` subscribing as true the observable value.
	 * @return {void}
	 */
	public hideLoader() {
		this._busyService$.hideLoading();
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
	 * @method onBackButtonClick
	 * Return to dashboard when click link
	 * @return {void}
	 */
	public onBackButtonClick() {
		this._router.navigate([this.validPath]);
	}

	/**
	 * @method emptyRateCards
	 * Validate if is empty rateCards data
	 * @return {boolean}
	 */
	public validateEmptyRateCards(): boolean {
		return this.ratePrograms && this.ratePrograms.length === 0;
	}

	/**
	 * @method onDragOver
	 * Drag over element selected in list
	 * @param event
	 * @return {void}
	 */
	public onDragOver(event: any): void {
		event.preventDefault();
		this.edited = true;
		this.sortable.moveItem(event.oldIndex, event.index);
	}
	/**
	 * @method onAddNewRateProgram
	 * This functionti
	 * @return {void}
	 */
	public onAddNewRateProgram(): void {
		this._router.navigate(['/othc/add-rate-programs']);
	}
	/**
	 * @method createRateProgram
	 * Function create a new rate program and call list rate programs
	 * @param {object} _rateProgram Receives rate program data
	 * @return {void}
	 */
	public async createRateProgram(_rateProgram: IRateProgram) {
		try {
			this.edited = true;
			const response = await this._dataManagerService.createNewRateProgram(_rateProgram);
			if (response) {
				await this.loadRatePrograms(this.versionSelected.id);
			}
		} catch (_error) {
			this.hideLoader();
			throw Error(`createRateProgram ${_error}`);
		}
	}
	/**
	 * @method loadRatePrograms
	 * Load rate cards and insert into veriable ratePrograms
	 * @param {string} _versionId Receives version ID
	 * @return {void}
	 */
	public loadRatePrograms(_versionId: string) {
		this._dataManagerService
			.fetchRatePrograms(_versionId)
			.then((_data) => {
				this.ratePrograms = _data;
				this.isDisabled = false;
				this.hideLoader();
			})
			.catch((_error) => {
				this.hideLoader();
				throw Error(_error);
			});
	}
	/**
	 * @method duplicateRateProgramClick
	 * Handles the duplicate the Rate Programs click.
	 * @param _event Receives the click event is required to send it as param to catch the other params.
	 * @param _rateProgram Receives the Rate Program data to duplicate and sends the
	 * request.
	 * @return {void}
	 */
	public duplicateRateProgramClick(_event, _rateProgram) {
		doLog && console.log(LOG_TAG, 'duplicateRateProgramClick', JSON.stringify(_rateProgram));
		if (!_rateProgram) {
			return;
		}
		this.duplicateRateProgram(_rateProgram);
	}

	/**
	 * @method editRateProgramClick
	 * Handles the request to edit Rate Program.
	 * @param _event The native angular event, needed to bypass the next params
	 * @param _rateProgram The Rate Program data to edit.
	 * @return {void}
	 */
	public editRateProgramClick(_event, _rateProgram) {
		const { id: rateProgramId } = _rateProgram || '';
		if (!rateProgramId) {
			return;
		}
		this._router.navigate(['othc/edit-rate-programs', rateProgramId]);
	}

	/**
	 * @method deleteRateProgramClick
	 * Handles the duplicate the Rate Programs click.
	 * @param _event Receives the click event is required to send it as param to catch the other params.
	 * @param _rateProgram Receives the Rate Program data to duplicate and sends the
	 * request.
	 * @param _dialogActions Receives the dialog actions to handle the dialog submission
	 * @return {void}
	 */
	public deleteRateProgramClick(_event, _rateProgram, _dialogActions) {
		doLog && console.log(LOG_TAG, 'deleteRateProgramClick', _rateProgram);
		if (!_rateProgram) {
			return;
		}
		this.buttonAction = 'Delete';
		const dialogData = {
			title: 'Delete Rate Program',
			content: RateProgramDialogComponent,
			actions: _dialogActions,
			height: 208.5,
		};
		const rateCard = {
			id: null,
			name: null,
		};

		const actionType: IDialogActionType = {
			action: 'delete',
			type: 'rateprogram',
		};
		this.openRateProgramDialog(dialogData, _rateProgram, actionType);
	}

	/**
	 * @method handleDialogSubmitButtonClick
	 * Handle the dialog submit button click
	 * @param _event The native click event to handle the button action.
	 * @return {void}
	 */
	public async handleDialogSubmitButtonClick(_event) {
		doLog && console.log(LOG_TAG, 'handleDialogSubmitButtonClick', _event);
		const { actionType, item } = this.dialogRefComponent || {};
		if (!actionType) {
			return;
		}
		if (actionType.action === 'delete') {
			this.dialogRef.close();
			await this.deleteRateProgram(item);
		}
	}

	/**
	 * @method handleDialogCloseButtonClick
	 * Handle the dialog close button click
	 * @param _event The native click event to handle the button action.
	 * @return {void}
	 */
	public handleDialogCloseButtonClick(_event) {
		this.dialogRef.close();
	}

	/**
	 * @method duplicateRateProgram
	 * Sends the request to duplicate the rate program and
	 * updates the rate program list.
	 * @param _rateProgram The rateProgram to duplicate
	 * @return {void}
	 */
	private async duplicateRateProgram(_rateProgram) {
		try {
			this.edited = true;
			this.showLoader();
			const response = await this._dataManagerService.duplicateRateProgram(_rateProgram);
			if (response) {
				if (response && !response.id) {
					return this.validateErrorDisplay(response);
				}
				const { id = '' } = this._dataManagerService.versionSelected || {};
				this.loadRatePrograms(id);
				this.ratePrograms = [...this.ratePrograms, response];
				const { id: versionId = '' } = this._dataManagerService.versionSelected || {};
				await this._dataManagerService.fetchVersionSelected(versionId);
			}
			this.hideLoader();
		} catch (_error) {
			throw Error(`duplicateRateProgram ${_error}`);
		}
	}

	/**
	 * @method deleteRateProgram
	 * Sends the request to delete the rate program from the database
	 * @param {IRateProgram} _rateProgram Receives the rateprogram to delete.
	 * @return {void}
	 */
	private async deleteRateProgram(_rateProgram: IRateProgram) {
		try {
			this.edited = true;
			this.showLoader();
			const response = await this._dataManagerService.deleteRateProgram(_rateProgram);
			if (response) {
				const { result: rateProgramDeleted } = response || {};
				if (!rateProgramDeleted.id) {
					const { ratePrograms: rateProgramsArray = [] } = this._dataManagerService.versionSelected || {};
					this.ratePrograms = rateProgramsArray;
					this.hideLoader();
					return;
				}
				this.ratePrograms = _.filter(this.ratePrograms || [], (_rate) => _rate.id !== rateProgramDeleted.id);
			}
			this.hideLoader();
		} catch (_error) {
			throw Error(`duplicateRatProgram ${_error}`);
		}
	}

	/**
	 * @method openRateCardsDialog
	 * Opens Rate Program Dialog to Manage its data
	 * @private
	 * @param _dialogData The dialog data to create the dialog window
	 * @param _rateProgram The rateProgram data to process.
	 * @param _actionType {String} The action type to execute with the rateCard.
	 * @return {void}
	 */
	private openRateProgramDialog(_dialogData, _rateProgram, _actionType) {
		this.dialogRef = this._dialogService.open(_dialogData);
		this.dialogRefComponent = this.dialogRef.content.instance;
		this.dialogRefComponent.item = _rateProgram;
		this.dialogRefComponent.ratePrograms = this.ratePrograms;
		this.dialogRefComponent.actionType = _actionType;
	}

	/**
	 * @method reorderRateProgram
	 * Save the new order from rate programs in API call
	 * @return {void}
	 */
	public async reorderRateProgram() {
		try {
			this.edited = true;
			this.isDisabled = true;
			this.showLoader();
			if (this.ratePrograms.length > 0) {
				const response = await this._dataManagerService.reorderRatePrograms(this.ratePrograms);
				if (!response) {
					const { ratePrograms: rateProgramsArray = [] } = this._dataManagerService.versionSelected || {};
					this.ratePrograms = rateProgramsArray;
				}
			}
			this.isDisabled = false;
			this.hideLoader();
		} catch (_error) {
			this.hideLoader();
			throw Error(`reorderRateProgram ${_error}`);
		}
	}
	/**
	 * @method onDoneButtonClick
	 *
	 * @param {object} _event Receives click event from button done
	 */
	public async onDoneButtonClick(_event, _templateActions) {
		if (this.edited) {
			await this.reorderRateProgram();
			this.openReminderDialog('Reminder', _templateActions, 195);
			return;
		}
		this.goBackToDashboard();
	}
	/**
	 * @method handleDialogReminderClick
	 * Handle the `DialogReminder` click to close dialog and then return to dashboard.
	 * @param {Object} _evt the `DialogReminder` click event.
	 * @return {void}
	 */
	public handleDialogReminderClick(_evt) {
		this.dialogRef.close();
		this.goBackToDashboard();
	}

	/**
	 * @method goBackToDashboard
	 * Return to dashboard module.
	 * @return {void}
	 */
	public async goBackToDashboard() {
		_.defer(async () => {
			const { id = null } = this._dataManagerService.versionSelected || {};
			await this._dataManagerService.fetchVersionSelected(id);
			this._router.navigate([DASHBOARD_PROGRAMS_PATH]);
		});
	}
	/**
	 * @method openReminderDialog
	 * Method that opens the Reminder dialog to user prior to leaving the settings view.
	 * @param {String} _tittle tittle text for the dialog.
	 * @param {TemplateRef} _templateActions dialogActions for the template that should be displayed.
	 * @param {Number} _height the height of the dialog pop up
	 * @return {void}
	 */
	private openReminderDialog(_tittle, _templateActions, _height = 195) {
		this.dialogRef = this._dialogService.open({
			title: _tittle,
			content: ManageRateProgramDialogComponent,
			actions: _templateActions,
			height: _height,
		});

		this.dialogRefComponent = this.dialogRef.content.instance;
		this.dialogRefComponent.message = 'Remember to publish any changes you made on this screen.';
	}
	/**
	 * @method handleDialogErrorOkClick
	 * Reload page for refresh rate program list an
	 * @return {void}
	 */
	public handleDialogErrorOkClick() {
		window.location.reload();
	}

	/**
	 * @method validateErrorDisplay
	 * Validate error message to display if already exist rate program or other error and diplay dialog with error message
	 * @param {string} _message receive error message
	 * @return {void}
	 */
	private validateErrorDisplay(_message: string) {
		let title = null;
		let height = 130;
		if (_message.indexOf(ALREADY_EXIST_MESSAGE) > -1) {
			title = DUPLICATE_TITLE;
			height = 195;
		}
		return this.openErrorDialog(this.dialogActionsErrorDisplay, _message, height, title);
	}

	/**
	 * @method openErrorDialog
	 * Method that opens dialog with error message
	 * @param {TemplateRef} _templateActions dialogActions for the template that should be displayed.
	 * @param {String} _message receives error message
	 * @param {Number} _height the height of the dialog pop up
	 * @param {title} _title title for dialog
	 * @return {void}
	 */
	private openErrorDialog(_templateActions, _message, _height, _title?) {
		const title = _title ? _title : ERROR_TITLE;
		this.dialogRef = this._dialogService.open({
			title,
			content: ManageRateProgramDialogComponent,
			actions: _templateActions,
			height: _height,
		});

		this.dialogRefComponent = this.dialogRef.content.instance;
		this.dialogRefComponent.message = _message;
	}
}