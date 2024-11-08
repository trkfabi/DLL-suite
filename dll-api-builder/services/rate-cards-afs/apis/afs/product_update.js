const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../../lib/reusable/helpers');

const LOG_TAG = '[apis/afs/product_update]';

/**
 * @class Apis.api.afs_rate_cards.product.update
 * POST /api/afs_rate_cards/product/update
 */
const API = Arrow.API.extend({
	group: 'product',
	path: '/api/rate_cards/afs/product/update',
	method: 'POST',
	description: 'Updates a product',
	parameters: {
		'id': {
			type: 'body',
			description: 'Id of the product',
			optional: false
		},
		'name': {
			type: 'body',
			description: 'Name of the product. Must be unique in the version',
			optional: true
		},
		'categoryId': {
			type: 'body',
			description: 'Category the products belongs to. Must exist in the version.',
			optional: false
		},
		'order': {
			type: 'body',
			description: 'Order number for sorting.',
			optional: true
		},
		'versionId': {
			type: 'body',
			description: 'Version the product belongs to.',
			optional: false
		},
		'hasItad': {
			type: 'body',
			description: 'true if the product must include an ITAD value',
			optional: true
		},
		'itadValue': {
			type: 'body',
			description: 'value for ITAD.',
			optional: true
		},
		'ratesEnabled': {
			type: 'body',
			description: 'Array of rates for the product. Must be any value(s) from "fmv", "1-out"',
			optional: true
		},
		'terms': {
			type: 'body',
			description: 'Object containing the term values for its residual values',
			optional: true
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
				id: uid,
				name,
				categoryId,
				order,
				versionId,
				hasItad,
				itadValue,
				ratesEnabled,
				terms
			}
		} = req;

		log(LOG_TAG, {
			app,
			uid,
			name,
			categoryId,
			order,
			versionId,
			hasItad,
			itadValue,
			ratesEnabled,
			terms
		});

		dataManager
			.updateProduct({
				app,
				data: {
					uid,
					name,
					categoryId,
					order,
					versionId,
					hasItad,
					itadValue,
					ratesEnabled,
					terms
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
