import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { AppSettings, AuthGuardService, AuthService, BusyService, ToastEventHandlerService, ToastService, WebServices } from '@core/index';
import { KendoUIModules, MaterialModules, SiteLayoutComponent } from '@layout/index';
import { GridComponent, LoadingComponent, LoginComponent, TermsComponent } from '@shared/components';
import { ToasterModule, ToasterService } from 'angular2-toaster';
import { APP_ROUTES } from '../../../app-routing.module';
import { NavToolbarComponent, SidebarComponent } from '../shared';
import { AppLayoutComponent } from './app-layout.component';

xdescribe('AppLayoutComponent', () => {
	let component: AppLayoutComponent;
	let fixture: ComponentFixture<AppLayoutComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [RouterTestingModule.withRoutes(APP_ROUTES), KendoUIModules, MaterialModules, ReactiveFormsModule, ToasterModule],
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
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(AppLayoutComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
