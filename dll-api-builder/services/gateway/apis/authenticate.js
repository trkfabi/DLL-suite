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

const AuthenticateAPI = Arrow.API.extend({
	group: 'authenticate',
	path: '/api/gateway/authenticate',
	method: 'POST',
	description: 'Login a username and password against DLL services. Returning its associated data and tokens.',
	parameters: {
		'username': {
			type: 'body',
			description: 'Name of the user to authenticate in DLL services. Email or SSO ID',
			optional: false
		},
		'password': {
			type: 'body',
			description: 'Password used in DLL services.',
			optional: false
		},
		'include': {
			type: 'query',
			description: 'Additional attributed to include from DLL supported values: (vendorCode, rcmPermissions)',
			optional: true
		},
		'secure': {
			type: 'body',
			description: 'Api builder should encrypt the password',
			optional: true
		}
	},
	action: async function (req, res, next) {
		const {
			server: {
				config: {
					authTokenExpiration,
					refreshTokenExpiration
				} = {}
			} = {},
			params: {
				username,
				password,
				include = '',
				secure = true
			} = {}
		} = req;

		log(LOG_TAG, {
			username,
			password,
			include,
			secure
		});

		const fjrlEKW311 = secure ? Crypto.encrypt(password) : password;
		const additionalOptions = include.split(',');
		try {
			const response = await ServiceManager.callService('dll-services', {
				url: '/api/dll/authorization',
				method: 'POST',
				json: true,
				body: {
					username,
					password: fjrlEKW311
				}
			});

			const {
				success,
				result: {
					AuthenticateResult: {
						Status: {
							Code: code,
							Message: message
						} = {}
					} = {}
				} = {}
			} = response;

			log(LOG_TAG, {
				response
			});

			if (!success || code !== 'S') {
				log(LOG_TAG, 'invalid user');
				throw new RequestError(message, 401);
			}

			let {
				result: {
					AuthenticateResult: {
						UserIdentity: userId,
						Data: {
							APIList: {
								APIType: apiType
							}
						} = {}
					} = {}
				} = {}
			} = response;

			if (!_.isArray(apiType)) {
				apiType = [apiType];
			}

			const refreshToken = Crypto.generateToken({
				dllToken: fjrlEKW311
			}, {
				expiresIn: refreshTokenExpiration,
				mutatePayload: true
			});

			let extraInfo = null;

			if (include) {
				const groups = ServiceCalls.obtainGroupsForHeader(apiType);
				const requests = additionalOptions.map(option => {
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

			let result = {
				userId,
				apiType,
				refreshToken
			};
			let tokenInfo = {
				userId,
				apiType
			};

			if (extraInfo) {
				_.extend(result, ...extraInfo);
				_.extend(tokenInfo, ...extraInfo);
			}

			const authToken = Crypto.generateToken(tokenInfo, {
				expiresIn: authTokenExpiration
			});

			result.authToken = authToken;

			next(null, result);
		} catch (error) {
			handleError(error, req, res, next);
		}
	}
});

module.exports = AuthenticateAPI;
