import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { AppSettings, GridFactory, ToastEventHandlerService, WebServices } from '@core/index';
import { KendoUIModules, MaterialModules } from '@layout/index';
import { NumberHelper } from '@lib/index';
import { GridRatefactorsCompareComponent } from './grid.ratefactors.compare.component';

xdescribe('GridRatefactorsCompareComponent', () => {
	let component: GridRatefactorsCompareComponent;
	let fixture: ComponentFixture<GridRatefactorsCompareComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [GridRatefactorsCompareComponent],
			imports: [KendoUIModules, MaterialModules, FormsModule, ReactiveFormsModule, RouterTestingModule, BrowserAnimationsModule],
			providers: [AppSettings, WebServices, GridFactory, ToastEventHandlerService, NumberHelper],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(GridRatefactorsCompareComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
