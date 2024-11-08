const _ = require('lodash');
const Base = require('./base.model');
const DataError = require('../reusable/errors/dataError');
const moment = require('moment');
const VendorCode = require('./vendor-code.model');
const Helpers = require('./../helpers');

const {
	compact
} = require('./../reusable/helpers');

const LOG_TAG = '\x1b[34m' + '[models/version-base]' + '\x1b[39;49m ';

const table = 'version';

/**
 * Custom logic for versions
 * @class Models.version
 * @singleton
 */
const VersionBase = _.extend({}, Base, {
	table,

	/**
	 * @method constructor
	 * initialices the object
	 */
	constructor(..._defaults) {

		Base.constructor.call(this, ..._defaults, {
			app: '',
			rateCardId: '',
			canPublish: false,
			archived: false,
			published: false,
			isPublishing: false,
			datePublished: '',
			vendorCodes: [],
			vendorCodeNames: []
		});

		this._hasUpdates = false;

		return this;
	},
	/**
	 * @method init
	 * initialices the object
	 */
	init() {
		log(LOG_TAG, 'init');
		if (this.published || this.archived) {
			this.canPublish = false;

			if (this.published) {
				this.archived = false;
			} else if (this.archived) {
				this.published = false;
			}

			if (!this.datePublished) {
				this.datePublished = new Date().toISOString();
			}
		}

		return this;
	},
	/**
	 * @method forAll
	 * Returns an object with the structure of the model. 
	 * @return {object}
	 */
	forAll() {
		return {
			app: this.app,
			rateCardId: this.rateCardId,
			terms: this.terms,
			canPublish: this.canPublish,
			isPublishing: this.isPublishing,
			archived: this.archived,
			deleted: this.deleted,
			published: this.published,
			datePublished: this.datePublished
		};
	},

	/**
	 * @method forArrow
	 * Returns the properties required to save on ArrowDb
	 * @return {object}
	 */
	forArrow() {
		const json = Base.forArrow.call(this);

		return _.extend(json, this.forAll());
	},

	/**
	 * @method forAPI
	 * Returns the properties required to present in the API
	 * @return {object}
	 */
	forAPI() {
		const json = Base.forAPI.call(this);

		return _.extend(json, this.forAll(), {
			created_at: this.created_at,
			updated_at: this.updated_at
		});
	},
	/**
	 * @method remove
	 * Removes the object and all dependencies marking them as deleted, not a physical deletion
	 * @return {object}
	 */
	remove() {
		log(LOG_TAG, 'remove');

		this.update({
			deleted: true,
			canPublish: false
		});

		return this;
	},
	/**
	 * @method validateVersionIsInProgress
	 * Checks if this version is in progress, thowing error if not
	 * @return {void}
	 */
	validateVersionIsInProgress() {
		if (this.published || this.archived || this.isPublishing) {
			throw DataError({
				code: 'no-in-progress',
				variable: 'version',
				value: this.uid
			});
		}
	},
	/**
	 * @method checkVersionIsNotPublishing
	 * Checks if the version is not actually in the process of publishing, throws an error if it is publishing
	 * @return {void}
	 */
	checkVersionIsNotPublishing() {
		if (this.isPublishing) {
			throw DataError({
				code: 'version-still-publishing',
				variable: 'version'
			});
		}
	},
	/**
	 * @method getNextOrder
	 * Iterates a collection with objects having an "order" key, returning the max order + 1
	 * @param {Array} _collection Collection of items to get the maximum order
	 * @return {Number} Next order
	 */
	getNextOrder(collection = []) {
		let nextOrder = _.chain(collection)
			.map((item) => {
				return Number(item.order) || 0;
			})
			.sortBy()
			.last()
			.value();

		nextOrder = Number(nextOrder);

		if (!nextOrder) {
			nextOrder = 0;
		}

		return nextOrder + 1;
	},

	/**
	 * @method findByUID
	 * Searches for an item in the collection filtering by UID.
	 * @param {Array} _collection Collection of items to search for
	 * @param {String} _uid UID of the item
	 * @return {object} the item if found, otherwise an error is thrown
	 */
	findByUID(_collection, _uid) {
		const item = _.find(_collection, {
			uid: _uid
		});

		if (!item) {
			throw DataError({
				code: 'not-found',
				variable: 'item.id',
				value: _uid
			});
		}

		return item;
	},
	/**
	 * @method description
	 * Returns the description of a version, the description is formed by the status of the version and the date of the version
	 * @return {String} the description
	 */
	description() {
		const date = moment(this.updated_at);
		let versionDate = date.format('MM/DD/YYYY hh:mm A');
		let status = '';
		if (this.published) {
			status = '(Current)';
		}

		if (!this.published && !this.archived) {
			versionDate = date.format('MM/DD/YYYY');
			status = '(In-Progress)';
		}
		return `${versionDate} ${status}`;
	},
	/**
	 * @method vendorCodesAsString
	 * Returns the vendor codes name separated by comma 
	 * @return {String} 
	 */
	vendorCodesAsString() {
		const vendorCodesString = this.vendorCodes.map(vendorCode => {
			return vendorCode.name
		}).join(',');
		return vendorCodesString;
	},
	/**
	 * @method createVendorCode
	 * Creates a vendor code
	 * @param {Object} _newData Data of the vendor code to create
	 * @return {Object} The newly created vendor code
	 */
	createVendorCode(_newData = {}) {
		log(LOG_TAG, 'createVendorCode', _newData);

		let {
			name,
			rateCardId = ''
		} = _newData;

		if (name) {
			Helpers.validateName({
				collection: this.vendorCodes,
				name
			});
		} else {
			throw DataError({
				code: 'missing-required-parameter',
				variable: 'name'
			});
		}

		if (rateCardId.length === 0) {
			rateCardId = this.rateCardId;
		}

		const vendorCode = VendorCode.create(compact(_newData));
		vendorCode.update({
			versionId: this.uid,
			rateCardId
		});

		this.vendorCodes.push(vendorCode);
		this.update({
			canPublish: true,
			vendorCodeNames: this.active('vendorCodes').map(vendorCode => vendorCode.name)
		});

		return vendorCode;
	},
	/**
	 * @method updateVendorCode
	 * Updates a vendor code
	 * @param {Object} _newData Data to update
	 * @return {Object} The updated vendor code
	 */
	updateVendorCode(_newData = {}) {
		log(LOG_TAG, 'updateVendorCode', _newData);

		const newData = JSON.parse(JSON.stringify(compact(_newData)));
		const {
			uid,
			name = '',
		} = newData;

		if (!uid) {
			throw Error(`${LOG_TAG} - updateVendorCode - Missing uid`);
		}

		const vendorCode = this.getVendorCode(uid);

		if (name.length > 0) {
			Helpers.validateName({
				collection: this.vendorCodes,
				name,
				uid
			});
		}

		newData.versionId = this.uid;

		vendorCode.update(newData);

		this.update({
			canPublish: true,
			vendorCodeNames: this.active('vendorCodes').map(vendorCode => vendorCode.name)
		});

		return vendorCode;
	},
	/**
	 * @method removeVendorCode
	 * Removes a vendor code
	 * @param {String} _vendorCodeId Id of the vendor code to remove
	 * @return {Object} The removed vendor code
	 */
	removeVendorCode(_vendorCodeId) {
		log(LOG_TAG, 'removeVendorCode', _vendorCodeId);

		const vendorCode = this.getVendorCode(_vendorCodeId);
		vendorCode.remove();

		this.update({
			canPublish: true,
			vendorCodeNames: this.active('vendorCodes').map(vendorCode => vendorCode.name)
		});

		return vendorCode;
	},
	/**
	 * @method getVendorCode
	 * Returns a vendor code
	 * @param {String} _vendorCodeId Id of the vendor code to return
	 * @return {Object} The vendor code
	 */
	getVendorCode(_vendorCodeId) {
		const vendorCode = this.findByUID(this.vendorCodes, _vendorCodeId);
		return vendorCode;
	}
});

module.exports = VersionBase;
