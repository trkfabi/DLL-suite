import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppSettings } from '@core/index';
import { MaterialModules } from '@layout/ui-modules';
import { NavToolbarComponent } from '../shared';
import { SiteLayoutComponent } from './site-layout.component';

xdescribe('SiteLayoutComponent', () => {
	let component: SiteLayoutComponent;
	let fixture: ComponentFixture<SiteLayoutComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [SiteLayoutComponent, NavToolbarComponent],
			imports: [RouterTestingModule, MaterialModules],
			providers: [AppSettings],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(SiteLayoutComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
