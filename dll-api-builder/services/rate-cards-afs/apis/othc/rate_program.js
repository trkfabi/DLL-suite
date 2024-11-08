const Arrow = require('@axway/api-builder-runtime');

const LOG_TAG = '[apis/othc/rate_program]';
const Helpers = require('../../lib/reusable/helpers');
/**
 * @class Apis.rate_cards.othc.rate_program
 * GET /api/rate_cards/othc/rate_program
 */
const API = Arrow.API.extend({
	group: 'rateProgram',
	path: '/api/rate_cards/othc/rate_program',
	method: 'GET',
	description: 'Obtains a rate program by id',
	parameters: {
		versionId: {
			type: 'query',
			description: 'Version',
			optional: false
		},
		id: {
			type: 'query',
			description: 'Rate program id',
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
				versionId,
				id: uid
			}
		} = req;

		log(LOG_TAG, {
			app,
			versionId,
			uid
		});

		dataManager
			.getRateProgram({
				app,
				data: {
					versionId,
					uid
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
