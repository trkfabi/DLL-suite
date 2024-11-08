import { Component, Input } from '@angular/core';

@Component({
	selector: 'app-delete-version-dialog',
	templateUrl: './delete-version-dialog.component.html',
	styleUrls: ['./delete-version-dialog.component.scss'],
})
export class DeleteVersionDialogComponent {
	@Input('currentVersion') public currentVersion: any;
}
