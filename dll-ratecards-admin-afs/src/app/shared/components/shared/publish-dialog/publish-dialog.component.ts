import { Component, Input, OnInit } from '@angular/core';

@Component({
	selector: 'app-publish-dialog',
	templateUrl: './publish-dialog.component.html',
	styleUrls: ['./publish-dialog.component.scss'],
})
export class PublishDialogComponent implements OnInit {
	/**
	 * @property {Object} item Stores the RateCard data and Environment to display on dialog.
	 */
	@Input('item') public item: any;

	public ngOnInit() {
		//
	}
}
