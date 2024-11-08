const _ = require('lodash');
const Base = require('./base.model');
const RequestError = require('../reusable/errors/requestError');
const DataError = require('../reusable/errors/dataError');

const LOG_TAG = '\x1b[34m' + '[models/rate-card]' + '\x1b[39;49m ';

const table = 'rate_card';
const ARROW_FIELDS = {
	VERSIONS: '[CUSTOM_version]version_ids'
};

/**
 * Custom logic for rate cards
 * @class Models.rateCard
 * @singleton
 */
const RateCardBase = _.extend({}, Base, {
	table,
	/**
	 * @method constructor
	 * initialices the object
	 */
	constructor(_versionModel, _defaults = {}) {
		const versionModel = _versionModel;
		Base.constructor.call(this, _defaults, {
			app: '',
			name: '',
			versionInProgress: '',
			versionPublished: '',
			order: 0,
			published: false,
			versions: []
		});

		if (this[ARROW_FIELDS.VERSIONS]) {
			this.versions = this[ARROW_FIELDS.VERSIONS];
		}

		if (this.versions.length > 0) {
			this.versions = _.chain(this.versions)
				.filter(version => {
					return _.isObject(version) && !version.deleted;
				})
				.compact()
				.map(version => {
					return versionModel.create(version);
				})
				.value();
		}

		return this;
	},
	/**
	 * @method init
	 * initialices the object
	 */
	init() {
		log(LOG_TAG, 'init');
		if (this.versions.length === 0) {
			this.createVersion();
		}

		if (!this.versionInProgress) {
			let versionInProgress = _.find(this.versions, version => {
				return !version.archived && !version.published;
			});

			if (versionInProgress) {
				versionInProgress.canPublish = true;
				this.versionInProgress = versionInProgress.uid;
			}
		}

		if (!this.versionPublished) {
			const versionPublished = _.find(this.versions, version => {
				return version.published;
			}) || {};

			this.versionPublished = versionPublished.uid || '';
		}

		if (this.versionPublished) {
			this.published = true;

			if (!this.datePublished) {
				this.datePublished = new Date().toISOString();
			}
		}

		this.versions.forEach(version => {
			version.rateCardId = this.uid;
			version.init();
		});

		return this;
	},
	/**
	 * @method update
	 * Updates the model 
	 * @param {Object} _newData Data to update
	 * @return {object}
	 */
	update(newData = {}) {
		const {
			name,
			versionInProgress,
			versionPublished,
			versions,
		} = newData;

		if (name != null && !name.match(/^[\w]{1,20}$/)) {
			throw RequestError(`Invalid RateCard name: ${name}`);
		}

		if (versionInProgress) {
			const version = this.versions.find(version => version.uid === versionInProgress);
			if (!version) {
				throw RequestError(`Invalid versionInProgress: ${versionInProgress}`);
			}
		}

		if (versionPublished != null) {
			const version = this.versions.find(version => version.uid === versionPublished);
			if (!version) {
				throw RequestError(`Invalid versionPublished: ${versionPublished}`);
			}

			newData.published = true;
		}

		if (versions != null) {
			if (!_.isArray(versions)) {
				throw RequestError(`versions must be an array.`);
			}
		}
		delete newData.app;

		return Base.update.call(this, newData);
	},
	/**
	 * @method dependencies
	 * Returns an Array of all external models tied to the rateCard, this is used for saving on ArrowDb
	 * @return {Array[Object]} Array of the dependencies
	 */
	dependencies() {
		return this.versions.filter(version => version._hasUpdates);
	},
	/**
	 * @method forAll
	 * Returns an object with the structure of the model. 
	 * @return {object}
	 */
	forAll() {
		return {
			app: this.app || '',
			name: this.name || '',
			versionInProgress: this.versionInProgress || '',
			versionPublished: this.versionPublished || '',
			order: Number(this.order) || 0,
			published: !!this.published,
			deleted: !!this.deleted,
		};
	},
	/**
	 * @method forArrow
	 * Returns the properties required to save on ArrowDb
	 * @return {object}
	 */
	forArrow() {
		const json = Base.forArrow.call(this);

		return _.extend(json, this.forAll(), {
			[ARROW_FIELDS.VERSIONS]: _.compact(this.active('versions').map(version => version.id))
		});
	},

	/**
	 * @method forAPI
	 * Returns the properties required to present in the API
	 * @return {object}
	 */
	forAPI() {
		const json = Base.forAPI.call(this);

		return _.extend(json, this.forAll(), {
			versions: this.active('versions').map(version => version.forAPI())
		});
	},

	/**
	 * @method withVendorCodes
	 * Returns the rate card with its vendor codes
	 * @return {object} The ratecard
	 */
	withVendorCodes() {
		const result = _.extend(this.forAPI(), {
			versions: []
		});
		let version = this.getVersionInProgress() || this.getVersionPublished() || {};

		let vendorCodes = version.vendorCodes || [];

		return _.extend(result, {
			vendorCodes: vendorCodes.map(vendorCode => vendorCode.forAPI())
		});
	},

	/**
	 * @method addVersion
	 * Adds a new version to the rate card
	 * @param {object} _version Version to add, if null, generates a new one
	 * @return {object}
	 */
	addVersion(_version) {
		log(LOG_TAG, 'addVersion', _version);

		if (this.versionInProgress) {
			this.removeVersion(this.versionInProgress);
		}

		this.versions.push(_version);
		this.versionInProgress = _version.uid;

		_version.update({
			rateCardId: this.uid
		});

		return _version;
	},

	removeVersion(_versionId) {
		log(LOG_TAG, 'removeVersion', _versionId);

		const versionToRemove = _.find(this.versions, {
			uid: _versionId
		});

		if (!versionToRemove) {
			throw DataError({
				code: 'not-found',
				variable: 'version',
				value: _versionId
			});
		}

		versionToRemove.validateVersionIsInProgress();
		versionToRemove.remove();

		this.versions.splice(_.indexOf(this.versions, versionToRemove), 1);
		this.versionInProgress = '';

		return versionToRemove;
	},

	removeVersionInProgress() {
		log(LOG_TAG, 'removeVersionInProgress');

		if (this.versionInProgress) {
			this.removeVersion(this.versionInProgress);
		}

		if (this.versions.length === 0) {
			this.createVersion();
		}

		return this;
	},

	remove() {
		log(LOG_TAG, 'remove');

		this.versions.forEach(version => version.remove());
		this.update({
			deleted: true
		});

		return this;
	},

	getVersionInProgress() {
		return _.find(this.versions, {
			uid: this.versionInProgress
		});
	},
	getVersionPublishing() {
		return _.find(this.versions, {
			isPublishing: true
		});
	},

	getVersionPublished() {
		return _.find(this.versions, {
			uid: this.versionPublished
		});
	},

	publishStart() {
		log(LOG_TAG, 'publishStart');

		const versionInProgress = this.getVersionInProgress();
		if (!versionInProgress) {
			throw RequestError(`The RateCard ${this.uid} does not have a versionInProgress to publish.`, 400);
		}

		versionInProgress.validateVersionIsInProgress();

		versionInProgress.update({
			isPublishing: true,
			canPublish: false
		});

		this.update({
			versionInProgress: ''
		});
		return this;
	},

	publishEnd() {
		log(LOG_TAG, 'publishEnd');

		const versionPublishing = this.getVersionPublishing();
		const publishDate = new Date().toISOString();

		if (!versionPublishing) {
			throw DataError({
				code: 'not-found',
				variable: 'version',
				value: '_versionId'
			});
		}

		versionPublishing.update({
			isPublishing: false,
			published: true,
			canPublish: false,
			datePublished: publishDate
		});

		const versionPublished = this.getVersionPublished();
		if (versionPublished) {
			versionPublished.update({
				archived: true,
				published: false,
				canPublish: false
			});
		}

		this.update({
			versionInProgress: '',
			versionPublished: versionPublishing.uid,
			datePublished: publishDate,
			published: true
		});

		return this;
	}
});

module.exports = RateCardBase;
