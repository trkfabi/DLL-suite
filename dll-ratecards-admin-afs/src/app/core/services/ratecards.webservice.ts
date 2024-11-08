import { HttpClient, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IReorderRatePrograms } from '@shared/interfaces';
import { IRateProgram } from '@shared/interfaces/rate-program.interface';
import { IProductCategories } from '@shared/models/product-categories.model';
import { IProduct } from '@shared/models/product.model';
import { RateCardTerms } from '@shared/models/ratecard-terms.model';
import { IResidual } from '@shared/models/residual.model';
import { ITerm } from '@shared/models/terms.model';
import * as _ from 'lodash';
import * as moment from 'moment';
import { AppSettings, DEFAULT_PERMISSION, doLog } from '../app-settings';
import { AppConfigService } from './app.config.service';
import { AuthService } from './auth.service';
import { BusyService } from './busy.service';
import { WebServices } from './webservices.service';

const LOG_TAG = '[core/services/RateCardsWebService]';
// TODO: remove this after integration be complete
const API_PATH = 'api/rate_cards/';

/**
 * @class core.services.RateCardsWebService
 * List of API RateCardsWebService to be consumed by the app
 * @uses angular.core.Injectable
 * @uses moment
 * @version 1.0.0
 */
@Injectable()
export class RateCardsWebService {
	/**
	 * @property {Object} apiCredentials Stores the API credentials to use on the requests.
	 * @property {String} apiCredentials.hostUrl Stores the current environment API url.
	 * @property {String} apiCredentials.apiKey Stores the API Keys in case need to refresh the token.
	 * @property {String} apiCredentials.token Stores the API token to generate the Auth Token and Refresh Token.
	 */
	private apiCredentials;

	/**
	 * @property {Object} currentToken Stores the current session token values.
	 * @property {String} currentToken.userId Stores the current session userId.
	 * @property {String} currentToken.authToken Stores the current auth token to manage the requests to API.
	 * @property {String} currentToken.refreshToken Stores the current refreshToken to update the tokens without re-authenticate.
	 */
	private currentToken;

	/**
	 * @property {Object} apiUrls Receives URLs from user permissions
	 */
	private apiUrls;

	constructor(
		private _busyService: BusyService,
		private _http: HttpClient,
		private _webService: WebServices,
		private _authService: AuthService,
		private _config: AppConfigService,
		private _settings?: AppSettings
	) {
		this.apiCredentials = this._settings.getApiCredentials();
		this.currentToken = {};
		this.apiUrls = this._config.getUrls();
	}

	/**
	 * @method getAllRateCards
	 * Request from API all ratecards with own versions.
	 * @return {Promise}
	 */
	public getRateCardInfo(rateCardId?: string, versionId?: string) {
		doLog && console.log(LOG_TAG, 'getRateCardInfo');

		const api = `${this.apiUrls.fetch_rate_cards}?depth=1`;
		return this._webService.request({
			api,
		});
	}

	/**
	 * @method getRateCardsVersion
	 * Request from API all ratecards with own versions.
	 * @param _rateCardId the ratecard id to query.
	 * @return {void}
	 */
	public getRateCardsVersion(rateCardId) {
		const api = `${this.apiUrls.fetch_rate_card}/${rateCardId}`;
		return this._webService.request({
			api,
		});
	}

	/**
	 * @method getAllRateCards
	 * Request from API all ratecards with own versions.
	 * @return {Promise}
	 */
	public getAllRateCardsWithVendors() {
		doLog && console.log(LOG_TAG, 'getAllRateCardsWithVendors');
		const rateCardPath = API_PATH + 'rate_cards_vendor_codes';

		return this._webService.request({
			api: rateCardPath,
		});
	}

	/**
	 * @method listAllRateCards
	 * Request from API in order to get a basic information of all rate cards.
	 * @return {Promise}
	 */
	public listAllRateCards() {
		doLog && console.log(LOG_TAG, 'listAllRateCards');
		const rateCardPath = 'api/rateCards/ratecard';

		return this._webService.request({
			api: rateCardPath,
		});
	}

	/**
	 * @method createRateCard
	 * Create a rate card in the backend.
	 * @param {Object} _rateCard contents the rate card information to create.
	 * @return {Promise}
	 */
	public createRateCard(_rateCard) {
		doLog && console.log(LOG_TAG, 'createRateCard', _rateCard);
		const rateCardPath = API_PATH + 'rate_card/create/';

		return this._webService.request({
			api: rateCardPath,
			method: 'POST',
			body: _rateCard,
		});
	}

