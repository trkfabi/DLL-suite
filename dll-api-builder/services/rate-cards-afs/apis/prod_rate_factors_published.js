const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../lib/reusable/helpers');
const GatewayConnector = require('../lib/reusable/gatewayConnector');
const RequestError = require('../lib/reusable/errors/requestError');

const LOG_TAG = '[apis/afs_rate_factors_published]';

/**
 * @class Apis.afs_rate_cards.rate_factors.published
 * GET /api/afs_rate_cards/rate_factors/published
 */
const API = Arrow.API.extend({
	group: 'rate_factors',
	path: '/api/afs_rate_cards/rate_factors/published',
	method: 'GET',
	description: 'Gets only published rate factors, based on vendor code and publish date',
	parameters: {
		vendorCodeName: {
			description: 'DEPRECATED. Will use token.',
			optional: true,
			type: 'query'
		},
		lastPublished: {
			description: 'Last published date. Default 1970-01-01',
			optional: true,
			type: 'query'
		}
	},
	action: function (req, resp, next) {
		const {
			server: {
				dataManager,
				config: {
					envName: environment
				}
			},
			params: {
				lastPublished,
				app = 'afs'
			},
			headers: {
				'x-userId': userId,
				'x-groups': groups,
				'x-token': authorization
			}
		} = req;

		log(LOG_TAG, {
			app,
			lastPublished
		});

		GatewayConnector
			.callExternalAPI({
				environment,
				authorization,
				api: '/api/dll/rateCards',
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

					return vendorCode;
				}

				throw new RequestError('The user does not have a valid vendor code');
			})
			.then(vendorCode => {
				log({
					vendorCode
				});
				return dataManager.getRateFactorsPublished(vendorCode, lastPublished, 'afs');
			})
			.then(version => {
				if (version) {
					next(null, version.forAPI());
				} else {
					next(null, {});
				}
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
