const Arrow = require('@axway/api-builder-runtime');
const pkg = require('../package.json');

const ServiceManager = require('../lib/serviceManager');

const InfoAPI = Arrow.API.extend({
	group: 'info',
	path: '/api/gateway/info',
	method: 'GET',
	description: 'Obtains the server info, for debugging purposes',
	parameters: {

	},
	action: function (req, res, next) {
		try {
			const {
				config: {
					serverId
				}
			} = req.server;

			const {
				version,
				name
			} = pkg;

			const services = ServiceManager.getServices();

			next(null, {
				serverId,
				version,
				name,
				services
			});
		} catch (error) {
			console.log(error.message);
			console.log(error.stack);
			next(error.message);
		}

	}
});

module.exports = InfoAPI;
