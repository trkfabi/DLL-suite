const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../../lib/reusable/helpers');

const LOG_TAG = '[apis/afs/version_update]';

/**
 * @class Apis.rate_cards.afs.version.update
 * POST /api/rate_cards/afs/version/update
 */
const API = Arrow.API.extend({
	group: 'version',
	path: '/api/rate_cards/afs/version/update',
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
		inputs: {
			type: 'body',
			description: 'New inputs to update in the version',
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
				inputs
			}
		} = req;

		log(LOG_TAG, {
			app,
			uid,
			terms,
			inputs
		});

		dataManager
			.updateVersion({
				app,
				data: {
					uid,
					terms,
					inputs
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
