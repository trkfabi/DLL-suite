const _ = require('lodash');
const Base = require('./base.model');
const moment = require('moment');

const table = 'audit_log';

/**
 * Custom logic for auditLog
 * @class Models.auditLog
 * @singleton
 */
const AuditLog = _.extend({}, Base, {
	table,

	/**
	 * @method constructor
	 * initialices the object
	 */
	constructor(_defaults = {}) {
		Base.constructor.call(this, _defaults, {
			app: '',
			action: '',
			user: '',
			type: '',
			versionId: '',
			versionName: '',
			vendorCode: '',
			vendorPoints: '',
			rateCardCode: ''
		});

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
			action: this.action,
			user: this.user,
			type: this.type,
			versionId: this.versionId,
			versionName: this.versionName,
			vendorCode: this.vendorCode,
			vendorPoints: this.vendorPoints,
			rateCardCode: this.rateCardCode,
			deleted: this.deleted
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

		});
	},

	/**
	 * @method forAPI
	 * Returns the properties required to present in the API
	 * @return {object}
	 */
	forAPI() {
		return {
			'app': this.app,
			'action': this.action,
			'user': this.user,
			'date': moment(this.created_at).format('YYYY/MM/DD hh:mm A'),
			'type': this.type,
			'rate-card-version-id': this.versionId,
			'rate-card-version-name': this.versionName,
			'vendor-code': this.vendorCode,
			'vendor-points': this.vendorPoints,
			'rate-card-code': this.rateCardCode,
			'id': this.uid
		}
	},

	/**
	 * @method forCache
	 * Returns the properties required to save in arrow
	 * @return {object}
	 */
	forCache() {
		const json = Base.forCache.call(this);

		return _.extend(json, {

		});
	},
});

/**
 * @method create
 * Creates a new auditLog with its required data
 * @return {object}
 */
function create(_params = {}) {
	const auditLog = _.extend({}, AuditLog);

	if (_params.user && _params.user.indexOf('@', 1) !== -1) {
		_params.user = _params.user.split('@')[0];
	}

	return auditLog.constructor(_params);
}

module.exports = {
	table,
	create
};
