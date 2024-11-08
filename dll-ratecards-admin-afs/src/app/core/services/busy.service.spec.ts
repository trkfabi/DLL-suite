import { TestBed } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AppLayoutComponent, NavToolbarComponent, SidebarComponent } from '@layout/components';
import { KendoUIModules, MaterialModules, SiteLayoutComponent } from '@layout/index';
import { GridComponent, LoadingComponent, LoginComponent, TermsComponent } from '@shared/components';
import { ToasterModule } from 'angular2-toaster';
import { Subscription } from 'rxjs';
import { AuthService, BusyService, WebServices } from '.';
import { AuthGuardService } from '..';
import { APP_ROUTES } from '../../app-routing.module';
import { AppSettings } from '../app-settings';

describe('[core/services/BusyService]', () => {
	let busyService: BusyService;
	let busyStatus: boolean;
	let busySubscription: Subscription;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [KendoUIModules, MaterialModules, ReactiveFormsModule],
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
			providers: [AuthService, AuthGuardService, WebServices, BusyService, AppSettings],
		});
	});

	beforeEach(() => {
		busyService = new BusyService();
		busySubscription = busyService.busyState.subscribe((_state) => {
			busyStatus = _state.busy;
		});
	});

	describe('#showLoading()', () => {
		it('Validate if service is busy and show loading', () => {
			const expected = true;
			busyService.showLoading();
			const actual = busyStatus;
			expect(expected).toEqual(actual);
			expect(actual).toBeTruthy();
		});
	});

	describe('#hideLoading()', () => {
		it('Validate if service is not busy and hide loading', () => {
			const expected = false;
			busyService.hideLoading();
			const actual = busyStatus;
			expect(expected).toEqual(actual);
			expect(actual).toBeFalsy();
		});
	});

	afterEach(() => {
		busySubscription.unsubscribe();
	});
});
