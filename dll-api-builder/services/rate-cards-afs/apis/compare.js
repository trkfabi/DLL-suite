const Arrow = require('@axway/api-builder-runtime');

const LOG_TAG = '[apis/compare]';
const Helpers = require('../lib/reusable/helpers');
/**
 * @class Apis.afs_rate_cards.compare
 * GET /api/afs_rate_cards/compare
 */
const API = Arrow.API.extend({
	group: 'compare',
	path: '/api/rate_cards/compare',
	method: 'GET',
	description: 'Compares 2 versions of rate cards and mark their differences without updating any data.',
	parameters: {
		'versionBeforeId': {
			type: 'query',
			description: 'ID of the before version',
			optional: false
		},
		'versionAfterId': {
			type: 'query',
			description: 'ID of the before version',
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
				versionBeforeId,
				versionAfterId
			}
		} = req;

		log(LOG_TAG, {
			app,
			versionBeforeId,
			versionAfterId
		});

		dataManager
			.compareVersions(app, versionBeforeId, versionAfterId)
			.then(results => {
				next(null, results);
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
