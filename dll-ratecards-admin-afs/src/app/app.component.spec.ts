import { HttpClient, HttpHandler } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { AppSettings } from '@core/index';
import { AuthService, BusyService, ErrorService, LayoutService, ToastEventHandlerService, ToastService, WebServices } from '@core/services';
import { DialogContainerService, DialogService } from '@progress/kendo-angular-dialog';
import { SetupUnitTests, ToastServiceMock } from '@shared/utils';
import { ToasterService } from 'angular2-toaster';
import { AppComponent } from './app.component';

const setupUnitTests = new SetupUnitTests();

describe('AppComponent', () => {
	let app: AppComponent;
	let fixture: ComponentFixture<AppComponent>;
	let authService: AuthService;

	beforeEach(async(() => {
		setupUnitTests.loginUser();
		TestBed.configureTestingModule({
			imports: [RouterTestingModule, FormsModule],
			declarations: [AppComponent],
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
				{ provide: ToastService, useFactory: () => ToastServiceMock.instance() },
				ToasterService,
				ToastEventHandlerService,
				LayoutService,
			],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(AppComponent);
		app = fixture.componentInstance;
		authService = TestBed.inject(AuthService);
	});

	afterAll(() => setupUnitTests.logout());

	it('should create the app', () => {
		expect(app).toBeTruthy();
	});

	describe('#initializeTitle', () => {
		it('should exist function initializeTitle', () => {
			const func = spyOn(app, 'initializeTitle');
			app.initializeTitle();

			expect(func).toHaveBeenCalled();
		});
	});

	describe('#isSessionActive', () => {
		it('should exist function isSessionActive', () => {
			const func = spyOn(app, 'isSessionActive');
			app.isSessionActive();

			expect(func).toHaveBeenCalled();
		});

		it('should function isSessionActive call function isSessionActive in variable _auth', () => {
			const spySession = spyOn(authService, 'isSessionActive').and.returnValue(true);
			app.isSessionActive();

			expect(spySession).toHaveBeenCalled();
		});
	});

	describe('#checkSession', () => {
		it('should exist function checkSession', () => {
			const func = spyOn(app, 'checkSession');
			app.checkSession();

			expect(func).toHaveBeenCalled();
		});

		it('should function checkSession call function refreshToken in variable _auth', () => {
			const spytoken = spyOn(authService, 'refreshToken').and.returnValue(Promise.resolve());
			app.checkSession();

			expect(spytoken).toHaveBeenCalled();
		});
	});
});
