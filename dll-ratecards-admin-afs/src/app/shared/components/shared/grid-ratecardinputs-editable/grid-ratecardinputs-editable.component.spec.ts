import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GridRatecardinputsEditableComponent } from './grid-ratecardinputs-editable.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NumberHelper } from '@lib/helpers';

describe('GridRatecardinputsEditableComponent', () => {
	let component: GridRatecardinputsEditableComponent;
	let fixture: ComponentFixture<GridRatecardinputsEditableComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [GridRatecardinputsEditableComponent],
			imports: [FormsModule, ReactiveFormsModule],
			providers: [NumberHelper],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(GridRatecardinputsEditableComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('#parseValues', () => {
		it('should exist function parseValues and parse percentage', () => {
			const dataItem = {
				name: '1500 -  5000',
				term18: 0.02,
			};
			const currentIndex = 'term18';
			const expected = '2.00%';
			const result = component.parseValues(dataItem, currentIndex);
			const actual = result[currentIndex];
			expect(expected).toEqual(actual);
		});
	});

	describe('#isValidEntry', () => {
		it('should validate entry is a valid input', () => {
			const previousValue = 0;
			const entry = 0.02;
			const result = component.isValidEntry(entry, previousValue);
			expect(result).toBeTrue();
		});
		it('should validate entry is not a valid input', () => {
			const previousValue = 0;
			const entry = 0;
			const result = component.isValidEntry(entry, previousValue);
			expect(result).toBeFalse();
		});
	});

	describe('#isMinMaxAllowed', () => {
		it('should validate entry is a valid input in the range allowed', () => {
			const dataItem = {
				name: '1500 -  5000',
				rate: {
					amountRangeMax: 5000,
					amountRangeMin: 1500,
				},
				term18: 0.01,
				terms: { term: '18', value: 0.01 },
			};
			const currentIndex = 'term18';
			const result = component.isMinMaxAllowed(dataItem, currentIndex);
			expect(result).toBeTrue();
		});
		it('should validate entry is not a valid input', () => {
			const dataItem = {
				name: '1500 -  5000',
				rate: {
					amountRangeMax: 5000,
					amountRangeMin: 1500,
				},
				term18: 0.01,
				terms: { term: '18', value: 0.01 },
			};
			const currentIndex = '18';
			const result = component.isMinMaxAllowed(dataItem, currentIndex);

			expect(result).toBeFalse();
		});
	});

	describe('#isEditable', () => {
		it('should validate if cell is not editable', () => {
			const cellData = {
				dataItem: {
					isEditable: false,
				},
				column: {
					field: 'name',
				},
			};
			const result = component.isEditable(cellData);
			expect(result).toBeFalse();
		});
		it('should validate if cell is editable', () => {
			const cellData = {
				dataItem: {
					isEditable: false,
				},
				column: {
					field: 'term18',
				},
			};
			const result = component.isEditable(cellData);
			expect(result).toBeTrue();
		});
	});
});
