const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../lib/reusable/helpers');

const LOG_TAG = '[apis/version_import]';

/**
 * @class Apis.afs_rate_cards.version.import
 * POST /api/afs_rate_cards/version/import
 */
const API = Arrow.API.extend({
	group: 'version',
	path: '/api/rate_cards/version/import',
	method: 'POST',
	description: 'Imports a whole version model, which is the json obtained from GET /api/rateCards/exports with all of its nested models.',
	parameters: {
		version: {
			type: 'body',
			description: 'JSON data to import',
			optional: false
		},
		rateCardId: {
			type: 'body',
			description: 'ID of the Rate Card to import the version into',
			optional: false
		}
	},
	action: function (req, resp, next) {
		const {
			headers: {
				'x-userid': user,
				'x-app': app
			},
			server: {
				dataManager
			},
			params: {
				version,
				rateCardId
			}
		} = req;

		log(LOG_TAG, {
			app,
			version,
			rateCardId
		});

		dataManager
			.importVersion({
				app,
				user,
				rateCardId,
				version
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
