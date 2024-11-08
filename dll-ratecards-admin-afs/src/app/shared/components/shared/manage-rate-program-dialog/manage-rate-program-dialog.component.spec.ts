import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageRateProgramDialogComponent } from './manage-rate-program-dialog.component';

describe('ManageRateProgramDialogComponent', () => {
	let component: ManageRateProgramDialogComponent;
	let fixture: ComponentFixture<ManageRateProgramDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ManageRateProgramDialogComponent],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ManageRateProgramDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
