const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../../lib/reusable/helpers');

const LOG_TAG = '[apis/product_create]';

/**
 * @class Apis.afs_rate_cards.product.create
 * POST /api/afs_rate_cards/product/create
 */
const API = Arrow.API.extend({
	group: 'product',
	path: '/api/rate_cards/afs/product/create',
	method: 'POST',
	description: 'Creates a new product for the given version',
	parameters: {
		'name': {
			type: 'body',
			description: 'Name of the product. Must be unique in the version',
			optional: false
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
		},
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
				name,
				categoryId,
				order,
				versionId,
				hasItad,
				itadValue,
				ratesEnabled,
				terms,
			}
		} = req;

		log(LOG_TAG, {
			app,
			name,
			categoryId,
			order,
			versionId,
			hasItad,
			itadValue,
			ratesEnabled,
			terms,
		});

		dataManager
			.createProduct({
				app,
				data: {
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
