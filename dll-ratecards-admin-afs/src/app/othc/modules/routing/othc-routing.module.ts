import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserPermissionGuard } from '@core/guards/user-permission.guard';
import { USER_PERMISSION } from '@core/index';
import {
	AddEditRateProgramsComponent,
	DashboardComponent,
	ManageRateProgramsComponent,
	ManageTermsCofComponent,
} from '@othc/components/index';
import { SettingsComponent } from '@shared/components';

const routes: Routes = [
	{
		path: 'dashboard',
		component: DashboardComponent,
		children: [
			{
				path: '',
				redirectTo: 'othc/dashboard',
				pathMatch: 'full',
			},
		],

		data: { permission: USER_PERMISSION.OTHCRCM },
		canActivate: [UserPermissionGuard],
	},
	{
		path: 'manage-rate-cards-vendor',
		data: { permission: USER_PERMISSION.OTHCRCM },
		component: SettingsComponent,
		canActivate: [UserPermissionGuard],
	},
	{
		path: 'manage-terms-cof',
		data: { permission: USER_PERMISSION.OTHCRCM },
		component: ManageTermsCofComponent,
		canActivate: [UserPermissionGuard],
	},
	{
		path: 'manage-rate-programs',
		data: { permission: USER_PERMISSION.OTHCRCM },
		component: ManageRateProgramsComponent,
		canActivate: [UserPermissionGuard],
	},
	{
		path: 'add-rate-programs',
		data: { permission: USER_PERMISSION.OTHCRCM },
		component: AddEditRateProgramsComponent,
		canActivate: [UserPermissionGuard],
	},
	{
		path: 'edit-rate-programs/:id',
		data: { permission: USER_PERMISSION.OTHCRCM },
		component: AddEditRateProgramsComponent,
		canActivate: [UserPermissionGuard],
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class OthcRoutingModule {}
