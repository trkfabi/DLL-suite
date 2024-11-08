import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { KendoUIModules } from '@layout/index';
import { ManageRateProgramsComponent } from './manage-rate-programs.component';

import { SharedModule } from '@shared/shared.module';

@NgModule({
	declarations: [ManageRateProgramsComponent],
	imports: [CommonModule, KendoUIModules, SharedModule],
})
export class ManageRateProgramsModule {}
