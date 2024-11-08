import { HttpBackend, HttpClient, HttpHandler } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppSettings, doLog } from '@core/index';
import { AuthService, BusyService, ErrorService, LayoutService, ToastEventHandlerService, ToastService, WebServices } from '@core/services';
import { DataManagerService } from '@core/services/data-manager.service';
import { RateCardsService } from '@core/services/rate-cards.service';
import { RateCardsWebService } from '@core/services/ratecards.webservice';
import { KendoUIModules, MaterialModules } from '@layout/index';
import { NumberHelper } from '@lib/index';
import { DialogContainerService, DialogService } from '@progress/kendo-angular-dialog';
import { SetupUnitTests } from '@shared/utils';
import { ToasterService } from 'angular2-toaster';
import { ManageRateProgramsComponent } from './manage-rate-programs.component';

const setupUnitTests = new SetupUnitTests();

describe('ManageRateProgramsComponent', () => {
	let component: ManageRateProgramsComponent;
	let fixture: ComponentFixture<ManageRateProgramsComponent>;

	beforeEach(async(() => {
		setupUnitTests.loginUser();
		TestBed.configureTestingModule({
			declarations: [ManageRateProgramsComponent],
			imports: [KendoUIModules, RouterTestingModule],
			providers: [
				AppSettings,
				AuthService,
				BusyService,
				WebServices,
				HttpClient,
				HttpHandler,
				DialogService,
				DialogContainerService,
				ErrorService,
				ToasterService,
				ToastService,
				ToastEventHandlerService,
				RateCardsWebService,
				DataManagerService,
				RateCardsService,
				LayoutService,
				NumberHelper,
				HttpBackend,
			],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ManageRateProgramsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	afterAll(() => setupUnitTests.logout());

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
