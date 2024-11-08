const Arrow = require('@axway/api-builder-runtime');

const LOG_TAG = '[apis/othc/rate_programs]';
const Helpers = require('../../lib/reusable/helpers');
/**
 * @class Apis.rate_cards.othc.rate_programs
 * GET /api/rate_cards/othc/rate_programs
 */
const API = Arrow.API.extend({
	group: 'rateProgram',
	path: '/api/rate_cards/othc/rate_programs',
	method: 'GET',
	description: 'Obtains the current list of rate programs for a version',
	parameters: {
		versionId: {
			type: 'query',
			description: 'Version',
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
				versionId
			}
		} = req;

		log(LOG_TAG, {
			app,
			versionId
		});

		dataManager
			.getVersion(versionId, app)
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
