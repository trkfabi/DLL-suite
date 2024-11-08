const process = require('process');

module.exports = {
	'gateway': {
		'host': process.env.GATEWAY_HOST,
		'apiKey': process.env.GATEWAY_APIKEY
	}
};
