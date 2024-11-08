/**
 * @class Utils.sessionManager
 * Manages the session and salesrep model, all the login, logout, and user-dependent data functions should be called here
 * @singleton
 */

var doLog = Alloy.Globals.doLog;
const LOG_TAG = '\x1b[35m' + '[utils/sessionManager]' + '\x1b[39;49m ';

var webservices = require('/utils/webservices');
var SlowAES = require('/external/SlowAES/Ti.SlowAES');
var analytics = require('/utils/analytics');
var customizations = require('/customizations');
var configsManager = require('/utils/configsManager');

var salesRep = null;
var tries = 0;

var sessionManager = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	var isLiveSession = false;
	var isBUSupported = true;
	var user = null;
	var countryData = null;
	var language = null;
	var rateCardHandler = null;
	var calculatorManager = null;
	var slowAES = new SlowAES({
		iv: Alloy.Globals.aes.iv
	});

	webservices.setRefreshTokenHandler(function (_authToken, _refreshToken) {
		doLog && console.log(LOG_TAG, '- refreshToken success');
		var savedSession = isSessionSaved() && getSessionUser();
		if (savedSession) {
			savedSession.token = _authToken;
			savedSession.refreshToken = _refreshToken;
			saveSession(savedSession);

			salesRep && salesRep.set(savedSession).save();

			webservices.updateSalesRep(salesRep);
			customizations.updateSalesRep(salesRep);
		}
	});

	/**
	 * @method
	 * @private
	 * Persists a session's data to be used next time after the app closes
	 * @param _user {Object} User's data to persist
	 * @return {void}
	 */
	var saveSession = function (_user) {
		doLog && console.log(LOG_TAG, '- saveSession');

		analytics.captureEvent('[sessionManager] - saveSession()');
		Ti.App.Properties.setObject('USER', _user);
	};

	/**
	 * @method loadConfigs
	 * @private
	 * Loads the country JSON data based on the currently languageoaded user
	 * @return {void}
	 */
	var loadConfigs = function () {
		doLog && console.log(LOG_TAG, '- loadConfigs');

		analytics.captureEvent('[sessionManager] - loadConfigs()');
		var configPath = null;

		if (user && user.salesGroup) {
			switch (user.salesGroup) {
			case 'APL':
				analytics.captureEvent('[sessionManager] - loadConfigs() - APPLE');
				configPath = 'configs/apple';
				isBUSupported = true;
				break;

			default:
				doLog && console.error(LOG_TAG, '- Business Unit not Supported: ' + user.salesGroup);
				isBUSupported = false;
				return false;
			}

		}

		if (configPath) {
			var countryData = configsManager.useConfigs(configPath);
			rateCardHandler = configsManager.getLib('rateCards');
			calculatorManager = configsManager.getLib('calculations/calculatorManager');

			return !!countryData;
		} else {
			return false;
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
		analytics.captureEvent('[sessionManager] - loadDocsLang()');

		if (salesRep.has('language')) {
			setDocsLang(salesRep.get('language'));
		} else {
			var languages = configsManager.getConfig('languages');

			language = _.findWhere(languages, {
				key: Alloy.Globals.currentLanguage
			}) || _.first(languages);

			setDocsLang(language.key);
		}
	};

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method
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
		analytics.captureEvent('[sessionManager] - attemptLogin()');
		_params = _params || {};

		var _useActiveSession = _params.useActiveSession || false;
		var _username = null;
		var _password = null;
		var _currentUser = getSessionUser() || {};

		if (_useActiveSession) {
			_username = _currentUser.username;
			_password = _currentUser.password;
		} else {
			_username = _params.username || '';
			_password = _params.password || ''; //slowAES.encrypt(_params.password, Alloy.Globals.aes.key);
		}

		if (_username && _password) {
			webservices.login({
				username: _username,
				password: _password,
				include: 'vendorCode',
				successCallback: function (_data, _headers) {
					if (_data.success) {
						var _id = _data[_data.key].userId;
						var apiType = _data[_data.key].apiType || [];
						var _token = _data[_data.key].authToken;
						var _refreshToken = _data[_data.key].refreshToken;
						var _vendorCode = _data[_data.key].vendorCode || null;

						var handleRateCardsFetch = function (_rateCards) {
							if (rateCardHandler && rateCardHandler.hasRateCards()) {
								_params.successCallback && _params.successCallback({
									response: _data,
									headers: _headers,
									salesRep: salesRep
								});
							} else {

								logout();

								if (_useActiveSession) {
									saveSession(_currentUser);
								}

								_params.failCallback && _params.failCallback({
									tries: tries,
									data: _data,
									message: L('no_rate_cards_error')
								});
							}
						};

						var _group = _.find(apiType, function (element) {
							return Alloy.Globals.validUserGroups.indexOf(element.Href) >= 0;
						});

						if (!_group) {
							var message = L('userid_or_password_incorrect');

							_params.failCallback && _params.failCallback({
								tries: tries,
								data: _data,
								message: message
							});
							return;
						}
						_group = (_group.Href || '').toUpperCase();

						user = {
							username: _username,
							password: slowAES.encrypt(_password, Alloy.Globals.aes.key),
							id: _id,
							salesGroup: _group,
							token: _token,
							refreshToken: _refreshToken,
							vendorCode: _vendorCode
						};

						if (createSession()) {
							if (_params.keepLogged) {
								saveSession(user);
							}

							tries = 0;

							rateCardHandler && rateCardHandler.fetchRateCards({
								salesRep: salesRep,
								successCallback: handleRateCardsFetch,
								failureCallback: handleRateCardsFetch
							});
						} else {
							_params.failCallback && _params.failCallback({
								tries: tries,
								data: _data,
								message: !isBUSupported ? L('userid_or_password_incorrect') : L('please_try_again_later')
							});
						}
					} else {
						_params.failCallback && _params.failCallback({
							tries: tries,
							data: _data,
							message: !isBUSupported ? L('userid_or_password_incorrect') : L('please_try_again_later')
						});
					}
				},
				failCallback: function (_data) {
					doLog && console.log(LOG_TAG, '- attemptLogin - failCallback');

					_data = _data || {};
					var httpError = _data.http || {};
					var status = Number(httpError.status) || 0;
					var message = '';
					var responseText = null;
					if (httpError.responseText) {
						try {
							responseText = JSON.parse(httpError.responseText);
						} catch (exception) {
							responseText = {
								message: L('please_try_again_later')
							};
						}
					}

					switch (status) {
					case 401:
						message = L('userid_or_password_incorrect');
						tries++;
						break;
					default:
						message = L('please_try_again_later');
					}

					_params.failCallback && _params.failCallback({
						tries: tries,
						data: _data,
						message: message
					});
				}
			});

		} else {

			_params.failCallback && _params.failCallback({
				message: 'Username and Password are required'
			});
		}
	};

	/**
	 * @method
	 * Logout the user, removing the actual session, country data and clearing its salesRep model
	 * @return {void}
	 */
	var logout = function () {
		analytics.captureEvent('[sessionManager] - logout()');
		isLiveSession = false;
		user = null;

		Ti.App.Properties.removeProperty('USER');
		salesRep && salesRep.set({
			'lastCustomizationsUpdate': null,
			'lastRateCardUpdate': null
		}).save();
		salesRep = null;

		configsManager.useConfigs(null);
		webservices.updateSalesRep(null);
		webservices.setRefreshTokenHandler(null);
		customizations.updateSalesRep(null);
	};

	/**
	 * @method
	 * Attempts to create a new session from the previously saved info, if any
	 * @return {Boolean} status creating the session, will return false if the session was not created
	 */
	var createSession = function () {
		analytics.captureEvent('[sessionManager] - createSession()');
		if (!user && isSessionSaved()) {
			user = Ti.App.Properties.getObject('USER') || null;
		}

		if (user) {
			analytics.setApmUsername(user.id);

			isLiveSession = loadConfigs();

			if (isLiveSession) {
				salesRep = Alloy.createModel('salesRep');
				salesRep.fetch({
					id: user.id
				});

				loadDocsLang();

				webservices.updateSalesRep(salesRep);
				customizations.updateSalesRep(salesRep);

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
	 * Useful to know if there is already a logged in user
	 * @return {Boolean} true if a session is active
	 */
	var isSessionActive = function () {
		return isLiveSession;
	};

	/**
	 * @method getSessionUser
	 * Returns the current user's session if any
	 * @return {Object} User's session, null if there is no user
	 */
	var getSessionUser = function () {
		return Ti.App.Properties.getObject('USER');
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
	 * Useful to know if there is some session previous persisted to be loaded
	 * @return {Boolean} true if there is a session persisted on the device
	 */
	var isSessionSaved = function () {
		return (Ti.App.Properties.hasProperty('USER'));
	};

	/**
	 * @method
	 * Updates the language selected for the docs
	 * If the language is not found, it will be ignored
	 * @param _lang {String} Language name, such as 'en' or 'fr'
	 * @return {void}
	 */
	var setDocsLang = function (_lang) {
		analytics.captureEvent('[sessionManager] - setDocsLang() - ' + _lang);
		var languages = configsManager.getConfig('languages');
		var newLang = null;

		if (languages) {
			newLang = _.findWhere(languages, {
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
	 * @method getDocsLang
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
		getSalesRep: getSalesRep,
		getDocsLang: getDocsLang,
		setDocsLang: setDocsLang,
		createSession: createSession,
		isSessionActive: isSessionActive,
		isSessionSaved: isSessionSaved,
		getSessionUser: getSessionUser
	};
})();

module.exports = sessionManager;
