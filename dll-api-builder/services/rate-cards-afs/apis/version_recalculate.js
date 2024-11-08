const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../lib/reusable/helpers');
const Constants = require('../constants/constants');

const LOG_TAG = '[apis/version_recalculate]';
/**
 * @class Apis.afs_rate_cards.version.recalculate
 * GET /api/afs_rate_cards/version/recalculate/:id
 */
const API = Arrow.API.extend({
	group: 'version',
	path: '/api/rate_cards/version/recalculate/:id',
	method: 'GET',
	description: 'Recalculates all rate factors for the given version',
	parameters: {
		id: {
			type: 'path',
			description: 'Version to update rate factors',
			optional: false
		},
		display: {
			type: 'query',
			description: 'Type of display of the rate factors: "regular", "admin"',
			optional: true
		},
		vendorName: {
			description: 'Vendor name to export. Default: Base (No points added)',
			optional: true,
			type: 'query'
		},
		vendorPoints: {
			description: 'Vendor points to export.',
			optional: true,
			type: 'query'
		},
		vendorCodeId: {
			description: 'Vendor Code id.',
			optional: true,
			type: 'query'
		},
		ratePrograms: {
			description: 'Array of Rate programs id to filter (OTHC only)',
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
				id,
				display = 'regular',
				vendorCodeId,
				vendorName = Constants.defaultVendorName,
				vendorPoints,
				show = 'rates',
				ratePrograms = [],
				purchaseOption,
				paymentFrequency = 'M',
				advancePayments = 0
			}
		} = req;

		log(LOG_TAG, {
			app,
			id,
			display,
			vendorCodeId,
			vendorName,
			vendorPoints,
			show
		});

		const filters = {
			ratePrograms: ratePrograms.length > 1 ? ratePrograms : null,
			purchaseOptions: purchaseOption ? [purchaseOption] : null,
			paymentFrequencies: [paymentFrequency],
			advancePayments: [parseInt(advancePayments)],
			vendorCodes: vendorCodeId ? [vendorCodeId] : null
		};

		dataManager
			.recalculateRateFactors(app, id, null, {
				checkVersionIsNotPublishing: true,
				baseOnly: vendorName === Constants.defaultVendorName,
				vendorCodes: {
					'name': vendorName,
					'points': vendorPoints
				},
				filters
			})
			.then(version => {
				let result = {};

				switch (display) {
				case 'admin':
					result = (app === Constants.apps.APP_AFS) ? version.rateFactorsWithProducts() : version.rateFactorsAdmin(show, vendorCodeId);
					break;
				case 'regular':
				default:
					result = version.forAPI();
				}

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
