const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../lib/reusable/helpers');

const LOG_TAG = '[apis/rate_card_create]';
/**
 * @class Apis.afs_rate_cards.rate_card.create
 * POST /api/afs_rate_cards/rate_card/create
 */
const API = Arrow.API.extend({
	group: 'rate_card',
	path: '/api/rate_cards/rate_card/create',
	method: 'POST',
	description: 'Creates a new Rate Card with a default version',
	parameters: {
		name: {
			type: 'body',
			description: 'Name of the rate card',
			optional: false
		}
	},
	action: function (req, resp, next) {
		const {
			headers: {
				'x-userid': user,
				'x-app': app
			},
			server: {
				dataManager
			},
			params: {
				name
			}
		} = req;

		log(LOG_TAG, {
			name
		});

		dataManager
			.createRateCard(app, user, {
				name
			})
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
