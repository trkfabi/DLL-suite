import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { AfsRoutingModule } from './routing/afs-routing.module';

import { DashboardModule, ManageProductsModule, ManageTermsModule } from '../components/';

import { KendoUIModules } from '@layout/ui-modules';
import { SharedModule } from '@shared/shared.module';

@NgModule({
	declarations: [],
	imports: [CommonModule, DashboardModule, ManageTermsModule, ManageProductsModule, SharedModule, AfsRoutingModule, KendoUIModules],
	exports: [DashboardModule],
})
export class AfsModule {}
