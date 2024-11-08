/**
 * Connects a microservice with the gatway and pings it over time
 * @class lib.gatewayConnector
 * @version 1.2.0
 * @singleton
 */
const request = require('request-promise-native');
const _ = require('lodash');

const LOG_TAG = '\x1b[32m' + '[lib/gatewayConnector]' + '\x1b[39;49m ';

const GatewayConnector = (function () {
	// +-------------------
	// | Private members.
	// +-------------------
	// const INTERVAL_MS = 5 * 60 * 1000;
	let server = null;
	// let pingInterval = null;

	/**
	 * @method callGateway
	 * @private
	 * Calls the gateway or any api within it directly
	 * @param {object} options={} Request options to send
	 * @return {Promise}
	 */
	function callGateway(params = {}) {
		doLog && console.log(LOG_TAG, '- callGateway');

		const {
			api,
			headers: {
				authorization
			} = {}
		} = params;

		let auth;

		if (!api) {
			throw new Error('Missing api');
		}

		const {
			config: {
				gateway: {
					host,
					apiKey
				}
			}
		} = server;

		if (authorization) {
			doLog && console.debug(`${LOG_TAG} - using custom authorization: ${authorization}`);
		} else {
			auth = {
				username: apiKey,
				password: ''
			};
		}

		const options = _.extend(params, {
			auth,
			url: `${host}${api}`,
		});

		doLog && console.log(`${LOG_TAG} - callGateway - ${JSON.stringify(options)}`);

		return request(options);
	}

	/**
	 * @method pingGateway
	 * @private
	 * Updates the registry in the gateway with the current apis supported
	 * @return {void}
	 */
	/*function pingGateway() {
		console.log(LOG_TAG, '- pingGateway');

		const {
			config: {
				service
			} = {}
		} = server;

		callGateway({
				api: '/api/gateway/register',
				method: 'POST',
				body: {
					name: service
				},
				json: true
			})
			.then(() => {
				console.log(`${LOG_TAG} - pingGateway - Registered in gateway!`);
			})
			.catch((error) => {
				console.error(`${LOG_TAG} - pingGateway - Error registering!: ${JSON.stringify(error)}`);
			});
	}*/

	// +-------------------
	// | Public members.
	// +-------------------
	/**
	 * @method start
	 * Initialices the service and pings the gateway to update its status
	 * @param {object} newServer API Builder instance
	 * @return {void}
	 */
	function start(newServer = {}) {
		log(LOG_TAG, 'start');

		server = newServer;

		// pingInterval = setInterval(pingGateway, INTERVAL_MS);
		// pingGateway();
	}

	/**
	 * @method stop
	 * Prevents the gateway to be called anymore
	 * @return {void}
	 */
	function stop() {
		log(LOG_TAG, 'stop');

		// clearInterval(pingInterval);
		// pingInterval = null;
		server = null;
	}

	/**
	 * @method callExternalAPI
	 * Performs a HTTP request in the gateway
	 * @param {object} [options={}] Options to send (same as those supported by request)
	 * @return {Promise}
	 */
	function callExternalAPI(params = {}) {
		log(LOG_TAG, 'callExternalAPI', params);

		const {
			api,
			environment,
			authorization
		} = params;

		if (!environment) {
			throw Error('Missing environment');
		}

		if (!api) {
			throw Error('Missing api');
		}

		const options = _.extend(params, {
			headers: {
				authorization,
				'x-environment': environment,
			}
		});

		doLog && console.log(`${LOG_TAG} - callExternalAPI - ${JSON.stringify(options)}`);

		return callGateway(options);
	}

	return {
		start,
		stop,
		callExternalAPI
	};
})();

module.exports = GatewayConnector;
