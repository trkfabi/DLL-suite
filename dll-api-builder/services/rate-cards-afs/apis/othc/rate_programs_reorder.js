const Arrow = require('@axway/api-builder-runtime');

const LOG_TAG = '[apis/othc/rate_program/reorder]';
const Helpers = require('../../lib/reusable/helpers');
/**
 * @class Apis.rate_cards.othc.rate_program.reorder
 * GET /api/rate_cards/othc/rate_program/reorder
 */
const API = Arrow.API.extend({
	group: 'rateProgram',
	path: '/api/rate_cards/othc/rate_program/reorder',
	method: 'POST',
	description: 'Receives a list of rateprograms to reorder',
	parameters: {
		'versionId': {
			type: 'body',
			description: 'Version of the rate programs',
			optional: false
		},
		'ratePrograms': {
			type: 'body',
			description: 'Rate programs ids to reorder',
			optional: false
		},
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
				ratePrograms
			}
		} = req;

		log(LOG_TAG, {
			app,
			versionId,
			ratePrograms
		});

		dataManager
			.reorderRatePrograms({
				app,
				data: {
					versionId,
					ratePrograms
				}
			})
			.then(version => {
				next(null, version.forAPI().ratePrograms);
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
