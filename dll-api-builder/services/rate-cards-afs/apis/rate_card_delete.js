const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../lib/reusable/helpers');

const LOG_TAG = '[apis/rate_card_delete]';

/**
 * @class Apis.afs_rate_cards.rate_card.delete
 * POST /api/afs_rate_cards/rate_card/delete
 */
const API = Arrow.API.extend({
	group: 'rate_card',
	path: '/api/rate_cards/rate_card/delete',
	method: 'POST',
	description: 'Deletes a rateCard',
	parameters: {
		'id': {
			type: 'body',
			description: 'ID of the rateCard to delete',
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
				id: rateCardId
			}
		} = req;

		log(LOG_TAG, {
			app,
			rateCardId
		});

		dataManager
			.deleteRateCard(app, user, rateCardId)
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
