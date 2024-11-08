var Arrow = require('@axway/api-builder-runtime');
var ratings = require('../lib/ratings');

var ListEntityAPI = Arrow.API.extend({
	name: 'list',
	group: 'list',
	path: '/api/mobile/rating/',
	method: 'GET',
	description: 'API for searching entities and get their ratings',
	action: function (req, resp, next) {
		ratings.getList({
			callback: function (_response) {
				if (_response.success) {
					next(null, _response.response);
				} else {
					next(_response.error);
				}
			}
		});
	}
});

module.exports = ListEntityAPI;
