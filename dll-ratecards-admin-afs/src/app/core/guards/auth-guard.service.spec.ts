import { HttpClient, HttpHandler } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { AppLayoutComponent, NavToolbarComponent, SidebarComponent } from '@layout/components';
import { KendoUIModules, MaterialModules, SiteLayoutComponent } from '@layout/index';
import { GridComponent, LoadingComponent, LoginComponent, TermsComponent } from '@shared/components';
import { SetupUnitTests } from '@shared/utils';
import { ToasterModule, ToasterService } from 'angular2-toaster';
import { combineLatest } from 'rxjs';
import { AppSettings, AuthGuardService } from '..';
import { APP_ROUTES } from '../../app-routing.module';
import { AuthService, BusyService, ErrorService, LayoutService, ToastEventHandlerService, ToastService, WebServices } from '../services';

const setupUnitTests = new SetupUnitTests();

describe('[core/guards/AuthGuardService]', () => {
	let authService: AuthService;
	let authGuardService: AuthGuardService;
	let webServices: WebServices;

	beforeEach(() => {
		setupUnitTests.loginUser();
		TestBed.configureTestingModule({
			imports: [KendoUIModules, MaterialModules, ReactiveFormsModule, RouterTestingModule.withRoutes(APP_ROUTES), ToasterModule],
			declarations: [
				AppLayoutComponent,
				GridComponent,
				LoadingComponent,
				LoginComponent,
				NavToolbarComponent,
				SidebarComponent,
				SiteLayoutComponent,
				TermsComponent,
			],
			providers: [
				AuthService,
				AuthGuardService,
				WebServices,
				BusyService,
				AppSettings,
				HttpClient,
				HttpHandler,
				ErrorService,
				ToastService,
				ToastService,
				ToastEventHandlerService,
				ToasterService,
				LayoutService,
			],
		});
	});

	beforeEach(() => {
		webServices = TestBed.inject(WebServices);
		authService = TestBed.inject(AuthService);
		authGuardService = new AuthGuardService(authService);
	});

	afterAll(() => setupUnitTests.logout());

	describe('#canActivate()', () => {
		it('should exist function canActivate', () => {
			const func = spyOn(authGuardService, 'canActivate');
			authGuardService.canActivate();

			expect(func).toHaveBeenCalled();
		});

		it('Validate if session can activate module', () => {
			const expected = authGuardService.canActivate();

			expect(expected).toBeTruthy();
		});

		it('should function canActivate call function isSessionActive', () => {
			const spySession = spyOn(authService, 'isSessionActive');
			authGuardService.canActivate();

			expect(spySession).toHaveBeenCalled();
		});
	});
});
