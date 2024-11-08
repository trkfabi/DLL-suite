const Arrow = require('@axway/api-builder-runtime');
const _ = require('lodash');

const Crypto = require('../lib/crypto');
const ServiceManager = require('../lib/serviceManager');
const ServiceCalls = require('../lib/serviceCalls');
const RequestError = require('../lib/reusable/errors/requestError');
const {
	handleError
} = require('../lib/reusable/helpers');

const LOG_TAG = '\x1b[31m' + '[apis/authenticateAPI]' + '\x1b[39;49m ';

const RefreshTokenAPI = Arrow.API.extend({
	group: 'refreshToken',
	path: '/api/gateway/refreshToken',
	method: 'POST',
	description: 'Refreshes an expired token to be re-used',
	parameters: {
		'include': {
			type: 'query',
			description: 'DEPRECATED. Will ignore now, additional data is based on the current token metadata.',
			optional: true
		},
		'authToken': {
			type: 'body',
			description: 'authToken generated from the authenticate/ API',
			optional: false
		},
		'refreshToken': {
			type: 'body',
			description: 'refreshToken generated from the authenticate/ API',
			optional: false
		}
	},
	action: async function (req, res, next) {
		const {
			server: {
				config: {
					authTokenExpiration,
					refreshTokenExpiration
				}
			},
			params: {
				authToken,
				refreshToken
			}
		} = req;

		log(LOG_TAG, {
			authToken,
			refreshToken
		});

		try {
			const tokenPayload = Crypto.validateToken(authToken, {
				ignoreExpiration: true
			});
			let userId = null;

			const {
				vendorCode,
				rcmPermissions,
				userId: _userId,
				error: {
					message: authMessage = 'Unknown Error.'
				} = {}
			} = (tokenPayload || {});

			userId = _userId;

			if (!userId) {
				throw new RequestError(`Invalid authToken: ${authMessage}`, 401);
			}

			const refreshPayload = Crypto.validateToken(refreshToken, {
				ignoreExpiration: true
			});
			const {
				dllToken,
				error: {
					message: refreshMessage = 'Unknown Error.'
				} = {}
			} = (refreshPayload || {});

			if (!dllToken) {
				throw new RequestError(`Invalid refreshToken: ${refreshMessage}`, 401);
			}

			const newToken = dllToken;

			const response = await ServiceManager.callService('dll-services', {
				url: '/api/dll/authorization',
				method: 'POST',
				json: true,
				body: {
					username: userId,
					password: dllToken
				}
			});

			let {
				success,
				result: {
					AuthenticateResult: {
						Status: {
							Code: code = 'F',
							Message: message
						},
						Data: {
							APIList: {
								APIType: apiType
							}
						},
						UserIdentity
					}
				}
			} = response;

			userId = UserIdentity;

			if (!_.isArray(apiType)) {
				apiType = [apiType];
			}

			if (!success || code !== 'S') {
				throw new RequestError(message || 'Invalid Token', 401);
			}

			let extraInfo = null;

			const include = [];

			if (vendorCode) {
				include.push('vendorCode');
			}

			if (rcmPermissions) {
				include.push('rcmPermissions');
			}

			if (include.length > 0) {
				const groups = ServiceCalls.obtainGroupsForHeader(apiType);
				const requests = include.map(option => {
					switch (option) {
					case 'vendorCode':
						return ServiceCalls.obtainVendorCode({
							userId,
							groups,
						});

					case 'rcmPermissions':
						return ServiceCalls.obtainRCMPermissions({
							userId,
							groups,
						});

					default:
						return null;

					}
				});

				extraInfo = await Promise.all(requests);
			}

			let tokenInfo = {
				userId,
				apiType
			};

			const newRefreshToken = Crypto.generateToken({
				dllToken: newToken
			}, {
				expiresIn: refreshTokenExpiration
			});

			let result = {
				refreshToken: newRefreshToken
			};

			if (extraInfo) {
				_.extend(tokenInfo, ...extraInfo);
				_.extend(result, ...extraInfo);
			}
			const newAuthToken = Crypto.generateToken(tokenInfo, {
				expiresIn: authTokenExpiration
			});

			result.authToken = newAuthToken;

			next(null, result);
		} catch (error) {
			handleError(error, req, res, next);
		}
	}
});

module.exports = RefreshTokenAPI;
