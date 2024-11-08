/**
 * Web services
 * Provides the urls for the calls of the webservices
 * @class Libs.webservices
 * @singleton
 */
var doLog = Alloy.Globals.doLog;
var http = require('/utils/http');
var baseWSUrl = Alloy.Globals.baseWSUrl;
var baseWSUrlApiBuilder = Alloy.Globals.baseWSUrlApiBuilder;
var baseWSApiKeyApiBuilder = Alloy.Globals.baseWSApiKeyApiBuilder;
var gatewayApiPath = '/api/gateway/';
var rateCardsApiPath = '/api/rate_cards/';
var dllServicesApiPath = '/api/dll/';
var quotesApiPath = '/api/quotes/';
var mobileServicesApiPath = '/api/mobile/';

/**
 * @property {String} Alloy.Globals.shortenerWSUrl URL to extend shortened urls
 */
var shortenerWSUrl = Alloy.Globals.shortenerWSUrl;

/**
 * @property {Array} requestsQueue Queue to store requests.
 */
var requestsQueue = [];

var webservices = (function () {
	// Private members
	var refreshTokenHandler = null;
	var isRefreshingToken = false;
	var salesRep = null;
	var urls = {
		login: baseWSUrlApiBuilder + gatewayApiPath + 'authenticate',
		refreshToken: baseWSUrlApiBuilder + gatewayApiPath + 'refreshToken',
		customizations: baseWSUrlApiBuilder + dllServicesApiPath + 'customizations',
		submitQuote: baseWSUrlApiBuilder + dllServicesApiPath + 'submitApplication',

		ratefactors: baseWSUrlApiBuilder + rateCardsApiPath + 'rate_factors/published',

		fetchQuote: baseWSUrlApiBuilder + quotesApiPath + 'quote',
		fetchQuotes: baseWSUrlApiBuilder + quotesApiPath + 'quotes',
		saveQuote: baseWSUrlApiBuilder + quotesApiPath + 'quote',
		fetchEvent: baseWSUrlApiBuilder + quotesApiPath + 'event',
		saveEvent: baseWSUrlApiBuilder + quotesApiPath + 'event',

		ratingsList: baseWSUrlApiBuilder + mobileServicesApiPath + 'rating',
		versionQuery: baseWSUrlApiBuilder + mobileServicesApiPath + 'version',

		// TODO: These are still pending of update
		versionUpdateShortenedUrl: shortenerWSUrl,
		defaultUrl: baseWSUrl + '/dll/rest/finance/user/[salesRepName]/group/[group]/[method]',
		searchContracts: baseWSUrl + '/dll/rest/finance/user/[salesRepName]/group/[group]/contracts',
		terminationQuote: baseWSUrl + '/dll/rest/finance/user/[salesRepName]/group/[group]/terminationQuote',
		searchCustomers: baseWSUrl + '/dll/rest/finance/user/[salesRepName]/group/[group]/customers',

	};

	/**
	 * @method pushRequest
	 * @private
	 * Pushes a request into the queue for later processing
	 * @param {Object} _params Details about the request
	 * @return {Void}
	 */
	function pushRequest(_params) {
		requestsQueue.push(_params);
	};

	/**
	 * @method processQueue
	 * @private
	 * Executes the queued requests and dequeues them.
	 * @return {Void}
	 */
	function processQueue() {
		while (requestsQueue.length > 0) {
			var requestParameters = requestsQueue.shift();
			var headers = createApiHeaders(); // use new token
			requestParameters.headers = headers;
			http.request(requestParameters);
		}
	};

	/**
	 * @method emptyQueue
	 * @private
	 * Empties the request queue.
	 * @return {Void}
	 */
	function emptyQueue() {
		requestsQueue = [];
	};

	/**
	 * @method request
	 * @private
	 * Attempts to do a single request, parsing the url tokens and adding GET params if needed
	 * @param {Object} _params Details about the request
	 * @param {String} [_params.type='GET'] Type used in the request to the server
	 * @param {Object} [_params.parameters] Parameters for the request to the server
	 * @param {String} [_params.url] Url for the request to the server
	 * @param {Object} [_params.urlTokens] Url tokens for the request to the server
	 * @param {String} [_params.username] User name for the request to the server
	 * @param {String} [_params.password] Password for the request to the server
	 * @param {String} [_params.headers] Header for the request to the server
	 * @param {Function} [_params.success] Success callback for the request to the server
	 * @param {Function} [_params.failure] Fail callback for the request to the server
	 * @param {Boolean} [_params.shouldAuthenticate=false] Used to know if it is should authenticate 
	 * @param {String} [_params.context] Context used in the request to the server
	 * @param {Boolean} [_params.isShortener] Flag used for update helper on shortened urls
	 * @return {Ti.Network.HTTPClient} Details about the request to the server
	 */
	function request(_params) {
		_params = _params || {};

		var type = _params.type || 'GET';
		var getParams = (type === 'GET' ? _params.parameters : {});
		var url = createURL((_params.url || urls.defaultUrl), _params.urlTokens, getParams);
		var headers = _params.headers || [];
		var username = salesRep ? salesRep.get('username') : '';
		var password = salesRep ? salesRep.get('password') : '';
		var currentAuthToken = salesRep ? salesRep.get('token') : null;
		var currentRefreshToken = salesRep ? salesRep.get('refreshToken') : null;
		var timeout = _params.timeout || null;

		username = _params.username || username;
		password = _params.password || password;

		return http.request({
			url: url,
			type: type,
			parameters: (type !== 'GET' ? _params.parameters : null),
			success: function (_response, _headers, _context) {
				var success = _response.success || _params.isShortener || false;

				if (!success) {
					_params.failCallback && _params.failCallback(_response, _context);
					return;
				}

				_params.successCallback && _params.successCallback(_response, _headers, _context);
			},
			failure: function (_response, _context) {
				if (http.isOnline() && _response.event && _response.event.code === 401) {
					pushRequest({
						url: url,
						type: type,
						parameters: (type !== 'GET' ? _params.parameters : null),
						success: _params.successCallback,
						failure: _params.failCallback,
						shouldAuthenticate: _params.shouldAuthenticate || false,
						headers: headers,
						username: username,
						password: password,
						context: _params.context
					});

					!isRefreshingToken && refreshToken({
						token: currentAuthToken,
						refreshToken: currentRefreshToken,
						successCallback: function (_resp) {
							if (_resp.success) {
								refreshTokenHandler && refreshTokenHandler(_resp.result.authToken, _resp.result.refreshToken);
								processQueue();
							}
							isRefreshingToken = false;
						},
						failCallback: function (_resp) {
							isRefreshingToken = false;

							if (!http.isOnline() && _resp.event && _resp.event.code < 0) {
								// timed out because a network drop
							} else {
								emptyQueue();
								var application = require('/application');
								application.logout();
							}
							_params.failCallback && _params.failCallback(_response, _context);
						}
					});
				} else {
					_params.failCallback && _params.failCallback(_response, _context);
				}
			},
			shouldAuthenticate: _params.shouldAuthenticate || false,
			headers: headers,
			username: username,
			password: password,
			context: _params.context,
			timeout: timeout
		});
	};

	/**
	 * @method createURL
	 * @private
	 * Creates an url string, parsing the url tokens and adding get params if applies
	 * @param {String} _baseUrl with square brackets
	 * @param {Object} _urlTokens Tokens to be replaced on the URL String
	 * @param {Object} _getParams Parameters for the GET calls
	 * @return {String} Returns the parsed URL String
	 */
	function createURL(_baseUrl, _urlTokens, _getParams) {
		_getParams = _getParams || {};
		var salesRepTokens = {};
		var url = _baseUrl || '';
		var tokens = {};
		var getParamsArray = _.map(_getParams, function (_value, _key) {
			if (_.isObject(_value) || _.isArray(_value)) {
				_value = JSON.stringify(_value);
			}
			return _key + '=' + encodeURIComponent(_value);
		});

		if (salesRep) {
			salesRepTokens = {
				'salesRepName': salesRep.id,
				'group': salesRep.get('salesGroup')
			};
		}

		_.extend(tokens, salesRepTokens, _urlTokens);

		url = replaceURLTokens(url, tokens);

		if (getParamsArray.length > 0) {
			url += '?' + getParamsArray.join('&');
		}
		return url;
	};

	/**
	 * @method replaceURLTokens
	 * @private
	 * Replace url tokens
	 * @param {String} _template url with square brackets
	 * @param {Object} _tokens Token details
	 * @return {String} url without square brackets, and token
	 */
	function replaceURLTokens(_template, _tokens) {
		var _result = '' + (_template || '');
		_tokens = _tokens || {};
		_result = _result.replace(/\[\w+\]/g, function (_found, _index) {
			var _foundStrip = _found.replace(/[^\w]/g, '');
			return _tokens[_foundStrip] || '';
		});
		return _result;
	};

	/**
	 * @method createDLLHeaders
	 * @private
	 * Creates the default headers list for DLL webservices
	 * @param {String} [_username=salesRep.get('username')] DLL User Name
	 * @param {String} [_password=salesRep.get('password')] DLL User Password
	 * @return {Array} Headers Array
	 */
	function createDLLHeaders(_username, _password) {
		var username = _username;
		var password = _password;

		if (salesRep && (!username || !password)) {
			username = salesRep.get('username');
			password = salesRep.get('password');
		}

		var _dllHeaders = [{
			name: 'Content-Type',
			value: 'application/json'
		}, {
			name: 'Accept',
			value: 'application/json'
		}, {
			name: 'Authorization',
			value: 'DLLEncrypted ' + Ti.Utils.base64encode(username + ':' + password).toString().replace(/[\n\r]/g, '')
		}];

		if (salesRep && salesRep.get('token')) {
			_dllHeaders.push({
				name: 'X-DLLToken',
				value: salesRep.get('token')
			});
		}

		return _dllHeaders;
	};

	/**
	 * @method createGatewayHeaders
	 * @private
	 * Creates the default headers list for gateway api
	 * @return {Array} Headers Array
	 */
	function createGatewayHeaders() {
		var _headers = [{
			name: 'Content-Type',
			value: 'application/json'
		}, {
			name: 'Accept',
			value: 'application/json'
		}, {
			name: 'Authorization',
			value: 'Basic ' + Ti.Utils.base64encode(baseWSApiKeyApiBuilder + ':').toString().replace(/[\n\r]/g, '')
		}];

		return _headers;
	};

	/**
	 * @method createApiHeaders
	 * @private
	 * Creates the default headers list for the api
	 * @return {Array} Headers Array
	 */
	function createApiHeaders() {
		var authToken = null;
		if (salesRep && salesRep.get('token')) {
			authToken = salesRep.get('token');
		}
		var _headers = [{
			name: 'Content-Type',
			value: 'application/json'
		}, {
			name: 'Accept',
			value: 'application/json'
		}, {
			name: 'Authorization',
			value: 'Bearer ' + authToken
		}];

		return _headers;
	};

	// Public members

	/**
	 * @method login
	 * Attempts login
	 * @param {Object} _params parameters
	 * @param {String} _params.username Username
	 * @param {String} _params.password Password
	 * @param {String} _params.include Include attributes in response (vendorCode)
	 * @param {Function} _params.success Callback function called when the request succeded
	 * @param {Function} _params.failure Callback function called when the request failed
	 * @return {void}
	 */
	function login(_params) {
		_params = _params || {};

		_params.parameters = {
			username: _params.username,
			password: _params.password
		};
		if (_params.include) {
			_params.parameters.include = _params.include;
		}
		_params.type = 'POST';
		_params.url = urls.login;
		_params.shouldAuthenticate = true;
		_params.headers = createGatewayHeaders();

		request(_params);
	};

	/**
	 * @method refreshToken
	 * Refreshes an expired token
	 * @param {Object} _params parameters
	 * @param {String} _params.token Token
	 * @param {String} _params.refreshToken Refresh token
	 * @param {Function} _params.successCallback Callback function called when the request succeded
	 * @param {Function} _params.failCallback Callback function called when the request failed
	 * @return {void}
	 */
	function refreshToken(_params) {
		isRefreshingToken = true;

		_params = _params || {};
		if (!_params.token || !_params.refreshToken) {
			_params.failCallback && _params.failCallback();
			return false;
		}
		_params.parameters = {
			authToken: _params.token,
			refreshToken: _params.refreshToken
		};
		_params.type = 'POST';
		_params.url = urls.refreshToken;
		_params.shouldAuthenticate = true;
		_params.headers = createGatewayHeaders();

		request(_params);
	};

	/**
	 * @method fetchQuote
	 * Retrieves a single quote based on its ID
	 * @param {Object} _params parameters
	 * @param {Object} _params.quoteID Quote's ID to search for
	 * @param {Function} _params.success Callback function called when the request succeded
	 * @param {Function} _params.failure Callback function called when the request failed
	 * @return {void}
	 */
	function fetchQuote(_params) {
		_params = _params || {};

		_params.url = urls.fetchQuote + '/' + _params.quoteID;
		_params.headers = createApiHeaders();

		request(_params);
	};

	/**
	 * @method fetchQuotes
	 * Retrieves a list of quotes for the current logged in user
	 * @param {Object} _params parameters
	 * @param {Number} _params.page Page number to search for
	 * @param {Function} _params.success Callback function called when the request succeded
	 * @param {Function} _params.failure Callback function called when the request failed
	 * @return {void}
	 */
	function fetchQuotes(_params) {
		_params = _params || {};

		_params.url = urls.fetchQuotes;
		var limit = _params.size <= Alloy.Globals.quoteLimit ? _params.size : Alloy.Globals.quoteLimit;

		_params.parameters = {
			currentPage: '' + _params.page,
			limit: '' + limit
		};
		if (_params.where) {
			_params.parameters.where = _params.where;
		}
		_params.headers = createApiHeaders();
		_params.timeout = 90000;

		request(_params);
	};

	/**
	 * @method saveQuote
	 * Saves a single quote on the quote repository
	 * @param {Object} _params parameters
	 * @param {Models.quote} _params.quote Quote model to save
	 * @param {Function} _params.success Callback function called when the request succeded
	 * @param {Function} _params.failure Callback function called when the request failed
	 * @return {void}
	 */
	function saveQuote(_params) {
		_params = _params || {};

		_params.url = urls.saveQuote;
		_params.type = 'POST';

		var quote = _params.quote;
		delete quote.pendingSync;
		delete quote.requests;
		delete quote.isOutdated;
		delete quote.leaseFileName;
		delete quote.activeRequest;
		delete quote.httpRequest;

		_params.parameters = quote;
		_params.headers = createApiHeaders();

		request(_params);
	};

	/**
	 * @method fetchEvent
	 * Retrieves a single event based on its ID
	 * @param {Object} _params parameters
	 * @param {Object} _params.quoteID Quote's ID to search for
	 * @param {Function} _params.success Callback function called when the request succeded
	 * @param {Function} _params.failure Callback function called when the request failed
	 * @return {void}
	 */
	function fetchEvent(_params) {
		_params = _params || {};

		_params.url = urls.fetchEvent + '/' + _params.quoteID;

		_params.headers = createApiHeaders();

		request(_params);
	};

	/**
	 * @method saveEvent
	 * Saves a single quote on the quote repository
	 * @param {Object} _params parameters
	 * @param {Models.quote} _params.quote Quote model to save
	 * @param {Function} _params.success Callback function called when the request succeded
	 * @param {Function} _params.failure Callback function called when the request failed
	 * @return {void}
	 */
	function saveEvent(_params) {
		_params = _params || {};

		_params.url = urls.saveEvent;
		_params.type = 'POST';
		_params.parameters = _params.quote;

		_params.headers = createApiHeaders();

		request(_params);
	};

	/**
	 * @method submitQuote
	 * Submits a quote to DLL, meaning the deal has been closed
	 * @param {Object} _params parameters
	 * @param {Object} _params.quote quote object to submit
	 * @param {Function} _params.success Callback function called when the request succeded
	 * @param {Function} _params.failure Callback function called when the request failed
	 * @return {void}
	 */
	function submitQuote(_params) {
		_params = _params || {};

		_params.url = urls.submitQuote;
		_params.parameters = {
			jsonDocument: _params.quote
		};
		_params.type = 'POST';
		_params.headers = createApiHeaders();

		request(_params);
	};

	/**
	 * @method searchContracts
	 * Searches using hte contract URL
	 * @param {Object} _params parameters
	 * @param {String} [_params.customerName] Customer Name to search for
	 * @param {String} [_params.partyPhone] Phone to search for
	 * @param {String} [_params.partyName] Make Dealer Name to search for
	 * @param {String/Number} [_params.page=1] Page number
	 * @param {Function} _params.success Callback function called when the request succeded
	 * @param {Function} _params.failure Callback function called when the request failed
	 * @return {void}
	 */
	function searchContracts(_params) {
		_params = _params || {};

		_params.url = urls.searchContracts;
		_params.parameters = {
			customerName: _params.customerName,
			partyPhone: _params.partyPhone,
			contractNumber: _params.contractNumber,
			page: _params.page || 1
		};
		_params.headers = createDLLHeaders();

		request(_params);
	};

	/**
	 * @method terminationQuote
	 * Searches for a Keep or Return value (OTHC only)
	 * @param {Object} _params parameters
	 * @param {String} _params.quoteType Quote Type to search (either 'KEEP' or 'RETURN')
	 * @param {String} [_params.customerName] Customer Name to search for
	 * @param {String} [_params.contractID] Contract ID
	 * @param {String} [_params.contractNumber] Contract Number
	 * @param {Function} _params.success Callback function called when the request succeded
	 * @param {Function} _params.failure Callback function called when the request failed
	 * @return {void}
	 */
	function terminationQuote(_params) {
		_params = _params || {};

		_params.url = urls.terminationQuote;
		_params.parameters = {
			contractID: _params.contractID,
			customerName: _params.customerName,
			contractNumber: _params.contractNumber,
			quoteType: _params.quoteType
		};
		_params.headers = createDLLHeaders();

		request(_params);
	};

	/**
	 * @method searchCustomers
	 * Searches using the customer URL
	 * @param {Object} _params parameters
	 * @param {String} [_params.sourceSystemID] SourceSystemID to search for
	 * @param {String} [_params.partyPhone] Phone to search for
	 * @param {String} [_params.partyName] Make Dealer Name to search for
	 * @param {String/Number} [_params.page=1] Page number
	 * @param {Function} _params.success Callback function called when the request succeded
	 * @param {Function} _params.failure Callback function called when the request failed
	 * @return {void}
	 */
	function searchCustomers(_params) {
		_params = _params || {};

		_params.url = urls.searchCustomers;
		_params.parameters = {
			//sourceSystemID : _params.sourceSystemID,
			page: _params.page || 1
		};

		(_params.partyName) && (_params.parameters.partyName = _params.partyName);
		(_params.partyPhone) && (_params.parameters.partyPhone = _params.partyPhone);
		_params.headers = createDLLHeaders();

		request(_params);
	};

	/**
	 * @method customizations
	 * Looks for customizations updates
	 * @param {Object} _params parameters
	 * @param {String} _params.lastRefreshDate Last refresh date, typically use: moment().format(moment.defaultFormat)
	 * @param {Function} _params.success Callback function called when the request succeded
	 * @param {Function} _params.failure Callback function called when the request failed
	 * @return {void}
	 */
	function customizations(_params) {
		_params = _params || {};

		_params.url = urls.customizations;
		_params.parameters = {
			lastRefreshDate: _params.lastRefreshDate
		};
		_params.headers = createApiHeaders();

		request(_params);
	};

	/**
	 * @method rateFactors
	 * Looks for rate factors updates
	 * @param {Object} Details for ratefactors
	 * @return {void}
	 */
	function rateFactors(_params) {
		_params = _params || {};

		_params.url = urls.ratefactors;
		_params.parameters = {};
		if (_params.vendorCode) {
			_params.parameters.vendorCodeName = _params.vendorCode;
		}
		if (_params.lastRefreshDate) {
			_params.parameters.lastPublished = _params.lastRefreshDate;
		}

		_params.headers = createApiHeaders();

		request(_params);
	};

	/**
	 * @method searchByCustomer
	 * Search by customer
	 * @param {Object} _params parameters	 
	 * @param {String} [_params.customerName] Customer Name to search for
	 * @param {String/Number} [_params.page=1] Page number
	 * @param {Function} _params.success Success callback for the request to the server
	 * @param {Function} _params.failure Fail callback for the request to the server
	 * @return {void}
	 */
	function searchByCustomer(_params) {
		_params = _params || {};
		_params.url = urls.searchContracts;
		_params.parameters = {
			customerName: _params.customerName,
			page: _params.page || 1
		};
		_params.headers = createDLLHeaders();
		request(_params);
	};

	/**
	 * @method searchByContractNumber
	 * Searches using a contract number
	 * @param {Object} _params parameters
	 * @param {String} [_params.contractNumber] Contract Number to search for
	 * @param {String} [_params.salesRepID] Sales Representive ID
	 * @param {String/Number} [_params.page=1] Page number
	 * @param {String} [_params.group] Sales group
	 * @param {Function} _params.success Callback function called when the request succeded
	 * @param {Function} _params.failure Callback function called when the request failed
	 * @return {void}
	 */
	function searchByContractNumber(_params) {
		_params = _params || {};
		_params.url = urls.searchContracts;
		_params.parameters = {
			contractNumber: _params.contractNumber,
			page: _params.page || 1
		};
		_params.headers = createDLLHeaders();
		request(_params);
	};

	/**
	 * @method searchBySourceSystemID
	 * Searches using a contract number
	 * @param {Object} _params parameters
	 * @param {String} [_params.salesRepID] Sales Representive Id
	 * @param {String} [_params.group] Sales group
	 * @param {String} [_params.sourceSystemID] Source System Id
	 * @param {Function} _params.success Callback function called when the request succeded
	 * @param {Function} _params.failure Callback function called when the request failed
	 * @return {void}
	 */
	function searchBySourceSystemID(_params) {
		_params = _params || {};
		_params.url = urls.searchCustomers;
		_params.parameters = {
			sourceSystemID: (_params.sourceSystemID || '')
		};
		_params.headers = createDLLHeaders();
		request(_params);
	};

	/**
	 * @method fetchEntityRatings
	 * @private
	 * Fetch Entity Ratings from ArrowDB
	 * @param {Object} _params parameters
	 * @param {Function} _params.success Callback function called when the request succeded
	 * @param {Function} _params.failure Callback function called when the request failed
	 * @return {void}
	 */
	function fetchEntityRatings(_params) {
		_params = _params || {};
		_params.url = urls.ratingsList;
		_params.headers = createApiHeaders();
		request(_params);
	}

	/**
	 * @method checkUpdates
	 * Calls the API for obtaining the latest version available stored in DB
	 * @param {Object} _params parameters
	 * @param {Function} _params.success Callback function called when the request succeded
	 * @param {Function} _params.failure Callback function called when the request failed
	 * @return {void}
	 */
	function checkUpdates(_params) {
		_params = _params || {};
		_params.url = urls.versionQuery + '/query';
		_params.parameters = {
			where: {
				// os_name: _params.osName,
				app_id: _params.appId,
			}
		};

		request(_params);
	}

	/**
	 * @method extendShortenedUrl
	 * Calls the API for obtaining the extended URL of a shortened URL
	 * @param {Object} _params parameters
	 * @param {Function} _params.success Callback function called when the request succeded
	 * @param {Function} _params.failure Callback function called when the request failed
	 * @return {void}
	 */
	function extendShortenedUrl(_params) {
		_params = _params || {};
		_params.url = urls.versionUpdateShortenedUrl;
		_params.parameters = {
			format: 'json',
			shorturl: _params.shorturl
		};
		_params.isShortener = true;
		request(_params);
	}

	/**
	 * @method updateSalesRep
	 * Updates the Sales Rep model to use for most requests
	 * @return {void}
	 */
	function updateSalesRep(_salesRep) {
		salesRep = _salesRep;
	};

	/**
	 * @method setRefreshTokenHandler
	 * Sets the method to call after refreshing the auth token
	 * @param {Function} _newHandler function called after refreshing a token.
	 * @return {void}
	 */
	function setRefreshTokenHandler(_newHandler) {
		refreshTokenHandler = _newHandler;
	};

	// Public API.
	return {
		urls: urls,
		login: login,
		fetchQuote: fetchQuote,
		fetchQuotes: fetchQuotes,
		saveQuote: saveQuote,
		submitQuote: submitQuote,
		fetchEvent: fetchEvent,
		saveEvent: saveEvent,
		searchContracts: searchContracts,
		terminationQuote: terminationQuote,
		searchCustomers: searchCustomers,
		customizations: customizations,
		searchByCustomer: searchByCustomer,
		searchByContractNumber: searchByContractNumber,
		searchBySourceSystemID: searchBySourceSystemID,
		updateSalesRep: updateSalesRep,
		fetchEntityRatings: fetchEntityRatings,
		checkUpdates: checkUpdates,
		extendShortenedUrl: extendShortenedUrl,
		refreshToken: refreshToken,
		rateFactors: rateFactors,
		setRefreshTokenHandler: setRefreshTokenHandler,
		processQueue: processQueue
	};
})();

module.exports = webservices;
