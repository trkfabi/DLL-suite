const process = require('process');

module.exports = {
	'services': [{
			'name': 'dll-services',
			'host': process.env.DLL_SERVICES_HOST,
			'apiKey': process.env.DLL_SERVICES_APIKEY,
		},
		{
			'name': 'rate-cards',
			'host': process.env.RATE_CARDS_AFS_HOST,
			'apiKey': process.env.RATE_CARDS_AFS_APIKEY
		},
		{
			'name': 'quotes',
			'host': process.env.QUOTES_HOST,
			'apiKey': process.env.QUOTES_APIKEY
		},
		{
			'name': 'mobile-services',
			'host': process.env.MOBILE_SERVICES_HOST,
			'apiKey': process.env.MOBILE_SERVICES_APIKEY
		}
	],
	'gateway': {
		'host': process.env.GATEWAY_HOST
	}
};
