const Arrow = require('@axway/api-builder-runtime');
const GatewayConnector = require('../lib/reusable/gatewayConnector');
const Helpers = require('../lib/reusable/helpers');
const _ = require('lodash');

const LOG_TAG = '[apis/import_list]';

const ENVS_MAP = {
	dev: ['dev', 'tst', 'acc'],
	tst: ['tst', 'acc'],
	acc: ['tst', 'acc'],
	release: ['release'],
};

/**
 * @class Apis.afs_rate_cards.import_list
 * GET /api/afs_rate_cards/import_list
 */
const API = Arrow.API.extend({
	group: 'import_list',
	path: '/api/rate_cards/import_list',
	method: 'GET',
	description: 'Returns the list of versions to import from another environments',
	action: function (req, resp, next) {
		const {
			server: {
				config: {
					envName
				}
			},
			headers: {
				'x-token': authorization
			}
		} = req;

		const environments = ENVS_MAP[envName];

		log(LOG_TAG);

		const requests = _.map(environments, (environment) => {
			return Promise
				.resolve()
				.then(() => {
					return GatewayConnector
						.callExternalAPI({
							environment,
							authorization,
							api: '/api/rate_cards/rate_cards',
							qs: {
								depth: 2
							},
							json: true
						})
				})
				.then(response => {
					return {
						environment,
						rateCards: response.result
					};
				});
		});

		Promise
			.all(requests)
			.then(responses => {
				next(null, responses);
			})
			.catch(error => {
				Helpers.handleError(error, req, resp, next);
			})
			.catch(error => {
				console.error(LOG_TAG, 'error: ', error.stack, error);
				next('An internal error occured');
			});
	}
});

module.exports = API;