	/**
	 * @method updateRateCard
	 * Updates a rate card information in the backend.
	 * @param {Object} _rateCard contents the rate card information to update.
	 * @return {Promise}
	 */
	public updateRateCard(_rateCard) {
		doLog && console.log(LOG_TAG, 'updateRateCard', _rateCard);
		const rateCardPath = API_PATH + 'rate_card/update/';

		return this._webService.request({
			api: rateCardPath,
			method: 'POST',
			body: _rateCard,
		});
	}

	/**
	 * @method deleteRateCard
	 * Deletes a rate card record in the backend.
	 * @param {String} _rateCardId rate card identifier.
	 * @return {Promise}
	 */
	public deleteRateCard(_rateCardId) {
		doLog && console.log(LOG_TAG, 'deleteRateCard');
		const rateCardPath = API_PATH + 'rate_card/delete';

		return this._webService.request({
			api: rateCardPath,
			method: 'POST',
			body: { id: _rateCardId },
		});
	}

	/**
	 * @method getVersion
	 * Get current Version data extended.
	 * @param {String} _versionId the version to get data.
	 * @return {Promise}
	 */
	public getVersion(_versionId) {
		doLog && console.log(LOG_TAG, 'getVersion');
		const rateCardPath = `${this.apiUrls.fetch_version}/${_versionId}`;

		return this._webService.request({
			api: rateCardPath,
		});
	}

	/**
	 * @method getAllImportList
	 * Import from other Rate Cards
	 * @return {Promise}
	 */
	public getAllImportList() {
		doLog && console.log(LOG_TAG, 'getAllImportList');
		// this.apiUrls.fetch_import_list; //
		const rateCardPath = API_PATH + 'import_list';

		return this._webService.request({
			api: rateCardPath,
		});
	}

	/**
	 * @method getImportListEnvironment
	 * Import Rate Card version according to an environment.
	 * @param {String} _rateCardEnvironment the ratecard environment.
	 * @return {Promise}
	 */
	public getImportListEnvironment(_rateCardEnvironment) {
		doLog && console.log(LOG_TAG, 'getImportListEnvironment');
		const rateCardPath = API_PATH + 'import_list/?environment =' + _rateCardEnvironment;

		return this._webService.request({
			api: rateCardPath,
		});
	}

	/**
	 * @method getImportListEnvironmentId
	 * Import Rate Card version according to an environment and the rateCard Id.
	 * @param {String} _rateCardEnvironment the ratecard environment.
	 * @param {String} _rateCardId the ratecard Id to validate version.
	 * @return {Promise}
	 */
	public getImportListEnvironmentId(_rateCardEnvironment, _rateCardId) {
		doLog && console.log(LOG_TAG, 'getImportListEnvironment');
		const rateCardPath = API_PATH + 'import_list/?environment=' + _rateCardEnvironment + '&rateCardId=' + _rateCardId;

		return this._webService.request({
			api: rateCardPath,
		});
	}

	/**
	 * @method importFrom
	 * Import a version according to the environment, rate card and rate version selected
	 * @param {Object} _item contents the rate card version to export.
	 * @return {void}
	 */
	public importFrom(_item) {
		doLog && console.log(LOG_TAG, 'importFrom');
		const rateCardPath = API_PATH + 'import_from';

		return this._webService.request({
			api: rateCardPath,
			method: 'POST',
			body: _item,
		});
	}

	/**
	 * @method createNewVersion
	 * Create/Replace a new version
	 * @param {Object} _item contents the rate card version to create. If the versionId is empty then
	 * the version will be created from scratch with everything empty, otherwise will be a copy
	 * and set as the InProgress version.
	 * @return {void}
	 */
	public createNewVersion(_item) {
		doLog && console.log(LOG_TAG, 'createNewVersion', JSON.stringify(_item));
		const rateCardPath = API_PATH + 'version/create';

		return this._webService.request({
			api: rateCardPath,
			method: 'POST',
			body: _item,
		});
	}

