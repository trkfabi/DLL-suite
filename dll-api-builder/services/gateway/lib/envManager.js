/**
 * Calls external environments as long as they are in the whitelist
 * @class lib.envManager
 * @singleton
 */
const _ = require('lodash');
const request = require('request-promise-native');
const RequestError = require('./reusable/errors/requestError');

const LOG_TAG = '\x1b[32m' + '[lib/envManager]' + '\x1b[39;49m ';

const EnvManager = (function () {
	// +-------------------
	// | Private members.
	// +-------------------
	let config = null;

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method init
	 * initialices the instance with the server configuration
	 * @param {object} server API Builder instance
	 * @return {void}
	 */
	function init(_server) {
		config = _server.config || {};
	}

	/**
	 * @method call
	 * performs an HTTP request to the given environment
	 * @param {object} params={} Options to request
	 * @return {Promise}
	 */
	const call = (params = {}) => {
		log(LOG_TAG, 'call', params);

		const {
			api,
			environment,
			authorization,
		} = params;

		if (!environment) {
			throw Error('Missing environment');
		}

		if (!api) {
			throw Error('Missing api');
		}

		const {
			environments: {
				[environment]: {
					host,
					apiKey
				} = {}
			} = {}
		} = config;

		if (!host || !apiKey) {
			throw RequestError(`Environment unrecognized: ${environment}`, 400);
		}

		let auth;

		if (!authorization) {
			auth = {
				username: apiKey,
				password: ''
			};
		}

		const options = _.extend(params, {
			url: `${host}${api}`,
			auth,
			headers: {
				authorization
			}
		});

		log(LOG_TAG, 'call', {
			options
		});

		return request(options);

	};

	return {
		init,
		call
	};
})();

module.exports = EnvManager;
