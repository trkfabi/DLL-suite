import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LayoutRoutingModule } from './routing/layout-routing.module';

import { KendoUIModules, MaterialModules } from '@layout/ui-modules';

import { AppLayoutComponent, NavToolbarComponent, SidebarComponent, SiteLayoutComponent } from '@layout/components';

import { SharedModule } from '@shared/shared.module';

@NgModule({
	declarations: [AppLayoutComponent, NavToolbarComponent, SidebarComponent, SiteLayoutComponent],
	exports: [
		AppLayoutComponent,
		NavToolbarComponent,
		SidebarComponent,
		SiteLayoutComponent,
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		KendoUIModules,
		MaterialModules,
		LayoutRoutingModule,
	],
	imports: [CommonModule, FormsModule, ReactiveFormsModule, KendoUIModules, MaterialModules, LayoutRoutingModule, SharedModule],
})
export class LayoutModule {}
