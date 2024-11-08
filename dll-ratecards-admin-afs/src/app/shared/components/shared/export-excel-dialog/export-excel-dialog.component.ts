import { Component, Input, OnInit } from '@angular/core';
import { RateCardsService } from '@core/services/ratecards.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import { log } from 'util';

@Component({
	selector: 'app-export-excel-dialog',
	templateUrl: './export-excel-dialog.component.html',
	styleUrls: ['./export-excel-dialog.component.scss'],
})
export class ExportExcelDialogComponent implements OnInit {
	/**
	 * @property {Object} item Ratecard item to export
	 */
	@Input('item') public item;

	/**
	 * @property {Object} vendorCodesList Object representation of the list of vendor codes
	 */
	@Input('vendorCodesList') public vendorCodesList;

	/**
	 * @property {Boolean} noVendors Status to display No-Vendors message and disable selector.
	 */
	public noVendors: boolean;

	/**
	 * @property {Object} defaultVendor default vendor to select
	 */
	public defaultVendor = {
		name: 'Base (No points added)',
		id: 'base',
	};

	/**
	 * @property {Object} selectedVendorCode object representation for the vendor code selected
	 */
	public selectedVendorCode;

	public ngOnInit() {
		if (this.item && this.item.ratecard && this.item.ratecard.versionInProgress) {
			const date = new Date(this.item.ratecard.lastUpdated);
			this.item.version = moment(date).format('MM/DD/YYYYY');
			this.item.status = 'In-Progress';
		}

		if (!(this.vendorCodesList && Array.isArray(this.vendorCodesList) && this.vendorCodesList.length > 0)) {
			this.noVendors = true;
		}
	}
}
