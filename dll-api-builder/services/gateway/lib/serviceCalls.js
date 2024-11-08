/**
 * Custom calls to services outside the gateway
 * @class lib.serviceCalls
 * @singleton
 */
const ServiceManager = require('./serviceManager');

const LOG_TAG = '\x1b[36m' + '[lib/serviceCalls]' + '\x1b[39;49m ';

const ServiceCalls = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method obtainGroupsForHeader
	 * Parses the list of APIList into a comma-separated list of strings
	 * @param {object[]} apiList=[] APIList to parse from DLL
	 * @return {string}
	 */
	const obtainGroupsForHeader = (apiType = []) => {
		return apiType.map(api => {
			const {
				Href: group = ''
			} = api;

			return group;
		}).join(',');
	};

	/**
	 * @method obtainAppForHeader
	 * @private
	 * Returns the app depending on the user, this is a temporary method. Should use the group and not the user.
	 * @param {String} _userId User to check for
	 * @return {void}
	 */
	const obtainAppForHeader = (rcmPermissions = '') => {
		rcmPermissions = rcmPermissions.toUpperCase();

		if (~rcmPermissions.indexOf('AFSRCM')) {
			return 'afs';
		}

		if (~rcmPermissions.indexOf('OTHCRCM')) {
			return 'othc';
		}

		return 'afs';
	};

	/**
	 * @method obtainRoleForHeader
	 * @private
	 * Returns the role depending on the user, this is a temporary method. Should use the group and not the user.
	 * @param {String} _userId User to check for
	 * @return {void}
	 */
	const obtainRoleForHeader = (rcmPermissions = '') => {
		rcmPermissions = rcmPermissions.toUpperCase();

		if (~rcmPermissions.indexOf('OTHCRCMADMIN')) {
			return 'admin';
		}

		return 'user';
	};

	/**
	 * @method obtainVendorCode
	 * Retrieves the vendorCode for the given user
	 * @param {object} options Options to use
	 * @param {string} options.userId User id from DLL
	 * @param {string} options.group User group from DLL
	 * @return {Promise<object>}
	 */
	const obtainVendorCode = ({
		groups,
		userId,
	} = {}) => {
		log(LOG_TAG, 'obtainVendorCode', {
			groups,
			userId
		});

		return ServiceManager
			.callService('dll-services', {
				url: '/api/dll/rateCards',
				method: 'GET',
				json: true,
				headers: {
					'x-userId': userId,
					'x-group': groups
				}
			})
			.then(response => {
				const {
					result: {
						RateCard: {
							Rows: {
								Row: {
									0: {
										RP: rateCardId = ''
									} = {}
								} = {}
							} = {}
						} = {}
					},
				} = response;

				if (rateCardId) {
					const [vendorCode] = rateCardId.split(':');

					return {
						vendorCode
					};
				}

				return {
					vendorCode: null
				};
			})
			.catch(error => {
				log(LOG_TAG, 'obtainVendorCode', {
					message: error.message,
					stack: error.stack,
				});
				return {
					vendorCode: null
				};
			});
	};

	/**
	 * @method obtainRCMPermissions
	 * Checks if the user has permission to use the RCM services
	 * @param {object} options Options to use
	 * @param {string} options.userId User id from DLL
	 * @param {string} options.group User group from DLL
	 * @return {Promise<object>}
	 */
	const obtainRCMPermissions = ({
		groups,
		userId,
	} = {}) => {
		log(LOG_TAG, 'obtainRCMPermissions', {
			groups,
			userId
		});

		return ServiceManager
			.callService('rate-cards', {
				url: '/api/rate_cards/authenticate',
				method: 'GET',
				json: true,
				headers: {
					'x-userId': userId,
					'x-group': groups
				}
			})
			.then(response => {
				const {
					result: rcmPermissions,
				} = response;

				return {
					rcmPermissions
				};
			});
	};

	return {
		obtainVendorCode,
		obtainRCMPermissions,
		obtainGroupsForHeader,
		obtainAppForHeader,
		obtainRoleForHeader
	};
})();

module.exports = ServiceCalls;
