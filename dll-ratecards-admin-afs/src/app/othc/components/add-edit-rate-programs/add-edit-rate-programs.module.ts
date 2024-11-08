import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { KendoUIModules } from '@layout/index';
import { SharedModule } from '@shared/shared.module';

import { AddEditRateProgramsComponent } from './add-edit-rate-programs.component';

@NgModule({
	declarations: [AddEditRateProgramsComponent],
	imports: [CommonModule, KendoUIModules, SharedModule],
	exports: [AddEditRateProgramsComponent],
})
export class AddEditRateProgramsModule {}
