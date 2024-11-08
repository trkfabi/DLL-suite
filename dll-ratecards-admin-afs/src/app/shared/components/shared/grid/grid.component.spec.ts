import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { AppSettings, GridFactory, ToastEventHandlerService, WebServices } from '@core/index';
import { KendoUIModules, MaterialModules } from '@layout/index';
import { NumberHelper } from '@lib/index';
import { GridComponent } from './grid.component';

xdescribe('GridComponent', () => {
	let component: GridComponent;
	let fixture: ComponentFixture<GridComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [GridComponent],
			imports: [KendoUIModules, MaterialModules, FormsModule, ReactiveFormsModule, RouterTestingModule, BrowserAnimationsModule],
			providers: [AppSettings, WebServices, GridFactory, ToastEventHandlerService, NumberHelper],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(GridComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
