import { Component, EventEmitter, Input } from '@angular/core';
import { DialogCloseResult, DialogRef, DialogService } from '@progress/kendo-angular-dialog';

@Component({
	selector: 'app-logout-dialog',
	templateUrl: 'logout-dialog.component.html',
})
export class LogoutDialogComponent {
	/**
	 * @property {Object[]} dialogRefComponentReference Receives the dialogRef object.
	 */
	@Input('dialogRefComponentReference') public dialogRefComponentReference;

	/**
	 * @property {Object[]} logoutButtonClick Receives the logout button click object.
	 */
	@Input('logoutButtonClick') public logoutButtonClick;

	/**
	 * @method handleDialogSubmitButtonClick
	 * Handle the Dialog Submit Button Click and Emit event to the parent component.
	 * @param _evt The click event to emit to logout.
	 * @return {void}
	 */
	public handleDialogSubmitButtonClick(_evt) {
		this.logoutButtonClick.emit(_evt);
		this.dialogRefComponentReference.close();
	}

	/**
	 * @method handleDialogCloseButtonClick
	 * Handle the Dialog Cancel Button Click and close dialog window.
	 * @param _evt The click event to close dialog.
	 * @return {void}
	 */
	public handleDialogCloseButtonClick() {
		this.dialogRefComponentReference.close();
	}
}
