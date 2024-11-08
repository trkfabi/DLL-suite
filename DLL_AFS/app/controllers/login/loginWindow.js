/**
 * @class Controllers.login.loginWindow
 * Login Window
 * @uses appNavigation
 * @uses Libs.analytics
 * @uses Libs.http
 * @uses Libs.sessionManager
 */
const LOG_TAG = '\x1b[31m' + '[login/loginWindow]' + '\x1b[39;49m ';

var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var appNavigation = require('/appNavigation');
var analytics = require('/utils/analytics');
var http = require('/utils/http');
var sessionManager = require('/utils/sessionManager');
var dataManager = require('/utils/dataManager');
var application = require('/application');

/**
 * @property {Boolean} useActiveSession useful to know if there is some session previous persisted to be loaded
 */
var useActiveSession = sessionManager.isSessionSaved();

/**
 * @property {Number} tries hold login attempts
 */
var tries = 0;

/**
 * @method init
 * @private
 * Initialize values for the login window
 * @return {void}
 */
function init() {
	analytics.captureEvent('[loginWindow] - init()');

	if (useActiveSession && sessionManager.getSessionUser()) {
		var _username = sessionManager.getSessionUser().username || '';
		$.loginField.value = _username.substring(0, _username.indexOf('@'));
		$.passwordField.value = 'password'; // We won't put the real password here

		// Workaround for android
		setTimeout(function () {
			$.loginField.addEventListener('change', handleFieldChange);
			$.passwordField.addEventListener('change', handleFieldChange);
		}, 700);
	}

	if (OS_IOS) {
		application.addNetworkHandler(handleNetworkChange);
		application.addAppStatusChangeHandler(handleAppStatusChange);
	}
	// Check if the app is already waiting for a request
	!Alloy.Globals.updateRequestLoading && dataManager.checkForUpdates(function (_error, _updateDialog) {
		if (_updateDialog) {
			_updateDialog.show();
			Alloy.Globals.updateDialogIsVisible = true;
		}
	});
};

/**
 * @method handleAppStatusChange
 * @private
 * Function handler for the app status change (pause/resume)
 * @param {Object} _evt Change event
 * @return {void}
 */
function handleAppStatusChange(_evt) {
	doLog && console.log(LOG_TAG, '- handleAppStatusChange ' + _evt.type);

	if (_evt.type === 'resumed') {
		// Check if the app is already waiting for a request
		!Alloy.Globals.updateRequestLoading && dataManager.checkForUpdates(function (_error, _updateDialog) {
			if (_updateDialog) {
				_updateDialog.show();
				Alloy.Globals.updateDialogIsVisible = true;
			}
		});
	}
}
/**
 * @method handleNetworkChange
 * @private
 * Function handler for the network change
 * @param {Object} _evt Change event
 * @return {void}
 */
function handleNetworkChange(_evt) {
	doLog && console.log(LOG_TAG, '- handleNetworkChange is online: ' + _evt.networkOnline);

	if (_evt.networkOnline) {
		// Check if the app is already waiting for a request
		!Alloy.Globals.updateRequestLoading && dataManager.checkForUpdates(function (_error, _updateDialog) {
			if (_updateDialog) {
				_updateDialog.show();
				Alloy.Globals.updateDialogIsVisible = true;
			}
		});
	}
}

/**
 * @method loginSuccess
 * @private
 * Login success callback response
 * @param {Object} _params Response from the server
 * @return {void}
 */
var loginSuccess = function (_params) {
	doLog && console.log('[loginWindow] - loginSuccess() - ' + JSON.stringify(_params));
	analytics.captureTiAnalytics('AFS-Login-Authentication-Success');
	if (OS_IOS) {
		application.removeAppStatusChangeHandler(handleAppStatusChange);
	}
	args.successCallback && args.successCallback();
};

/**
 * @method loginFailed
 * @private
 * Callback Function invoked when there is an error on the login attempt
 * @param {Object} _data error object
 * @param {Object} _data.http Http error
 * @param {String} _data.message Http message
 * @return {void}
 */
var loginFailed = function (_data) {
	doLog && console.error('[loginWindow] - loginFailed() : ' + JSON.stringify(_data, null, ' '));
	_data = _data || {};
	tries = _data.tries || 0;

	$.loadingIndicator.hide();
	appNavigation.showAlertMessage(_data.message, function () {
		if (tries === 3) {
			appNavigation.showAlertMessage(L('you_have_failed_to_login'));
		} else if (tries > 4) {
			appNavigation.showAlertMessage(L('your_account_has_been_locked'));
		}
	});
};

/**
 * @method blurFields
 * Attempts to hide the soft keyboard
 * @return {void}
 */
$.blurFields = function () {
	$.loginField.blur();
	$.passwordField.blur();
};

/**
 * @method handleAndroidBack
 * @private
 * Handle the android back event for the login window
 * @param {Object} _evt androidback event
 * return {void}
 */
function handleAndroidBack(_evt) {
	// Do something
};

/**
 * @method handleLoginButtonClick
 * @private
 * Handle the click event for the loginButton control
 * @return {void}
 */
function handleLoginButtonClick() {
	var _tries = 0;
	var _username = $.loginField.value;

	if (!http.isOnline()) {
		appNavigation.showAlertMessage(L('no_internet_connection'));
	} else {

		$.blurFields();

		if (tries > 4) {
			appNavigation.showAlertMessage(L('your_account_has_been_locked'));
			return false;
		}

		$.loadingIndicator.show();

		sessionManager.attemptLogin({
			username: $.loginField.value,
			password: $.passwordField.value,
			keepLogged: $.stayLoggedInSwitch.value,
			useActiveSession: useActiveSession,
			successCallback: loginSuccess,
			failCallback: loginFailed
		});
	}
};

/**
 * @method handleWindowOpen
 * @private
 * Handle the open event of the window
 * @param {Object} _evt Open event for the window
 * @return {void}
 */
function handleWindowOpen(_evt) {
	$.window.removeEventListener('open', handleWindowOpen);
	$.stayLoggedInSwitch.setValue(true);
};

/**
 * @method handleWindowFocus
 * @private
 * Handle the focus event of the window
 * @param {Object} _evt Focus event for the window
 * @return {void}
 */
function handleWindowFocus(_evt) {
	$.window.removeEventListener('focus', handleWindowFocus);
	var _currentPoliciesVersion = Ti.App.Properties.getString('policy_version', '');
	if (_currentPoliciesVersion !== Alloy.Globals.policyVersion) {
		appNavigation.openLoginPoliciesWindow();
	}
};

/**
 * @method handleFieldChange
 * @private
 * Handle the change event of TextFields controls
 * @param {Object} _evt Change event
 * @return {void}
 */
function handleFieldChange(_evt) {
	doLog && console.log('[loginWindow] - handleFieldChange()');
	useActiveSession = false;
};

// Event Handlers
$.loginButton.addEventListener('click', handleLoginButtonClick);
$.privacyStatementButton.addEventListener('click', appNavigation.openPrivacyStatementWindow);
$.termsAndConditionsButton.addEventListener('click', appNavigation.openLoginPoliciesWindow);
$.window.addEventListener('click', $.blurFields);
$.window.addEventListener('open', handleWindowOpen);
$.window.addEventListener('focus', handleWindowFocus);
OS_ANDROID && $.window.addEventListener('androidback', handleAndroidBack);

init();
