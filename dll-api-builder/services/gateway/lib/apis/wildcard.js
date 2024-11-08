const _ = require('lodash');
const Auth = require('../auth');
const RequestError = require('../reusable/errors/requestError');
const ServiceManager = require('../serviceManager');
const ServiceCalls = require('../serviceCalls');
const EnvManager = require('../envManager');
const {
	handleError
} = require('../reusable/helpers');

/**
 * Specian path in expressjs registered for managing all API calls that may require to connect to another service.
 * Specific for the Gateway inter-connections
 * @class lib/apis.wildcard
 * @singleton
 */

const LOG_TAG = '\x1b[32m' + '[lib/apis/wildcard]' + '\x1b[39;49m ';

const Wildcard = (function () {
	// +-------------------
	// | Private members.
	// +-------------------
	let server = null;

	/**
	 * @method register
	 * @private
	 * Self-registers to listen any incoming request in the server
	 * @return {void}
	 */
	const register = () => {
		server.all('*', handleMainRedirect);
	};

	/**
	 * @method handleMainRedirect
	 * @private
	 * Manages the redirection of any call to its service, ignoring gateway calls
	 * @param {object} req Request options
	 * @param {object} res Response options
	 * @param {function} next continue callback options
	 * @return {void}
	 */
	const handleMainRedirect = (req, res, next) => {
		const init = () => {
			const {
				method,
				body: reqBody = {},
				originalUrl: url,
				query = {}
			} = req;

			log(LOG_TAG, 'handleMainRedirect', {
				method,
				reqBody,
				url,
				query
			});

			let json = false;

			if (url.startsWith('/api/gateway') || url.startsWith('/apibuilderPing.json')) {
				next();
				return;
			}

			res.header('Access-Control-Allow-Origin', '*');
			res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
			res.header('Access-Control-Allow-Headers', 'origin, x-requested-with, content-type, accept, authorization');
			res.header('Access-Control-Expose-Headers', 'content-type, response-time, Content-Disposition');

			if (method === 'OPTIONS') {
				res.status(200).send();
				return;
			}

			const environment = req.get('x-environment');

			if (environment) {
				log(LOG_TAG, {
					environment
				});
				const authorization = req.get('authorization');

				return Promise.resolve()
					.then(() => {
						return EnvManager.call({
							environment,
							method,
							authorization,
							json: true,
							api: url,
						});
					})
					.then(response => {
						log(LOG_TAG, {
							response
						});

						res
							.status(200)
							.json(response);
						next();
					})
					.catch(error => {
						handleError(error, req, res, next);
					});
			}

			const service = ServiceManager.findForUrl(url);

			if (!service) {
				log(LOG_TAG, 'no service for url: ', url);
				handleError(new RequestError('API not supported.', 404), req, res, next);
				return;
			}

			const {
				name,
				requiresAuth
			} = service;

			Promise.resolve()
				.then(() => {
					if (requiresAuth) {
						const auth = new Auth(server);
						return auth.validateRequest(req, res);
					}

					return true;
				})
				.then(() => {
					let {
						rcmPermissions = '',
							userId = null,
							apiType = [],
					} = req.tokenPayload || {};

					if (!_.isArray(apiType)) {
						apiType = [apiType];
					}
					const groups = ServiceCalls.obtainGroupsForHeader(apiType);
					const app = ServiceCalls.obtainAppForHeader(rcmPermissions);
					const role = ServiceCalls.obtainRoleForHeader(rcmPermissions);
					const contentType = req.get('content-type') || 'application/json';
					const accept = req.get('accept') || 'application/json';
					json = contentType.includes('application/json') && accept.includes('application/json');

					const headers = {
						'x-userId': userId,
						'x-group': groups,
						'x-app': app,
						'x-role': role,
						'x-token': req.get('authorization'),
						'accept': accept,
						'content-type': contentType,
					};

					const body = json ? reqBody : JSON.stringify(reqBody);

					log(LOG_TAG, {
						url,
						query,
						method,
						body,
						headers,
						json,
					});

					return ServiceManager.callService(name, {
						url,
						qs: query,
						method,
						body,
						headers,
						json,
						resolveWithFullResponse: true
					});
				})
				.then((response) => {
					const {
						statusCode = 200,
							body = {},
							headers = {}
					} = response;
					res
						.status(statusCode)
						.set(headers)
						.send(body);

					next();
				}).catch(error => {
					handleError(error, req, res, next);
				});
		};

		init();
	};

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method init
	 * Initialices the API
	 * @param {object} newServer Express.js server instance
	 * @return {void}
	 */
	const init = (newServer) => {
		server = newServer;
		register();
	};

	return {
		init
	};
})();

module.exports = Wildcard;
