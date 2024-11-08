const Arrow = require('@axway/api-builder-runtime');
const LOG_TAG = '[apis/prod_rate_cards]';
/**
 * @class Apis.afs_rate_cards.rate_cards
 * GET /api/afs_rate_cards/rate_cards
 * This API is only done to not break Production that is on another version as of 10/22/2020
 */
const API = Arrow.API.extend({
	group: 'rate_card',
	path: '/api/afs_rate_cards/rate_cards',
	method: 'GET',
	description: 'Return an empty array',
	parameters: {
		'depth': {
			description: 'Returns an empty array, only to not break release environment',
			type: 'query',
			optional: true
		}
	},
	action: function (req, resp, next) {
		const {
			params: {
				depth
			}
		} = req;

		log(LOG_TAG, {
			depth
		});
		next(null, []);
	}
});

module.exports = API;
