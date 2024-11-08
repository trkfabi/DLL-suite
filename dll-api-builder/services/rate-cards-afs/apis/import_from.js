const Arrow = require('@axway/api-builder-runtime');
const GatewayConnector = require('../lib/reusable/gatewayConnector');
const Helpers = require('../lib/reusable/helpers');
const RequestError = require('../lib/reusable/errors/requestError');

const LOG_TAG = '[apis/import_from]';

/**
 * @class Apis.afs_rate_cards.import_from
 * POST /api/afs_rate_cards/import_from
 */
const API = Arrow.API.extend({
	group: 'import_from',
	path: '/api/rate_cards/import_from',
	method: 'POST',
	description: 'Imports a version from an environment to actual environment',
	parameters: {
		environment: {
			type: 'body',
			description: 'Name of the environment to import from',
			optional: false
		},
		fromVersionId: {
			type: 'body',
			description: 'id (in the external environment) of the version to import from.',
			optional: false
		},
		toRateCardId: {
			type: 'body',
			description: 'id of the rate card to import to.',
			optional: false
		}
	},
	action: function (req, resp, next) {
		const {
			headers: {
				'x-token': authorization,
				'x-userid': user,
				'x-app': app
			},
			server: {
				dataManager,
				config: {
					envName
				}
			},
			params: {
				environment,
				fromVersionId,
				toRateCardId
			}
		} = req;

		log(LOG_TAG, {
			app,
			envName,
			environment,
			fromVersionId,
			toRateCardId
		});

		Promise
			.resolve(true)
			.then(() => {
				return GatewayConnector
					.callExternalAPI({
						environment,
						authorization,
						api: `/api/rate_cards/version/${fromVersionId}`,
						method: 'GET',
						json: true
					});
			})
			.then(response => {
				const {
					result
				} = response;
				if (!result) {
					throw RequestError(`Version ${fromVersionId} is empty in environment: ${environment}`, 400);
				}

				return dataManager.importVersion({
					app,
					user,
					toRateCardId,
					version: result
				});
			})
			.then(version => {
				next(null, version.forAPI());
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
