import { Component } from '@angular/core';
import { AppSettings } from '@core/index';

const LOG_TAG = '[layout.SiteLayoutComponent]';

/**
 * @class layout.SiteLayoutComponent
 * Site layout for static pages.
 * @version 1.0.0
 */
@Component({
	selector: 'app-site-layout',
	templateUrl: './site-layout.component.html',
	styleUrls: ['./site-layout.component.css'],
})
export class SiteLayoutComponent {
	/**
	 * @property {String} title
	 * The main title of the application.
	 */
	public title: string;

	/**
	 * @property {String} templateName
	 * The main templateName of the application.
	 */
	public templateName: string;

	constructor(private _settings: AppSettings) {
		this.title = this._settings.appCustomOptions.appTitle;
		this.templateName = this._settings.appCustomOptions.templateName;
	}
}
