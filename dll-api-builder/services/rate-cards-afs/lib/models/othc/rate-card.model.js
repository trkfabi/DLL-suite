const _ = require('lodash');
const RateCardBase = require('../rate-card-base.model');
const Version = require('./version.model');
const RequestError = require('../../reusable/errors/requestError');
const DataError = require('../../reusable/errors/dataError');
const Constants = require('../../../constants/constants');

const {
	compact
} = require('../../reusable/helpers');

const LOG_TAG = '\x1b[34m' + '[models/othc/rate-card]' + '\x1b[39;49m ';

const table = 'rate_card';

/**
 * Custom logic for rate cards
 * @class Models.rateCard
 * @singleton
 */
const RateCard = _.extend({}, RateCardBase, {
	table,
	/**
	 * @method constructor
	 * initialices the object
	 */
	constructor(_defaults = {}) {
		_.extend(this, {
			app: Constants.apps.APP_OTHC
		});

		RateCardBase.constructor.call(this, Version, _defaults);
		return this;
	},
	/**
	 * @method init
	 * initialices the object
	 */
	init() {
		return RateCardBase.init.call(this);
	},
	/**
	 * @method createVersion
	 * Creates a version for the rateCard
	 * @param {object} _version Version data
	 * @return {object} The created version
	 */
	createVersion(_version = {}) {
		const version = Version.create(_version);

		const result = this.addVersion(version)

		return result;
	},
	/**
	 * @method importVersion
	 * Imports a version to the rate card
	 * @param {object} _version Version to import
	 * @return {object}
	 */
	importVersion(_version = {}) {
		log(LOG_TAG, 'importVersion', _version);
		const version = Version.create(_version).duplicate();

		let actualVendorCodes = this.withVendorCodes().vendorCodes;

		actualVendorCodes.forEach(vendorCode => {
			version.createVendorCode({
				name: vendorCode.name,
				points: vendorCode.points,
				rateCardId: this.uid
			});
		});
		if (actualVendorCodes.length === 0) {
			version.update({
				vendorCodeNames: []
			});
		}

		return this.addVersion(version)

	},

	/**
	 * @method duplicateVersion
	 * Duplicates a version changing attributes received in _newData
	 * @param {String} _versionId VersionId of the source version
	 * @param {Object} _newData Data that changed on the source version and should be part of the new version
	 * @return {object} The duplicated version
	 */
	duplicateVersion(_versionId, _newData = {}) {
		log(LOG_TAG, 'duplicateVersion', {
			_versionId,
			_newData
		});

		const version = _.find(this.versions, {
			uid: _versionId
		});

		if (!version) {
			throw DataError({
				code: 'not-found',
				variable: 'version',
				value: '_versionId'
			});
		}
		if (!version.published && !version.archived) {
			throw RequestError(`The version ${_versionId} is not archived or published.`, 400);
		}
		const newData = JSON.parse(JSON.stringify(_newData));
		const {
			cofs,
			terms,
			vendorCodes = [],
			ratePrograms = []
		} = newData;

		const originalVersion = Version.create(JSON.parse(JSON.stringify(version)));

		if (cofs || terms) {
			originalVersion.update(compact({
				cofs,
				terms
			}));
		}

		if (vendorCodes.length > 0) {
			_.each(vendorCodes, vendorCode => {
				if (vendorCode.deleted) {
					originalVersion.removeVendorCode(vendorCode.uid);
				} else if (_.find(originalVersion.vendorCodes, {
						uid: vendorCode.uid
					})) {
					originalVersion.updateVendorCode(vendorCode);
				} else {
					delete vendorCode.uid;
					originalVersion.createVendorCode(vendorCode);
				}
			});
		}

		if (ratePrograms.length > 0) {
			_.each(ratePrograms, rateProgram => {
				if (rateProgram.deleted) {
					originalVersion.removeRateProgram(rateProgram.uid);
				} else if (_.find(originalVersion.ratePrograms, {
						uid: rateProgram.uid
					})) {
					originalVersion.updateRateProgram(rateProgram);
				} else {
					delete rateProgram.uid;
					originalVersion.createRateProgram(rateProgram);
				}
			});
		}
		const newVersion = originalVersion.duplicate();

		return this.addVersion(newVersion);
	},

	/**
	 * @method hasVendorCodeAvailable
	 * Checks if any of the given vendor code names are used in a version
	 * @param {Array|String} _names Vendor code names to check for
	 * @param {String} _versionType='versionInProgress' Type of the version
	 * @return {Boolean} Returns true if names are not used 
	 */
	hasVendorCodeAvailable(_names, _versionType = 'versionInProgress') {
		if (!_.isArray(_names)) {
			_names = [_names];
		}

		const version = _.find(this.versions, {
			uid: this[_versionType]
		});

		if (!version) {
			return true;
		}

		return _.every(_names, name => {
			name = name
				.trim()
				.toLowerCase();

			return _.every(version.vendorCodeNames, vendorCodeName => {
				return vendorCodeName.trim().toLowerCase() !== name;
			});
		});
	}

});

/**
 * @method create
 * Creates a new rate card with its required data
 * @return {object}
 */
function create(_params = {}) {
	const rateCard = _.extend({}, RateCard)

	return rateCard.constructor(_params);
}

module.exports = {
	table,
	create
};
