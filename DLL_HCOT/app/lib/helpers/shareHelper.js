/**
 * @class Helpers.shareHelper
 * Utility functions for shared files
 * ##version 1.0.0
 * @singleton
 * @uses Helpers.parser
 */

var social = require('dk.napp.social');

var share = (function () {
	/**
	 * @method
	 * Attach PDFs to share
	 * @param {} _params arams with pdfs to share
	 */
	var pdf = function (_params) {

		_params = _params || {};

		var attachments = _params.attachments || [];
		var files = [];

		_.each(attachments, function (attach) {
			var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, attach.fileName);
			if (file.exists()) {
				files.push(file.nativePath);
			}
		});
		_.extend(_params, {
			files: files
		});

		share(_params);
	};
	/**
	 * @method
	 * Share documentos to other apps
	 * @param {object} args params with information to share
	 */
	var share = function (args = {}) {
		var payload = {};
		var customActivities = [];

		payload.text = args.status;
		if (args.image) {
			payload.image = args.image;
		}
		if (args.url) {
			payload.url = args.url;
		}
		if (args.subject) {
			payload.subject = args.subject;
		}
		if (args.removeIcons) {
			payload.removeIcons = args.removeIcons;
		}
		if (args.htmlText) {
			payload.htmlText = args.htmlText;
		}
		if (args.emailIsHTML) {
			payload.emailIsHTML = args.emailIsHTML;
		}
		if (args.files) {
			payload.files = args.files;
		}
		if (args.arrayOfCustomActivities) {
			customActivities = args.arrayOfCustomActivities;
		}
		if (social.isActivityViewSupported()) { //min iOS6 required
			if (Ti.Platform.osname === 'ipad') {
				payload.view = args.view;
				social.activityPopover(payload, customActivities);
			} else {
				social.activityView(payload, customActivities);
			}
		} else {
			console.error('sharing', 'Sorry but your device does not support this feature.');
		}
	};

	return {
		share: share,
		pdf: pdf
	};

})();

module.exports = share;
