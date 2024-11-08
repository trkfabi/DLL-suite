var analytics = require('/utils/analytics');
/**
 * # Http Request Module
 * Handles the Http Requests to the server
 * @class Lib.utils.http
 * @singleton
 */
var httpRequests = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method request
	 * @public
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
		var type = params.type || "GET";
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

		analytics.captureApm('[HTTP] - url : ' + url);

		if (isOnline) {
			doLog && console.log('[http] - request - online');

			var xhr = Ti.Network.createHTTPClient({
				timeout: timeout,
				validatesSecureCertificate: secure,
				username: username,
				password: password,
				shouldAuthenticate: true,
				cache: false
			});

			doLog && console.log("[HTTP] - request - Type - " + type + " - URL - " + url);

			xhr.open(type, url);

			for (var i = 0, j = headers.length; i < j; i++) {
				xhr.setRequestHeader(headers[i].name, headers[i].value);
				doLog && console.log('[HTTP] - Request Header - ' + headers[i].name + ' : - ' + headers[i].value);
			}

			if (parameters) {
				var data = (typeof parameters === "string") ? parameters : JSON.stringify(parameters);
				data = data.replace(/\\"/g, "'");
				doLog && console.log("[HTTP] - request - Params - " + data);

				xhr.send(data);
			} else {
				xhr.send();
			}

			xhr.onload = function () {
				doLog && console.log("[HTTP] - request - onload");

				var responseHeaders = {};
				if (OS_IOS) {
					responseHeaders = (this.getResponseHeaders ? this.getResponseHeaders() : {});
				} else {
					var headersString = (this.getAllResponseHeaders ? this.getAllResponseHeaders() : {});
					var headersArray = headersString.split('\n');
					for (var i = 0, j = headersArray.length; i < j; i++) {
						var headerInfoString = headersArray[i];
						var headerInfoArray = headerInfoString.split(':', 1);
						responseHeaders[headerInfoArray[0]] = headerInfoString.substring(headerInfoString.indexOf(':') + 1);
					}

				}

				doLog && console.debug("HEADERS : " + JSON.stringify(responseHeaders));

				var data = this.responseText;
				var contentType = this.getResponseHeader('ContentType');

				if (format === "json" && contentType !== 'application/json') {
					try {
						data = JSON.parse(this.responseText);
					} catch (err) {
						data = this.responseText;
					}
				} else if (format === "text") {
					data = this.responseText;
				} else if (format === "xml") {
					data = this.responseXML;
				}

				doLog && console.debug("[HTTP] - onload - data: " + JSON.stringify(data));
				doLog && console.debug("[HTTP] - onload - responseHeaders: " + JSON.stringify(responseHeaders));

				success && success(data, responseHeaders, context);
			};

			/**
			 * Error handling
			 * @param {Object} _event The callback object
			 */
			xhr.onerror = function (_event) {
				doLog && console.log("[HTTP] - error ");
				doLog && console.debug(this);
				var prop;
				try {
					for (prop in this) {
						doLog && console.debug('Error ' + prop + ': ');
						doLog && console.debug(this[prop]);
					}
				} catch (err) {
					console.error(err);
				}

				console.error(_event.error);
				try {
					for (prop in _event) {
						doLog && console.debug('Error _event[' + prop + ']: ' + JSON.stringify(_event[prop]));
					}
				} catch (err) {
					console.error(err);
				}

				failure && failure({
					"error": true,
					"http": this,
					"event": _event
				}, context);
			};

		} else {

			doLog && console.error("[HTTP] - request - No internet connection");

			_.defer(function () {
				failure && failure({
					"error": true,
					"message": L("no_internet_connection"),
					"online": isOnline,
					"networkType": Ti.Network.networkType
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
