import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { Location } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { AppLayoutComponent, NavToolbarComponent, SidebarComponent, SiteLayoutComponent } from '@layout/components';
import { KendoUIModules, MaterialModules } from '@layout/ui-modules';

import { DashboardComponent } from '@afs/components';

import { GridComponent, LoadingComponent, LoginComponent, TermsComponent } from '@shared/components';
import { ToasterModule } from 'angular2-toaster';
import * as _ from 'lodash';
import { AuthService, BusyService, WebServices } from '.';
import { AuthGuardService } from '..';
import { APP_ROUTES } from '../../app-routing.module';
import { AppSettings } from '../app-settings';
import { ErrorService } from './error.service';

xdescribe('[core/services/AuthService]', () => {
	let router: Router;
	let webServices: WebServices;
	let settings: AppSettings;
	let location: Location;
	let authService: AuthService;
	let errorServ: ErrorService;

	const USER_CREDENTIALS = {
		username: 'tester1@propelics.com',
		password: 'propelicstest1',
	};

	let errorMessage;

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
			providers: [AuthService, AuthGuardService, WebServices, BusyService, AppSettings, ErrorService],
		});
	});

	beforeEach(() => {
		router = TestBed.inject(Router);
		webServices = TestBed.inject(WebServices);
		settings = TestBed.inject(AppSettings);
		location = TestBed.inject(Location);
		errorServ = TestBed.inject(ErrorService);
		authService = new AuthService(router, webServices, settings, location, errorServ);
		authService.errorMessage.subscribe((_error) => {
			errorMessage = _error;
		});
	});

	describe('#authenticate()', () => {
		it('Should authenticate the user and redirect to/dashboard', fakeAsync(() => {
			const input = USER_CREDENTIALS;
			authService.authenticate(input);
			tick(100);
			// Validate only the username as the object USER_CREDENTIALS, and USER returned from getUser are different in structure.
			const expected = 'tester1@propelics.com';
			const actual = authService.user().username;
			router.navigate(['/dashboard']);
			tick(100);
			expect(location.path()).toBe('/dashboard');
			expect(expected).toEqual(actual);
		}));

		it('Should return error message if user is not valid', () => {
			fakeAsync(() => {
				const expected = 'Invalid credentials';
				const input = {
					username: 'tester2@propelics.com',
					password: '1234567890',
				};
				authService.authenticate(input);
				tick(100);
				const actual = errorMessage;
				tick(100);
				expect(expected).toEqual(actual);
			});
		});
	});

	describe('#isSessionActive()', () => {
		it('Should validate session status', () => {
			const actual = authService.isSessionActive();
			expect(actual).toBeTruthy();
		});
	});

	describe('#getUser()', () => {
		it('Should validate user data be same as input', fakeAsync(() => {
			const input = USER_CREDENTIALS;
			const expected = 'tester1@propelics.com';
			authService.authenticate(input);
			tick(100);
			// Validate only the username as the object USER_CREDENTIALS, and USER returned from getUser are different in structure.
			const actual = authService.user().username;
			expect(expected).toEqual(actual);
			expect(actual).toEqual(input.username);
		}));

		it('Should return null or false if user is not logged in', fakeAsync(() => {
			authService.logout();
			const expected = null;
			let actual;
			actual = authService.user();
			expect(expected).toEqual(actual);
			actual = authService.isSessionActive();
			expect(actual).toBeFalsy();
		}));
	});

	describe('#logout()', () => {
		it('Should logout the user', fakeAsync(() => {
			const input = USER_CREDENTIALS;
			authService.authenticate(input);
			tick(100);
			authService.logout();
			tick(100);
			const expected = null;
			const actual = authService.user();
			expect(expected).toEqual(actual);
		}));
	});

	describe('#getUserPermissions()', () => {
		it('should exist function getUserPermissions', () => {
			const func = spyOn<any>(authService, 'getUserPermissions');
			authService.getUserPermissions();
			expect(func).toHaveBeenCalled();
		});
		it('should function validatePermissions return value "othc" when input value "AFSRCM_DEV"', () => {
			const value = 'AFSRCM_DEV';
			const result = authService.getUserPermissions(value);
			expect(result).toEqual('afs');
		});

		it('should function validatePermissions return value "othc" when input value "OTHCRCM_DEV"', () => {
			const value = 'OTHCRCM_DEV';
			const result = authService.getUserPermissions(value);
			expect(result).toEqual('othc');
		});

		it('should function validatePermissions return value "othc" when input value "OTHCRCMADMIN_DEV"', () => {
			const value = 'OTHCRCMADMIN_DEV';
			const result = authService.getUserPermissions(value);
			expect(result).toEqual('othc');
		});
	});
});
