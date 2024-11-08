/**
 * Collection of helper functions to perform update tasks
 * @class Helpers.updateHelper
 * @version 1.1.0
 * @singleton
 */
var doLog = Alloy.Globals.doLog;
const LOG_TAG = '\x1b[36m' + '[helpers/updateHelper]' + '\x1b[39;49m ';
var webservices = require('/utils/webservices');

var updateHelper = (function () {

	// +-------------------
	// | Private members.
	// +-------------------

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method isVersionOutdated
	 * Check the current version and the lastest version to know if there is an update
	 * @param {String} _currentVersion The current version of the App
	 * @param {String} _latestVersion The latest version of the backend
	 * @return {Boolean} isVersionOutdated
	 */
	function isVersionOutdated(_currentVersion, _latestVersion) {
		var result = false;
		var currentVersionArray = _currentVersion.split('.');
		var latestVersionArray = _latestVersion.split('.');

		//Note: We need to change this to Numbers since backend send it as String

		_.each(currentVersionArray, function (_value, _key) {
			currentVersionArray[_key] = Number(currentVersionArray[_key]);
			latestVersionArray[_key] = Number(latestVersionArray[_key]);
		});

		if (currentVersionArray[0] < latestVersionArray[0]) {
			result = true;
		} else if (currentVersionArray[0] === latestVersionArray[0] && currentVersionArray[1] < latestVersionArray[1]) {
			result = true;
		} else if (currentVersionArray[0] === latestVersionArray[0] && currentVersionArray[1] === latestVersionArray[1] &&
			currentVersionArray[2] < latestVersionArray[2]) {
			result = true;
		}
		return result;
	}

	/**
	 * @method checkAppVersion
	 * Check the current version and the minimum/lastest version to know if there is an update
	 * @param {String} _currentVersion The current version of the App
	 * @param {String} _latestVersion The latest version of the backend
	 * @param {String} _minimumVersion The minimum required version of the backend
	 * @return {Object} result
	 * @return {Boolean} result.isOutdated
	 * @return {String} result.alertType (soft / hard)
	 */
	function checkAppVersion(_currentVersion, _latestVersion, _minimumVersion) {
		var result = {
			isOutdated: false,
			alertType: 'SOFT'
		};
		var currentVersionArray = _currentVersion.split('.');
		var latestVersionArray = _latestVersion.split('.');
		var minimumVersionArray = _minimumVersion.split('.');

		//Note: We need to change this to Numbers since backend send it as String

		_.each(currentVersionArray, function (_value, _key) {
			currentVersionArray[_key] = Number(currentVersionArray[_key]);
			latestVersionArray[_key] = Number(latestVersionArray[_key]);
			minimumVersionArray[_key] = Number(minimumVersionArray[_key]);
		});

		if (isLowerThanVersion(currentVersionArray, latestVersionArray)) {
			result.isOutdated = true;
			if (isLowerThanVersion(currentVersionArray, minimumVersionArray)) {
				result.alertType = 'HARD';
			}
		}
		return result;
	}

	/**
	 * @method isLowerThanVersion
	 * Check if the current version is lower than other version
	 * @param {Array} _currentVersionArray The current version of the App
	 * @param {Array} _versionArray The version of the backend to check against
	 * @return {Boolean} True if the current version is lower
	 */
	function isLowerThanVersion(_currentVersionArray, _versionArray) {
		return ((_currentVersionArray[0] < _versionArray[0]) || (_currentVersionArray[0] === _versionArray[0] &&
			_currentVersionArray[1] < _versionArray[1]) || (_currentVersionArray[0] === _versionArray[0] &&
			_currentVersionArray[1] === _versionArray[1] && _currentVersionArray[2] < _versionArray[2]));
	}

	/**
	 * @method isDomainInWhitelist
	 * Check if the domain is in the whitelist
	 * @param {String} _url The url to check
	 * @param {Function} _callback function to call if the URL is valid
	 * @return {Boolean} True if the domain is whitelisted
	 */
	function isDomainInWhitelist(_url, _callback) {
		var environment = Alloy.Globals.environment;
		doLog && console.log(LOG_TAG, '- isDomainInWhitelist() environment: ' + environment + ' - URL: ' + _url);

		// Production urls are not shortened with is.gd service
		if (environment === 'prod') {
			if (searchDomainString(_url)) {
				_callback();
				return;
			}
			doLog && console.log(LOG_TAG, '- isDomainInWhitelist() domain is NOT whitelisted');
			_callback({
				errormessage: _url + ' domain is not in whitelist.'
			});
			return;
		}

		// Use https://is.gd service
		webservices.extendShortenedUrl({
			shorturl: _url,
			successCallback: function (_response) {
				doLog && console.log(LOG_TAG, '- extendShortenedUrl() response: ' + JSON.stringify(_response, null, '\t'));
				var extendedUrl = _response.url || null;

				if (extendedUrl) {
					// replace the '&amp;' character that returns the is.gd service 
					// useful for the case of urls like itms-services://?action=download-manifest&url=
					extendedUrl = extendedUrl.replace(/&amp;/g, '&');
					if (searchDomainString(extendedUrl)) {
						_callback();
						return;
					}
				}
				doLog && console.log(LOG_TAG, '- isDomainInWhitelist() domain is NOT whitelisted');
				_callback({
					errormessage: _url + ' domain is not in whitelist.'
				});
			},
			failCallback: function (_error) {
				doLog && console.log(LOG_TAG, '- extendShortenedUrl() error: ' + JSON.stringify(_error, null, '\t'));
				_callback(_error);
			}
		});
	}

	/**
	 * @method searchDomainString
	 * Check if the domain is in the whitelist
	 * @param {String} _url The url to check
	 * @return {Boolean} True if the domain is whitelisted
	 */
	function searchDomainString(_url) {
		var domainWhitelist = Alloy.Globals.updateUrlDomainWhitelist;
		var decodedUrl = decodeURIComponent(_url);
		return domainWhitelist.some(function (_domain) {
			return decodedUrl.indexOf(_domain) > -1;
		});
	}

	// Public API.
	return {
		isVersionOutdated: isVersionOutdated,
		checkAppVersion: checkAppVersion,
		isDomainInWhitelist: isDomainInWhitelist
	};
})();

module.exports = updateHelper;
