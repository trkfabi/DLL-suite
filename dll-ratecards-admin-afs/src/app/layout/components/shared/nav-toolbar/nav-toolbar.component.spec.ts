import { HttpClient, HttpHandler } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { MaterialModules } from '@layout/ui-modules';

import { NavToolbarComponent } from './nav-toolbar.component';

import {
	AuthService,
	BusyService,
	DataManagerService,
	ErrorService,
	LayoutService,
	RateCardsService,
	RateCardsWebService,
	ToastEventHandlerService,
	ToastService,
	WebServices,
} from '@core/services/index';

import { AppSettings } from '@core/index';

import { NumberHelper } from '@lib/helpers/index';

import { DialogContainerService, DialogService } from '@progress/kendo-angular-dialog';
import { ToasterService } from 'angular2-toaster';

xdescribe('NavToolbarComponent', () => {
	let component: NavToolbarComponent;
	let fixture: ComponentFixture<NavToolbarComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [NavToolbarComponent],
			imports: [RouterTestingModule, MaterialModules],
			providers: [
				AppSettings,
				AuthService,
				BusyService,
				DataManagerService,
				ErrorService,
				LayoutService,
				DialogService,
				DialogContainerService,
				RateCardsService,
				RateCardsWebService,
				HttpClient,
				HttpHandler,
				NumberHelper,
				WebServices,
				ToastService,
				ToastEventHandlerService,
				ToasterService,
			],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(NavToolbarComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('#isVersionPublished()', () => {
		it('should exist function isVersionPublished and function be called', () => {
			const func = spyOn<any>(component, 'isVersionPublished');
			const value = '1';
			component.isVersionPublished(value);
			expect(func).toHaveBeenCalled();
		});

		it('should exist function isVersionPublished and return false', () => {
			const versionId = '1';
			const result = component.isVersionPublished(versionId);
			expect(result).toBeFalse();
		});
	});

	describe('#isVersionInProgress()', () => {
		it('should exist function isVersionInProgress and function be called', () => {
			const func = spyOn<any>(component, 'isVersionInProgress');
			const value = '1';
			component.isVersionInProgress(value);
			expect(func).toHaveBeenCalled();
		});

		it('should exist function isVersionInProgress and return false', () => {
			const versionId = '1';
			const result = component.isVersionInProgress(versionId);
			expect(result).toBeFalse();
		});
	});
});
