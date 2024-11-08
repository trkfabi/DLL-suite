const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../../lib/reusable/helpers');

const LOG_TAG = '[apis/afs/category/delete]';

/**
 * @class Apis.afs_rate_cards.category.delete
 * POST /api/afs_rate_cards/category/delete
 */
const API = Arrow.API.extend({
	group: 'category',
	path: '/api/rate_cards/afs/category/delete',
	method: 'POST',
	description: 'Deletes a category',
	parameters: {
		'id': {
			type: 'body',
			description: 'ID of the category to delete',
			optional: false
		},
		'versionId': {
			type: 'body',
			description: 'ID of the version that the category is in',
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
			.deleteCategory({
				app,
				data: {
					versionId,
					uid: id
				}
			})
			.then(category => {
				next(null, category.forAPI());
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
