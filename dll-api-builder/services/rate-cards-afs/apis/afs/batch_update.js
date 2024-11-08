const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../../lib/reusable/helpers');

const LOG_TAG = '[apis/afs/batch_update]';

/**
 * @class Apis.afs_rate_cards.batch_update
 * POST /api/afs_rate_cards/batch_update
 */
const API = Arrow.API.extend({
	group: 'batch_update',
	path: '/api/rate_cards/afs/batch_update',
	method: 'POST',
	description: 'Batch update',
	parameters: {
		model: {
			description: 'Model name to update ("product", "category")',
			optional: false,
			type: 'body'
		},
		items: {
			description: 'Items to update, must be an array of object. Id is required, name, order will be updated if provided',
			optional: false,
			type: 'body'
		},
		versionId: {
			type: 'body',
			description: 'Id of Version items belong to',
			optional: false
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
				model,
				items,
				versionId
			}
		} = req;

		log(LOG_TAG, {
			app,
			model,
			items,
			versionId
		});

		dataManager
			.batchUpdate({
				app,
				model,
				items,
				versionId
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
