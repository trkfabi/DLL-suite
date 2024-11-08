const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../lib/reusable/helpers');

const LOG_TAG = '[apis/vendor_code_delete]';

/**
 * @class Apis.afs_rate_cards.vendor_code.delete
 * POST /api/afs_rate_cards/vendor_code/delete
 */
const API = Arrow.API.extend({
	group: 'vendor_code',
	path: '/api/rate_cards/vendor_code/delete',
	method: 'POST',
	description: 'Deletes a vendor code',
	parameters: {
		'rateCardId': {
			type: 'body',
			description: 'Rate card ID',
			optional: false
		},
		'id': {
			type: 'body',
			description: 'ID of the vendor code to delete',
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
				rateCardId,
				id
			}
		} = req;

		log(LOG_TAG, {
			app,
			rateCardId,
			id
		});

		dataManager
			.deleteVendorCode({
				app,
				user,
				data: {
					rateCardId,
					uid: id
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
