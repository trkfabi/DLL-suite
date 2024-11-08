const Arrow = require('@axway/api-builder-runtime');

const LOG_TAG = '[apis/rate_card_vendor_codes]';
const Helpers = require('../lib/reusable/helpers');
/**
 * @class Apis.afs_rate_cards.rate_cards_vendor_codes
 * GET /api/afs_rate_cards/rate_cards_vendor_codes
 */
const API = Arrow.API.extend({
	group: 'rate_cards_vendor_codes',
	path: '/api/rate_cards/rate_cards_vendor_codes',
	method: 'GET',
	description: 'Obtains the current list of rate cards with their vendorcodes',
	action: function (req, resp, next) {
		const {
			headers: {
				'x-app': app
			},
			server: {
				dataManager
			}
		} = req;

		log(LOG_TAG, {
			app
		});

		dataManager
			.getRateCards(3, app)
			.then(rateCards => {
				next(null, rateCards.map(rateCard => rateCard.withVendorCodes()));
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
