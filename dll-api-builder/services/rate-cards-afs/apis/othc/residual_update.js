const Arrow = require('@axway/api-builder-runtime');

const Helpers = require('../../lib/reusable/helpers');
const LOG_TAG = '[apis/othc/residual_update]';

/**
 * @class Apis._rate_cards.residual.update
 * POST /api/rate_cards/othc/residual/update
 */
const API = Arrow.API.extend({
	group: 'residual',
	path: '/api/rate_cards/othc/residual/update',
	method: 'POST',
	description: 'Updates a residual of a rate program',
	parameters: {
		versionId: {
			type: 'body',
			description: 'version id',
			optional: false
		},
		rateProgramId: {
			type: 'body',
			description: 'rate program id',
			optional: false
		},
		term: {
			type: 'body',
			description: 'Term of the residual to update',
			optional: true
		},
		purchaseOption: {
			type: 'body',
			description: 'Purchase Option of the residual to update',
			optional: false
		},
		value: {
			type: 'body',
			description: 'Value of residual to update',
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
				rateProgramId: uid,
				term,
				purchaseOption,
				value
			}
		} = req;
		log(LOG_TAG, {
			app,
			versionId,
			uid,
			term,
			purchaseOption,
			value
		});

		dataManager
			.updateRateProgram({
				app,
				data: {
					uid,
					versionId,
					residuals: [{
						term,
						purchaseOption,
						value
					}]
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
