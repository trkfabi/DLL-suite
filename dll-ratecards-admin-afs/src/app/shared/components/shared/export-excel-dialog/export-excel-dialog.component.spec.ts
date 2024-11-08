import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportExcelDialogComponent } from './export-excel-dialog.component';

xdescribe('ExportExcelDialogComponent', () => {
	let component: ExportExcelDialogComponent;
	let fixture: ComponentFixture<ExportExcelDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ExportExcelDialogComponent],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ExportExcelDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
