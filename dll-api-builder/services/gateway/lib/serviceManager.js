/**
 * Carries the list of the services registered in the Gateway and provides functions to search for them
 * @class lib.serviceManager
 * @singleton
 */
const _ = require('lodash');
const request = require('request-promise-native');
const pathToRegexp = require('path-to-regexp');

const LOG_TAG = '\x1b[32m' + '[lib/serviceManager]' + '\x1b[39;49m ';

const ServiceManager = (function () {
	// +-------------------
	// | Private members.
	// +-------------------
	let services = [];

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method init
	 * initialices the instance with the server configuration
	 * @param {object} server API Builder instance
	 * @return {void}
	 */
	function init(server = {}) {
		const {
			config: {
				services: _services = [],
				'service-paths': servicePaths = {}
			}
		} = server;

		services = _services;
		services.forEach(service => {
			const paths = servicePaths[service.name];
			service.paths = paths;
			validate(service);
		});
	}

	/**
	 * @method register
	 * Registers (adds) a new service object in the list
	 * @param {object} service Service to register
	 * @param {string} service.path='' url(s) the service will serve to, in expressjs format 
	 * @param {string} service.host='' host URL to call when the service is required
	 * @return {object} service registered. `null` if an error occured.
	 */
	function register(name) {
		log(LOG_TAG, 'register', {
			name
		});
		const service = findByName(name);

		return service;
	}

	function validate(service = {}) {
		const {
			name,
			host,
			paths,
		} = service;
		let result = [];

		if (!name) {
			const message = `${LOG_TAG} - validate - Missing name - ${name}`;

			result.push(message);
		}

		if (!paths || paths.length < 1) {
			const message = `${LOG_TAG} - validate - Missing paths - ${name}`;

			result.push(message);
		}

		if (!host) {
			const message = `${LOG_TAG} - validate - Missing host - ${name}`;

			result.push(message);
		}

		if (result.length > 0) {
			result.push(JSON.stringify(service));
			throw Error(result.join('\n'));
		}

		return true;
	}

	/**
	 * @method findForUrl
	 * Searches for the first service that matches the given url (based on the service's path)
	 * @param {string} url='' URL to search for
	 * @return {object} service if found, `null` otherwise
	 */
	function findForUrl(url = '') {
		let result = null;

		_.some(services, (service) => {
			const {
				paths
			} = service;

			return _.some(paths, (path) => {
				const regexp = pathToRegexp(path.path);
				const isValid = regexp.test(url);
				if (isValid) {
					result = _.extend({}, service, path);
					return true;
				}

				return false;
			});
		});

		return result;
	}

	/**
	 * @method findByName
	 * Searches for a service using its name
	 * @param {string} name service's name to find
	 * @return {object}
	 */
	function findByName(name) {
		doLog && console.log(LOG_TAG, '- findByName');

		const service = _.find(services, {
			name
		});

		if (!service) {
			throw Error(`Service not found: ${name}`);
		}

		return service;
	}

	/**
	 * @method getServices
	 * Obtains the current list of services registered and their status
	 * @return {object[]}
	 */
	function getServices() {
		return services;
	}

	/**
	 * @method callService
	 * Performs a HTTP call to the service by its name, sending all the additional 
	 * options the request() module could take
	 * @param {string} name Service to call
	 * @param {object} options HTTP options
	 * @return {Promise}
	 */
	async function callService(name, options = {}) {
		log(LOG_TAG, 'callService', {
			name,
			options,
		});

		const service = findByName(name);

		log(LOG_TAG, 'callService', service);

		const {
			host = '',
				apiKey = ''
		} = service;

		const auth = apiKey ? {
			username: apiKey,
			password: ''
		} : undefined;

		_.extend(options, {
			auth,
			url: `${host}${options.url}`,
		});

		log(LOG_TAG, 'callService', 'request options', options);

		return request(options);
	}

	return {
		init,
		register,
		findForUrl,
		findByName,
		getServices,
		callService
	};
})();

module.exports = ServiceManager;
