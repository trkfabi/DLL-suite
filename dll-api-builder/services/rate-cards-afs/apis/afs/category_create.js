const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../../lib/reusable/helpers');

const LOG_TAG = '[apis/afs/category_create]';

/**
 * @class Apis.afs_rate_cards.category.create
 * POST /api/afs_rate_cards/category/create
 */
const API = Arrow.API.extend({
	group: 'category',
	path: '/api/rate_cards/afs/category/create',
	method: 'POST',
	description: 'Creates a new category for the given version',
	parameters: {
		'versionId': {
			type: 'body',
			description: 'Version to add the version',
			optional: false
		},
		'name': {
			type: 'body',
			description: 'Name of the category',
			optional: false
		},
		'order': {
			type: 'body',
			description: 'Number for sorting the category',
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
				order,
				versionId
			}
		} = req;

		log(LOG_TAG, {
			name,
			order,
			versionId
		});

		dataManager
			.createCategory({
				app,
				data: {
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
