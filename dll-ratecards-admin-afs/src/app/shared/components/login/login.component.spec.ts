import { HttpBackend, HttpClient, HttpHandler } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { AppSettings, AuthService, BusyService, doLog, WebServices } from '@core/index';
import { ErrorService, LayoutService, ToastEventHandlerService, ToastService } from '@core/services';
import { KendoUIModules, MaterialModules } from '@layout/index';
import { DialogContainerService, DialogService } from '@progress/kendo-angular-dialog';
import { SetupUnitTests } from '@shared/utils/setup-test';
import { ToasterService } from 'angular2-toaster';
import { LoginComponent } from './login.component';

const setupUnitTests = new SetupUnitTests();

describe('LoginComponent', () => {
	let component: LoginComponent;
	let fixture: ComponentFixture<LoginComponent>;
	const _http: HttpClient = null;

	beforeEach(async(() => {
		setupUnitTests.loginUser();
		TestBed.configureTestingModule({
			declarations: [LoginComponent],
			imports: [FormsModule, ReactiveFormsModule, MaterialModules, RouterTestingModule, BrowserAnimationsModule],
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
				ToastService,
				ToasterService,
				ToastEventHandlerService,
				LayoutService,
				HttpBackend,
			],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(LoginComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	afterAll(() => setupUnitTests.logout());

	it('should create LoginComponent', () => {
		expect(component).toBeTruthy();
	});
});
