const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../../lib/reusable/helpers');

const LOG_TAG = '[apis/othc/rate_program_duplicate]';

/**
 * @class Apis.rate_cards.othc.rate_program.duplicate
 * POST /api/rate_cards/othc/rate_program/duplicate
 */
const API = Arrow.API.extend({
	group: 'rateProgram',
	path: '/api/rate_cards/othc/rate_program/duplicate',
	method: 'POST',
	description: 'Duplicates a rate program for the given version',
	parameters: {
		'versionId': {
			type: 'body',
			description: 'Version of the rate program',
			optional: false
		},
		'id': {
			type: 'body',
			description: 'ID of the rate program',
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
				id: uid,
				versionId
			}
		} = req;

		log(LOG_TAG, {
			app,
			uid,
			versionId
		});

		dataManager
			.duplicateRateProgram({
				app,
				data: {
					uid,
					versionId
				}
			})
			.then(rateProgram => {
				next(null, rateProgram.forAPI());
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
