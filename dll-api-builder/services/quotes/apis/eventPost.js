const Arrow = require('@axway/api-builder-runtime');

/**
 * @method eventAPI
 * Creates a new event
 * @param {object} req http request
 * @param {object} resp http response
 * @param {function} next
 * @return {void}
 */
const eventAPI = Arrow.API.extend({
	name: 'event',
	group: 'event',
	path: '/api/quotes/event',
	method: 'POST',
	description: 'Creates a new event.',
	parameters: {
		name: {
			description: 'Name',
			optional: false,
			type: 'body'
		},
		platformID: {
			description: 'platformID',
			optional: false,
			type: 'body'
		},
		salesRepID: {
			description: 'salesRepID',
			optional: false,
			type: 'body'
		},
		osName: {
			description: 'osName',
			optional: false,
			type: 'body'
		},
		osVersion: {
			description: 'osVersion',
			optional: false,
			type: 'body'
		},
		appVersion: {
			description: 'appVersion',
			optional: false,
			type: 'body'
		},
		width: {
			description: 'width',
			optional: false,
			type: 'body'
		},
		height: {
			description: 'height',
			optional: false,
			type: 'body'
		},
		density: {
			description: 'density',
			optional: false,
			type: 'body'
		},
		model: {
			description: 'model',
			optional: false,
			type: 'body'
		},
		manufacturer: {
			description: 'manufacturer',
			optional: false,
			type: 'body'
		},
		created: {
			description: 'created',
			optional: false,
			type: 'body'
		},
		lastUpdate: {
			description: 'lastUpdate',
			optional: false,
			type: 'body'
		},
		isAnalytics: {
			description: 'isAnalytics',
			optional: false,
			type: 'body'
		},
		alloy_id: {
			description: 'alloy_id',
			optional: false,
			type: 'body'
		},
	},
	action: function (req, resp, next) {
		const {
			headers: {
				'x-userid': userId
			},
			params
		} = req;

		if (!userId) {
			next('Missing userId.');
			return;
		}

		Arrow.getModel('event').create(params, (_err, _results) => {
			if (_err) {
				return next(_err);
			}
			if (_results) {
				return next(null, _results);
			}
		});

	}
});

module.exports = eventAPI;
