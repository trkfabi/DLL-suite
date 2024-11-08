/**
 * Web services
 * Provides the urls for the calls of the webservices
 * @class Lib.utils.webservices
 * @singleton
 */
var http = require('/utils/http');
var salesRep = Alloy.Models.instance('salesRep');
var baseWSUrl = Alloy.Globals.baseWSUrl;

var webservices = (function () {
	// Private members
	var urls = {
		login: baseWSUrl + "/dll/login.html",
		fetchQuote: baseWSUrl + "/dll/rest/quotes/salesReps/[salesRepName]/QuoteBlob/[quoteID]",
		fetchQuotes: baseWSUrl + "/dll/rest/quotes/salesReps/[salesRepName]/QuoteBlob/page/[pageNumber]/[pageSize]",
		saveQuote: baseWSUrl + "/dll/rest/quotes/salesReps/[salesRepName]/QuoteBlob",
		defaultUrl: baseWSUrl + "/dll/rest/finance/user/[salesRepName]/group/[group]/[method]",
		submitQuote: baseWSUrl + "/dll/rest/finance/user/[salesRepName]/group/[group]/application2",
		searchContracts: baseWSUrl + "/dll/rest/finance/user/[salesRepName]/group/[group]/contracts",
		terminationQuote: baseWSUrl + "/dll/rest/finance/user/[salesRepName]/group/[group]/terminationQuote",
		searchCustomers: baseWSUrl + "/dll/rest/finance/user/[salesRepName]/group/[group]/customers",
		rateCards: baseWSUrl + "/dll/rest/finance/user/[salesRepName]/group/[group]/rateCards",
		customizations: baseWSUrl + "/dll/rest/finance/user/[salesRepName]/group/[group]/customizations"
	};

	/**
	 * @method request
	 * @private
	 * Attempts to do a single request, parsing the url tokens and adding GET params if needed
	 * @param {Object} _params Details about the request
	 * @param {String} _params.type Type used in the request to the server
	 * @param {Object} _params.parameters Parameters for the request to the server
	 * @param {String} _params.url Url for the request to the server
	 * @param {Object} _params.urlTokens Url tokens for the request to the server
	 * @param {String} _params.username User name for the request to the server
	 * @param {String} _params.password Password for the request to the server
	 * @param {String} _params.headers Header for the request to the server
	 * @param {Function} _params.successCallback Success callback for the request to the server
	 * @param {Function} _params.failCallback Fail callback for the request to the server
	 * @param {Boolean} _params.shouldAuthenticate Used to know if it is should authenticate 
	 * @param {String} _params.context Context used in the request to the server
	 * @return {Ti.Network.HTTPClient} Details about the request to the server
	 */
	function request(_params) {
		_params = _params || {};

		var _type = _params.type || 'GET';
		var _getParams = (_type === 'GET' ? _params.parameters : {});
		var _url = createURL((_params.url || urls.defaultUrl), _params.urlTokens, _getParams);
		var _dllHeaders = createDLLHeaders(_params.username, _params.password);
		var _requestHeaders = _params.headers || [];

		return http.request({
			url: _url,
			type: _type,
			parameters: (_type !== 'GET' ? _params.parameters : null),
			success: _params.successCallback,
			failure: _params.failCallback,
			shouldAuthenticate: _params.shouldAuthenticate || false,
			headers: _dllHeaders.concat(_requestHeaders),
			username: _params.username || salesRep.get('username'),
			password: _params.password || salesRep.get('password'),
			context: _params.context
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
		var DEFAULT_TOKENS = {
			'salesRepName': salesRep.id,
			'group': salesRep.get('salesGroup')
		};
		var _url = _baseUrl || '';
		var _tokens = {};
		var getParams = _getParams || {};
		var _getParamsArray = _.map(getParams, function (_value, _key) {
			return _key + '=' + _value;
		});

		_.extend(_tokens, DEFAULT_TOKENS, _urlTokens);

		_url = replaceURLTokens(_url, _tokens);

		if (_getParamsArray.length > 0) {
			_url += '?' + _getParamsArray.join('&');
		}
		return _url;
	};

	/**
	 * @example: 
	 replaceURLTokens('http://www.somedomain.com/[userID]/group/[group]/[method]', {
		'userID' : 'someUSER',
		'group' : 'OT',
		'method' : 'contractSearch'
	 });
	 returns: "http://www.somedomain.com/someUSER/group/OT/contractSearch"
	 * 
	 */

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
	 * @param {String} [_username=salesRep.get('username') DLL User Name
	 * @param {String} [_password=salesRep.get('password') DLL User Password
	 * @Return {Array} Headers Array
	 */
	function createDLLHeaders(_username, _password) {
		_username = _username || salesRep.get('username');
		_password = _password || salesRep.get('password');
		var _dllHeaders = [{
			name: "Content-Type",
			value: "application/json"
		}, {
			name: "Accept",
			value: "application/json"
		}, {
			name: 'Authorization',
			value: 'DLLEncrypted ' + Ti.Utils.base64encode(_username + ':' + _password).toString().replace(/[\n\r]/g, '')
		}, {
			name: 'Cache-Control',
			value: 'no-cache'
		}, {
			name: 'Cache-Control',
			value: 'no-store'
		}];

		if (salesRep.get('token')) {
			_dllHeaders.push({
				name: "X-DLLToken",
				value: salesRep.get('token')
			});
		}

		return _dllHeaders;
	};

	// Public members

	/**
	 * @method login
	 * Attempts login
	 * @param {Object} _params parameters
	 * @param {String} _params.username Username
	 * @param {String} _params.password Password
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
		_params.type = 'POST';
		_params.url = urls.login;
		_params.shouldAuthenticate = true;

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

		_params.url = urls.fetchQuote;
		_params.urlTokens = {
			'quoteID': _params.quoteID
		};

		request(_params);
	};

	/**
	 * @method fetchQuotes
	 * Retrieves a list of quotes for the current logged in user
	 * @param {Object} _params parameters
	 * @param {String/Integer} _params.page Page number to search for
	 * @param {Function} _params.success Callback function called when the request succeded
	 * @param {Function} _params.failure Callback function called when the request failed
	 * @return {void}
	 */
	function fetchQuotes(_params) {
		_params = _params || {};

		_params.url = urls.fetchQuotes;
		_params.urlTokens = {
			'pageNumber': '' + _params.page,
			'pageSize': '' + _params.size,
		};

		request(_params);
	};

	/**
	 * @method saveQuote
	 * Saves a single quote on the quote repository
	 * @param {Object} _params parameters
	 * @param {models/quote} _params.quote Quote model to save
	 * @param {Function} _params.success Callback function called when the request succeded
	 * @param {Function} _params.failure Callback function called when the request failed
	 * @return {void}
	 */
	function saveQuote(_params) {
		_params = _params || {};

		_params.url = urls.saveQuote;
		_params.type = 'PUT';
		_params.parameters = {
			id: _params.id,
			salesRepsId: _params.salesRepID, // "salesRepsId" is not a typo!
			blob: JSON.stringify(_params.quote)
		};

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
		_params.parameters = _params.quote;
		_params.type = 'POST';
		_params.urlTokens = {
			// group : 'AGCO'
		};

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

		request(_params);
	};

	/**
	 * @method rateCards
	 * Looks for rate cards updates (OTHC only)
	 * @params {Object} Details for rateCards
	 * @return {void}
	 */
	function rateCards(_params) {

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

		request(_params);

	};

	// Public API.
	return {
		urls: urls,

		login: login,
		fetchQuote: fetchQuote,
		fetchQuotes: fetchQuotes,
		saveQuote: saveQuote,
		submitQuote: submitQuote,
		searchContracts: searchContracts,
		terminationQuote: terminationQuote,
		searchCustomers: searchCustomers,
		rateCards: rateCards,
		customizations: customizations
	};
})();

module.exports = webservices;
