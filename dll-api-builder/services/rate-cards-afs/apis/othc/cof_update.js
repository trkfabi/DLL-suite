const Arrow = require('@axway/api-builder-runtime');

const Helpers = require('../../lib/reusable/helpers');
const LOG_TAG = '[apis/othc/cof_update]';

/**
 * @class Apis._rate_cards.cof.update
 * POST /api/rate_cards/othc/cof/update
 */
const API = Arrow.API.extend({
	group: 'cof',
	path: '/api/rate_cards/othc/cof/update',
	method: 'POST',
	description: 'Updates a cof of a version',
	parameters: {
		versionId: {
			type: 'body',
			description: 'version id',
			optional: false
		},
		term: {
			type: 'body',
			description: 'Term of the cof to update',
			optional: false
		},
		value: {
			type: 'body',
			description: 'Value of cof to update',
			optional: false
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
				versionId: uid,
				term,
				value
			}
		} = req;
		log(LOG_TAG, {
			app,
			uid,
			term,
			value
		});

		dataManager
			.updateVersion({
				app,
				data: {
					uid,
					cofs: [{
						term,
						value
					}]
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