import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { ToasterModule } from 'angular2-toaster';

// Core Modules
import { HttpClient, HttpClientModule } from '@angular/common/http';
// Routes
import { GRID_COLLECTIONS } from '@core/collections';
import { LoginGuardService } from '@core/guards';
import {
	AppSettings,
	AuthGuardService,
	AuthService,
	BusyService,
	GridFactory,
	LayoutService,
	ToastEventHandlerService,
	ToastService,
	WebServices,
} from '@core/index';

// Services
import { AppConfigService } from '@core/services/app.config.service';
import { DataManagerService } from '@core/services/data-manager.service';
import { ErrorService } from '@core/services/error.service';
import { RateCardsService } from '@core/services/rate-cards.service';
import { RateCardsWebService } from '@core/services/ratecards.webservice';
// Helpers
import { NumberHelper } from '@lib/index';

// Components
// import {
// 	GridComponent,
// 	GridRatefactorsCompareComponent,
// 	GridRatefactorsComponent,
// 	LoadingComponent,
// 	LoginComponent,
// } from '@shared/components';
// Components - Dialogs

import { CompareVersionsComponent } from '@afs/components/compare-versions/compare-versions.component';

import { DeleteVersionDialogComponent } from '@shared/components/shared/delete-version-dialog/delete-version-dialog.component';
// import { VendorDialogComponent } from '@shared/components/shared/done-vendor-dialog/done-vendor-dialog.component';
import { ErrorDialogComponent } from '@shared/components/shared/error-dialog/error-dialog.component';
import { ExportAuditLogDialogComponent } from '@shared/components/shared/export-audit-log-dialog/export-audit-log-dialog.component';
import { ExportExcelDialogComponent } from '@shared/components/shared/export-excel-dialog/export-excel-dialog.component';
import { ImportRatecardDialogComponent } from '@shared/components/shared/import-ratecard-dialog/import-ratecard-dialog.component';
import { LogoutDialogComponent } from '@shared/components/shared/logout-dialog/logout-dialog.component';
// import { ProductDialogComponent } from '@shared/components/shared/product-dialog/product-dialog.component';
import { PublishDialogComponent } from '@shared/components/shared/publish-dialog/publish-dialog.component';
import { RatefactorsCompareDialogComponent } from '@shared/components/shared/ratefactors-compare-dialog/ratefactors-compare-dialog.component';
// import { SettingRateCardDialogComponent } from '@shared/components/shared/setting-rate-card-dialog/setting-rate-card-dialog.component';
// import { SettingVendorCodesDialogComponent } from '@shared/components/shared/setting-vendor-codes-dialog/setting-vendor-codes-dialog.component';
import { TermsDialogComponent } from '@shared/components/shared/terms-dialog/terms-dialog.component';
//
import { SharedModule } from '@shared/shared.module';

// Layout Components
import { LayoutModule } from '@layout/layout.module';

// Application Modules Refactor
import { AfsModule } from '@afs/modules/afs.module';

import { OthcModule } from '@othc/modules/othc.module';

/**
 * @method initConfig
 * Load an init configutation for URLs from user login
 * @param {AppConfigService} appConfig
 */
export function initConfig(appConfig: AppConfigService) {
	return () => appConfig.loadApiModulePath();
}
@NgModule({
	declarations: [
		AppComponent,
		ExportAuditLogDialogComponent,
		LogoutDialogComponent,
		ImportRatecardDialogComponent,
		ErrorDialogComponent,
		TermsDialogComponent,
		RatefactorsCompareDialogComponent,
		PublishDialogComponent,
		ExportExcelDialogComponent,
		CompareVersionsComponent,
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		SharedModule,
		LayoutModule,
		FormsModule,
		ToasterModule.forRoot(),
		HttpClientModule,
		ReactiveFormsModule,
		BrowserAnimationsModule,
		AfsModule,
		OthcModule,
	],
	entryComponents: [
		ExportAuditLogDialogComponent,
		LogoutDialogComponent,
		ImportRatecardDialogComponent,
		ExportExcelDialogComponent,
		TermsDialogComponent,
		RatefactorsCompareDialogComponent,
		PublishDialogComponent,
		// GridRatefactorsCompareComponent,
		// GridRatefactorsComponent,
	],
	providers: [
		AuthService,
		WebServices,
		ToastService,
		LayoutService,
		BusyService,
		HttpClient,
		ErrorService,
		AppSettings,
		ToastEventHandlerService,
		AuthGuardService,
		DataManagerService,
		RateCardsWebService,
		RateCardsService,
		NumberHelper,
		LoginGuardService,
		GridFactory,
		AppConfigService,
		{ provide: APP_INITIALIZER, useFactory: initConfig, deps: [AppConfigService], multi: true },
	],
	bootstrap: [AppComponent],
})
export class AppModule {}
