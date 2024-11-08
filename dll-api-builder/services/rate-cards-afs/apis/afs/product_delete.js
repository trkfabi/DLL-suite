const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../../lib/reusable/helpers');

const LOG_TAG = '[apis/afs/product/delete]';

/**
 * @class Apis.afs_rate_cards.product.delete
 * POST /api/afs_rate_cards/product/delete
 */
const API = Arrow.API.extend({
	group: 'product',
	path: '/api/rate_cards/afs/product/delete',
	method: 'POST',
	description: 'Deletes a product',
	parameters: {
		'versionId': {
			type: 'body',
			description: 'ID of the version that the product is in',
			optional: false
		},
		'id': {
			type: 'body',
			description: 'ID of the product to delete',
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
				versionId,
				id
			}
		} = req;

		log(LOG_TAG, {
			app,
			versionId,
			id
		});

		dataManager
			.deleteProduct({
				app,
				data: {
					versionId,
					uid: id
				}
			})
			.then(product => {
				next(null, product.forAPI());
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
