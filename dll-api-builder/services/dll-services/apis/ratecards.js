const Arrow = require('@axway/api-builder-runtime');
const util = require('util');

const Helpers = require('../lib/helpers');
const SoapManager = require('../lib/soapManager');
const {
	handleError
} = require('../lib/reusable/helpers');

const LOG_TAG = '\x1b[31m' + '[apis/rateCards]' + '\x1b[39;49m ';

const RateCardsAPI = Arrow.API.extend({
	group: 'rateCards',
	path: '/api/dll/rateCards',
	method: 'GET',
	description: 'Read ratecards from DLL API. If params lastRefreshDate is not received, 1970-01-01 will be used as default.',
	parameters: {
		lastRefreshDate: {
			description: 'Last refresh date',
			type: 'query',
			optional: true
		}
	},
	action: function (req, res, next) {
		const {
			headers: {
				'x-userid': userId,
				'x-group': group
			},
			params: {
				lastRefreshDate = '1970-01-01'
			}
		} = req;
		doLog && console.debug(`${LOG_TAG}`);

		if (!userId && !group) {
			next('Missing userId and group in headers.');
			return;
		}
		const groups = group.split(',')
		SoapManager.createClient('ExpressFinance')
			.then((client) => {
				const requestor = Helpers.getWsdlRequestor(userId, groups);
				const request = {
					LastRefreshDate: lastRefreshDate
				};
				const EFSearchRateCards = util.promisify(client.EFSearchRateCards);

				return EFSearchRateCards({
					requestor,
					request
				});
			})
			.then((response) => {
				const rateCards = response.SearchRateCardsResult || response;
				next(null, rateCards);
			})
			.catch(error => {
				handleError(error, req, res, next);
			});
	}
});

module.exports = RateCardsAPI;
