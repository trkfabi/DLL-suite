const Arrow = require('@axway/api-builder-runtime');

const Helpers = require('../../lib/reusable/helpers');
const LOG_TAG = '[apis/afs/input_update]';

/**
 * @class Apis.afs_rate_cards.input.update
 * POST /api/afs_rate_cards/input/update
 */
const API = Arrow.API.extend({
	group: 'input',
	path: '/api/rate_cards/afs/input/update',
	method: 'POST',
	description: 'Updates an input of a version',
	parameters: {
		versionId: {
			type: 'body',
			description: 'version id',
			optional: false
		},
		name: {
			type: 'body',
			description: 'Name of the input to update',
			optional: false
		},
		type: {
			type: 'body',
			description: 'Type of input to update',
			optional: false
		},
		terms: {
			type: 'body',
			description: 'Hash of terms to change in the input',
			optional: true
		},
		creditRatings: {
			type: 'body',
			description: 'List of credit ratings of the input. Ignored for now.',
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
				versionId: uid,
				name,
				type,
				terms,
			}
		} = req;
		log(LOG_TAG, {
			app,
			uid,
			name,
			type,
			terms,
		});

		dataManager
			.updateVersion({
				app,
				data: {
					uid,
					inputs: [{
						name,
						type,
						terms
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
