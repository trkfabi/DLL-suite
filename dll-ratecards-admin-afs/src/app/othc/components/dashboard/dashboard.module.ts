import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { KendoUIModules } from '@layout/index';
import { SharedModule } from '@shared/shared.module';
import { DashboardComponent } from './dashboard.component';

@NgModule({
	declarations: [DashboardComponent],
	imports: [CommonModule, SharedModule, KendoUIModules],
})
export class DashboardModule {}
