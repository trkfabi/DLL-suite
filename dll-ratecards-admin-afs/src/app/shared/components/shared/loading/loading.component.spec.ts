import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BusyService } from '@core/index';

import { LoadingComponent } from './loading.component';

describe('LoadingComponent', () => {
	let component: LoadingComponent;
	let fixture: ComponentFixture<LoadingComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [LoadingComponent],
			providers: [BusyService],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(LoadingComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
