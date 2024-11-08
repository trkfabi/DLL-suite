import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { GridComponent, LoadingComponent, LoginComponent, TermsComponent } from '@shared/components';
import { ToasterContainerComponent, ToasterModule, ToasterService } from 'angular2-toaster';
import { AuthService, BusyService, ToastEventHandlerService, ToastService, WebServices } from '.';
import { AuthGuardService } from '..';
import { APP_ROUTES } from '../../app-routing.module';

import { AppLayoutComponent, NavToolbarComponent, SidebarComponent } from '@layout/components';
import { KendoUIModules, MaterialModules, SiteLayoutComponent } from '@layout/index';
import { AppSettings } from '../app-settings';

xdescribe('[core/services/ToastService]', () => {
	let toasterService: ToastService;
	let toasterContainer: ToasterContainerComponent;
	let toastService: ToasterService;
	let toastEventHandlerService: ToastEventHandlerService;
	let fixture;

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
			],
		});
		fixture = TestBed.createComponent(AppLayoutComponent);
		toasterContainer = fixture.debugElement.children[0].componentInstance;
		return fixture;
	});

	beforeEach(() => {
		toastService = TestBed.inject(ToasterService);
		toastEventHandlerService = TestBed.inject(ToastEventHandlerService);
		toasterService = new ToastService(toastService, toastEventHandlerService);
	});

	describe('#pop()', () => {
		it('Should pop toast synchronously', () => {
			const input = {
				type: 'info',
				event: 'pop',
				message: 'Hello World! This is message sample',
				hasButtons: true,
				hasIcon: true,
				saveButtonText: 'Publish',
				cancelButtonText: 'Dismiss',
			};
			toasterContainer.ngOnInit();
			toasterService.pop(input);
			expect(toasterContainer.toasts.length).toBe(1);
		});
	});

	describe('#clear()', () => {
		it('Should clear toast synchronously', () => {
			const input = {
				type: 'info',
				event: 'pop',
				message: 'Hello World! This is message sample',
				hasButtons: true,
				hasIcon: true,
				saveButtonText: 'Publish',
				cancelButtonText: 'Dismiss',
			};
			toasterContainer.ngOnInit();

			toasterService.pop(input);
			expect(toasterContainer.toasts.length).toBe(1);

			toasterService.clear();
			expect(toasterContainer.toasts.length).toBe(0);
		});
	});
});
