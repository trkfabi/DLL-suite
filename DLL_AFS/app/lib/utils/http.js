/**
 * # Http Request Module
 * Handles the Http Requests to the server
 * @class Utils.http
 * @singleton
 */
var httpRequests = (function () {
	// +-------------------
	// | Private members.
	// +-------------------
	var doLog = Alloy.Globals.doLog;
	var analytics = require('/utils/analytics');

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method request
	 * Function to make a request to a server via HTTP
	 * @param {Object} _params
	 * @param {Number}   _params.timeout=3000 HTTP timeout call
	 * @param {String}   _params.type='GET'
	 * @param {String}   _params.format='json'
	 * @param {Boolean}  _params.secure=false
	 * @param {Object}   _params.parameters
	 * @param {String}   _params.url
	 * @param {Function} _params.success=function(){}
	 * @param {Function} _params.failure=function(){}
	 * @param {Array}    _params.headers=[]
	 * @param {String}   _params.username=''
	 * @param {String}   _params.password=''
	 * @param {String}   _params.context=null
	 * @return {void}
	 */
	var request = function (_params) {
		doLog && console.log('[http] - request ');
		var params = _params || {};

		var timeout = params.timeout || 30000;
		var type = params.type || 'GET';
		var format = params.format || 'json';
		var secure = params.secure || false;
		var parameters = params.parameters;
		var url = params.url;
		var success = params.success || function () {};
		var failure = params.failure || function () {};
		var headers = params.headers || [];
		var username = params.username || '';
		var password = params.password || '';
		var context = params.context || null;
		var isOnline = (Ti.Network.networkType !== Ti.Network.NETWORK_NONE &&
			Ti.Network.networkType !== Ti.Network.NETWORK_UNKNOWN);

		analytics.captureEvent('[HTTP] - url : ' + url);

		if (isOnline) {
			doLog && console.log('[http] - request - online');

			var xhr = Ti.Network.createHTTPClient({
				timeout: timeout,
				validatesSecureCertificate: secure,
				//username: username,
				//password: password,
				//shouldAuthenticate: true,
				cache: false
			});

			doLog && console.log('[HTTP] - request - Type - ' + type + ' - URL - ' + url);

			xhr.open(type, url);

			for (var i = 0, j = headers.length; i < j; i++) {
				xhr.setRequestHeader(headers[i].name, headers[i].value);
				//doLog && console.log('[HTTP] - Request Header - ' + headers[i].name + ' : - ' + headers[i].value);
			}

			if (parameters) {
				var data = (typeof parameters === 'string') ? parameters : JSON.stringify(parameters);
				//data = data.replace(/\\'/g, ''');
				// doLog && console.log('[HTTP] - request - Params - ' + data);
				xhr.send(data);
			} else {
				xhr.send();
			}

			xhr.onload = function () {
				doLog && console.log('[HTTP] - request - onload');

				var responseHeaders = {};
				if (OS_IOS) {
					responseHeaders = this.responseHeaders || {};
				} else {
					var headersString = this.allResponseHeaders || {};
					var headersArray = headersString.split('\n');
					for (var i = 0, j = headersArray.length; i < j; i++) {
						var headerInfoString = headersArray[i];
						var headerInfoArray = headerInfoString.split(':', 1);
						responseHeaders[headerInfoArray[0]] = headerInfoString.substring(headerInfoString.indexOf(':') + 1);
					}

				}

				var data = this.responseText || '';
				var contentType = this.responseHeaders['ContentType'];

				if (format === 'json' && contentType !== 'application/json') {
					try {
						data = JSON.parse(data);
					} catch (err) {
						data = data;
					}
				} else if (format === 'text') {
					data = data;
				} else if (format === 'xml') {
					data = this.responseXML;
				}

				success && success(data, responseHeaders, context);
			};

			/**
			 * Error handling
			 * @param {Object} _event The callback object
			 */
			xhr.onerror = function (_event) {
				doLog && console.error('[HTTP] - error ' + JSON.stringify(_event));
				try {
					doLog && console.error('[HTTP] - error - event: ', JSON.stringify(_event));
					doLog && console.error('[HTTP] - error - responseText: ', this.responseText);
				} catch (err) {
					doLog && console.error('Error printing HTTP error: ', JSON.stringify(err));
				}

				failure && failure({
					'error': true,
					'http': this,
					'event': _event
				}, context);
			};

		} else {

			doLog && console.error('[HTTP] - request - No internet connection');

			_.defer(function () {
				failure && failure({
					'error': true,
					'message': L('no_internet_connection'),
					'online': isOnline,
					'networkType': Ti.Network.networkType
				}, context);
			});
		}

	};

	/**
	 * @method isOnline
	 * Function to know if we have internet connection
	 * @return {Boolean} True internet connection, and false no internet connection
	 */
	var isOnline = function () {
		var _isOnline = (Ti.Network.networkType !== Ti.Network.NETWORK_NONE &&
			Ti.Network.networkType !== Ti.Network.NETWORK_UNKNOWN);
		return _isOnline;
	};

	return {
		request: request,
		isOnline: isOnline
	};
})();

module.exports = httpRequests;