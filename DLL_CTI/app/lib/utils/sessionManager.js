var webservices = require('/utils/webservices');
var SlowAES = require('external/SlowAES/Ti.SlowAES');
var salesRep = Alloy.Models.instance('salesRep');
var analytics = require('/utils/analytics');
var appNavigation = require('/appNavigation');

/**
 * Manages the session and salesrep model, all the login, logout, and user-dependent data functions should be called here
 * @class Lib.utils.sessionManager
 * @singleton
 */

var sessionManager = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	var isLiveSession = false;
	var user = null;
	var countryData = null;
	var language = null;
	var slowAES = new SlowAES({
		iv: Alloy.Globals.aes.iv
	});

	/**
	 * @method
	 * @private
	 * Persists a session's data to be used next time after the app closes
	 * @param user {Object} User's data to persist
	 * @return {void}
	 */
	var saveSession = function (user) {
		analytics.captureApm('[sessionManager] - saveSession()');
		Ti.App.Properties.setObject("USER", user);
	};

	/**
	 * @method
	 * @private
	 * Loads the country JSON data based on the currently loaded user
	 * @return {void}
	 */
	var loadCountry = function () {
		analytics.captureApm('[sessionManager] - loadCountry()');
		var _country = null;
		if (user && user.salesGroup) {
			switch (user.salesGroup) {
				default: analytics.captureApm('[sessionManager] - loadCountry() - CT&I');
				_country = require('/countries/cti');
				break;

			}

			countryData = JSON.parse(JSON.stringify(_country));
		} else {
			countryData = null;
		}
	};

	/**
	 * @method
	 * @private
	 * Loads the language object for the currently loaded user on the session.
	 * Will load a default language if it has not any lang selected
	 * @return {void}
	 */
	var loadDocsLang = function () {
		analytics.captureApm('[sessionManager] - loadDocsLang()');
		if (salesRep.has('language')) {
			setDocsLang(salesRep.get('language'));
		} else {
			language = _.findWhere(countryData.languages, {
				key: Alloy.Globals.currentLanguage
			}) || _.first(countryData.languages);

			setDocsLang(language.key);
		}
	};

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method
	 * @public
	 * Attetmps to do a login call on the webservice, if success will create a new session, 
	 * initialize the salesRep model and initialize the country for him
	 * @param _params {Object} Parameters for login
	 * @param _params.username {String} User's name for the login
	 * @param _params.password {String} User's password for the login, without encryption
	 * @param [_params.keepLogged = false] {Boolean} Should the session be remained after the app closes?
	 * @param [_params.successCallback] {Function} Callback function to be called on success login
	 * @param [_params.failCallback] {Function} Callback function to be called on failure login
	 * @param [_params.useActiveSession = false] {Boolean} If true, will attempt to login using the current's session credentials
	 * @return {void}
	 */
	var attemptLogin = function (_params) {
		analytics.captureApm('[sessionManager] - attemptLogin()');
		var params = _params || {};

		var _useActiveSession = params.useActiveSession || false;
		var _username = null;
		var _password = null;
		var _currentUser = getSessionUser() || {};

		if (_useActiveSession) {
			_username = _currentUser.username;
			_password = _currentUser.password;
		} else {
			_username = params.username || '';
			_password = slowAES.encrypt(params.password, Alloy.Globals.aes.key);
		}

		if (_username && _password) {
			webservices.login({
				username: _username,
				password: _password,
				successCallback: function (_data, _headers) {
					var _id = _headers['X-DLLUser'];
					var _group = _headers['X-DLLGroup'];
					var _token = _headers['X-DLLToken'];

					_group = (_group || '').toUpperCase();

					user = {
						username: _username,
						password: _password,
						id: _id,
						salesGroup: _group,
						token: _token
					};

					createSession();

					if (params.keepLogged) {
						saveSession(user);
					}

					params.successCallback && params.successCallback(_data, _headers);
				},
				failCallback: params.failCallback
			});

		} else {
			params.failCallback && params.failCallback({
				message: 'Username and Password are required'
			});
		}
	};

	/**
	 * @method
	 * @public
	 * Logout the user, removing the actual session, country data and clearing its salesRep model
	 * @return {void}
	 */
	var logout = function () {
		analytics.captureApm('[sessionManager] - logout()');
		isLiveSession = false;
		user = null;
		countryData = null;
		Ti.App.Properties.removeProperty("USER");
		appNavigation.closeMainWindow();
		salesRep.clear();
	};

	/**
	 * @method
	 * @public
	 * Attempts to create a new session from the previously saved info, if any
	 * @return {Boolean} status creating the session, will return false if the session was not created
	 */
	var createSession = function () {
		analytics.captureApm('[sessionManager] - createSession()');
		if (!user && isSessionSaved()) {
			user = Ti.App.Properties.getObject("USER") || null;
		}

		if (user) {
			analytics.setApmUsername(user.id);

			loadCountry();

			isLiveSession = (countryData != null);

			if (isLiveSession) {
				salesRep.clear();
				salesRep.fetch({
					id: user.id
				});

				loadDocsLang();

				salesRep.set(user);
				salesRep.save();
			}

		} else {
			isLiveSession = false;
		}

		return isLiveSession;
	};

	/**
	 * @method
	 * @public
	 * Useful to know if there is already a logged in user
	 * @return {Boolean} true if a session is active
	 */
	var isSessionActive = function () {
		return isLiveSession;
	};

	/**
	 * @method getSessionUser
	 * @public
	 * Returns the current user's session if any
	 * @return {Object} User's session, null if there is no user
	 */
	var getSessionUser = function () {
		return Ti.App.Properties.getObject("USER");
	};

	/**
	 * @method
	 * @public
	 * Obtains the user's data from the active session, if any
	 * @return {Object} User's data (This will *NOT* return a SalesRep Model)
	 */
	var getUser = function () {
		return user;
	};

	/**
	 * @method
	 * Obtains the user's data from the active session, if any
	 * @return {Object} User's data (This will *NOT* return a SalesRep Model)
	 */
	var getSalesRep = function () {
		return salesRep;
	};

	/**
	 * @method
	 * @public
	 * Useful to know if there is some session previous persisted to be loaded
	 * @return {Boolean} true if there is a session persisted on the device
	 */
	var isSessionSaved = function () {
		return (Ti.App.Properties.hasProperty("USER"));
	};

	/**
	 * @method
	 * @public
	 * Obtains the country data for the loaded user
	 * @return {Object} Country JSON
	 */
	var getCountryData = function () {
		return countryData;
	};

	/**
	 * @method
	 * @public
	 * Updates the language selected for the docs
	 * If the language is not found, it will be ignored
	 * @param _lang {String} Language name, such as 'en' or 'fr'
	 * @return {void}
	 */
	var setDocsLang = function (_lang) {
		analytics.captureApm('[sessionManager] - setDocsLang() - ' + _lang);
		var newLang = null;

		if (countryData) {
			newLang = _.findWhere(countryData.languages, {
				key: _lang
			});
		}

		if (newLang) {
			salesRep.set('language', _lang).save();
			language = newLang;
		} else {
			analytics.logApmHandledException(new Error(
				'[sessionManager] - setDocsLang() - Could not update Docs Lang (Not Found): ' + _lang));
		}

	};

	/**
	 * @method
	 * @public
	 * Obtains the language data for the currently selected language
	 * @return {Object} Language data
	 */
	var getDocsLang = function () {
		return language;
	};

	// Public API.
	return {
		attemptLogin: attemptLogin,
		logout: logout,

		getUser: getUser,
		getSalesRep: getSalesRep,
		getCountryData: getCountryData,
		getDocsLang: getDocsLang,
		setDocsLang: setDocsLang,
		createSession: createSession,

		isSessionActive: isSessionActive,
		isSessionSaved: isSessionSaved,
		getSessionUser: getSessionUser
	};
})();

module.exports = sessionManager;