	/**
	 * @method duplicateVersion
	 * Create/Replace a new version
	 * @param {Object} _item contents the rate card version to create. If the versionId is empty then
	 * the version will be created from scratch with everything empty, otherwise will be a copy
	 * and set as the InProgress version.
	 * @return {void}
	 */
	public duplicateVersion(_versionDuplicate) {
		doLog && console.log(LOG_TAG, 'duplicateVersion', _versionDuplicate);
		const permission = this._authService.getUserPermissions() || DEFAULT_PERMISSION;
		const rateCardPath = `${API_PATH}${permission}/version/duplicate`;

		return this._webService.request({
			api: rateCardPath,
			method: 'POST',
			body: {
				id: _versionDuplicate.id,
				rateCardId: _versionDuplicate.rateCardId,
				products: _versionDuplicate.products,
				categories: _versionDuplicate.categories,
				terms: _versionDuplicate.terms,
				vendorCodes: _versionDuplicate.vendorCodes,
				inputs: _versionDuplicate.inputs,
				ratePrograms: _versionDuplicate.rateProgram,
			},
		});
	}

	/**
	 * @method exportVersion
	 * Export Version Selected into CSV
	 * @param {Object} _versionId contents the rate card version id to export.
	 * @param {Object} _vendorName vendor code name chosen to export.
	 * @return {void}
	 */
	public exportVersion(_versionId, _vendorName) {
		doLog && console.log(LOG_TAG, 'exportVersion');
		const rateCardPath =
			_vendorName && _vendorName !== 'Base (No points added)'
				? API_PATH + 'export?versionId=' + _versionId + '&vendorCode=' + _vendorName
				: API_PATH + 'export?versionId=' + _versionId;

		return this._webService.request({
			api: rateCardPath,
			headers: {
				Accept: 'application/csv',
			},
			responseType: 'blob' as 'json',
		});
	}

	/**
	 * @method exportAuditLog
	 * Export Version SelectedAudit Logs into CSV
	 * @return {void}
	 */
	public exportAuditLogs() {
		doLog && console.log(LOG_TAG, 'exportAuditLogs');
		const auditLogsPath = `${API_PATH}export/audit_log`;

		return this._webService.request({
			api: auditLogsPath,
			headers: {
				Accept: 'application/csv',
			},
			responseType: 'blob' as 'json',
		});
	}

	/**
	 * @method getRateFactorsTable
	 * Returns rateFactors table data to fill ratefactors grids.
	 * @param {String} _versionId the version id to get data.
	 * @return {Promise}
	 */
	public getRateFactorsTable(_versionId, _vendorCode) {
		doLog && console.log(LOG_TAG, 'getRateFactorsTable', _versionId, _vendorCode);
		const rateFactorsTablePath = API_PATH + 'admin/rate_factors/?versionId=' + _versionId + '&vendorCode=' + _vendorCode;

		return this._webService.request({
			api: rateFactorsTablePath,
		});
	}

	/**
	 * @method calculateFactors
	 * Calculate data table to fill ratefactors grids.
	 * @param {String} _versionId the version id to get data.
	 * @return {Promise}
	 */
	public calculateFactors(_versionId, _vendor) {
		doLog && console.log(LOG_TAG, 'calculateFactors', _versionId);
		let rateFactorsTablePath = `${this.apiUrls.recalculate_version}/${_versionId}/?display=admin`;
		if (_vendor.name && _vendor.points) {
			rateFactorsTablePath += `&vendorName=${_vendor.name}&vendorPoints=${_vendor.points}`;
		}
		return this._webService.request({
			api: rateFactorsTablePath,
			method: 'GET',
		});
	}

	/**
	 * @method calculateFactors
	 * Calculate data table to fill ratefactors grids.
	 * @param {String} _data the rate programs data to get.
	 * @return {Promise}
	 */
	public calculateFactorsOtch(_data) {
		doLog && console.log(LOG_TAG, 'calculateFactors', _data);
		const { versionId, params } = _data || {};
		const rateFactorsTablePath = `${this.apiUrls.recalculate_version}/${versionId}`;
		const queryParams = new HttpParams({ fromObject: params });
		return this._webService.request({
			api: rateFactorsTablePath,
			method: 'GET',
			queryParams,
		});
	}

	/**
	 * @method createCategory
	 * Creates a new product category in the backend.
	 * @param {Object} _category contents the product category to create.
	 * @return {Promise}
	 */
	public createCategory(_category) {
		doLog && console.log(LOG_TAG, 'createCategory', _category);
		const categoryPath = `${this.apiUrls.create_category}`;

		return this._webService.request({
			api: categoryPath,
			method: 'POST',
			body: _category,
		});
	}

