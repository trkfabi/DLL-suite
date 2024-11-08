import { DashboardComponent, ManageProductsComponent, ManageTermsComponent } from '@afs/components';
import { CompareVersionsComponent } from '@afs/components/compare-versions/compare-versions.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserPermissionGuard } from '@core/guards/user-permission.guard';
import { USER_PERMISSION } from '@core/index';
import { SettingsComponent } from '@shared/components';

const routes: Routes = [
	{
		path: 'dashboard',
		component: DashboardComponent,
		children: [
			{
				path: '',
				redirectTo: 'afs/dashboard',
				pathMatch: 'full',
			},
		],
		data: { permission: USER_PERMISSION.AFSRCM },
		canActivate: [UserPermissionGuard],
	},
	{
		path: 'manage-terms',
		data: { permission: USER_PERMISSION.AFSRCM },
		component: ManageTermsComponent,
		canActivate: [UserPermissionGuard],
	},
	{
		path: 'manage-products',
		data: { permission: USER_PERMISSION.AFSRCM },
		component: ManageProductsComponent,
		canActivate: [UserPermissionGuard],
	},
	{
		path: 'manage-rate-cards-vendor',
		data: { permission: USER_PERMISSION.AFSRCM },
		component: SettingsComponent,
		canActivate: [UserPermissionGuard],
	},
	{
		path: 'compare-versions',
		data: { permission: USER_PERMISSION.AFSRCM },
		component: CompareVersionsComponent,
		canActivate: [UserPermissionGuard],
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class AfsRoutingModule {}
