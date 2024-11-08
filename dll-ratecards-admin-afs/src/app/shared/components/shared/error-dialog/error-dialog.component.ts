import { Component, Input, OnInit } from '@angular/core';
import { LayoutService } from '@core/services/layout.service';

@Component({
	selector: 'app-error-dialog',
	templateUrl: './error-dialog.component.html',
	styleUrls: ['./error-dialog.component.scss'],
})
export class ErrorDialogComponent implements OnInit {
	@Input('message') public message;

	constructor(private _layoutService: LayoutService) {
		//
	}

	/**
	 * @property {Object[]} dialogRefComponentReference Receives the dialogRef object.
	 */
	@Input('dialogRefComponentReference') public dialogRefComponentReference;

	public ngOnInit() {
		//
	}

	public handleDialogSubmitButtonClick(_evt) {
		this._layoutService.modalIsOpen = false;
		this.dialogRefComponentReference.close();
		_evt.preventDefault();
		window.location.reload();
	}
}
