const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../../lib/reusable/helpers');

const LOG_TAG = '[apis/afs/category_update]';

/**
 * @class Apis.afs_rate_cards.category.update
 * POST /api/afs_rate_cards/category/update
 */
const API = Arrow.API.extend({
	group: 'category',
	path: '/api/rate_cards/afs/category/update',
	method: 'POST',
	description: 'Updates a category',
	parameters: {
		'id': {
			type: 'body',
			description: 'ID of the rate card to add this version into',
			optional: false
		},
		'versionId': {
			type: 'body',
			description: 'Version to add the version',
			optional: false
		},
		'name': {
			type: 'body',
			description: 'Name of the category',
			optional: true
		},
		'order': {
			type: 'body',
			description: 'Number for sorting the category',
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
				order,
				versionId
			}
		} = req;

		log(LOG_TAG, {
			app,
			uid,
			name,
			order,
			versionId
		});

		dataManager
			.updateCategory({
				app,
				data: {
					uid,
					name,
					order,
					versionId
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
