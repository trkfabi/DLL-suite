import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { KendoUIModules } from '@layout/index';
import { NumberHelper } from '@lib/index';
import { TermsDialogComponent } from './terms-dialog.component';

xdescribe('TermsDialogComponent', () => {
	let component: TermsDialogComponent;
	let fixture: ComponentFixture<TermsDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [TermsDialogComponent],
			imports: [FormsModule, ReactiveFormsModule, KendoUIModules],
			providers: [NumberHelper],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(TermsDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
