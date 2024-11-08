import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionsRadioComponent } from './options-radio.component';

describe('OptionsRadioComponent', () => {
	let component: OptionsRadioComponent;
	let fixture: ComponentFixture<OptionsRadioComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [OptionsRadioComponent],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(OptionsRadioComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
