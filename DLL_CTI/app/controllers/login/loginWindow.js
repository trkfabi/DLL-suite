/**
 * @class Controllers.login.LoginWindow
 * Login Window
 */
var args = arguments[0] || {};
var appNavigation = require('/appNavigation');
var analytics = require('/utils/analytics');
var sessionManager = require('/utils/sessionManager');
var http = require('/utils/http');
var salesReps = Alloy.Collections.instance('salesRep');
var salesRep = Alloy.Models.instance('salesRep');

var useActiveSession = sessionManager.isSessionSaved();

/**
 * @method init
 * @private
 * Initialize values for the login window
 * @return {void}
 */
function init() {
	analytics.captureApm('[loginWindow] - init()');

	doLog && console.log('sessionManager.isSessionSaved(): ' + JSON.stringify(sessionManager.isSessionSaved(), null, '\t'));

	// TODO: move this to the style (Alloy custom queries)
	if (OS_IOS) {
		if (!Alloy.Globals.iPhoneTall) {
			$.stayLoggedInContainer.applyProperties($.stayLoggedInContainer.iPhone4);
			$.termsAndConditionsButton.applyProperties($.termsAndConditionsButton.iPhone4);
			$.Wrapper.applyProperties($.Wrapper.iPhone4);
		}
	}
	// ------------------

	salesReps.fetch({
		reset: true
	});
	salesReps.each(function (salesRep) {
		salesRep && salesRep.set({
			tries: 0
		}).save();
	});

	if (useActiveSession && sessionManager.getSessionUser()) {
		var _username = sessionManager.getSessionUser().username || '';
		$.loginField.value = _username.substring(0, _username.indexOf('@'));
		$.passwordField.value = 'password'; // We won't put the real password here

		// Because Android
		setTimeout(function () {
			$.loginField.addEventListener('change', handleFieldChange);
			$.passwordField.addEventListener('change', handleFieldChange);
		}, 700);

	}
};

/**
 * @method loginSuccess
 * @private
 * Login success callback response
 * @param {Object} _params Response from the server
 * @return {void}
 */
var loginSuccess = function (_params) {
	doLog && console.log('[loginWindow] - loginSuccess() - ' + JSON.stringify(_params));
	analytics.captureTiAnalytics('Login.Authentication.Success');

	salesRep.set({
		tries: 0
	}).save();

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
	var _httpError = _data.http || {};
	var _status = Number(_httpError.status || '0');
	var _message = '';
	var defaultMsg = (!http.isOnline()) ? L("no_internet_connection") : L("please_try_again_later");

	switch (_status) {
	case 401:
		_message = L("userid_or_password_incorrect");
		break;
	case 500:
	case 0:
		_message = _data.message || defaultMsg;
		break;
	default:
		_message = _data.message || defaultMsg;
	}

	appNavigation.hideLoadingIndicator({
		forceHide: true
	});

	appNavigation.showAlert({
		message: _message,
		onClick: function () {
			// Login fails workaround
			// TODO:This should be done on the server side
			if (_status == 401) {
				var tries = salesRep.get('tries') || 0;
				tries++;
				if (tries === 3) {
					appNavigation.showAlertMessage(L("you_have_failed_to_login"));
				} else if (tries > 4) {
					appNavigation.showAlertMessage(L("your_account_has_been_locked"));
				}
				salesRep.set({
					tries: tries
				}).save();
			}
		}
	});

};

/**
 * @method refresh
 * Refreshes the UI based on the model's data
 * @return {void}
 */
$.refresh = function () {

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
	var username = $.loginField.value;

	$.blurFields();

	appNavigation.showLoadingIndicator({
		autoShow: true,
		container: $.window
	});

	salesRep.clear();
	salesRep.fetch({
		query: {
			where: {
				'id = ?': username,
				'username = ?': username
			},
			'limit': 1
		}
	});

	salesRep.set({
		'id': username,
		'username': username
	}).save();

	_tries = Number(salesRep.get('tries') || 0);

	if (_tries > 4) {
		appNavigation.hideLoadingIndicator();
		appNavigation.showAlertMessage(L("your_account_has_been_locked"));
	} else {
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
	var currentPoliciesVersion = Ti.App.Properties.getString("policy_version", "");
	if (currentPoliciesVersion !== Alloy.Globals.policyVersion) {
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
$.termsAndConditionsButton.addEventListener("click", appNavigation.openLoginPoliciesWindow);
$.window.addEventListener("click", $.blurFields);
$.window.addEventListener('open', handleWindowOpen);
$.window.addEventListener('focus', handleWindowFocus);
OS_ANDROID && $.window.addEventListener('androidback', handleAndroidBack);

init();
