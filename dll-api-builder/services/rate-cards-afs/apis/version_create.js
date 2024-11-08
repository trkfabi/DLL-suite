const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../lib/reusable/helpers');

const LOG_TAG = '[apis/version_create]';

/**
 * @class Apis.afs_rate_cards.version.create
 * POST /api/afs_rate_cards/version/create
 */
const API = Arrow.API.extend({
	group: 'version',
	path: '/api/rate_cards/version/create',
	method: 'POST',
	description: 'Creates a new version, putting it in progress for the given rate card',
	parameters: {
		rateCardId: {
			type: 'body',
			description: 'UID of the rate card to add this version into',
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
				rateCardId
			}
		} = req;

		log(LOG_TAG, {
			app,
			rateCardId
		});

		dataManager
			.createVersion({
				app,
				user,
				rateCardId
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
