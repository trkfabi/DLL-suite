const Arrow = require('@axway/api-builder-runtime');
const DataManager = require('../lib/data-manager');
const Helpers = require('../lib/reusable/helpers');

/**
 * @method quoteAPI
 * Creates a new quote
 * @param {object} req http request
 * @param {object} resp http response
 * @param {function} next
 * @return {void}
 */
const quoteAPI = Arrow.API.extend({
	name: 'quote',
	group: 'quote',
	path: '/api/quotes/quote',
	method: 'POST',
	description: 'Creates a new quote.',
	model: 'quote',
	parameters: {
		id: {
			description: 'id',
			optional: false,
			type: 'body'
		},
		alloy_id: {
			description: 'alloy_id',
			optional: false,
			type: 'body'
		},
		amountFinanced: {
			description: 'Amount financed',
			optional: true,
			type: 'body'
		},
		contractDate: {
			description: 'contractDate',
			optional: true,
			type: 'body'
		},
		creditRatingId: {
			description: 'creditRatingId',
			optional: true,
			type: 'body'
		},
		creditRatingName: {
			description: 'creditRatingName',
			optional: true,
			type: 'body'
		},
		customQuoteName: {
			description: 'customQuoteName',
			optional: true,
			type: 'body'
		},
		customer: {
			description: 'customer',
			optional: true,
			type: 'body'
		},
		dateCreated: {
			description: 'dateCreated',
			optional: true,
			type: 'body'
		},
		deleted: {
			description: 'deleted',
			optional: true,
			type: 'body'
		},
		displayPaybackPercentage: {
			description: 'displayPaybackPercentage',
			optional: true,
			type: 'body'
		},
		equipments: {
			description: 'equipments',
			optional: true,
			type: 'body'
		},
		expirationDate: {
			description: 'expirationDate',
			optional: true,
			type: 'body'
		},
		isFavorited: {
			description: 'isFavorited',
			optional: true,
			type: 'body'
		},
		modifiedDate: {
			description: 'modifiedDate',
			optional: true,
			type: 'body'
		},
		name: {
			description: 'name',
			optional: true,
			type: 'body'
		},
		paymentOptionOpened: {
			description: 'paymentOptionOpened',
			optional: true,
			type: 'body'
		},
		paymentOptionSelected: {
			description: 'paymentOptionSelected',
			optional: true,
			type: 'body'
		},
		paymentOptions: {
			description: 'paymentOptions',
			optional: true,
			type: 'body'
		},
		pdfFileName: {
			description: 'pdfFileName',
			optional: true,
			type: 'body'
		},
		revision: {
			description: 'revision',
			optional: true,
			type: 'body'
		},
		salesRepID: {
			description: 'salesRepID',
			optional: false,
			type: 'body'
		},
		submitStatus: {
			description: 'submitStatus',
			optional: true,
			type: 'body'
		},
		shareButtonTimesPressed: {
			description: 'submitStatus',
			optional: true,
			type: 'body'
		},
		shareSummaryButtonTimesPressed: {
			description: 'submitStatus',
			optional: true,
			type: 'body'
		},
		financedAmountTimesChanged: {
			description: 'submitStatus',
			optional: true,
			type: 'body'
		},
		customerRecordTimesChanged: {
			description: 'submitStatus',
			optional: true,
			type: 'body'
		},
		customerRecordCancelTimesChanged: {
			description: 'submitStatus',
			optional: true,
			type: 'body'
		},
		creditRatingTimesChanged: {
			description: 'submitStatus',
			optional: true,
			type: 'body'
		},
		creditRatingCancelTimesChanged: {
			description: 'submitStatus',
			optional: true,
			type: 'body'
		},
		summaryQuoteValidTimesChanged: {
			description: 'submitStatus',
			optional: true,
			type: 'body'
		},
		summaryFileNameTimesChanged: {
			description: 'submitStatus',
			optional: true,
			type: 'body'
		},
		summaryDisplayPlaybackOnTimesChanged: {
			description: 'submitStatus',
			optional: true,
			type: 'body'
		},
		summaryDisplayPlaybackOffTimesChanged: {
			description: 'submitStatus',
			optional: true,
			type: 'body'
		}
	},
	action: async function (req, resp, next) {
		const {
			headers: {
				'x-userid': userId
			},
			params: data,
		} = req;

		try {
			const quote = await DataManager.updateQuote(userId, data);
			next(null, quote);
		} catch (error) {
			Helpers.handleError(error, req, resp, next);
		}
	}
});

module.exports = quoteAPI;
