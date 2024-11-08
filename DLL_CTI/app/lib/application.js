/**
 * Application library
 * Provides functionality to assist in getting the app into the stable, happy-path state.
 * @class Lib.application
 * @singleton
 */
var appNavigation = require('/appNavigation');
var sessionManager = require('/utils/sessionManager');
var telemetry = require('/utils/telemetry');
var analytics = require('/utils/analytics');

/**
 * Provides functionality to assist in getting the app into the stable, happy-path state.
 * NOTE: This is conceptually the "State Stabilizer".
 */
var application = (function () {
	// +-------------------
	// | Private members.
	// +-------------------
	var networkHandlers = [];
	var appStatusHandlers = [];
	// The splash screen has finished showing, carry on.

	/**
	 * @method splashWindowDone
	 * @private
	 * Function called once the splash window closes
	 * @return {void}
	 */
	function splashWindowDone() {
		var isLoggedIn = sessionManager.isSessionSaved() && sessionManager.createSession();

		if (!isLoggedIn) {
			attemptLogin();
		} else {
			initStates();
			appNavigation.openMainWindow();
		}
		if (OS_ANDROID) {
			Ti.Filesystem.requestStoragePermissions(handlePermissionRequest);
		}

		appNavigation.closeSplashWindow();
	};

	/**
	 * @method handlePermissionRequest
	 * @private
	 * Handles permission requests
	 * @param {Object} _evt holds permission request data
	 * @return {void}
	 */
	function handlePermissionRequest(_evt) {
		doLog && console.log('[application] - handlePermissionRequest');
		if (!_evt.success) {
			appNavigation.showAlertMessage(L('storage_permissions_deny'));
		}
	};

	/**
	 * @method loginSuccessful
	 * @private
	 * Login successful
	 * @return {void}
	 */
	function loginSuccessful() {
		analytics.captureApm('[application] - loginSuccessful()');
		initStates();
		appNavigation.openMainWindow();
		appNavigation.closeLoginWindow();
	};

	/**
	 * @method initStates
	 * @private
	 * Initialize states
	 * @return {void}
	 */
	function initStates() {
		doLog && console.log('[application] - initStates()');
		var countryData = sessionManager.getCountryData();

		Alloy.Globals.formats = countryData.formats;

		telemetry.track();
	};

	/**
	 * @method handleNetworkChange
	 * @private
	 * Handle the network change conectivity
	 * @param {Object} _evt Change event 
	 * @param {Boolean} _evt.networkType Network type
	 * @param {Boolean} _evt.networkOnline to know the conectivity
	 * @return {void}
	 */
	function handleNetworkChange(_evt) {
		_evt = _evt || {};
		_evt.networkOnline = false;

		switch (_evt.networkType) {
		case Ti.Network.NETWORK_MOBILE:
		case Ti.Network.NETWORK_WIFI:
			_evt.networkOnline = true;
			break;

		case Ti.Network.NETWORK_LAN:
		case Ti.Network.NETWORK_NONE:
		case Ti.Network.NETWORK_UNKNOWN:
			/* falls through */
		default:
			_evt.networkOnline = false;
		}

		_.each(networkHandlers, function (_networkHandler) {
			_networkHandler(_evt);
		});
	};

	function handleAppStateChange(_evt) {
		_.each(appStatusHandlers, function (_appStatusHandler) {
			_appStatusHandler(_evt);
		});
	};
	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method start
	 * Start the application, navigate through the state machine to reach the Main Window.
	 * @return {void}
	 */
	function start() {
		// appNavigation.openSplashWindow({
		// 	doneCallback: splashWindowDone
		// });
		splashWindowDone();
	};

	/**
	 * @method attemptLogin
	 * Attempt to login
	 * @return {void}
	 */
	function attemptLogin() {
		analytics.captureApm('[application] - attemptLogin()');
		appNavigation.openLoginWindow({
			successCallback: loginSuccessful
		});
	};

	/**
	 * @method logout
	 * Logout
	 * @return {void}
	 */
	function logout() {
		analytics.captureApm('[application] - logout()');
		attemptLogin();
		appNavigation.closeSubmitProgress();
	};

	/**
	 * @method addNetworkHandler
	 * Add network handler
	 * @param {Function} _networkHandler Handler network change
	 * @return {void}
	 */
	function addNetworkHandler(_networkHandler) {
		doLog && console.log('[application] - addNetworkHandler()');
		networkHandlers.push(_networkHandler);
	};

	/**
	 * @method addAppStatusChangeHandler
	 * Adds a new observer for the app status changes
	 * @param {Function} _appStatusHandler Handler app state change
	 * @return {void}
	 */
	function addAppStatusChangeHandler(_appStatusHandler) {
		appStatusHandlers.push(_appStatusHandler);
	}

	/**
	 * @method removeNetworkHandler
	 * Remove network handler
	 * @param {Function} _networkHandler Handler network change
	 * @return {void}
	 */
	function removeNetworkHandler(_networkHandler) {
		doLog && console.log('[application] - removeNetworkHandler()');
		for (var i = 0, j = networkHandlers.length; i < j; i++) {
			if (networkHandlers[i] === _networkHandler) {
				networkHandlers.splice(i, 1);
				return true;
			}
		}

		return false;
	};

	/**
	 * @method removeAppStatusChangeHandler
	 * Remove app status change handler
	 * @param {Function} _appStatusHandler Handler network change
	 * @return {void}
	 */
	function removeAppStatusChangeHandler(_appStatusHandler) {
		doLog && console.log('[application] - removeAppStatusChangeHandler()');
		for (var i = 0, j = appStatusHandlers.length; i < j; i++) {
			if (appStatusHandlers[i] === _appStatusHandler) {
				appStatusHandlers.splice(i, 1);
				return true;
			}
		}

		return false;
	};

	Ti.Network.addEventListener('change', handleNetworkChange);

	if (OS_IOS) {
		Ti.App.addEventListener('pause', handleAppStateChange);
		Ti.App.addEventListener('resume', handleAppStateChange);
	}

	// Public API.
	return {
		start: start,
		attemptLogin: attemptLogin,
		logout: logout,
		addNetworkHandler: addNetworkHandler,
		removeNetworkHandler: removeNetworkHandler,
		addAppStatusChangeHandler: addAppStatusChangeHandler,
		removeAppStatusChangeHandler: removeAppStatusChangeHandler
	};
})();

module.exports = application;