	/**
	 * @method updateCategory
	 * Updates a product category information in the backend.
	 * @param {Object} _category contents the product category to update.
	 * @return {Promise}
	 */
	public updateCategory(_category) {
		doLog && console.log(LOG_TAG, 'updateCategory', _category);
		const categoryPath = `${this.apiUrls.update_category}`;

		return this._webService.request({
			api: categoryPath,
			method: 'POST',
			body: _category,
		});
	}

	/**
	 * @method deleteCategory
	 * Deletes a new product category in the backend.
	 * @param {String} _categoryId category identifier.
	 * @param {String} _versionId version identifier.
	 * @return {Promise}
	 */
	public deleteCategory(_categoryId, _versionId) {
		doLog && console.log(LOG_TAG, 'deleteCategory');
		const categoryPath = `${this.apiUrls.delete_category}`;
		return this._webService.request({
			api: categoryPath,
			method: 'POST',
			body: { id: _categoryId, versionId: _versionId },
		});
	}

	/**
	 * @method createProduct
	 * Creates a new product in the backend.
	 * @param {Object} _product contents the product to create.
	 * @return {Promise}
	 */
	public createProduct(_product) {
		doLog && console.log(LOG_TAG, 'createProduct', _product);
		const productPath = `${this.apiUrls.create_product}`;

		return this._webService.request({
			api: productPath,
			method: 'POST',
			body: _product,
		});
	}

	/**
	 * @method updateProduct
	 * Updates a new product category in the backend.
	 * @param {Object} _product contents the product to update.
	 * @return {Promise}
	 */
	public updateProduct(_product) {
		doLog && console.log(LOG_TAG, 'updateProduct', _product);
		const productPath = `${this.apiUrls.update_product}`;
		return this._webService.request({
			api: productPath,
			method: 'POST',
			body: _product,
		});
	}

	/**
	 * @method deleteProduct
	 * Deletes a new product in the backend.
	 * @param {String} _productId product identifier.
	 * @param {String} _versionId version identifier.
	 * @return {Promise}
	 */
	public deleteProduct(_productId, _versionId) {
		doLog && console.log(LOG_TAG, 'deleteProduct');
		const productPath = `${this.apiUrls.delete_product}`;

		return this._webService.request({
			api: productPath,
			method: 'POST',
			body: { id: _productId, versionId: _versionId },
		});
	}

	/**
	 * @method updateVersion
	 * Commits the terms edited based in the version selected.
	 * @param {RateCardTerms} _rateCardTerms object where custom attributes are stored to update terms based on version
	 * @return {Promise}
	 */
	public updateVersion(version: any) {
		doLog && console.log(LOG_TAG, 'updateVersion', version);
		const rateCardsPath = this.apiUrls.update_version;

		return this._webService.request({
			api: rateCardsPath,
			method: 'POST',
			body: version,
		});
	}

	/**
	 * @method saveRateCardInput
	 * Save RateCard Input data into database.
	 * @param {Object} _input stores the current input data to modify in database.
	 * @return {void}
	 */
	public saveRateCardInput(_input) {
		doLog && console.log(LOG_TAG, 'saveRateCardInput', _input);
		const api = this.apiUrls.update_rate_card_input;
		const body = _input;

		return this._webService.request({
			api,
			method: 'POST',
			body,
		});
	}

	/**
	 * @method saveRateCartdProduct
	 * Save RateCard Product data into database.
	 * @param _product stores the current product/category data to modify in database.
	 * @return {void}
	 */
	public saveRateCardProduct(_product) {
		doLog && console.log(LOG_TAG, 'saveRateCartdProduct', _product);
		const api = API_PATH + 'product';
		const body = _product;

		return this._webService.request({
			api,
			method: 'POST',
			body,
		});
	}

	/**
	 * @method publishRateCard
	 * Sends the data to API to publish the current ratecard version selected and enable to use it from mobile app.
	 * @param _rateCardId The main ratecard Id to submit.
	 * @param _rateCardVersionId The current ratecard version selected to publish.
	 * @return {void}
	 */
	public publishRateCardVersion(_rateCardVersionId) {
		doLog && console.log(LOG_TAG, 'publishRateCard', _rateCardVersionId);
		const rateCardPublishPath = API_PATH + 'rate_card/publish';

		return this._webService.request({
			api: rateCardPublishPath,
			method: 'POST',
			body: {
				id: _rateCardVersionId,
			},
		});
	}

