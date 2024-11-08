const Arrow = require('@axway/api-builder-runtime');

const Helpers = require('../../lib/reusable/helpers');
const LOG_TAG = '[apis/othc/spread_update]';

/**
 * @class Apis._rate_cards.spread.update
 * POST /api/rate_cards/othc/spread/update
 */
const API = Arrow.API.extend({
	group: 'spread',
	path: '/api/rate_cards/othc/spread/update',
	method: 'POST',
	description: 'Updates a spread of a rate program',
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
			description: 'Term of the spread to update',
			optional: false
		},
		amountRangeMin: {
			type: 'body',
			description: 'AmountRange minimum of the spread to update',
			optional: false
		},
		amountRangeMax: {
			type: 'body',
			description: 'AmountRange maximum of the spread to update',
			optional: false
		},
		value: {
			type: 'body',
			description: 'Value of spread to update',
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
				amountRangeMin,
				amountRangeMax,
				value
			}
		} = req;
		log(LOG_TAG, {
			app,
			versionId,
			uid,
			term,
			amountRangeMin,
			amountRangeMax,
			value
		});

		dataManager
			.updateRateProgram({
				app,
				data: {
					uid,
					versionId,
					spreads: [{
						term,
						amountRangeMin,
						amountRangeMax,
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
