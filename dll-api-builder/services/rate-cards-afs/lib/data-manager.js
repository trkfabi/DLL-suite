/**
 * Manages all the data handled by the server
 * @class lib.dataManager
 * @singleton
 */
const _ = require('lodash');

const Cache = require('./cache');
const Compare = require('./compare');
const RateCardModelAFS = require('./models/afs/rate-card.model');
const RateCardModelOTHC = require('./models/othc/rate-card.model');
const VersionModelAFS = require('./models/afs/version.model');
const VersionModelOTHC = require('./models/othc/version.model');
const RateFactorModelAFS = require('./models/afs/rate-factor.model');
const RateFactorModelOTHC = require('./models/othc/rate-factor.model');
const AuditLog = require('./models/audit-log.model');
const Helpers = require('./helpers');
const DataError = require('./reusable/errors/dataError');
const RequestError = require('./reusable/errors/requestError');
const Constants = require('../constants/constants');
const moment = require('moment');

const LOG_TAG = '\x1b[32m' + '[lib/dataManager]' + '\x1b[39;49m ';

const DataManager = function () {
	// +-------------------
	// | Private members.
	// +-------------------

	const key = process.env.ARROWDB_KEY;
	const username = process.env.ARROWDB_USER;
	const password = process.env.ARROWDB_PASS;

	let cache = new Cache({
		key,
		username,
		password
	});

	/**
	 * @method init
	 * @private
	 * Initialices the instance
	 * @return {void}
	 */
	const init = () => {
		log(LOG_TAG, 'init');

		start()
			.then(() => {
				log(LOG_TAG, 'init - complete');
			})
			.catch(error => {
				log(LOG_TAG, 'init - error', error.message, error.stack);
			});
	};

	/**
	 * @method save
	 * @private
	 * Saves 1 or more items for the same model
	 * @param {object[]} _models Models to save
	 * @return {Promise}
	 */
	const save = async (_items) => {
		log(LOG_TAG, 'save');
		// If it receives an array, saves directly all the items in a batch create, won't use queue
		if (_.isArray(_items)) {
			if (_items.length === 0) {
				log(LOG_TAG, 'save - no items to save');
				return;
			}

			const arrowObjects = _.map(_items, model => {
				return model.forArrow();
			});

			return await cache.save(_items[0].table, arrowObjects);
		}

		// If it's a single model, update its nested objects before the main model first
		const model = _items;
		const dependencies = model.dependencies();

		const requests = dependencies.map(dependency => {
			return save(dependency)
				.then(() => {
					return cache.get(dependency.table, {
						where: {
							uid: dependency.uid
						},
						limit: 1,
						response_json_depth: 1
					});
				})
				.then(([updated]) => {
					dependency.update(updated);

					log(LOG_TAG, 'save - dependency updated', dependency.table);
				});
		});

		await Promise.all(requests);

		return await cache.save(model.table, model.forArrow());
	};

	/**
	 * @method saveAuditLog
	 * saves an audit log
	 * @param {Object} _data Data for the log
	 */
	const saveAuditLog = (_data = {}) => {

		const auditLog = AuditLog.create(_data);
		save(auditLog);

	};

	/**
	 * @method checkUserIsDefined
	 * Checks that the user is defined
	 * @param {String} _user 
	 */
	const checkUserIsDefined = (_user) => {
		if (!_user) {
			throw new RequestError('User is required', 400);
		}
	};
	/**
	 * @method getRateCardModel
	 * Returns the rate card model depending on the app
	 * @param {String} _app 
	 */
	const getRateCardModel = (_app) => {
		return (_app === Constants.apps.APP_AFS) ? RateCardModelAFS : RateCardModelOTHC;
	};

	/**
	 * @method getVerssionModel
	 * Returns the version model depending on the app
	 * @param {String} _app 
	 */
	const getVersionModel = (_app) => {
		return (_app === Constants.apps.APP_AFS) ? VersionModelAFS : VersionModelOTHC;
	};

	/**
	 * @method getRateFactorModel
	 * Returns the rate factor model depending on the app
	 * @param {String} _app 
	 */
	const getRateFactorModel = (_app) => {
		return (_app === Constants.apps.APP_AFS) ? RateFactorModelAFS : RateFactorModelOTHC;
	};

	/**
	 * @method validateVendorCodeInRateCards
	 * @private
	 * validates if a vendor code is available from all vendor codes
	 * @param {string} _app. App that is calling	 	 
	 * @param {string} _name Name to validate
	 * @param {string} _versionType Type of version to validate
	 * @return {Promise<boolean>}
	 */
	const validateVendorCodeInRateCards = async (_app, _names, _versionType, _uid = '') => {
		log(LOG_TAG, 'validateVendorCodeInRateCards', {
			_app,
			_names,
			_versionType,
			_uid,
		});

		if (!_.isArray(_names)) {
			_names = [_names];
		}

		let rateCards = await getRateCards(2, _app);
		if (_uid.length > 0) {
			rateCards = rateCards.filter(rateCard => {
				return rateCard.uid !== _uid;
			});
		}

		const isAvailable = _.every(rateCards, rateCard => {
			return rateCard.hasVendorCodeAvailable(_names, _versionType);
		});

		if (!isAvailable) {
			if (_versionType === 'versionPublished') {
				throw DataError({
					code: 'vendor-published-other-ratecard',
					variable: 'vendorCode.name',
					value: _names.join(',')
				});

			} else {
				throw DataError({
					code: 'duplicated',
					variable: 'vendorCode.name',
					value: _names.join(',')
				});
			}
		}

		return isAvailable;
	};

	/**
	 * @method queryTable
	 * @private
	 * Queries a table and generates a model for the found items
	 * @param {object} _model Model to query
	 * @param {object} _query Query to perform
	 * @return {Promise}
	 */
	const queryTable = async (_model, _query = {}) => {
		log(LOG_TAG, 'queryTable', {
			_model,
			_query
		});

		let items = await cache.get(_model.table, _query);

		items = items.map(item => _model.create(item));

		return items;
	};

	/**
	 * @method parseIds
	 * @private
	 * updates an object to use `uid` instead of `id`, looks for all nested objects
	 * @param {object} _json Object(s) to update
	 * @return {object}
	 */
	const parseIds = (_json) => {
		log(LOG_TAG, 'parseIds', {
			_json
		});
		let result = JSON.parse(JSON.stringify(_json));

		parse(result);

		return result;

		function parse(item) {
			if (_.isArray(item)) {
				parseCollection(item)
			}

			if (_.isObject(item)) {
				parseItem(item);
			}
		}

		function parseCollection(collection) {
			_.each(collection, parseItem);
		}

		function parseItem(item) {
			if (item.id) {
				item.uid = item.id;
			}

			_.each(item, parse);
		}
	};

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method start
	 * Connects the cache with sync, performs all connection initialization
	 * @return {Promise}
	 */
	const start = async () => {
		log(LOG_TAG, 'start');

		return await cache.start();
	};

	/**
	 * @method stop
	 * Clean up memory and releases resources
	 * @return {Promise}
	 */
	const stop = async () => {
		log(LOG_TAG, 'stop');

		return await cache.stop();
	};

	/**
	 * @method getRateCards
	 * obtains the rate cards
	 * @param {number} _depth JSON depth. Default = 1
	 * @param {string} _app. App that is calling	 	 
	 * @return {object[]}
	 */
	const getRateCards = async (_depth = 1, _app) => {
		log(LOG_TAG, 'getRateCards', {
			_depth,
			_app
		});
		const RateCard = getRateCardModel(_app);

		let where;
		if (_app === Constants.apps.APP_AFS) {
			where = {
				'$or': [{
					'app': _app
				}, {
					'app': {
						'$exists': false
					}
				}]
			};
		} else {
			where = {
				'app': _app
			};
		}

		return await queryTable(RateCard, {
			where,
			response_json_depth: _depth
		});
	};

	/**
	 * @method getRateCard
	 * Gets a full rate card with its versions and nested data
	 * @param {string} _app. App that is calling	 	 
	 * @param {string} _rateCardId rate card to get
	 * @param {number} _depth JSON depth. Default = 3
	 * @return {object}
	 */
	const getRateCard = async (_app, _rateCardId, _depth = 3) => {
		log(LOG_TAG, 'getRateCard', {
			_app,
			_rateCardId,
			_depth
		});

		if (!_rateCardId) {
			throw Error('Missing _rateCardId')
		}

		const rateCardId = _rateCardId;
		const RateCard = getRateCardModel(_app);

		const [rateCard] = await queryTable(RateCard, {
			where: {
				'uid': rateCardId
			},
			limit: 1,
			response_json_depth: _depth
		});

		if (!rateCard) {
			throw DataError({
				code: 'not-found',
				variable: 'rateCard.id',
				value: _rateCardId
			});
		}

		return rateCard;
	};

	/**
	 * @method getVersion
	 * Obtains a version object with all its nested data
	 * @param {string} _versionId Version to obtain
	 * @param {string} _app. App that is calling	 	 
	 * @param {object} options additional Options for fetching the version
	 * @param {boolean} options.includeRateFactors=false Include rateFactors in response
	 * @param {number} options.depth=2 JSON depth
	 * @param {boolean} options.baseOnly=true Grabs only de base rate factors, no vendor codes.
	 * @return {object}
	 */
	const getVersion = async (_versionId, _app, {
		includeRateFactors = false,
		baseOnly = true,
		depth = 2
	} = {}) => {
		log(LOG_TAG, 'getVersion', {
			_app,
			_versionId,
			includeRateFactors,
			depth,
			baseOnly,
		});

		if (!_versionId) {
			throw Error('missing _versionId');
		}

		const versionId = _versionId;
		const Version = getVersionModel(_app);

		let requests = [
			queryTable(Version, {
				where: {
					uid: versionId
				},
				limit: 1,
				response_json_depth: depth
			})
		];

		if (includeRateFactors) {
			const where = {
				versionId
			};

			if (baseOnly) {
				_.merge(where, {
					'$or': [{
						vendorCode: ''
					}, {
						vendorCode: {
							'$exists': false
						}
					}]
				})
			}

			const RateFactor = getRateFactorModel(_app);

			requests.push(
				queryTable(RateFactor, {
					where
				})
			);
		}

		const [
			[version], rateFactors = []
		] = await Promise.all(requests);

		if (!version) {
			throw DataError({
				code: 'not-found',
				variable: 'version.id',
				value: _versionId
			});
		}

		return _.extend(version, {
			rateFactors
		});
	};

	/**
	 * @method exportVersion
	 * Obtains a version object with all its nested data
	 * @param {Object} _data. Data to export version 	 
	 * @param {string} _data.app. App that is calling	 	 
	 * @param {string} _data.versionId Version to obtain
	 * @param {string} _data.format Format to return (application/json or application/csv)
	 * @param {string} _data.vendorCode='' Vendor code or base (null)
	 * @return {object}
	 */
	const exportVersion = async (_data) => {
		log(LOG_TAG, 'exportVersion', {
			_data
		});

		const {
			app: _app,
			versionId,
			vendorCode = '',
			format: _format
		} = _data;

		if (!versionId) {
			throw Error('missing _versionId');
		}

		let rateFactors = [];
		const Version = getVersionModel(_app);

		const [version] = await queryTable(Version, {
			where: {
				uid: versionId
			},
			limit: 1,
			response_json_depth: 2
		});

		if (!version) {
			throw DataError({
				code: 'not-found',
				variable: 'version.id',
				value: versionId
			});
		}

		if (!version.archived && !version.published) {
			version.checkVersionIsNotPublishing();
			rateFactors = version.calculateRateFactors();
		} else {
			const RateFactor = getRateFactorModel(_app);
			rateFactors = await queryTable(RateFactor, {
				where: {
					versionId
				}
			});
		}

		const versionWithRateFactors = _.extend(version, {
			rateFactors
		});
		versionWithRateFactors.rateFactors = _.filter(versionWithRateFactors.rateFactors, {
			vendorCode
		});
		let rateFactorsForCSV;
		if (_app === Constants.apps.APP_AFS) {
			rateFactorsForCSV = versionWithRateFactors.rateFactorsWithProducts();
			const fmv = rateFactorsForCSV.fmv || [];
			const out = rateFactorsForCSV.out || [];
			rateFactorsForCSV = [...fmv, ...out];
		} else {
			rateFactorsForCSV = versionWithRateFactors.rateFactors.map(rateFactor => {
				return {
					rateProgram: rateFactor.rateProgram,
					promoCode: rateFactor.promoCode,
					purchaseOption: rateFactor.purchaseOption,
					paymentFrequency: rateFactor.paymentFrequency,
					advancePayments: rateFactor.advancePayments,
					advancePaymentsType: rateFactor.advancePaymentsType,
					term: rateFactor.term,
					amountRangeMin: rateFactor.amountRangeMin,
					amountRangeMax: rateFactor.amountRangeMax,
					paymentLevel: rateFactor.paymentLevel,
					payments: rateFactor.payments,
					points: rateFactor.points,
					value: rateFactor.value
				}
			});
		}
		if (_format !== 'application/json') {
			const options = {
				fillGaps: true
			};
			const csv = await Helpers.jsonToCsv(rateFactorsForCSV, options);
			return csv;
		} else {
			return rateFactorsForCSV;
		}

	};

	/**
	 * @method exportAuditLog
	 * Obtains audit records in josn or csv format
	 * @param {Object} _options. Options for the export
	 * @param {String} _options.app App that is calling	 
	 * @param {String} _options.user User that exports
	 * @param {string} _options.userFiltered User to filter
	 * @param {string} _options.format Format to return (application/json or application/csv)
	 * @param {date} _options.dateFrom Date from to filter
	 * @param {date} _options.dateTo Date to to filter	 
	 * @return {object}
	 */
	const exportAuditLog = async (_options) => {
		log(LOG_TAG, 'exportAuditLog', {
			_options
		});

		const {
			app,
			user,
			userFiltered,
			dateFrom = null,
			dateTo = null,
			format
		} = _options;

		checkUserIsDefined(user);

		let where = {};

		if (dateFrom || dateTo) {
			const startOfDateFrom = moment(dateFrom).startOf('day');
			const endOfDateTo = moment(dateTo).endOf('day');

			where = {
				'$and': [{
					created_at: {
						'$gte': startOfDateFrom
					}
				}, {
					created_at: {
						'$lte': endOfDateTo
					}
				}],
				'app': app
			}
		}
		if (userFiltered !== '') {
			_.merge(where, {
				'user': userFiltered
			})
		}

		let auditLogs = [];

		auditLogs = await queryTable(AuditLog, {
			where
		});

		auditLogs = auditLogs.map(auditLog => auditLog.forAPI());

		if (format !== 'application/json') {
			const options = {
				fillGaps: true
			};
			const csv = await Helpers.jsonToCsv(auditLogs, options);
			return csv;
		} else {
			return auditLogs;
		}
	};

	/**
	 * @method createRateCard
	 * creates a new rate card
	 * @param {string} _app. App that is calling	 	 
	 * @param {Object} _data Data to initialice the rateCard with
	 * @return {Promise<object>}
	 */
	const createRateCard = async (_app, _user, _data = {}) => {
		log(LOG_TAG, 'createRateCard', {
			_app,
			_data
		});

		checkUserIsDefined(_user);

		const rateCards = await getRateCards(1, _app);
		const {
			name
		} = _data;

		Helpers.validateName(rateCards, name);
		const RateCard = getRateCardModel(_app);

		const rateCard = RateCard.create(_data);
		const version = rateCard.createVersion();

		await save(rateCard);

		saveAuditLog({
			app: _app,
			action: Constants.auditAction.rateCard,
			user: _user,
			type: Constants.auditType.create,
			rateCardCode: name,
			versionId: version.uid,
			versionName: version.description(),

		});

		return rateCard;
	};

	/**
	 * @method updateRateCard
	 * Updates a rateCard 
	 * @param {string} _app. App that is calling	 	 
	 * @param {Object} _rateCard to update
	 * @return {object}
	 */
	const updateRateCard = async (_app, _user, _rateCard = {}) => {
		log(LOG_TAG, 'updateRateCard', {
			_app,
			_rateCard
		});

		checkUserIsDefined(_user);

		const {
			name,
			uid: rateCardId
		} = _rateCard;

		if (!rateCardId) {
			throw Error('Missing rateCardId');
		}

		const [rateCard, rateCards] = await Promise.all([
			getRateCard(_app, rateCardId),
			getRateCards(1, _app)
		]);

		Helpers.validateName(rateCards, name, rateCardId);
		rateCard.name = name;
		await save(rateCard);

		const version = rateCard.getVersionInProgress() || rateCard.getVersionPublished() || {};
		const versionId = version.uid || '';
		const versionName = version.uid ? version.description() : '';

		saveAuditLog({
			app: _app,
			action: Constants.auditAction.rateCard,
			user: _user,
			type: Constants.auditType.update,
			vendorCode: version.vendorCodesAsString(),
			rateCardCode: name,
			versionId: versionId,
			versionName: versionName,
		});

		return rateCard;
	};

	/**
	 * @method deleteRateCard
	 * Deletes a rateCard 
	 * @param {string} _app. App that is calling	 	 
	 * @param {String} _user User that delete
	 * @param {String} _rateCardId Ratecard to delete
	 * @return {object}
	 */
	const deleteRateCard = async (_app, _user, _rateCardId) => {

		log(LOG_TAG, 'deleteRateCard', {
			_app,
			_rateCardId
		});

		checkUserIsDefined(_user);

		if (!_rateCardId) {
			throw Error('Missing rateCardId');
		}

		const rateCard = await getRateCard(_app, _rateCardId, 3);
		const version = rateCard.getVersionInProgress() || rateCard.getVersionPublished() || {};
		const versionId = version.uid || '';
		const versionName = version.uid ? version.description() : '';
		const name = rateCard.name;
		rateCard.remove();

		await save(rateCard);

		saveAuditLog({
			app: _app,
			action: Constants.auditAction.rateCard,
			user: _user,
			type: Constants.auditType.delete,
			rateCardCode: name,
			versionId: versionId,
			versionName: versionName,
		});

		return rateCard;
	};

	/**
	 * @method createVersion
	 * Creates a new version with its defaults
	 * @param {Object} _data. Data for version
	 * @return {object}
	 */
	const createVersion = async (_data) => {
		log(LOG_TAG, 'createVersion', {
			_data
		});

		const {
			app: _app,
			user: _user,
			rateCardId: _rateCardId,
			data: _versionData = {}
		} = _data;

		checkUserIsDefined(_user);

		if (!_rateCardId) {
			throw Error('Missing _rateCardId');
		}

		const rateCardId = _rateCardId;
		const rateCard = await getRateCard(_app, rateCardId, 3);

		const versionRemoved = rateCard.getVersionInProgress();
		if (versionRemoved) {
			saveAuditLog({
				app: _app,
				action: Constants.auditAction.rateCardVersion,
				user: _user,
				type: Constants.auditType.delete,
				versionId: versionRemoved.uid,
				versionName: versionRemoved.description(),
				rateCardCode: rateCard.name
			});
		}

		const version = rateCard.createVersion(_versionData);

		await save(rateCard);

		saveAuditLog({
			app: _app,
			action: Constants.auditAction.rateCardVersion,
			user: _user,
			type: Constants.auditType.create,
			versionId: version.uid,
			versionName: version.description(),
			rateCardCode: rateCard.name
		});

		return version;
	};

	/**
	 * @method createProduct
	 * Creates a new product for the given version
	 * @param {object} _data New product data to add
	 * @return {object}
	 */
	const createProduct = async (_data = {}) => {
		log(LOG_TAG, 'createProduct', {
			_data
		});

		const {
			app: _app,
			data: _product
		} = _data;

		const {
			versionId,
		} = _product;

		if (!versionId) {
			throw Error('Missing versionId');
		}

		const version = await getVersion(versionId, _app);
		version.validateVersionIsInProgress();
		const product = version.createProduct(_product);

		await save(version);

		return product;
	};

	/**
	 * @method createVendorCode
	 * Creates a new vendorcode for the given or current version
	 * @param {Object} _data. Data to create the vendor	 	 
	 * @return {object}
	 */
	const createVendorCode = async (_data) => {
		log(LOG_TAG, 'createVendorCode', {
			_data
		});

		const {
			app: _app,
			user: _user,
			data: _vendorCode = {}
		} = _data;

		checkUserIsDefined(_user);

		const {
			rateCardId,
			name,
			points
		} = _vendorCode;

		await validateVendorCodeInRateCards(_app, name, 'versionInProgress', rateCardId);

		const rateCard = await getRateCard(_app, rateCardId);
		const version = rateCard.getVersionInProgress();
		if (!version) {
			throw DataError({
				code: 'no-in-progress',
				variable: 'rateCard',
				value: rateCardId
			});
		}

		version.validateVersionIsInProgress();

		const vendorCode = version.createVendorCode(_vendorCode);

		await save(version);

		saveAuditLog({
			app: _app,
			action: Constants.auditAction.vendorCode,
			user: _user,
			type: Constants.auditType.create,
			versionId: version.uid,
			versionName: version.description(),
			vendorCode: name,
			vendorPoints: points,
			rateCardCode: rateCard.name
		});

		return vendorCode;
	};

	/**
	 * @method updateVendorCode
	 * Updates a vendorcode 
	 * @param {Object} _data. Data to update the vendor 	 
	 * @return {object}
	 */
	const updateVendorCode = async (_data) => {
		log(LOG_TAG, 'updateVendorCode', {
			_data
		});

		const {
			app: _app,
			user: _user,
			data: _vendorCode = {}
		} = _data;

		checkUserIsDefined(_user);

		const {
			uid: vendorCodeId,
			name,
			rateCardId,
			points
		} = _vendorCode;

		if (name) {
			await validateVendorCodeInRateCards(_app, name, 'versionInProgress', rateCardId);
		}

		const rateCard = await getRateCard(_app, rateCardId);
		const version = rateCard.getVersionInProgress();
		if (!version) {
			throw DataError({
				code: 'no-in-progress',
				variable: 'rateCard',
				value: rateCardId
			});
		}

		version.validateVersionIsInProgress();

		const {
			points: oldPoints,
			name: oldName
		} = await version.getVendorCode(vendorCodeId);

		const vendorCode = version.updateVendorCode(_vendorCode);

		await save(version);

		if (name !== oldName) {
			saveAuditLog({
				app: _app,
				action: Constants.auditAction.vendorCode,
				user: _user,
				type: Constants.auditType.update,
				versionId: version.uid,
				versionName: version.description(),
				vendorCode: name,
				vendorPoints: points,
				rateCardCode: rateCard.name
			});
		}
		if (points !== oldPoints) {
			saveAuditLog({
				app: _app,
				action: Constants.auditAction.vendorPoints,
				user: _user,
				type: Constants.auditType.change,
				versionId: version.uid,
				versionName: version.description(),
				vendorCode: name,
				vendorPoints: points,
				rateCardCode: rateCard.name
			});
		}

		return vendorCode;
	};

	/**
	 * @method updateVersion
	 * Updates a version 
	 * @param {Object} _data Data for the update
	 * @param {String} _data.app App that is calling
	 * @param {object} _data.data new data to add in the version
	 * @return {object}
	 */
	const updateVersion = async (_data = {}) => {
		log(LOG_TAG, 'updateVersion', {
			_data
		});

		const {
			app: _app,
			data: _newVersion
		} = _data;

		const {
			uid: versionId
		} = _newVersion;

		if (!versionId) {
			throw Error('Missing versionId');
		}

		const version = await getVersion(versionId, _app);
		version.validateVersionIsInProgress();
		_.extend(_newVersion, {
			canPublish: true
		});
		version.update(_newVersion);

		await save(version);

		return version;
	};

	/**
	 * @method updateCategory
	 * Updates a category 
	 * @param {Object} _data Data for the update
	 * @param {string} _data.app. App that is calling	 	 
	 * @param {object} _data.data new data to add to category
	 * @return {object}
	 */
	const updateCategory = async (_data) => {
		log(LOG_TAG, 'updateCategory', {
			_data
		});

		const {
			app: _app,
			data: _newCategory = {}
		} = _data;

		const {
			versionId
		} = _newCategory;

		const version = await getVersion(versionId, _app);
		version.validateVersionIsInProgress();
		const category = version.updateCategory(_newCategory);

		await save(version);

		return category;
	};

	/**
	 * @method updateProduct
	 * Updates a product 
	 * @param {object} _data new data to add to product
	 * @param {string} _data.app. App that is calling
	 * @param {Object} _data.data Data of the product
	 * @return {object}
	 */
	const updateProduct = async (_data = {}) => {
		log(LOG_TAG, 'updateProduct', {
			_data
		});

		const {
			app: _app,
			data: _newProduct
		} = _data;

		const {
			versionId,
		} = _newProduct;

		const version = await getVersion(versionId, _app);
		version.validateVersionIsInProgress();
		const product = version.updateProduct(_newProduct);

		await save(version);

		return product;
	};
	/**
	 * @method createCategory
	 * Creates a new category and saves it
	 * @param {Object} _data Data fto create category
	 * @param {string} _data.app. App that is calling
	 * @param {Object} _data.data Data of the category
	 * @return {void}
	 */
	const createCategory = async (_data) => {
		log(LOG_TAG, 'createCategory', {
			_data
		});

		const {
			app: _app,
			data: _category = {}
		} = _data;

		const {
			versionId
		} = _category;

		const version = await getVersion(versionId, _app);
		version.validateVersionIsInProgress();
		const category = version.createCategory(_category);

		await save(version);

		return category;
	};

	/**
	 * @method getRateFactorsPublished
	 * Obtains the rateFactors available for a vendor code and publish date
	 * @param {String} _vendorCodeName the vendor code name
	 * @param {String} _lastPublished datetime to start looking from
	 * @param {string} _app. App that is calling	 	 
	 * @return {Promise}
	 */
	const getRateFactorsPublished = async (_vendorCodeName, _lastPublished = '0', _app) => {
		log(LOG_TAG, 'getRateFactorsPublished', {
			_app,
			_vendorCodeName,
			_lastPublished
		});
		const Version = getVersionModel(_app);

		let where = {
			vendorCodeNames: {
				'$in': [_vendorCodeName]
			},
			datePublished: {
				'$gt': _lastPublished
			},
			published: true,
			'$or': [{
				isPublishing: false
			}, {
				isPublishing: {
					'$exists': false
				}
			}]
		};

		if (_app === Constants.apps.APP_AFS) {
			_.merge(where, {
				'$or': [{
					'app': _app
				}, {
					'app': {
						'$exists': false
					}
				}]
			});
		} else {
			_.merge(where, {
				'app': _app
			});
		}

		const [version] = await queryTable(Version, {
			where,
			limit: 1,
			response_json_depth: 2
		});

		// if no version found, return an empty state to prevent errors
		if (!version) {
			return null;
		}

		const RateFactor = getRateFactorModel(_app);

		const rateFactors = await queryTable(RateFactor, {
			where: {
				versionId: version.uid,
				vendorCode: _vendorCodeName
			}
		});

		if (rateFactors.length === 0) {
			return null;
		}

		return _.extend(version, {
			rateFactors
		});
	};

	/**
	 * @method compareVersions
	 * Compare two versions
	 * @param {string} _app. App that is calling	 	 
	 * @param {string} versionBeforeId Version to compare
	 * @param {string} versionAfterId Version to compare
	 * @return {Promise}
	 */
	const compareVersions = async (_app, versionBeforeId, versionAfterId) => {
		log(LOG_TAG, 'compareVersions', {
			_app,
			versionBeforeId,
			versionAfterId
		});

		if (!versionBeforeId) {
			throw Error('versionBeforeId not declared');
		}
		if (!versionAfterId) {
			throw Error('versionAfterId not declared');
		}

		let [
			versionBefore,
			versionAfter
		] = await Promise.all([
			getVersion(versionBeforeId, _app, {
				includeRateFactors: true,
				baseOnly: true
			}),
			getVersion(versionAfterId, _app, {
				includeRateFactors: true,
				baseOnly: true
			})
		]);

		versionBefore.checkVersionIsNotPublishing();
		versionAfter.checkVersionIsNotPublishing();

		if (!versionBefore.archived && !versionBefore.published) {
			versionBefore.calculateRateFactors({
				baseOnly: true
			});
		}

		if (!versionAfter.archived && !versionAfter.published) {
			versionAfter.calculateRateFactors({
				baseOnly: true
			});
		}

		const objVersionBefore = versionBefore.forAPI();
		const objVersionAfter = versionAfter.forAPI();

		const compare = new Compare();

		return compare.compareVersions(objVersionBefore, objVersionAfter);
	};

	/**
	 * @method recalculateRateFactors
	 * Forces all rate factors to be recalculated for a given version
	 * @param {string} _app. App that is calling	 
	 * @param {string} _versionId Version Id to update
	 * @param {object} _version Version
	 * @return {object[]}
	 */
	const recalculateRateFactors = async (_app, _versionId, _version, _options = {}) => {
		log(LOG_TAG, 'recalculateRateFactors', {
			_versionId,
			_version,
			_options
		});

		let version = _version;

		if (!version) {
			version = await getVersion(_versionId, _app);
		}

		if (_options.checkVersionIsNotPublishing) {
			version.checkVersionIsNotPublishing();
		}

		const rateFactors = version.calculateRateFactors(_options);

		return _.extend(version, {
			rateFactors
		});
	};

	/**
	 * @method deleteVendorCode
	 * Deletes a vendor code 
	 * @param {Object} _data. Data to delete the version
	 * @return {object}
	 */
	const deleteVendorCode = async (_data) => {
		log(LOG_TAG, 'deleteVendorCode', {
			_data
		});

		const {
			app: _app,
			user: _user,
			data: _vendorCode = {}
		} = _data;

		checkUserIsDefined(_user);

		const {
			uid,
			rateCardId
		} = _vendorCode;

		const rateCard = await getRateCard(_app, rateCardId);
		const version = rateCard.getVersionInProgress();
		if (!version) {
			throw DataError({
				code: 'no-in-progress',
				variable: 'rateCard',
				value: rateCardId
			});
		}

		version.validateVersionIsInProgress();

		const vendorCode = version.removeVendorCode(uid);

		await save(version);

		saveAuditLog({
			app: _app,
			action: Constants.auditAction.vendorCode,
			user: _user,
			type: Constants.auditType.delete,
			versionId: version.uid,
			versionName: version.description(),
			vendorCode: vendorCode.name,
			vendorPoints: vendorCode.points,
			rateCardCode: rateCard.name
		});

		return vendorCode;
	};

	/**
	 * @method deleteCategory
	 * Deletes a category
	 * @param {Object} _data Data for the update
	 * @param {String} _data.app App that is calling
	 * @param {object} _data.data Data for delete category
	 * @return {object}
	 */
	const deleteCategory = async (_data) => {
		log(LOG_TAG, 'deleteCategory', {
			_data
		});

		const {
			app: _app,
			data: _category = {}
		} = _data;

		const {
			uid,
			versionId
		} = _category;

		const version = await getVersion(versionId, _app);
		version.validateVersionIsInProgress();
		const categoryProducts = _.chain(version.products)
			.filter(product => {
				return product.categoryId === uid;
			})
			.map(product => product.uid)
			.value();

		const category = version.removeCategory(uid);

		await save(version);

		const RateFactor = getRateFactorModel(_app);
		cache.remove(RateFactor.table, {
			productId: {
				'$in': categoryProducts
			}
		});

		return category;
	};

	/**
	 * @method deleteProduct
	 * Deletes a product
	 * @param {Object} _data Data for the deletetion
	 * @param {String} _data.app App that is calling
	 * @param {object} _data.data Data for delete product
	 * @return {object}
	 */
	const deleteProduct = async (_data) => {
		log(LOG_TAG, 'deleteProduct', {
			_data
		});

		const {
			app: _app,
			data: _product
		} = _data;

		const {
			uid,
			versionId
		} = _product;

		const version = await getVersion(versionId, _app);
		version.validateVersionIsInProgress();
		const product = version.removeProduct(uid);

		await save(version);

		const RateFactor = getRateFactorModel(_app);
		cache.remove(RateFactor.table, {
			productId: uid
		});

		return product;
	};

	/**
	 * @method deleteVersion
	 * Deletes a version
	 * @param {Object} _data. Data of the version
	 * @return {object}
	 */
	const deleteVersion = async (_data) => {
		log(LOG_TAG, 'deleteVersion', {
			_data
		});

		const {
			app: _app,
			user: _user,
			data: _version = {}
		} = _data;

		checkUserIsDefined(_user);

		const {
			versionId,
			rateCardId
		} = _version;

		const rateCard = await getRateCard(_app, rateCardId);

		const versionRemoved = rateCard.removeVersion(versionId);
		save(versionRemoved);

		if (_.isEmpty(rateCard.versions)) {
			rateCard.createVersion();
		}

		await save(rateCard);

		saveAuditLog({
			app: _app,
			action: Constants.auditAction.rateCardVersion,
			user: _user,
			type: Constants.auditType.delete,
			versionId: versionRemoved.uid,
			versionName: versionRemoved.description(),
			rateCardCode: rateCard.name
		});

		const RateFactor = getRateFactorModel(_app);

		cache.remove(RateFactor.table, {
			versionId
		});

		return versionRemoved;
	};

	/**
	 * @method publishRateCard
	 * Publishes a version
	 * @param {string} _app. App that is calling	 	 
	 * @param {string} _user 
	 * @param {string} _rateCardIds();
	 * @param {string} _rateCardId 
	 * @return {object}
	 */
	const publishRateCard = async (_app, _user, _rateCardId) => {
		log(LOG_TAG, 'publishRateCard', {
			_app,
			_rateCardId
		});

		checkUserIsDefined(_user);

		const rateCard = await getRateCard(_app, _rateCardId);
		const version = rateCard.getVersionInProgress();

		if (!version) {
			throw DataError({
				code: 'no-in-progress',
				variable: 'rateCard',
				value: _rateCardId
			});
		}

		version.checkVersionIsNotPublishing();
		await validateVendorCodeInRateCards(_app, version.vendorCodeNames, 'versionPublished', _rateCardId);

		rateCard.publishStart();

		await save(rateCard);

		const {
			rateFactors
		} = await recalculateRateFactors(_app, version.uid, version);

		log(LOG_TAG, 'publishRateCard', {
			rateFactors: rateFactors.length
		});

		const RateFactor = getRateFactorModel(_app);

		cache
			.remove(RateFactor.table, {
				versionId: version.uid
			})
			.then(() => {
				log(LOG_TAG, 'publishRateCard - old rate factors removed');
				return save(rateFactors);
			})
			.then(() => {
				log(LOG_TAG, 'publishRateCard - new rate factors saved');

				rateCard.publishEnd();
				return save(rateCard);
			})
			.then(() => {
				log(LOG_TAG, 'publishRateCard - updated rate card model');

				saveAuditLog({
					app: _app,
					action: Constants.auditAction.rateCardVersion,
					user: _user,
					type: Constants.auditType.publish,
					versionId: version.uid,
					versionName: version.description(),
					vendorCode: version.vendorCodesAsString(),
					rateCardCode: rateCard.name
				});
			})
			.catch(error => {
				log(LOG_TAG, 'publishRateCard - error', error.message, error.stack);
			});
		return 'Ratecard is being published';
	};

	/*
	 * @method importVersion
	 * Imports a version into a rate card
	 * @param {Object} _data. Data for the import
	 * @param {String} _data.app App that is calling	 
	 * @param {String} _data.user User that exports
	 * @param {string} _data.toRateCardId Id of ratecard to import to
	 * @return {object}
	 */
	const importVersion = async (_data) => {
		log(LOG_TAG, 'importVersion', {
			_data
		});

		const {
			app: _app,
			user: _user,
			toRateCardId: _rateCardId
		} = _data;

		let {
			version: _version = {}
		} = _data;

		checkUserIsDefined(_user);

		if (_version.rateCardId === _rateCardId) {
			throw RequestError(`Could not import version ${_version.id} within the same rate card.`);
		}
		_version = parseIds(_version);
		_version.vendorCodes = [];

		const rateCard = await getRateCard(_app, _rateCardId);
		const versionRemoved = rateCard.getVersionInProgress();
		if (versionRemoved) {
			saveAuditLog({
				app: _app,
				action: Constants.auditAction.rateCardVersion,
				user: _user,
				type: Constants.auditType.delete,
				versionId: versionRemoved.uid,
				versionName: versionRemoved.description(),
				rateCardCode: rateCard.name
			});
		}

		const version = rateCard.importVersion(_version);

		saveAuditLog({
			app: _app,
			action: Constants.auditAction.rateCardVersion,
			user: _user,
			type: Constants.auditType.import,
			versionId: version.uid,
			versionName: version.description(),
			rateCardCode: rateCard.name
		});

		await save(rateCard);

		return version;
	};

	/**
	 * @method getRateFactors
	 * Return all rateFactors of a version 
	 * @param {string} _versionId Version 
	 * @param {string} _app. App that is calling	 	 
	 * @return {object[]}
	 */
	const getRateFactors = async (_data) => {
		log(LOG_TAG, 'rateFactors', {
			_data
		});

		const {
			app: _app,
			data: _options
		} = _data;

		const {
			versionId,
			vendorCode,
			ratePrograms,
			points = 0,
			purchaseOption,
			paymentFrequency = 'M',
			advancePayments = 0,
			show = 'rates',
		} = _options;

		let version = await getVersion(versionId, _app, {
			baseOnly: false
		});
		version.checkVersionIsNotPublishing();

		let where = {
			versionId
		};
		if (_app === Constants.apps.APP_AFS) {
			_.merge(where, {
				'$or': [{
					vendorCode: ''
				}, {
					vendorCode: {
						'$exists': false
					}
				}]
			});
			if (vendorCode && vendorCode !== Constants.defaultVendorName) {
				where = {
					versionId,
					vendorCode
				};
			}
		} else {
			where = _.merge(where, {
				points,
				paymentFrequency,
				advancePayments
			});
			purchaseOption && (where = _.merge(where, {
				purchaseOption
			}));
		}
		const RateFactor = getRateFactorModel(_app);

		let rateFactors = await queryTable(RateFactor, {
			where: where
		});

		if (ratePrograms) {
			rateFactors = rateFactors.filter(rateFactor => {
				return ratePrograms.includes(rateFactor.rateProgramId);
			})
		}

		_.extend(version, {
			rateFactors
		});

		if (_app === Constants.apps.APP_AFS) {
			return version.rateFactorsWithProducts();
		} else {
			return version.rateFactorsAdmin(show);
		}
	};

	/**
	 * @method batchUpdate
	 * Receives an array of items and a table and updates all the items of the array
	 * @param {Object} _data. Object with the data to update 
	 * @return {String}
	 */
	const batchUpdate = async (_data) => {
		log(LOG_TAG, 'batchUpdate', {
			_data
		});

		const {
			app: _app,
			model: _table,
			items: _itemsToUpdate,
			versionId
		} = _data;

		const validTables = ['category', 'product'];

		if (!validTables.includes(_table)) {
			throw DataError({
				code: 'not-accepted',
				variable: _table,
				value: validTables.join(',')
			});
		}

		const version = await getVersion(versionId, _app);
		version.validateVersionIsInProgress();

		_.each(_itemsToUpdate, newItem => {
			newItem.uid = newItem.id;

			delete newItem.id;

			if (_table === 'category') {
				version.updateCategory(newItem);
			} else {
				version.updateProduct(newItem);
			}
		});

		await save(version);

		return version;
	};

	/**
	 * @method createRateProgram
	 * Creates a new rate program and saves it
	 * @param {Object} _data Data to create rate program
	 * @param {string} _data.app. App that is calling
	 * @param {Object} _data.data Data of the rate program
	 * @return {void}
	 */
	const createRateProgram = async (_data) => {
		log(LOG_TAG, 'createRateProgram', {
			_data
		});

		const {
			app: _app,
			data: _rateProgram = {}
		} = _data;

		const {
			versionId
		} = _rateProgram;

		const version = await getVersion(versionId, _app);
		version.validateVersionIsInProgress();
		const rateProgram = version.createRateProgram(_rateProgram);

		await save(version);

		return rateProgram;
	};

	/**
	 * @method updateRateProgram
	 * Updates a rate program and saves it
	 * @param {Object} _data Data to update rate program
	 * @param {string} _data.app. App that is calling
	 * @param {Object} _data.data Data of the rate program
	 * @return {void}
	 */
	const updateRateProgram = async (_data) => {
		log(LOG_TAG, 'updateRateProgram', {
			_data
		});

		const {
			app: _app,
			data: _rateProgram = {}
		} = _data;

		const {
			versionId
		} = _rateProgram;

		const version = await getVersion(versionId, _app);
		version.validateVersionIsInProgress();
		const rateProgram = version.updateRateProgram(_rateProgram);

		await save(version);

		return rateProgram;
	};
	/**
	 * @method deleteRateProgram
	 * Deletes a Rate Program
	 * @param {Object} _data Data for the deletetion
	 * @param {String} _data.app App that is calling
	 * @param {object} _data.data Data for delete rate program
	 * @return {object}
	 */
	const deleteRateProgram = async (_data) => {
		log(LOG_TAG, 'deleteRateProgram', {
			_data
		});

		const {
			app: _app,
			data: _rateProgram = {}
		} = _data;

		const {
			uid,
			versionId
		} = _rateProgram;

		const version = await getVersion(versionId, _app);
		version.validateVersionIsInProgress();
		const rateProgram = version.removeRateProgram(uid);

		await save(version);

		return rateProgram;
	};
	/**
	 * @method duplicateRateProgram
	 * Duplicates a Rate Program
	 * @param {Object} _data Data for the duplicate
	 * @param {String} _data.app App that is calling
	 * @param {object} _data.data Data for duplicate rate program
	 * @return {object}
	 */
	const duplicateRateProgram = async (_data) => {
		log(LOG_TAG, 'duplicateRateProgram', {
			_data
		});

		const {
			app: _app,
			data: _rateProgram = {}
		} = _data;

		const {
			uid,
			versionId
		} = _rateProgram;

		const version = await getVersion(versionId, _app);
		version.validateVersionIsInProgress();
		const rateProgram = version.duplicateRateProgram(uid);

		await save(version);

		return rateProgram;
	};
	/**
	 * @method getRateProgram
	 * Returns a Rate Program
	 * @param {Object} _data Data for getting rateProgram
	 * @param {String} _data.app App that is calling
	 * @param {object} _data.data Data for getting rate program
	 * @return {object}
	 */
	const getRateProgram = async (_data) => {
		log(LOG_TAG, 'getRateProgram', {
			_data
		});

		const {
			app: _app,
			data: _rateProgram = {}
		} = _data;

		const {
			uid,
			versionId
		} = _rateProgram;

		const version = await getVersion(versionId, _app);
		return version.getRateProgram(uid);
	};
	/**
	 * @method reorderRatePrograms
	 * Reorders the rate programs of the version
	 * @param {Object} _data Data for the roerdering
	 * @param {String} _data.app App that is calling
	 * @param {object} _data.data Data for the reorder
	 * @return {object}
	 */
	const reorderRatePrograms = async (_data) => {
		log(LOG_TAG, 'reorderRatePrograms', {
			_data
		});

		const {
			app: _app,
			data: _reorderData = {}
		} = _data;

		const {
			versionId,
			ratePrograms = []
		} = _reorderData;

		const version = await getVersion(versionId, _app);
		version.validateVersionIsInProgress();

		if (ratePrograms.length !== version.ratePrograms.length) {
			throw RequestError(`All rate programs should be included to reorder.`);
		}

		let order = 0;
		_.each(ratePrograms, rateProgramId => {
			version.updateRateProgram({
				uid: rateProgramId,
				order: ++order
			});
		});
		await save(version);

		return version;
	};
	/**
	 * @method duplicateVersion
	 * Duplicates a version into a rate card
	 * @param {object} _data
	 * @param {String} _data.app App that is calling	 
	 * @param {String} _data.user User that exports
	 * @param {String} _data.rateCardId Id of ratecard 
	 * @param {String} _data.versionId Id of version
	 * @param {Object} _data.data data to add to the new version
	 * @return {object}
	 */
	const duplicateVersion = async (_data = {}) => {
		log(LOG_TAG, 'duplicateVersion', {
			_data
		});

		const {
			app: _app,
			user: _user,
			rateCardId: _rateCardId,
			versionId: _versionId,
			data: _newData
		} = _data;

		checkUserIsDefined(_user);

		const newData = parseIds(_newData);

		const {
			vendorCodes = [],
		} = newData;

		const rateCard = await getRateCard(_app, _rateCardId);
		const originalVersion = await getVersion(_versionId, _app);

		const version = rateCard.duplicateVersion(_versionId, newData);
		await save(rateCard);

		if (vendorCodes.length > 0) {
			_.each(vendorCodes, vendorCode => {
				const vendorInOriginalVersion = _.find(originalVersion.vendorCodes, {
					uid: vendorCode.uid
				});

				if (vendorCode.deleted) {
					saveAuditLog({
						app: _app,
						action: Constants.auditAction.vendorCode,
						user: _user,
						type: Constants.auditType.delete,
						versionId: version.uid,
						versionName: version.description(),
						vendorCode: vendorInOriginalVersion.name,
						vendorPoints: vendorInOriginalVersion.points,
						rateCardCode: rateCard.name
					});
				} else if (vendorInOriginalVersion) {
					if (vendorInOriginalVersion.points !== vendorCode.points) {
						saveAuditLog({
							app: _app,
							action: Constants.auditAction.vendorPoints,
							user: _user,
							type: Constants.auditType.change,
							versionId: version.uid,
							versionName: version.description(),
							vendorCode: vendorCode.name,
							vendorPoints: vendorCode.points,
							rateCardCode: rateCard.name
						});
					}
					if (vendorInOriginalVersion.name !== vendorCode.name) {
						saveAuditLog({
							app: _app,
							action: Constants.auditAction.vendorCode,
							user: _user,
							type: Constants.auditType.update,
							versionId: version.uid,
							versionName: version.description(),
							vendorCode: vendorCode.name,
							vendorPoints: vendorCode.points,
							rateCardCode: rateCard.name
						});
					}

				} else {
					saveAuditLog({
						app: _app,
						action: Constants.auditAction.vendorCode,
						user: _user,
						type: Constants.auditType.create,
						versionId: version.uid,
						versionName: version.description(),
						vendorCode: vendorCode.name,
						vendorPoints: vendorCode.points,
						rateCardCode: rateCard.name
					});
				}

			});
		}

		return version;
	};

	init();

	return {
		batchUpdate,
		compareVersions,
		createCategory,
		createProduct,
		createRateCard,
		createVendorCode,
		createVersion,
		deleteCategory,
		deleteProduct,
		deleteRateCard,
		deleteVendorCode,
		deleteVersion,
		duplicateVersion,
		exportVersion,
		exportAuditLog,
		getRateCard,
		getRateCards,
		getRateFactorsPublished,
		getVersion,
		importVersion,
		publishRateCard,
		getRateFactors,
		recalculateRateFactors,
		start,
		stop,
		updateCategory,
		updateProduct,
		updateRateCard,
		updateVendorCode,
		updateVersion,
		createRateProgram,
		updateRateProgram,
		deleteRateProgram,
		duplicateRateProgram,
		getRateProgram,
		reorderRatePrograms
	};
};

module.exports = DataManager;
