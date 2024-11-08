const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../../lib/reusable/helpers');

const LOG_TAG = '[apis/othc/rate_program/delete]';

/**
 * @class Apis.rate_cards.othc.rate_program.delete
 * POST /api/rate_cards/othc/rate_program/delete
 */
const API = Arrow.API.extend({
	group: 'rateProgram',
	path: '/api/rate_cards/othc/rate_program/delete',
	method: 'POST',
	description: 'Deletes a rate program',
	parameters: {
		'versionId': {
			type: 'body',
			description: 'ID of the version that the rate program is in',
			optional: false
		},
		'id': {
			type: 'body',
			description: 'ID of the rate program to delete',
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
				id
			}
		} = req;

		log(LOG_TAG, {
			app,
			versionId,
			id
		});

		dataManager
			.deleteRateProgram({
				app,
				data: {
					versionId,
					uid: id
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
