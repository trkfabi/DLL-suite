const Arrow = require('@axway/api-builder-runtime');
const DataManager = require('../lib/data-manager');
const Helpers = require('../lib/reusable/helpers');

/**
 * @method quoteAPI
 * Deletes a quote by setting deleted to true
 * @param {object} req http request
 * @param {object} resp http response
 * @param {function} next
 * @return {void}
 */
const quoteAPI = Arrow.API.extend({
	name: 'quote',
	group: 'quote',
	path: '/api/quotes/quote',
	method: 'DELETE',
	nickname: 'Delete Manual',
	description: 'Deletes a quote',
	parameters: {
		// Required
		id: {
			description: 'Quote Id',
			optional: true,
			type: 'body'
		},
		alloy_id: {
			description: 'Alloy id used internally by mobile apps',
			optional: true,
			type: 'body'
		}
	},
	model: 'quote',
	action: async function (req, resp, next) {
		const {
			headers: {
				'x-userid': userId
			},
			params: {
				id,
				alloy_id
			},
		} = req;

		try {
			const quote = await DataManager.deleteQuote(userId, {
				id,
				alloy_id,
			});
			next(null, quote);
		} catch (error) {
			Helpers.handleError(error, req, resp, next);
		}
	}
});

module.exports = quoteAPI;