	/**
	 * @method deleteRateCardVersion
	 * Sends the delete request to API to remove the current version Id from the ratecard selected.
	 * @param _rateCardId stores the rate card Id to query and delete the version.
	 * @param _rateCardVersionId stores the ratecard version Id to remove from parent ratecard.
	 * @return {void}
	 */

	public deleteRateCardVersion(_rateCardId, _rateCardVersionId) {
		doLog && console.log(LOG_TAG, 'deleteRateCardVersion', _rateCardId, _rateCardVersionId);
		const deleteRateCardVersionPath = API_PATH + 'version/delete';

		return this._webService.request({
			api: deleteRateCardVersionPath,
			method: 'POST',
			body: { rateCardId: _rateCardId, id: _rateCardVersionId },
		});
	}

	/** @method batchUpdate
	 * Updates a list of type elements in one call in the backend
	 * @param { String } _type data type model to update.
	 * @param { Array } _elements array of elements to update.
	 * @return { Promise }
	 */
	public batchUpdate(_type, _versionId, _elements: any[]) {
		doLog && console.log(LOG_TAG, 'batchUpdate');
		const batchPath = `${this.apiUrls.batch_update_models}`;

		return this._webService.request({
			api: batchPath,
			method: 'POST',
			body: { model: _type, versionId: _versionId, items: _elements },
		});
	}

	/**
	 * @method createVendorCode
	 * Creates a vendor code information in the backend.
	 * @param {Object} _vendorCode contents the vendor code information to create.
	 * @return {Promise}
	 */
	public createVendorCode(_vendorCode) {
		doLog && console.log(LOG_TAG, 'createVendorCode', _vendorCode);

		const vendorCodePath = `${this.apiUrls.create_vendor_code}`;

		return this._webService.request({
			api: vendorCodePath,
			method: 'POST',
			body: _vendorCode,
		});
	}

	/**
	 * @method updateVendorCode
	 * Updates a vendor code information in the backend.
	 * @param {Object} _vendorCode contents the vendor code information to update.
	 * @return {Promise}
	 */
	public updateVendorCode(_vendorCode) {
		doLog && console.log(LOG_TAG, 'updateVendorCode', _vendorCode);
		const vendorCodePath = `${this.apiUrls.update_vendor_code}`;

		return this._webService.request({
			api: vendorCodePath,
			method: 'POST',
			body: _vendorCode,
		});
	}

	/**
	 * @method deleteVendorCode
	 * Deletes a vendro code record in the backend.
	 * @param {String} _vendorCodeId vendor code identifier.
	 * @param {String} _rateCardId rate card identifier.
	 * @return {Promise}
	 */
	public deleteVendorCode(_vendorCodeId, _rateCardId) {
		doLog && console.log(LOG_TAG, 'deleteVendorCode');
		const vendorCodePath = `${this.apiUrls.delete_vendor_code}`;

		return this._webService.request({
			api: vendorCodePath,
			method: 'POST',
			body: {
				id: _vendorCodeId,
				rateCardId: _rateCardId,
			},
		});
	}

	/**
	 * @method compareVersion
	 * Compare 2 versions of Rate Cards and mark their differences
	 * @param {Object} _item contains both versions to compare
	 * @return {void}
	 */
	public compareVersion(_versionId, _versionToCompare) {
		doLog && console.log(LOG_TAG, 'compareVersion', _versionId, _versionToCompare);
		const rateCardPath = `api/rate_cards/compare?versionBeforeId=${_versionId}&versionAfterId=${_versionToCompare}`;
		return this._webService.request({
			api: rateCardPath,
			method: 'GET',
		});
	}

	/**
	 * @method loadRatePrograms
	 * Load rate programs data with version ID
	 * @param {string} _versionId Receives version ID data
	 * @return {void}
	 */
	public loadRatePrograms(_versionId: string) {
		doLog && console.log(LOG_TAG, 'loadRatePrograms', _versionId);
		const rateProgramsPath = `${this.apiUrls.fetch_rate_programs}?versionId=${_versionId}`;

		return this._webService.request({
			api: rateProgramsPath,
			method: 'GET',
		});
	}

