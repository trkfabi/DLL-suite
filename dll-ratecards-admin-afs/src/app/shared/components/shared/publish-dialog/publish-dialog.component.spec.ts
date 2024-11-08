import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PublishDialogComponent } from './publish-dialog.component';

xdescribe('PublishDialogComponent', () => {
	let component: PublishDialogComponent;
	let fixture: ComponentFixture<PublishDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [PublishDialogComponent],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(PublishDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
