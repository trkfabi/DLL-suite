import { NgModule } from '@angular/core';

// Share Angular Material Modules
import { MatButtonModule, MatFormFieldModule, MatInputModule, MatSidenavModule, MatToolbarModule } from '@angular/material';

@NgModule({
	imports: [MatToolbarModule, MatSidenavModule, MatInputModule, MatButtonModule, MatFormFieldModule],
	exports: [MatToolbarModule, MatSidenavModule, MatInputModule, MatButtonModule, MatFormFieldModule],
})
export class MaterialModules {}