	/**
	 * @method getRateProgram
	 * Get rate program's data from rate program id
	 * @param {string} _rateProgramId Receives rate program ID
	 * @return {Promise}
	 */
	public getRateProgram(_rateProgram) {
		doLog && console.log(LOG_TAG, 'getRateProgram', _rateProgram);
		const { id: rateProrgramId, versionId } = _rateProgram || {};
		const rateProgramsPath = `${this.apiUrls.get_rate_program}?id=${rateProrgramId}&versionId=${versionId}`;
		return this._webService.request({
			api: rateProgramsPath,
			method: 'GET',
		});
	}

	/**
	 * @method createRateProgram
	 * Create a new rate program with data received
	 * @param _rateProgram Receives rate program data for save
	 * @return {Promise}
	 */
	public async createRateProgram(_rateProgram: IRateProgram) {
		doLog && console.log(LOG_TAG, 'createRateProgram', _rateProgram);
		const rateProgramPath = `${this.apiUrls.create_rate_program}`;

		return this._webService.request({
			api: rateProgramPath,
			method: 'POST',
			body: _rateProgram,
		});
	}

	/**
	 * @method updateRateProgram
	 * updates the rate program with data received
	 * @param _rateProgram Receives rate program data for save
	 * @return {Promise}
	 */
	public async updateRateProgram(_rateProgram: IRateProgram) {
		doLog && console.log(LOG_TAG, 'updateRateProgram', _rateProgram);
		const rateProgramPath = `${this.apiUrls.update_rate_program}`;

		return this._webService.request({
			api: rateProgramPath,
			method: 'POST',
			body: _rateProgram,
		});
	}

	/**
	 * @method duplicateRatProgram
	 * Sends the request to duplicate the rate program
	 * @param _rateProgram The rateProgram to duplicate
	 * @return {void}
	 */
	public async duplicateRateProgram(_rateProgram) {
		doLog && console.log(LOG_TAG, 'duplicateRateProgram', _rateProgram);
		const rateProgramPath = `${this.apiUrls.duplicate_rate_program}`;
		return this._webService.request({
			api: rateProgramPath,
			method: 'POST',
			body: {
				id: _rateProgram.id,
				versionId: _rateProgram.versionId,
			},
		});
	}

	/**
	 * @method deleteRateProgram
	 * Sends the request to delete the rate program
	 * @param _rateProgram The rateProgram to delete
	 * @return {void}
	 */
	public async deleteRateProgram(_rateProgram) {
		doLog && console.log(LOG_TAG, 'deleteRateProgram', _rateProgram);
		const rateProgramPath = `${this.apiUrls.delete_rate_program}`;
		return this._webService.request({
			api: rateProgramPath,
			method: 'POST',
			body: {
				id: _rateProgram.id,
				versionId: _rateProgram.versionId,
			},
		});
	}

	/**
	 * @method reorderRatePrograms
	 * Reorder rate programs for list
	 * @param {object} _rateProgramsIds Receives id from rate programs to order
	 * @return {Promise}
	 */
	public reorderRatePrograms(_rateProgramsIds: IReorderRatePrograms) {
		doLog && console.log(LOG_TAG, 'reorderRatePrograms', _rateProgramsIds);
		const rateProgramPath = this.apiUrls.reorder_rate_programs;
		return this._webService.request({
			api: rateProgramPath,
			method: 'POST',
			body: _rateProgramsIds,
		});
	}

	/**
	 * @method saveRateProgramInput
	 * Upates the Rate Program input data
	 * @param {object} _rateProgramInput Recives rate program input data
	 * @return {Promise}
	 */
	public async saveRateProgramInput(_rateProgramInput) {
		const rateProgramSpread = this.apiUrls.update_spread;
		return this._webService.request({
			api: rateProgramSpread,
			method: 'POST',
			body: _rateProgramInput,
		});
	}

	/**
	 * @method saveResidualsRateProgramInput
	 * Upates residuals in rate cards input othc
	 * @param {object} _data Recives rate program data
	 * @return {Promise}
	 */
	public async saveResidualsRateProgramInput(_data) {
		const rateProgramResiduals = this.apiUrls.update_residual;
		return this._webService.request({
			api: rateProgramResiduals,
			method: 'POST',
			body: _data,
		});
	}
}
