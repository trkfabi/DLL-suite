import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { ManageTermsComponent } from './manage-terms.component';

@NgModule({
	declarations: [ManageTermsComponent],
	imports: [CommonModule, SharedModule],
})
export class ManageTermsModule {}
