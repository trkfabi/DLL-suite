const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../lib/reusable/helpers');

const LOG_TAG = '[apis/version]';

/**
 * @class Apis.afs_rate_cards.version
 * GET /api/afs_rate_cards/version/:id
 */
const API = Arrow.API.extend({
	group: 'version',
	path: '/api/rate_cards/version/:id',
	method: 'GET',
	description: 'Obtains the current list of rate cards',
	parameters: {
		'id': {
			type: 'path',
			description: 'UID of the version to load',
			optional: false
		},
		'options': {
			type: 'query',
			description: 'Options to retrieve the version, as json object, supports: { includeRateFactors: [true|false], baseOnly: [true|false], depth: [1|2|3] }',
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
				id,
				options: _options = '{}'
			}
		} = req;

		let options;

		try {
			options = JSON.parse(_options);
		} catch (error) {
			log(LOG_TAG, 'error parsing options: ', error.message, error.stack);
			options = undefined;
		}

		log(LOG_TAG, {
			app,
			id,
			options
		});

		dataManager
			.getVersion(id, app, options)
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
