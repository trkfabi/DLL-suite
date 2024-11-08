import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RatefactorsCompareDialogComponent } from './ratefactors-compare-dialog.component';

xdescribe('RatefactorsCompareDialogComponent', () => {
	let component: RatefactorsCompareDialogComponent;
	let fixture: ComponentFixture<RatefactorsCompareDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [RatefactorsCompareDialogComponent],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(RatefactorsCompareDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
