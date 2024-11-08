import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { KendoUIModules } from '@layout/index';
import { SharedModule } from '@shared/shared.module';
import { ManageTermsCofComponent } from './manage-terms-cof.component';

@NgModule({
	declarations: [ManageTermsCofComponent],
	imports: [CommonModule, SharedModule, KendoUIModules],
})
export class ManageTermsCofModule {}
