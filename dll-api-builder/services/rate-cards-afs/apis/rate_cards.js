const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../lib/reusable/helpers');

const LOG_TAG = '[apis/rate_cards]';
/**
 * @class Apis.afs_rate_cards.rate_cards
 * GET /api/afs_rate_cards/rate_cards
 */
const API = Arrow.API.extend({
	group: 'rate_card',
	path: '/api/rate_cards/rate_cards',
	method: 'GET',
	description: 'Obtains the current list of rate cards',
	parameters: {
		'depth': {
			description: 'Amount of levels to show nested objects, the larger the depth, the slower the API',
			type: 'query',
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
				depth
			}
		} = req;

		log(LOG_TAG, {
			app,
			depth
		});

		dataManager
			.getRateCards(depth, app)
			.then(rateCards => {
				next(null, rateCards.map(rateCard => rateCard.forAPI()));
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
