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
	path: '/api/rate_cards/export/audit_log',
	method: 'GET',
	description: 'Exports Audit Logs',
	parameters: {
		user: {
			description: 'User of the log export.',
			optional: true,
			type: 'query'
		},
		dateFrom: {
			description: 'From date of the log export',
			optional: true,
			type: 'query'
		},
		dateTo: {
			description: 'To date of the log export',
			optional: true,
			type: 'query'
		}
	},
	action: function (req, resp, next) {
		const {
			server: {
				dataManager
			},
			headers: {
				'x-userid': user,
				'x-app': app,
				accept: format = 'application/csv'
			},
			params: {
				user: userFiltered = '',
				dateFrom: dateFrom = null,
				dateTo: dateTo = null
			}
		} = req;

		log(LOG_TAG, {
			app,
			format,
			userFiltered,
			dateFrom,
			dateTo
		});

		if (format !== 'application/json' && format !== 'application/xls' && format !== 'application/csv') {
			const message = `Header 'Accept' must be 'application/json', 'application/xls' or 'application/csv'`;
			throw new RequestError(message, 400);
		}

		dataManager
			.exportAuditLog({
				app,
				user,
				userFiltered,
				dateFrom,
				dateTo,
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
