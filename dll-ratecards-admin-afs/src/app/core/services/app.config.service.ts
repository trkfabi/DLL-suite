import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { doLog, USER_GROUP } from '@core/app-settings';
import { AppModulePath } from '@shared/interfaces';
import { ConfigApiPath } from '@shared/models/config.urls';
import * as _ from 'lodash';

const PATH = 'assets/api-paths/';
const LOG_TAG = '[AppComponent]';

/**
 * @class core.services.AppConfigService
 * Load json files with URLs
 * @uses angular.core.Injectable
 * @version 1.0.0
 */
@Injectable({
	providedIn: 'root',
})
export class AppConfigService {
	static urls: AppModulePath;
	private http: HttpClient;

	constructor(private httpBackEnd: HttpBackend) {
		this.http = new HttpClient(httpBackEnd);
	}
	/**
	 * @method loadApiModulePath
	 * @public
	 * URLs to ApiPaths
	 * @param {String} _fileName Input file name from json file
	 * @return {Promise}
	 */
	public loadApiModulePath(_fileName: string = ''): Promise<void> {
		const fileStorage = localStorage.getItem(USER_GROUP);
		const file = fileStorage ? fileStorage : _fileName;
		if (!file) {
			doLog && console.warn(LOG_TAG, '- loadApiModulePath', 'User group is missing, waiting to login');
			return;
		}
		const jsonFile = `${PATH}${file}.json`;
		return this.http
			.get(jsonFile)
			.toPromise()
			.then(async (response: ConfigApiPath) => {
				const shared = await this.loadSharedApiPath();
				const urls = _.extend(response.apiPaths, shared);
				AppConfigService.urls = urls;
				if (!fileStorage) {
					localStorage.setItem(USER_GROUP, file);
				}
			})
			.catch((response: any) => {
				throw Error(`Could not load file '${jsonFile}': ${JSON.stringify(response)}`);
			});
	}
	/**
	 * @method loadSharedApiPath
	 * @private
	 * Load shared.json file with URLs for both user groups (afs or othc)
	 * @return {Promise}
	 */
	private loadSharedApiPath(): Promise<object> {
		const jsonFile = `${PATH}shared.json`;
		return this.http
			.get(jsonFile)
			.toPromise()
			.then((response: ConfigApiPath) => {
				return response.apiPaths;
			})
			.catch((response: any) => {
				throw Error(`Could not load file '${jsonFile}': ${JSON.stringify(response)}`);
			});
	}
	/**
	 * @method getUrls
	 * Return URLs from user permissions(afs or othc) for access to API
	 * @return {AppModulePath}
	 */
	public getUrls(): AppModulePath {
		return AppConfigService.urls;
	}
}
