import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { DialogService } from '@progress/kendo-angular-dialog';
import { GridComponent, LoadingComponent, LoginComponent, TermsComponent } from '@shared/components';
import { ToasterContainerComponent, ToasterModule, ToasterService } from 'angular2-toaster';
import { AuthService, BusyService, ToastEventHandlerService, ToastService, WebServices } from '.';
import { AuthGuardService } from '..';
import { APP_ROUTES } from '../../app-routing.module';

import { AppLayoutComponent, NavToolbarComponent, SidebarComponent } from '@layout/components';
import { KendoUIModules, MaterialModules, SiteLayoutComponent } from '@layout/index';
import { AppSettings } from '../app-settings';
import { ErrorService } from './error.service';
import { LayoutService } from './layout.service';

xdescribe('[core/services/WebServices]', () => {
	let busyService: BusyService;
	let webServices: WebServices;
	let dialogService: DialogService;
	let errorService: ErrorService;
	let layoutService: LayoutService;
	let appSettings: AppSettings;
	const _http: HttpClient = null;
	const _router: Router = null;

	const USER_CREDENTIALS = {
		username: 'tester1@propelics.com',
		password: 'propelicstest1',
	};

	beforeEach(() => {
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
				ToasterService,
				ToastService,
				ToastEventHandlerService,
				DialogService,
				ErrorService,
				LayoutService,
			],
		});
	});

	beforeEach(() => {
		busyService = TestBed.inject(BusyService);
		appSettings = TestBed.inject(AppSettings);
		dialogService = TestBed.inject(DialogService);
		errorService = TestBed.inject(ErrorService);
		layoutService = TestBed.inject(LayoutService);
		webServices = new WebServices(busyService, _http, _router, dialogService, errorService, layoutService, appSettings);
	});

	describe('#authenticate()', () => {
		it('Should athenticate correctly with a valid user', () => {
			const input = USER_CREDENTIALS;
			webServices.authenticate(input.username, input.password).then((_results: any) => {
				const actual = _results.username;
				// Validate only the username as the object USER_CREDENTIALS, and USER returned from _results are different in structure.
				const expected = 'tester1@propelics.com';
				expect(expected).toEqual(actual);
			});
		});

		it('Should return error with an invalid user', () => {
			const input = {
				username: 'tester2@propelics.com',
				password: 12345,
			};
			webServices
				.authenticate(input.username, input.password)
				.then((_results: any) => {
					// Nothing ToDO
				})
				.catch((_err) => {
					const expected = 'Invalid credentials';
					const actual = _err.message;
					expect(expected).toEqual(actual);
				});
		});
	});
});
