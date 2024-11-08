import { NgModule } from '@angular/core';

// Share Kendo-UI Modules
import { DateInputsModule } from '@progress/kendo-angular-dateinputs';
import { DialogModule } from '@progress/kendo-angular-dialog';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';
import { GridModule } from '@progress/kendo-angular-grid';
import { NumericTextBoxModule, SwitchModule } from '@progress/kendo-angular-inputs';
import { TabStripModule } from '@progress/kendo-angular-layout';
import { PopupModule } from '@progress/kendo-angular-popup';
import { SortableModule } from '@progress/kendo-angular-sortable';

@NgModule({
	imports: [
		TabStripModule,
		GridModule,
		DialogModule,
		SortableModule,
		DropDownsModule,
		SwitchModule,
		NumericTextBoxModule,
		DateInputsModule,
		PopupModule,
	],
	exports: [
		TabStripModule,
		GridModule,
		DialogModule,
		SortableModule,
		DropDownsModule,
		SwitchModule,
		NumericTextBoxModule,
		DateInputsModule,
		PopupModule,
	],
})
export class KendoUIModules {}
