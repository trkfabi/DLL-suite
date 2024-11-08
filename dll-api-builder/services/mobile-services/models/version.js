var Arrow = require('@axway/api-builder-runtime');

var Version = Arrow.Model.extend('version', {
	'fields': {
		'app_id': {
			'type': 'String'
		},
		'minimum_version': {
			'type': 'String'
		},
		'latest_version': {
			'type': 'Object'
		},
		'meta': {
			'type': 'Object'
		}
	},
	'connector': 'mbs',
	'actions': [
		'read'
	],
	'singular': 'version',
	'plural': 'versions'
});

module.exports = Version;
