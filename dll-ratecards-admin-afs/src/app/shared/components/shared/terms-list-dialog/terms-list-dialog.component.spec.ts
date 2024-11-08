import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TermsListDialogComponent } from './terms-list-dialog.component';

describe('TermsListDialogComponent', () => {
	let component: TermsListDialogComponent;
	let fixture: ComponentFixture<TermsListDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [TermsListDialogComponent],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(TermsListDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
