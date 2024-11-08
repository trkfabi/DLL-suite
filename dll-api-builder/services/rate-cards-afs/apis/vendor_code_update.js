const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../lib/reusable/helpers');

const LOG_TAG = '[apis/vendor_code_update]';

/**
 * @class Apis.afs_rate_cards.vendor_code.update
 * POST /api/afs_rate_cards/vendor_code/update
 */
const API = Arrow.API.extend({
	group: 'vendor_code',
	path: '/api/rate_cards/vendor_code/update',
	method: 'POST',
	description: 'Updates a vendor code',
	parameters: {
		id: {
			type: 'body',
			description: 'ID of the vendorcode to update',
			optional: false
		},
		rateCardId: {
			description: 'RateCard ID',
			type: 'body',
			optional: false
		},
		name: {
			type: 'body',
			description: 'Name to update',
			optional: true
		},
		points: {
			description: 'Points to update',
			type: 'body',
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
				rateCardId,
				name,
				points
			}
		} = req;

		log(LOG_TAG, {
			app,
			uid,
			rateCardId,
			name,
			points
		});

		dataManager
			.updateVendorCode({
				app,
				user,
				data: {
					uid,
					rateCardId,
					name,
					points
				}
			})
			.then(vendorCode => {
				next(null, vendorCode.forAPI());
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
