var Mustache = require('/external/mustache');
/**
 * @class pdfGeneration
 * Mediator between the PDF native modules and the JS bridge
 * @singleton
 */
var pdfGeneration = (function () {
	var PdfCreator = null;

	if (OS_IOS) {
		PdfCreator = require('dk.napp.pdf.creator');
	}

	if (OS_ANDROID) {
		PdfCreator = require('com.propelics.pdfcreator');
	}

	/**
	 * @method generateWithWebView
	 * Generates a PDF file based on an HTML File using a webview to load it's data
	 * @param {Object} _params
	 * @param {Ti.UI.View} _params.wrapper View that will contain the WebView to load the HTML (This view should be inside an opened Window)
	 * @param {Ti.Filesystem.File} _params.htmlFile HTML file to load
	 * @param {Object} _params.data Data to parse within the HTML before generating the PDF.
	 * @param {String} [_params.pdfFileName = Date.now()] File name to generate (don't include the '.pdf' extension)
	 * @param {Function} [_params.successCallback] Function to call when the PDF gets generated
	 * @param {Function} [_params.failCallback] Function to call when an error occurs
	 * @return {void}
	 */
	function generateWithWebView(_params) {
		_params = _params || {};

		doLog && console.log('[pdfGeneration] - generateWithWebView() - ' + JSON.stringify(_params));

		var htmlFile = _params.htmlFile;
		var data = _params.data || {};
		var pdfFileName = (_params.pdfFileName || Date.now()) + '.pdf';
		var successCallback = _params.successCallback;
		var failCallback = _params.failCallback;
		var wrapper = _params.wrapper;

		var webViewUpdateTimeout = null;
		var webView = null;

		var generate = function () {
			doLog && console.log('[pdfGeneration] - generateWithWebView() - generate');
			if (htmlFile) {
				Ti.App.addEventListener('app:webViewUpdated', handleWebViewUpdated);
				PdfCreator.addEventListener('complete', handlePDFComplete);
				PdfCreator.addEventListener('error', handlePDFError);
			} else {
				failCallback && failCallback({
					success: false,
					message: 'No HTML file',
					error: -1
				});
				return;
			}

			var htmlBlob = htmlFile.read();
			var html = htmlBlob ? htmlBlob.text : '';

			webView = Ti.UI.createWebView({
				scalesPageToFit: true,
				width: Ti.UI.FILL,
				height: Ti.UI.FILL,
				html: html,
				visible: false
			});

			webView.addEventListener('load', handleWebViewLoad);

			wrapper.add(webView);
		};

		var handleWebViewLoad = function (_evt) {
			webView.removeEventListener('load', handleWebViewLoad);
			doLog && console.log('[pdfGeneration] - generateWithWebView() - handleWebViewLoad');

			Ti.App.fireEvent('app:updateApplicationContract', data);

			//If after 5 secs the webView hasn't finished, force it to finish
			webViewUpdateTimeout = setTimeout(function () {
				handleWebViewUpdated({
					error: true
				});
			}, 5000);
		};

		var handleWebViewUpdated = function (_evt) {
			_evt = _evt || {};

			clearTimeout(webViewUpdateTimeout);
			Ti.App.removeEventListener('app:webViewUpdated', handleWebViewUpdated);

			doLog && console.log('[pdfGeneration] - generateWithWebView() - handleWebViewUpdated');

			// wrapper.remove(webView);

			if (_evt.error) {
				PdfCreator.removeEventListener('complete', handlePDFComplete);
				PdfCreator.removeEventListener('error', handlePDFError);
				webView.removeEventListener('load', handleWebViewLoad);

				failCallback && failCallback({
					success: false,
					message: 'An error ocurred generating the PDF.',
					error: _evt.error
				});
			} else {
				var htmlString = _evt.html || webView.html || '';

				PdfCreator.generatePDFWithHTML({
					html: htmlString,
					filename: pdfFileName
				});
			}

			wrapper = null;
			webView = null;
			webViewUpdateTimeout = null;
		};

		var handlePDFComplete = function (_evt) {
			_evt = _evt || {};
			Ti.App.removeEventListener('app:webViewUpdated', handleWebViewUpdated);
			PdfCreator.removeEventListener('complete', handlePDFComplete);
			PdfCreator.removeEventListener('error', handlePDFError);

			doLog && console.log('[pdfGeneration] - generateWithWebView() - handlePDFComplete');

			_evt.fileName = pdfFileName;

			successCallback && successCallback(_evt);
		};

		var handlePDFError = function (_evt) {
			_evt = _evt || {};
			Ti.App.removeEventListener('app:webViewUpdated', handleWebViewUpdated);
			PdfCreator.removeEventListener('complete', handlePDFComplete);
			PdfCreator.removeEventListener('error', handlePDFError);

			doLog && console.log('[pdfGeneration] - generateWithWebView() - handlePDFError');

			_evt.fileName = pdfFileName;

			failCallback && failCallback(_evt);
		};

		generate();
	};

	/**
	 * @method generatePDFWithTemplate
	 * Generates a PDF file based on an HTML Template, will load using mustache.js
	 * @param {Object} _params
	 * @param {Ti.Filesystem.File} _params.htmlFile HTML file to load
	 * @param {Object} _params.data Data to parse within the HTML before generating the PDF.
	 * @param {String} [_params.pdfFileName = Date.now()] File name to generate (don't include the '.pdf' extension)
	 * @param {Function} [_params.successCallback] Function to call when the PDF gets generated
	 * @param {Function} [_params.failCallback] Function to call when an error occurs
	 * @return {void}
	 */
	function generatePDFWithTemplate(_params) {
		_params = _params || {};

		doLog && console.log('[pdfGeneration] - generatePDFWithTemplate() - ' + JSON.stringify(_params));

		var htmlFile = _params.htmlFile;
		var data = _params.data || {};
		var pdfFileName = (_params.pdfFileName || Date.now()) + '.pdf';
		var successCallback = _params.successCallback;
		var failCallback = _params.failCallback;
		var htmlString = '';

		var generate = function () {
			if (!htmlFile) {
				failCallback && failCallback({
					success: false,
					message: 'No HTML file',
					error: -1
				});
				return;
			}

			PdfCreator.addEventListener('complete', handlePDFComplete);
			PdfCreator.addEventListener('error', handlePDFError);

			htmlString = htmlFile.read().text;
			htmlString = Mustache.render(htmlString, data);

			PdfCreator.generatePDFWithHTML({
				html: htmlString,
				filename: pdfFileName
			});
		};

		var handlePDFComplete = function (_evt) {
			_evt = _evt || {};
			PdfCreator.removeEventListener('complete', handlePDFComplete);
			PdfCreator.removeEventListener('error', handlePDFError);

			doLog && console.log('[pdfGeneration] - generatePDFWithTemplate() - handlePDFComplete');

			_evt.fileName = pdfFileName;

			successCallback && successCallback(_evt);
		};

		var handlePDFError = function (_evt) {
			_evt = _evt || {};
			PdfCreator.removeEventListener('complete', handlePDFComplete);
			PdfCreator.removeEventListener('error', handlePDFError);

			doLog && console.log('[pdfGeneration] - generatePDFWithTemplate() - handlePDFComplete');

			_evt.fileName = pdfFileName;

			failCallback && failCallback(_evt);
		};

		generate();
	};

	return {
		generateWithWebView: generateWithWebView,
		generatePDFWithTemplate: generatePDFWithTemplate
	};
})();

module.exports = pdfGeneration;
