import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { AddEditRateProgramsModule, DashboardModule, ManageRateProgramsModule, ManageTermsCofModule } from '@othc/components/index';

import { SharedModule } from '@shared/shared.module';

import { OthcRoutingModule } from './routing/othc-routing.module';

import { KendoUIModules } from '@layout/ui-modules';

@NgModule({
	declarations: [],
	imports: [
		CommonModule,
		DashboardModule,
		SharedModule,
		OthcRoutingModule,
		ManageTermsCofModule,
		ManageRateProgramsModule,
		KendoUIModules,
		AddEditRateProgramsModule,
	],
	exports: [DashboardModule],
})
export class OthcModule {}
