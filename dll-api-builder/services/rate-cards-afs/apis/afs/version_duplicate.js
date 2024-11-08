const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../../lib/reusable/helpers');

const LOG_TAG = '[apis/version_duplicate]';

/**
 * @class Apis.afs_rate_cards.version.duplicate
 * POST /api/afs_rate_cards/version/duplicate
 */
const API = Arrow.API.extend({
	group: 'version',
	path: '/api/rate_cards/afs/version/duplicate',
	method: 'POST',
	description: 'Duplicates a version',
	parameters: {
		id: {
			type: 'body',
			description: 'ID of the version to copy',
			optional: false
		},
		rateCardId: {
			type: 'body',
			description: 'ID of the Rate Card that contains the version',
			optional: false
		},
		inputs: {
			type: 'body',
			description: 'inputs: [] <1 or more inputs to change from the original version. Optional>',
			optional: true
		},
		terms: {
			type: 'body',
			description: 'terms: [] <list of terms to use in the new version. Optional>',
			optional: true
		},
		categories: {
			type: 'body',
			description: 'categories: [] <1 or more categories to update from the original version. Must include the original id. If it requires to delete an item, must send the property: `deleted: true`. Optional>',
			optional: true
		},
		products: {
			type: 'body',
			description: 'products: [] <1 or more products to update from the original version. Must include the original id and the categoryId. If it requires to delete an item, must send the property: `deleted: true`. Optional>',
			optional: true
		},
		vendorCodes: {
			type: 'body',
			description: 'vendorCodes: [] <1 or more vendor codes to update from the original version. Must include the original id. If it requires to delete an item, must send the property: `deleted: true`>, }',
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
				id,
				rateCardId,
				inputs,
				terms,
				categories,
				products,
				vendorCodes
			}
		} = req;

		log(LOG_TAG, {
			app,
			id,
			rateCardId,
			inputs,
			terms,
			categories,
			products,
			vendorCodes
		});

		dataManager
			.duplicateVersion({
				app,
				user,
				rateCardId,
				versionId: id,
				data: {
					inputs,
					terms,
					categories,
					products,
					vendorCodes
				}
			})
			.then(version => {
				next(null, version.forAPI());
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
