const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../lib/reusable/helpers');
const RequestError = require('../lib/reusable/errors/requestError');

const LOG_TAG = '[apis/authenticate]';

const groupsMeta = [{
		input: /OTHCRCM/,
		output: 'OTHCRCM'
	},
	{
		input: /AFSRCM/,
		output: 'AFSRCM'
	},
	{
		input: /RCM/,
		output: 'AFSRCM'
	},
];

/**
 * @class Apis.afs_rate_cards.authenticate
 * POST /api/afs_rate_cards/authenticate
 */
const API = Arrow.API.extend({
	group: 'authenticate',
	path: '/api/rate_cards/authenticate',
	method: 'GET',
	description: 'Authenticates a user by its group',
	action: function (req, resp, next) {
		const {
			headers: {
				'x-userid': userId,
				'x-group': group
			},
			server: {
				config: {
					envName
				}
			},
		} = req;

		log(LOG_TAG, {
			userId,
			group,
		});

		Promise
			.resolve()
			.then(() => {
				if (!userId || !group) {
					throw RequestError('Missing userId or group', 400);
				}

				const groupToCompare = group.toUpperCase();
				const groupFound = groupsMeta.find(({
					input
				}) => {
					return groupToCompare.match(input);
				});

				if (groupFound) {
					next(null, `${groupFound.output}_${envName}`.toUpperCase());
				} else {
					throw RequestError('User is not a valid OTHC or AFS RCM user', 401);
				}

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
