const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../lib/reusable/helpers');

const LOG_TAG = '[apis/rate_factors_table]';
/**
 * @class Apis.afs_rate_cards.admin.rate_factors
 * GET /api/afs_rate_cards/admin/rate_factors
 */
const API = Arrow.API.extend({
	group: 'rate_factors',
	path: '/api/rate_cards/admin/rate_factors',
	method: 'GET',
	description: 'Returns all ratefactors of a version.',
	parameters: {
		versionId: {
			type: 'query',
			description: 'Version',
			optional: false
		},
		vendorCode: {
			description: 'Vendor code to export. Default: Base (No points added)',
			optional: true,
			type: 'query'
		},
		ratePrograms: {
			description: 'Array of Rate program id to filter (OTHC only)',
			optional: true,
			type: 'query'
		},
		points: {
			description: 'Points to filter. Defaults to 0. (OTHC only)',
			optional: true,
			type: 'query'
		},
		purchaseOption: {
			description: 'Purchase option to filter (OTHC only)',
			optional: true,
			type: 'query'
		},
		paymentFrequency: {
			description: 'Payment frequency to filter (OTHC only)',
			optional: true,
			type: 'query'
		},
		advancePayments: {
			description: 'Advance payment to filter (OTHC only)',
			optional: true,
			type: 'query'
		},
		show: {
			description: 'Show rates or interest. Default rates. (OTHC only)',
			optional: true,
			type: 'query'
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
				versionId,
				vendorCode,
				ratePrograms = [],
				points = 0,
				purchaseOption,
				paymentFrequency = 'M',
				advancePayments = 0,
				show
			}
		} = req;

		log(LOG_TAG, {
			versionId,
			vendorCode,
			ratePrograms,
			points,
			purchaseOption,
			paymentFrequency,
			advancePayments,
			show,
			app
		});

		dataManager
			.getRateFactors({
				app,
				data: {
					versionId,
					vendorCode,
					ratePrograms: ratePrograms.length > 1 ? ratePrograms : null,
					points: parseInt(points),
					purchaseOption,
					paymentFrequency,
					advancePayments: parseInt(advancePayments),
					show
				}
			})
			.then(rateFactors => {
				next(null, rateFactors);
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
