import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RateProgramDialogComponent } from './rateprogram-dialog.component';

describe('RateProgramDialogComponent', () => {
	let component: RateProgramDialogComponent;
	let fixture: ComponentFixture<RateProgramDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [RateProgramDialogComponent],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(RateProgramDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
