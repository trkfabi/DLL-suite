import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GridRatecardinputsReadonlyComponent } from './grid-ratecardinputs-readonly.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

describe('GridRatecardinputsReadonlyComponent', () => {
	let component: GridRatecardinputsReadonlyComponent;
	let fixture: ComponentFixture<GridRatecardinputsReadonlyComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [GridRatecardinputsReadonlyComponent],
			imports: [FormsModule, ReactiveFormsModule],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(GridRatecardinputsReadonlyComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
