/**
 * @class telemetry
 * @singleton
 * Custom telemetry tracking for DLL apps
 */
var sessionManager = require('/utils/sessionManager');

var Telemetry = (function () {
	// +-------------------
	// | Private members.
	// +-------------------
	var quoteName = Alloy.Globals.quoteAnalytics.quoteName;

	var osName = Alloy.Globals.osName;
	var osVersion = Alloy.Globals.OSVersion;
	var appVersion = Alloy.Globals.appVersion;
	var width = Alloy.Globals.width;
	var height = Alloy.Globals.height;
	var density = Alloy.Globals.density;
	var model = Alloy.Globals.model;
	var manufacturer = Alloy.Globals.manufacturer;
	var platformID = Alloy.Globals.platformID;

	var analytics = Alloy.createModel('analytics');

	// +-------------------
	// | Public members.
	// +-------------------

	var track = function () {
		var salesRep = sessionManager.getSalesRep();
		var now = new moment();

		analytics.clear();

		analytics.fetch({
			query: {
				where: {
					'platformID = ?': platformID,
					'salesRepID = ?': salesRep.id,
					'isAnalytics = ?': 1
				}
			}
		});

		analytics
			.set({
				'name': quoteName,
				'platformID': platformID,
				'salesRepID': salesRep.id,
				'osName': osName,
				'osVersion': osVersion,
				'appVersion': appVersion,
				'width': width,
				'height': height,
				'density': density,
				'model': model,
				'manufacturer': manufacturer,
				'created': analytics.get('created') || now.format(),
				'lastUpdate': now.format(),
				'isAnalytics': 1
			})
			.save();
	};

	return {
		track: track
	};
})();

module.exports = Telemetry;
