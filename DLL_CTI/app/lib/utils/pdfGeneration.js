/**
 * # PDF Generation Module
 * Module to generate PDF files based on html
 * @class Lib.utils.pdfGeneration
 * @singleton
 * @uses dk.napp.pdf.creator
 * @uses com.propelics.pdfcreator
 */
var pdfGeneration = (function () {

	// +-------------------
	// | Private members.
	// +-------------------

	var pdfCreator = (OS_IOS) ? require("dk.napp.pdf.creator") : require('com.propelics.pdfcreator');
	var timeout;
	var originalPDF;
	var userTempPDF;
	var pdfFileName;
	var callback;
	var errorCallback;
	var webView;

	Ti.App.addEventListener('app:webViewUpdated', generatePDFEvent);

	pdfCreator.addEventListener("complete", createFileForUser);

	pdfCreator.addEventListener("error", function (args) {
		errorCallback && errorCallback(args);
	});

	/**
	 * @method generatePDFEvent
	 * @private
	 * Function that executes when the web view has been loaded
	 * @param {Object} _evt Web View Load event
	 */
	function generatePDFEvent(_evt) {
		clearTimeout(timeout);

		if (_evt && _evt.error) {
			doLog && console.log('[pdfGeneration] - generatePDFEvent error');

			errorCallback && errorCallback({
				success: false,
				message: 'PDF generation error,\nplease contact your sales representative.',
				error: _evt.error
			});
		} else {
			doLog && console.log('[pdfGeneration] - filename: ' + originalPDF);

			var html = _evt.html;
			pdfCreator.generatePDFWithHTML({
				html: html,
				filename: originalPDF
			});
		}
	};

	/**
	 * @method createFileForUser
	 * @private
	 * Creates a copy of the PDF to be attached
	 * @param {Object} _evt Web View Load event
	 * @return {void}
	 */
	function createFileForUser(_evt) {
		var evt = _evt || {};
		var originalFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, originalPDF);

		userTempPDF.write(originalFile);

		evt.fileName = userTempPDF.name;
		evt.originalName = originalFile.name;
		callback && callback(evt);
	};

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method generate
	 * Generate the PDF file from a given html File
	 * @param {Object} _params
	 * @param {Ti.UI.View} _params.view
	 * @param {Object} _params.data  Data to be sent to HTML file
	 * @param {Ti.Filesystem.File} _params.htmlFile HTML file to transform to PDF
	 * @param {String} _params.fileName File name of the pdf to be saved fo local use
	 * @param {String} _params.fileForUser File name of the pdf to be saved for the user
	 * @param {Function} _params.callback Function to be executed in case of success
	 * @param {Function} _params.errorCallback Function to be executed in case of failure
	 * @return {void}
	 */
	var generate = function (_params) {
		var params = _params || {};
		var view = params.view;
		var data = params.data;
		// var htmlfileURL = params.fileName + ".html";
		var htmlFile = params.htmlFile;

		originalPDF = Date.now() + '_' + params.fileName + '.pdf';

		userTempPDF = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, params.fileForUser + '.pdf');

		callback = params.callback;
		errorCallback = params.errorCallback;

		if (!htmlFile) {
			errorCallback && errorCallback({
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
			width: (OS_ANDROID ? 170000 / Alloy.Globals.dpi : 0),
			height: (OS_ANDROID ? 400000 / Alloy.Globals.dpi : 0),
			visible: false,
			html: html
		});

		var webViewLoadEvent = function (e) {
			webView.removeEventListener('load', webViewLoadEvent);
			Ti.App.fireEvent("app:updateApplicationContract", data);
			//If after 5 secs the webview hasn finished, force it
			timeout = setTimeout(generatePDFEvent, 5000);
		};

		webView.addEventListener("load", webViewLoadEvent);

		view.add(webView);

	};

	return {
		generate: generate
	};
})();

module.exports = pdfGeneration;
