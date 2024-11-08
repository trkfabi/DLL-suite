import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService, LoginGuardService } from '@core/guards';

import { TermsComponent } from '@shared/components';
import { LoginComponent } from '@shared/components/login';

import { AppLayoutComponent, SiteLayoutComponent } from '@layout/components';

/**
 * @property APP_ROUTES
 * Stores the `paths` to route the application.
 */
export const APP_ROUTES: Routes = [
	// App routes goes here and when the have only words "afs" or "othc" will redirect to own dashboard
	{
		path: '',
		component: AppLayoutComponent,
		children: [
			{
				path: '',
				redirectTo: 'afs/dashboard',
				pathMatch: 'full',
			},
			{
				path: 'afs',
				redirectTo: 'afs/dashboard',
				pathMatch: 'full',
			},
			{
				path: 'othc',
				redirectTo: 'othc/dashboard',
				pathMatch: 'full',
			},
			{
				path: 'afs',
				loadChildren: () => import('./afs/modules/afs.module').then((m) => m.AfsModule),
			},
			{
				path: 'othc',
				loadChildren: () => import('./othc/modules/othc.module').then((m) => m.OthcModule),
			},
		],
		canActivate: [AuthGuardService],
	},
	{
		path: 'login',
		component: LoginComponent,
		canActivate: [LoginGuardService],
	},
];

@NgModule({
	imports: [RouterModule.forRoot(APP_ROUTES)],
	exports: [RouterModule],
})
export class AppRoutingModule {}
