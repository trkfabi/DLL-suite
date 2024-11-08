import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { KendoUIModules } from '@layout/index';
import { SharedModule } from '@progress/kendo-angular-dialog';
import { ManageProductsComponent } from './manage-products.component';

@NgModule({
	declarations: [ManageProductsComponent],
	imports: [CommonModule, SharedModule, KendoUIModules],
})
export class ManageProductsModule {}
