import { Component, Input, OnInit } from '@angular/core';

import { IDialogActionType } from '@shared/interfaces';

@Component({
	selector: 'app-rateprogram-dialog',
	templateUrl: './rateprogram-dialog.component.html',
	styleUrls: ['./rateprogram-dialog.component.scss'],
})
export class RateProgramDialogComponent implements OnInit {
	@Input('ratePrograms') public ratePrograms: any[];
	@Input('item') public item: any;
	@Input('actionType') public actionType: IDialogActionType;

	/**
	 * @property {String} rateProgramName='' stores the rateProgramName value
	 */
	public rateProgramName: string = '';

	/**
	 * @property {Boolean} isDeleting is a flag that indicate if action is deleting
	 */
	public isDeleting: boolean;

	public ngOnInit(): void {
		if (this.item && this.item.name) {
			this.rateProgramName = this.item.name;
			this.isDeleting = this.actionType.action === 'delete' || false;
		}
	}
}
