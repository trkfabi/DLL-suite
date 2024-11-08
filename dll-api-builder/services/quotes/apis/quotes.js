const Arrow = require('@axway/api-builder-runtime');
const DataManager = require('../lib/data-manager');
const Helpers = require('../lib/reusable/helpers');

/**
 * @method quotesAPI
 * Returns quotes of a user
 * @param {object} req http request
 * @param {object} resp http response
 * @param {function} next
 * @return {void}
 */
const quotesAPI = Arrow.API.extend({
	name: 'quotes',
	group: 'quotes',
	path: '/api/quotes/quotes',
	method: 'GET',
	description: 'Returns all quotes of a user.',
	parameters: {
		where: {
			type: 'query',
			description: 'where',
			optional: true
		},
		limit: {
			type: 'query',
			description: 'limit',
			optional: true
		},
		currentPage: {
			type: 'query',
			description: 'Current page',
			optional: true
		},
	},
	action: async function (req, resp, next) {
		const {
			headers: {
				'x-userid': userId
			},
			params: {
				limit,
				where = '{}',
				currentPage = 1,
			}
		} = req;

		try {
			const quotes = await DataManager.getQuotes(userId, {
				where: JSON.parse(where),
				limit,
				currentPage
			});

			next(null, quotes);
		} catch (error) {
			Helpers.handleError(error, req, resp, next);
		}
	}
});

module.exports = quotesAPI;
