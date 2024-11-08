const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../lib/reusable/helpers');

const LOG_TAG = '[apis/rate_card_update]';

/**
 * @class Apis.afs_rate_cards.rate_card.update
 * POST /api/afs_rate_cards/rate_card/update
 */
const API = Arrow.API.extend({
	group: 'rate_card',
	path: '/api/rate_cards/rate_card/update',
	method: 'POST',
	description: 'Updates a rateCard',
	parameters: {
		id: {
			type: 'body',
			description: 'UID of the rate card to update',
			optional: false
		},
		name: {
			type: 'body',
			description: 'Name of the rateCard',
			optional: true
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
				id: uid,
				name
			}
		} = req;

		log(LOG_TAG, {
			app,
			uid,
			name
		});

		dataManager
			.updateRateCard(app, user, {
				uid,
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
