const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../lib/reusable/helpers');

const LOG_TAG = '[apis/version_delete]';

/**
 * @class Apis.afs_rate_cards.version.delete
 * POST /api/afs_rate_cards/version/delete
 */
const API = Arrow.API.extend({
	group: 'version',
	path: '/api/rate_cards/version/delete',
	method: 'POST',
	description: 'Deletes a version',
	parameters: {
		'id': {
			type: 'body',
			description: 'ID of the version to delete',
			optional: false
		},
		'rateCardId': {
			type: 'body',
			description: 'ID of the rateCard of the version',
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
				id,
				rateCardId
			}
		} = req;

		log(LOG_TAG, {
			app,
			id,
			rateCardId
		});

		dataManager
			.deleteVersion({
				app,
				user,
				data: {
					versionId: id,
					rateCardId
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
