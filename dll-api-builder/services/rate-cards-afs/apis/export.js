const Arrow = require('@axway/api-builder-runtime');
const RequestError = require('../lib/reusable/errors/requestError');
const Helpers = require('../lib/reusable/helpers');

const LOG_TAG = '[apis/export]';

/**
 * @class Apis.afs_rate_cards.export
 * GET /api/afs_rate_cards/export
 */
const API = Arrow.API.extend({
	group: 'export',
	path: '/api/rate_cards/export',
	method: 'GET',
	description: 'Exports a version',
	parameters: {
		versionId: {
			description: 'Id of the version to export.',
			optional: false,
			type: 'query'
		},
		vendorCode: {
			description: 'Vendor code to export. Default: Base (No points added)',
			optional: true,
			type: 'query'
		}
	},
	action: function (req, resp, next) {
		const {
			headers: {
				accept: format = 'application/csv',
				'x-app': app
			},
			server: {
				dataManager
			},
			params: {
				versionId,
				vendorCode
			}
		} = req;

		log(LOG_TAG, {
			app,
			format,
			versionId,
			vendorCode
		});

		if (format !== 'application/json' && format !== 'application/xls' && format !== 'application/csv') {
			const message = `Header 'Accept' must be 'application/json', 'application/xls' or 'application/csv'`;
			throw new RequestError(message, 400);
		}

		dataManager
			.exportVersion({
				app,
				versionId,
				vendorCode,
				format
			})
			.then(result => {
				next(null, result);
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
