import { Component, Input } from '@angular/core';

@Component({
	selector: 'app-manage-rate-program-dialog',
	templateUrl: './manage-rate-program-dialog.component.html',
})
export class ManageRateProgramDialogComponent {
	/**
	 * @property {String} message Receives the message to be shown in the modal.
	 */
	@Input('message') public message: string;
}
