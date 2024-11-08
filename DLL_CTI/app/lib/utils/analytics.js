/**
 * Facade over analytics and performance event capturing.
 *
 * @class Lib.utils.analytics
 * @singleton
 * @version 1.1
 * 
 * Sample usage:
 * 		// Load the module.
 * 		var analytics = require('analytics');
 * 		analytics.enable();
 *
 * 		// Capture an event to ALL analytics locations.
 * 		analytics.capture({
 * 			name : 'login.successful'
 * 		});
 *
 * 		// Capture an APM-only event.
 * 		analytics.capture({
 * 			name : 'loginButtonPressed',
 * 			type : analytics.types.APM
 * 		});
 *
 * 		// Capture a TiAnalytics-only event.
 * 		analytics.capture({
 * 			name : 'login.successful',
 * 			type : analytics.types.TI_ANALYTICS
 * 		});
 */

var analytics = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	/**
	 * @property isActive
	 * @private
	 * Analytics enabled (Defaults to false)
	 * @type {Boolean}
	 */
	var isActive = false;

	// +-------------------
	// | Public members.
	// +-------------------
	/**
	 * @property types
	 * @private
	 * The types of analytics event that can be tracked
	 * @type {Object}
	 */
	var types = {
		TI_ANALYTICS: 'TI_ANALYTICS',
		APM: 'APM',
		ALL: 'ALL'
	};

	/**
	 * @method captureTiAnalytics
	 * @public
	 * Capture the Appcelerator Performance Management breadcrumb
	 * @param {String} _name Name of the analytics to be captured
	 * @param {Object} _data Aditional metrics to Analytics
	 * @return {void}
	 */
	function captureTiAnalytics(_name, _data) {
		_data = _data || {};
		doLog && console.log('[analytics] - captureTiAnalytics() - ' + _name + ' - ' + JSON.stringify(_data));
		Ti.Analytics.featureEvent(_name, _data);
	};

	/**
	 * @method captureApm
	 * @public
	 * Capture the Appcelerator Performance Management breadcrumb
	 * @param {String} _name Name of the breadcrumb to be captured
	 * @return {void}
	 */
	function captureApm(_name) {
		doLog && console.log('[analytics] - captureApm() - ' + _name);
		if (Alloy.Globals.analytics) {
			Alloy.Globals.analytics.leaveBreadcrumb(_name);
		}
	};

	/**
	 * @method capture
	 * @public
	 * Capture analytics events
	 * @param {Object} _params Includes the name, data and type (constant).
	 * @return {void}
	 */
	function capture(_params) {
		_params = _params || {};
		var name = _params.name;

		if (isActive && name) {
			var data = _params.data || null;
			var type = _params.type;
			if ((type !== types.TI_ANALYTICS) & (type !== types.APM)) {
				type = types.ALL;
			}
			switch (_params.type) {
			case types.TI_ANALYTICS:
				{
					captureTiAnalytics(name, data);
					break;
				}
			case types.APM:
				{
					captureApm(name);
					break;
				}
			default:
				{
					// Capture the event everywhere.
					captureTiAnalytics(name, data);
					captureApm(name);
				}
			};

		}
	};

	/**
	 * @method enable
	 * @public
	 * Enable all analytics.
	 * @return {void}
	 */
	function enable() {
		isActive = true;
	};

	/**
	 * @method disable
	 * @public
	 * Disable all analytics.
	 * @return {void}
	 */
	function disable() {
		isActive = false;
	};

	/**
	 * @method isEnabled
	 * @public
	 * Check if analytics is enabled.
	 * @return {Boolean}
	 */
	function isEnabled() {
		return isActive;
	};

	/**
	 * @method setApmUsername
	 * @public
	 * Wrapper function to set APM's username to differentiate metadata of crash reports.
	 * @param {String} _username Up to 32 characters to identify a user.
	 * @return {void}
	 */
	function setApmUsername(_username) {
		doLog && console.log('[analytics] - setApmUsername() - ' + _username);
		Alloy.Globals.analytics && Alloy.Globals.analytics.setUsername(_username);
	};

	/**
	 * @method logApmHandledException
	 * @public
	 * Wrapper function to track one handled error into APM.
	 * @param {Object} _error Error object to track. See http://www.ecma-international.org/ecma-262/5.1/#sec-15.11 for further reference.
	 * @return {void}
	 */
	function logApmHandledException(_error) {
		doLog && console.warn('[analytics] - logApmHandledException() - ' + JSON.stringify(_error || 'no _error'));
		Alloy.Globals.analytics && Alloy.Globals.analytics.logHandledException(_error);
	};

	/**
	 * @method setApmMetadata
	 * @public
	 * Wrapper function to set one key-val to APM's metadata object.
	 * @param {String} _key Metadata entry key.
	 * @param {Number|String} _value Metadata entry value. Can be either Number or String.
	 * @return {void}
	 */
	function setApmMetadata(_key, _value) {
		doLog && console.log('[analytics] - setApmMetadata() - ' + _key + ' = ' + JSON.stringify(_value || 'no _value'));
		Alloy.Globals.analytics && Alloy.Globals.analytics.setMetadata(_key, _value);
	};

	// Public API.
	return {
		// Type constants.
		types: types,

		capture: capture,
		captureApm: captureApm,
		captureTiAnalytics: captureTiAnalytics,

		enable: enable,
		disable: disable,
		isEnabled: isEnabled,
		setApmUsername: setApmUsername,
		logApmHandledException: logApmHandledException,
		setApmMetadata: setApmMetadata
	};
})();

module.exports = analytics;
