var Arrow = require('@axway/api-builder-runtime');

var VersionAPI = Arrow.API.extend({
	name: 'version',
	group: 'version',
	path: '/api/mobile/update_version',
	method: 'POST',
	description: 'Update version info for an app',
	parameters: {
		'app_id': {
			description: 'App ID of the app to update its version',
			optional: false,
			type: 'body'
		},
		'minimum_version': {
			description: 'Minimum version of the app use.',
			optional: true,
			type: 'body'
		},
		'latest_version': {
			description: 'Latest version of the app to update',
			optional: true,
			type: 'body'
		},
		'duration': {
			description: 'Duration to wait until the alert shows again in the app. <hh:mm:ss>',
			optional: true,
			type: 'body'
		},
		'redirect_url': {
			description: 'URL in to redirect from the app to update it',
			optional: true,
			type: 'body'
		}
	},
	model: 'version',
	action: function (req, resp, next) {
		var appId = req.params.app_id;

		var minimumVersion = req.params.minimum_version;
		var latestVersion = req.params.latest_version;
		var duration = req.params.duration;
		var redirectUrl = req.params.redirect_url;
		var versionModel = req.model;

		versionModel.query({
			where: {
				'app_id': appId
			}
		}, function (error, queryResult) {
			if (error) {
				next(error);
				return;
			}

			var versionData = queryResult[0] ? queryResult[0].toJSON() : {
				app_id: appId,
				latest_version: {
					notification_type: 'ALWAYS'
				},
				meta: {}
			};

			if (minimumVersion) {
				versionData.minimum_version = minimumVersion;
			}

			if (latestVersion) {
				versionData.latest_version.version = latestVersion;
			}

			if (duration) {
				versionData.meta.duration = duration;
			}

			if (redirectUrl) {
				versionData.meta.redirect_url = redirectUrl;
			}

			if (versionData.id) {
				versionModel.upsert(versionData.id, versionData, next);
			} else {
				versionModel.create(versionData, next);
			}

		});
	}
});

module.exports = VersionAPI;
