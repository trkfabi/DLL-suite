import { Component, Input } from '@angular/core';

@Component({
	selector: 'app-vendor-dialog',
	templateUrl: './done-vendor-dialog.component.html',
})
export class VendorDialogComponent {
	/**
	 * @property {String} message Receives the message to be shown in the modal.
	 */
	@Input('message') public message: string;

	constructor() {
		//
	}
}
