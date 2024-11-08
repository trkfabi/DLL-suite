import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportAuditLogDialogComponent } from './export-audit-log-dialog.component';

describe('ExportAuditLogDialogComponent', () => {
	let component: ExportAuditLogDialogComponent;
	let fixture: ComponentFixture<ExportAuditLogDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ExportAuditLogDialogComponent],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ExportAuditLogDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
