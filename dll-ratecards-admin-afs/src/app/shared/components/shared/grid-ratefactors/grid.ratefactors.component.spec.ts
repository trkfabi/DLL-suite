import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { AppSettings, GridFactory, ToastEventHandlerService, WebServices } from '@core/index';
import { KendoUIModules, MaterialModules } from '@layout/index';
import { NumberHelper } from '@lib/index';
import { GridComponent } from '@shared/components';
import { GridRatefactorsComponent } from './grid.ratefactors.component';

xdescribe('GridRatefactorsComponent', () => {
	let component: GridRatefactorsComponent;
	let fixture: ComponentFixture<GridRatefactorsComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [GridComponent],
			imports: [KendoUIModules, MaterialModules, FormsModule, ReactiveFormsModule, RouterTestingModule, BrowserAnimationsModule],
			providers: [AppSettings, WebServices, GridFactory, ToastEventHandlerService, NumberHelper],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(GridRatefactorsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
