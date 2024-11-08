const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../lib/reusable/helpers');

const LOG_TAG = '[apis/rate_card_publish]';
/**
 * @class Apis.rate_cards
 * POST /api/afs_rate_cards/rate_card/publish
 */
const API = Arrow.API.extend({
	group: 'rate_card',
	path: '/api/rate_cards/rate_card/publish',
	method: 'POST',
	description: 'Marks a version of a ratecard published and invalidates (archives) any other version of that same rate card. If the version includes some vendor codes with additional points in it, it will generate additional rate factor models for those vendor codes + points',
	parameters: {
		id: {
			type: 'body',
			description: 'ID of the rate card to publish. Must have a versionInProgress',
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
				id
			}
		} = req;

		log(LOG_TAG, {
			id
		});

		dataManager
			.publishRateCard(app, user, id)
			.then(result => {
				next(null, result);
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
