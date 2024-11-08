const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../../lib/reusable/helpers');

const LOG_TAG = '[apis/othc/rate_program_update]';

/**
 * @class Apis.rate_cards.othc.rate_program.update
 * POST /api/rate_cards/othc/rate_program/update
 */
const API = Arrow.API.extend({
	group: 'rateProgram',
	path: '/api/rate_cards/othc/rate_program/update',
	method: 'POST',
	description: 'Updates a rate program for the given version',
	parameters: {
		'versionId': {
			type: 'body',
			description: 'Version of the rate program',
			optional: false
		},
		'id': {
			type: 'body',
			description: 'ID of the rate program',
			optional: false
		},
		'name': {
			type: 'body',
			description: 'Name of the rate program',
			optional: true
		},
		'promo': {
			type: 'body',
			description: 'Is the rate program a promo',
			optional: true
		},
		'order': {
			type: 'body',
			description: 'Order of the rate program',
			optional: true
		},
		'points': {
			type: 'body',
			description: 'Points of the rate program',
			optional: true
		},
		'terms': {
			type: 'body',
			description: 'Terms to use',
			optional: true
		},
		'defaults': {
			type: 'body',
			description: 'List of default values to be taken by the mobile app every time this Rate Program gets selected. (Limited to `term`)',
			optional: true
		},
		'amountRanges': {
			type: 'body',
			description: 'Array of amount ranges (min and max)',
			optional: true
		},
		'purchaseOptions': {
			type: 'body',
			description: 'Purchase options',
			optional: true
		},
		'advancePayments': {
			type: 'body',
			description: 'Advance payments',
			optional: true
		},
		'advanceSecurityPayments': {
			type: 'body',
			description: 'Advance security payments',
			optional: true
		},
		'paymentFrequencies': {
			type: 'body',
			description: 'Payment frequencies',
			optional: true
		},
		'deferrals': {
			type: 'body',
			description: 'Deferrals',
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
				versionId,
				name,
				promo,
				order,
				points,
				terms,
				defaults,
				amountRanges,
				purchaseOptions,
				advancePayments,
				advanceSecurityPayments,
				paymentFrequencies,
				deferrals
			}
		} = req;

		log(LOG_TAG, {
			app,
			uid,
			versionId,
			name,
			promo,
			order,
			points,
			terms,
			defaults,
			amountRanges,
			purchaseOptions,
			advancePayments,
			advanceSecurityPayments,
			paymentFrequencies,
			deferrals
		});

		dataManager
			.updateRateProgram({
				app,
				data: {
					uid,
					versionId,
					name,
					promo,
					order,
					points,
					terms,
					defaults,
					amountRanges,
					purchaseOptions,
					advancePayments,
					advanceSecurityPayments,
					paymentFrequencies,
					deferrals
				}
			})
			.then(rateProgram => {
				next(null, rateProgram.forAPI());
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
