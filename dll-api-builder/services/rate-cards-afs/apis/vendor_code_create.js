const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../lib/reusable/helpers');

const LOG_TAG = '[apis/vendor_code_create]';

/**
 * @class Apis.afs_rate_cards.vendor_code.create
 * POST /api/afs_rate_cards/vendor_code/create
 */
const API = Arrow.API.extend({
	group: 'vendor_code',
	path: '/api/rate_cards/vendor_code/create',
	method: 'POST',
	description: 'Creates a new vendor code',
	parameters: {
		'rateCardId': {
			type: 'body',
			description: 'Rate card ID',
			optional: false
		},
		'name': {
			type: 'body',
			description: 'The name of the vendor code',
			optional: false
		},
		'points': {
			type: 'body',
			description: 'Vendor code points',
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
				rateCardId,
				name,
				points
			}
		} = req;

		log(LOG_TAG, {
			app,
			rateCardId,
			name,
			points
		});

		dataManager
			.createVendorCode({
				app,
				user,
				data: {
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
