const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../../lib/reusable/helpers');

const LOG_TAG = '[apis/othc/version_update]';

/**
 * @class Apis.rate_cards.othc.version.update
 * POST /api/rate_cards/othc/version/update
 */
const API = Arrow.API.extend({
	group: 'version',
	path: '/api/rate_cards/othc/version/update',
	method: 'POST',
	description: 'Updates a version',
	parameters: {
		id: {
			type: 'body',
			description: 'UID of the version',
			optional: false
		},
		terms: {
			type: 'body',
			description: 'New terms to use in the this version',
			optional: true
		},
		cofs: {
			type: 'body',
			description: 'New cofs to update in the version',
			optional: true
		}
	},
	action: function (req, resp, next) {
		const {
			headers: {
				'x-app': app
			},
			server: {
				dataManager
			},
			params: {
				id: uid,
				terms,
				cofs
			}
		} = req;

		log(LOG_TAG, {
			app,
			uid,
			terms,
			cofs
		});

		dataManager
			.updateVersion({
				app,
				data: {
					uid,
					terms,
					cofs
				}
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
