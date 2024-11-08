import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedRoutingModule } from './modules/routing/shared-routing.module';

import { SharingModule } from './modules/sharing.module';

import { SettingsComponent } from './components/settings/settings.component';

@NgModule({
	imports: [CommonModule, SharedRoutingModule, SharingModule],
	exports: [SharingModule],
	declarations: [SettingsComponent],
})
export class SharedModule {}
