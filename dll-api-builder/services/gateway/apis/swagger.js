const Arrow = require('@axway/api-builder-runtime');
const request = require('request-promise-native');
const ServiceManager = require('../lib/serviceManager');
const _ = require('lodash');

const LOG_TAG = '\x1b[31m' + '[apis/swagger]' + '\x1b[39;49m ';

const SwaggerAPI = Arrow.API.extend({
	group: 'swagger',
	path: '/api/gateway/swagger',
	method: 'GET',
	description: 'Obtains a complete swagger definition of all the available services.',
	parameters: {

	},
	action: function (req, res, next) {
		const {
			server: {
				config: {
					apiPrefix: gwApiPrefix,
					gateway: {
						host: gwHost
					}
				}
			}
		} = req;
		const services = ServiceManager.getServices();
		let globalSwagger;

		log(LOG_TAG);

		request({
				url: obtainSwaggerUrl(gwHost),
				json: true
			})
			.then(gatewaySwagger => {
				log(LOG_TAG, {
					gatewaySwagger
				});

				const gwPrefix = obtainAPIPrefix(gwApiPrefix);

				globalSwagger = JSON.parse(JSON.stringify(gatewaySwagger));
				globalSwagger.basePath = '/api';
				globalSwagger.paths = {};

				extendPaths(globalSwagger.paths, gatewaySwagger.paths, gwPrefix);

				const requests = services.map((service) => {
					const {
						host
					} = service;
					const url = obtainSwaggerUrl(host);

					return request({
							url,
							json: true
						})
						.catch(error => {
							log(LOG_TAG, 'error calling a service:', error.message, error.stack);
							return {};
						});
				});
				return Promise.all(requests);
			})
			.then(swaggers => {
				log(LOG_TAG, 'swagger complete.');

				swaggers = _.compact(swaggers);
				_.each(swaggers, (swagger) => {
					const apiPrefix = swagger.basePath || '';
					const servicePrefix = obtainAPIPrefix(apiPrefix);

					globalSwagger.consumes && globalSwagger.consumes.concat(swagger.consumes || []);
					globalSwagger.produces && globalSwagger.produces.concat(swagger.produces || []);

					extendPaths(globalSwagger.paths, swagger.paths, servicePrefix);
					_.merge(globalSwagger.definitions, swagger.definitions);
				});

				globalSwagger.securityDefinitions = {};
				globalSwagger.security = [];

				res.json(globalSwagger);
				next();
			})
			.catch(error => {
				log(LOG_TAG, 'error generating swagger', error.message, error.stack);
				next('An error occured.');
			});

		function obtainSwaggerUrl(host) {
			const url = `${host}/apidoc/swagger.json`;
			return url;
		}

		function obtainAPIPrefix(apiPrefix) {
			const result = apiPrefix.replace(/^\/api(\/[\w-]+)$/, '$1');
			return result;
		}

		function extendPaths(pathsTo, pathsFrom, prefix) {
			const realFromPaths = _.mapKeys(pathsFrom, (value, name) => {
				const result = `${prefix}${name}`;
				return result;
			});

			_.extend(pathsTo, realFromPaths);
		}
	}
});

module.exports = SwaggerAPI;
