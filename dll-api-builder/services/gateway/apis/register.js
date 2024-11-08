const Arrow = require('@axway/api-builder-runtime');
const serviceManager = require('../lib/serviceManager');

const LOG_TAG = '\x1b[31m' + '[apis/register]' + '\x1b[39;49m ';

const RegisterAPI = Arrow.API.extend({
	group: 'register',
	path: '/api/gateway/register',
	method: 'POST',
	description: 'Allows any service to register in this Gateway\'s list to ensure all their APIs are available.',
	parameters: {
		'name': {
			type: 'body',
			description: 'Name of the service to register.',
			optional: false
		}
	},
	action: function (req, res, next) {
		const {
			params: {
				name
			}
		} = req;

		log(LOG_TAG, {
			name
		});

		try {
			const service = serviceManager.register(name);
			next(null, {
				name: service.name,
				created: service.created,
				updated: service.updated,
			});
		} catch (error) {
			log(LOG_TAG, 'error registering - ', error.message, error.stack);

			res
				.status(400)
				.json({
					success: false,
					message: error.message
				});
			next();
		}
	}
});

module.exports = RegisterAPI;
