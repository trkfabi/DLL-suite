const Arrow = require('@axway/api-builder-runtime');
const util = require('util');

const Helpers = require('../lib/helpers');
const SoapManager = require('../lib/soapManager');
const {
	handleError
} = require('../lib/reusable/helpers');

const LOG_TAG = '\x1b[31m' + '[apis/customizations]' + '\x1b[39;49m ';

const CustomizationsAPI = Arrow.API.extend({
	group: 'customizations',
	path: '/api/dll/customizations',
	method: 'GET',
	description: 'Read customizations from DLL API',
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
				lastRefreshDate
			}
		} = req;

		doLog && console.debug(`${LOG_TAG}`);

		if (!userId && !group) {
			next('Missing userId and group in headers.');
			return;
		}

		SoapManager.createClient('ExpressFinance')
			.then((client) => {
				const requestor = Helpers.getWsdlRequestor(userId, group);
				const request = {
					LastRefreshDate: lastRefreshDate
				};
				const EFGetCustomizations = util.promisify(client.EFGetCustomizations);

				return EFGetCustomizations({
					requestor,
					request
				});
			})
			.then((response) => {
				const customizations = response.GetCustomizationsResult || response;
				next(null, customizations);
			})
			.catch(error => {
				handleError(error, req, res, next);
			});
	}
});

module.exports = CustomizationsAPI;
