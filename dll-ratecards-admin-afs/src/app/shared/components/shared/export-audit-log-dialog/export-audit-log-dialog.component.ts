import { Component, Input, OnInit } from '@angular/core';
import { RateCardsService } from '@core/services/ratecards.service';

import * as _ from 'lodash';
import * as moment from 'moment';
import { log } from 'util';

@Component({
	selector: 'app-export-audit-log-dialog',
	templateUrl: './export-audit-log-dialog.component.html',
	styleUrls: ['./export-audit-log-dialog.component.scss'],
})
export class ExportAuditLogDialogComponent implements OnInit {
	public ngOnInit() {}
}
