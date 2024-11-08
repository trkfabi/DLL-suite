var Arrow = require('@axway/api-builder-runtime');

var Rating = Arrow.Model.extend('rating', {
	'fields': {
		'entity_rxid': {
			'type': 'String'
		},
		'entity_name': {
			'type': 'String'
		},
		'entity_parent': {
			'type': 'String'
		},
		'st_rating': {
			'type': 'String'
		},
		'lt_rating': {
			'type': 'String'
		},
		'last_update': {
			'type': 'String'
		}
	},
	'connector': 'mbs',
	'actions': [

	],
	'singular': 'rating',
	'plural': 'ratings'
});

module.exports = Rating;
