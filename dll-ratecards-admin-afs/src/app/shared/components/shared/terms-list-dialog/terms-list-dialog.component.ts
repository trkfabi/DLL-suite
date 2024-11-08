import { Component, Input, OnInit } from '@angular/core';

import { ICheckboxItem } from '@shared/interfaces';

import * as _ from 'lodash';
import { Subject } from 'rxjs';

@Component({
	selector: 'app-terms-list-dialog',
	templateUrl: './terms-list-dialog.component.html',
	styleUrls: ['./terms-list-dialog.component.scss'],
})
export class TermsListDialogComponent implements OnInit {
	/**
	 * @property {ICheckboxItem[]} termsList Stores the terms list received from the parent component to display in the dialog.
	 */
	@Input('termsList') public termsList: ICheckboxItem[];

	/**
	 * @property {Subject<boolean>} disableButtonSubject Stores the subject to disable the button based on length of items list.
	 */
	private disableButtonSubject = new Subject<boolean>();

	/**
	 * @property {Observable} disableButtonObservable Stores the observable to disable the button based on length of items list.
	 */
	public disableButtonObservable = this.disableButtonSubject.asObservable();

	public ngOnInit() {
		this.checkItemsChecked();
	}

	/**
	 * @method checkBoxClick
	 * Updates the termsList value based on the terms checked from the checkbox list component
	 * @param {ICheckboxItem[]} _terms Receives the terms list updated with the new checked values.
	 * @return {void}
	 */
	public checkBoxClick(_terms: ICheckboxItem[]) {
		this.termsList = _terms;
		this.checkItemsChecked();
	}

	/**
	 * @method checkItemsChecked
	 * Updats the disable button statement based on length on list changes.
	 * @return {void}
	 */
	private checkItemsChecked() {
		const termsSelected = _.filter(this.termsList || [], { checked: true });
		const disableButton = termsSelected.length === 0;
		this.disableButtonSubject.next(disableButton);
	}
}
