const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../lib/reusable/helpers');

const LOG_TAG = '[apis/rate_card]';
/**
 * @class Apis.afs_rate_cards.rate_card
 * GET /api/afs_rate_cards/rate_card/:id
 */
const API = Arrow.API.extend({
	group: 'rate_card',
	path: '/api/rate_cards/rate_card/:id',
	method: 'GET',
	description: 'Obtains the current list of rate cards',
	parameters: {
		'id': {
			type: 'path',
			description: 'ID of the rateCard to load',
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
				id
			}
		} = req;

		log(LOG_TAG, {
			id
		});

		dataManager
			.getRateCard(app, id)
			.then(rateCard => {
				next(null, rateCard.forAPI());
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
