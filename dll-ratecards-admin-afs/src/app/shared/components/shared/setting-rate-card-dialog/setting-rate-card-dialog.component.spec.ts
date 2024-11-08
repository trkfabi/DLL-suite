import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { KendoUIModules } from '@layout/index';
import { SettingRateCardDialogComponent } from './setting-rate-card-dialog.component';

describe('SettingRateCardDialogComponent', () => {
	let component: SettingRateCardDialogComponent;
	let fixture: ComponentFixture<SettingRateCardDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [SettingRateCardDialogComponent],
			imports: [KendoUIModules, FormsModule],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(SettingRateCardDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('#onRateCardNameChange()', () => {
		it('should be defined function onRateCardNameChange', () => {
			const func = spyOn<any>(component, 'onRateCardNameChange');
			component.onRateCardNameChange(null);
			expect(func).toHaveBeenCalled();
		});

		it('should be defined function onRateCardNameChange and test name pattern', () => {
			const RATE_CARD_NAME_PATTERN = RegExp('^[a-zA-Z0-9]+(s+[a-zA-Z0-9]+)*$');
			const newRateCardName = 'TestRateCardName';
			const result = RATE_CARD_NAME_PATTERN.test(newRateCardName);
			expect(result).toBeTrue();
		});

		it('should be defined function onRateCardNameChange and value is empty', () => {
			const newRateCardName = '';
			const result = !!(newRateCardName.trim().length === 0);
			expect(result).toBeTrue();
		});
	});
});
