const Arrow = require('@axway/api-builder-runtime');
const Event = Arrow.createModel('event', {
	description: 'Analytics custom events registered from the app.',
	fields: {
		'name': {
			type: 'string',
			required: false,
			description: 'Name of the item',
			default: 'analytics'
		},
		'platformID': {
			type: 'string',
			required: true,
			description: 'Platform ID (UUID)'
		},
		'salesRepID': {
			type: 'string',
			required: true,
			description: 'User ID'
		},
		'osName': {
			type: 'string',
			required: false,
			description: 'OS name using'
		},
		'osVersion': {
			type: 'string',
			required: false,
			description: 'OS Version using'
		},
		'appVersion': {
			type: 'string',
			required: true,
			description: 'App version using'
		},
		'width': {
			type: 'number',
			required: false,
			description: 'Width of the device'
		},
		'height': {
			type: 'number',
			required: false,
			description: 'Height of the device'
		},
		'density': {
			type: 'string',
			required: false,
			description: 'Density of the device'
		},
		'model': {
			type: 'string',
			required: false,
			description: 'Device Model name'
		},
		'manufacturer': {
			type: 'string',
			required: false,
			description: 'Device Manufacturer name'
		},
		'created': {
			type: 'string',
			required: false,
			description: 'Date created'
		},
		'lastUpdate': {
			type: 'string',
			required: false,
			description: 'Date updated'
		},
		'isAnalytics': {
			type: 'boolean',
			required: false,
			description: 'Flag to indicate if its tracking an analytics event',
			default: true
		},
		'alloy_id': {
			type: 'string',
			required: false,
			description: 'internal id of the model'
		},
	},
	connector: 'mbs',
	actions: [
		'read',
		'update'
	],
	autogen: true
});
module.exports = Event;
