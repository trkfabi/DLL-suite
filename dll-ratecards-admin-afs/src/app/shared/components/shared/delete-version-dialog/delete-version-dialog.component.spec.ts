import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteVersionDialogComponent } from './delete-version-dialog.component';

describe('DeleteVersionDialogComponent', () => {
	let component: DeleteVersionDialogComponent;
	let fixture: ComponentFixture<DeleteVersionDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [DeleteVersionDialogComponent],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(DeleteVersionDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
