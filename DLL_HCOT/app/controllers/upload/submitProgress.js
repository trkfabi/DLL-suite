/**
 * @class Controllers.upload.submitProgress
 * Submit quotes to the server
 * 
 */
var analytics = require('/utils/analytics');
var sessionManager = require('/utils/sessionManager');
var configsManager = require('/utils/configsManager');
var webservices = require('/utils/webservices');
var application = require('/application');
var stringFormatter = require('/helpers/stringFormatter');

var salesRep = sessionManager.getSalesRep();
var quotesToSubmitQueue = Alloy.createCollection('quote');

var submitHandler = null;

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	analytics.captureApm('[submitProgress] - init()');

	submitHandler = configsManager.getLib('submitHandler');

	quotesToSubmitQueue.on('change:submitStatus', refreshUI);
	quotesToSubmitQueue.on('add', refreshUI);
	// quotesToSubmitQueue.on('remove', refreshUI);

	_.delay(function () {
		checkUnsubmittedQuotesWithActiveRequest();
		sendPendingQuotes(true);
		removeUnusedFiles();
	}, 5000);

	application.addNetworkHandler(handleAppStateChange);
	application.addAppStatusChangeHandler(handleAppStateChange);
};

/**
 * @method refreshUI
 * @private
 * Refresh values of the current window
 * @return {void}
 */
function refreshUI() {
	doLog && console.log('[submitProgress] - refreshUI()');
	var _message = '';
	var _pendingQuotes = quotesToSubmitQueue.where({
		'submitStatus': Alloy.Globals.submitStatus.sent
	}) || [];
	var _max = quotesToSubmitQueue.length;
	var _value = _max - _pendingQuotes.length;

	if (_value < _max) {
		$.show();
		// TODO: Use L() here
		_message = 'Submitting Quotes: ' + _value + '/' + _max;
	} else {
		// TODO: Use L() here
		_message = 'All Quotes have been submitted';
		setTimeout(function () {
			$.hide();
		}, 5000);
	}

	$.submitBar.applyProperties({
		max: _max,
		value: _value,
		message: _message
	});

};

/**
 * @method removeUnusedFiles
 * @private
 * Delete unused files PDF files, and images
 * @return {void}
 */
function removeUnusedFiles() {
	analytics.captureApm('[submitProgress] - removeUnusedFiles()');
	var _folder = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory);
	var _filesInFolder = _folder.getDirectoryListing() || [];
	var _allQuotes = Alloy.createCollection('quote');

	_allQuotes.fetch({
		localOnly: true
	});

	_.each(_filesInFolder, function (_fileName) {
		var _file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, _fileName);

		if (
			_fileName.match(/^[\w,\s-]+\.(pdf|png)$/) &&
			_file.exists() &&
			_file.isFile
		) {

			var _isActiveFileinQuote = _allQuotes.any(function (_quote) {
				var _isActive = (
					_quote.get('leaseFileName') === _fileName ||
					_quote.get('creditAppFileName') === _fileName
				);
				return _isActive;
			});

			if (!_isActiveFileinQuote) {
				// TODO: Breadcrumb
				doLog && console.log('[submitProgress] - removeUnusedFiles() - _fileName: ' + _fileName);

				_file.deleteFile();
			}

		}
	});
};

/**
 * @method sendPendingQuotes
 * @private
 * Attempts to re-upload previously submitted quotes marked with some errors
 * @param {Boolean} [_includeSent = false] Flag to try to send also quotes that may already be waiting for a server response.
 * @return {void}
 */
function sendPendingQuotes(_includeSent) {
	analytics.captureApm('[submitProgress] - sendPendingQuotes()');
	var _pendingQuotes = Alloy.createCollection('quote');
	var _where = {
		'salesRepID = ?': salesRep.id
	};

	if (_includeSent) {
		_where['(submitStatus = ? or submitStatus = ?)'] = [Alloy.Globals.submitStatus.pending, Alloy.Globals.submitStatus.sent];
	} else {
		_where['submitStatus = ?'] = Alloy.Globals.submitStatus.pending;
	}

	_pendingQuotes.fetch({
		localOnly: true,
		query: {
			where: _where
		}
	});

	// TODO: Breadcrumb
	doLog && console.log('[submitProgress] - sendPendingQuotes() - ' + _pendingQuotes.length);

	_pendingQuotes.each(function (_pendingQuote) {
		if (_includeSent) {
			if (_pendingQuote.get('submitStatus') === Alloy.Globals.submitStatus.sent && _pendingQuote.has('activeRequest')) {
				_pendingQuote.unset('activeRequest').save();
			}
		}
		doSubmit({
			quote: _pendingQuote
		});
	});
};

/**
 * @method doSubmit
 * @private
 * Do the submit to the server
 * @param {Models.quote} _quoteModel Model of the quote to be sent to the server
 * @return {void}
 */
function doSubmit(_params) {
	_params = _params || {};
	var quote = _params.quote;
	var authorizationsData = _params.authorizationsData;

	if (quote && !quote.has('activeRequest')) {
		doLog && console.log('[submitProgress] - doSubmit() - quote: ' + JSON.stringify(quote));

		var requestModel = Alloy.createModel('request');
		var httpRequest = null;
		// var quoteJSON = generateSubmitJSON(quote, authorizationsData);
		var quoteJSON = null;

		if (submitHandler && submitHandler.generateSubmitJSON) {
			quoteJSON = submitHandler.generateSubmitJSON(_params);
			doLog && console.log('[submitProgress] - doSubmit() - quoteJSON: ' + JSON.stringify(quoteJSON));
		}

		if (quoteJSON.documents.length === 0) {
			// TODO: Breadcrumb/handled exception
			doLog && console.error('[submitProgress] - doSubmit() - cannot submit quote without documents: ' + quote.id);
			return false;
		}

		if (!quoteJSON) {
			doLog && console.error('[submitProgress] - doSubmit() - cannot submit quote without JSON');
			return false;
		}

		quote.set({
			'submitStatus': Alloy.Globals.submitStatus.sent
		}).save();
		// quote.removeUnselectedPayments();
		try {
			quoteJSON = JSON.parse(stringFormatter.restoreSingleQuote(JSON.stringify(quoteJSON)));
		} catch (_error) {
			console.error('[submitProgress] - Error parsing JSON: ' + JSON.stringify(_error, null, '	'));
		}

		if (!Alloy.Globals.isDemo) {
			httpRequest = webservices.submitQuote({
				quote: quoteJSON,
				successCallback: handleSubmitSuccess,
				failCallback: handleSubmitFailure,
				context: quote
			});
		}

		requestModel.set({
			'submitStatus': Alloy.Globals.submitStatus.sent,
			'httpRequest': httpRequest
		});

		quote.get('requests').add(requestModel);
		quote.set({
			'activeRequest': requestModel,
		}).save();

		quotesToSubmitQueue.add(quote);

		if (Alloy.Globals.isDemo) {
			requestModel.set({
				'submitStatus': Alloy.Globals.submitStatus.submitted
			});

			quote.set({
				'submitStatus': Alloy.Globals.submitStatus.submitted
			}).save();

			deleteDocs(quote);
		}
	}
};

/**
 * @method cancelSubmit
 * @private
 * Aborts a submit and marks the quote submit as an error
 * @param {Models.quote} _quoteModel Quote to cancel its submission
 * @return {void}
 */
function cancelSubmit(_quoteModel) {
	analytics.captureApm('[submitProgress] - cancelSubmit() - _quoteModel: ' + JSON.stringify(_quoteModel));
	var _requestModel = _quoteModel.get('activeRequest');
	var _httpRequest = null;

	if (_requestModel) {
		_httpRequest = _requestModel.get('httpRequest');
		_httpRequest.abort();

		_requestModel.set({
			'submitStatus': Alloy.Globals.submitStatus.pending
		}).save();

		_quoteModel
			.unset('activeRequest')
			.set({
				'submitStatus': Alloy.Globals.submitStatus.pending
			})
			.save();
	}
};

/**
 * @method checkUnsubmittedQuotesWithActiveRequest
 * @private
 * Check for unsubmitted quotes that have active request object and remove it
 * @return {void}
 */
function checkUnsubmittedQuotesWithActiveRequest() {
	doLog && console.log('[submitProgress] - checkUnsubmittedQuotesWithActiveRequest');
	var _unsubmittedQuotes = Alloy.createCollection('quote');
	var _where = {
		'salesRepID = ?': salesRep.id,
		'(submitStatus = ? or submitStatus is null)': Alloy.Globals.submitStatus.unsubmitted
	};

	_unsubmittedQuotes.fetch({
		localOnly: true,
		query: {
			where: _where
		}
	});

	doLog && console.log('[submitProgress] - checkUnsubmittedQuotesWithActiveRequest() - ' + _unsubmittedQuotes.length);

	_unsubmittedQuotes.each(function (_unsubmittedQuote) {
		if (_unsubmittedQuote.has('activeRequest')) {
			_unsubmittedQuote.unset('activeRequest').save();
		}
	});
}

/**
 * @method cleanUp
 * Remove the network handler
 * @return {void}
 */
$.cleanUp = function () {
	quotesToSubmitQueue.off('change:submitStatus', refreshUI);
	quotesToSubmitQueue.off('add', refreshUI);
	// quotesToSubmitQueue.off('remove', refreshUI);
	application.removeNetworkHandler(handleAppStateChange);
	application.removeAppStatusChangeHandler(handleAppStateChange);
};

/**
 * @method show
 * Shows this progress UI
 * @return {void}
 */
$.show = function () {
	doLog && console.log('[submitProgress] - show()');

	// TODO: uncomment this when the screen gets approved
	// var animation = Ti.UI.createAnimation({
	// 	duration : 250,
	// 	bottom : 0
	// });

	// $.window.open();
	// $.window.animate(animation);
};

/**
 * @method hide
 * Hides this progress UI
 * @return {void}
 */
$.hide = function () {
	doLog && console.log('[submitProgress] - hide()');

	// TODO: uncomment this when the screen gets approved
	// var animation = Ti.UI.createAnimation({
	// 	duration : 250,
	// 	bottom : -50
	// });

	// quotesToSubmitQueue.reset();
	// $.window.animate(animation, function() {
	// 	$.window.close();
	// });
};

/**
 * @method addQuoteToSubmit
 * Add a quote to submit it
 * Adds a Quote Model to the queue to be submitted
 * @param {Models.quote} _quoteModel Quote model to submit
 * @return {void}
 */
$.addQuoteToSubmit = function (_params) {
	_params = _params || {};
	doLog && console.log('[submitProgress] - addQuoteToSubmit() - _params: ' + JSON.stringify(_params));

	doSubmit(_params);

	refreshUI();
};

/**
 * @method removeQuoteToSubmit
 * Removes the Quote Model from the list of submissions
 * @param {Models.quote} _quoteModel Quote Model to abort its submission
 * @return {void}
 */
$.removeQuoteToSubmit = function (_quoteModel) {
	doLog && console.log('[submitProgress] - removeQuoteToSubmit() - _quoteModel: ' + JSON.stringify(_quoteModel));

	cancelSubmit(_quoteModel);

	refreshUI();
};

/**
 * @method handleSubmitSuccess
 * @private
 * Response from the server
 * @param {Object} _response Response from the server
 * @param {Object} _header Headers that come along with the response from the server
 * @param {Object} _context Parameter to be used for any object to keep the the context 
 * @return {void}
 */
function handleSubmitSuccess(_response, _headers, _context) {
	_response = _response || {};

	doLog && console.log('[submitProgress] - handleSubmitSuccess()');

	var status = _response.Status || {};

	var code = status.Code;
	var quoteModel = _context;
	var requestModel = quoteModel.get('activeRequest');
	var httpRequest = quoteModel.get('httpRequest');

	quoteModel.unset('activeRequest');

	if (code === 'S') {
		requestModel.set({
			'submitStatus': Alloy.Globals.submitStatus.submitted
		});

		quoteModel.set({
			'submitStatus': Alloy.Globals.submitStatus.submitted
		}).save();

		deleteDocs(quoteModel);
	} else {
		requestModel.set({
			'submitStatus': Alloy.Globals.submitStatus.pending
		});

		quoteModel.set({
			'submitStatus': Alloy.Globals.submitStatus.pending
		}).save();

		// alert(status.Message || '');
	}

	// quotesToSubmitQueue.remove(quoteModel);

};

/**
 * @method handleSubmitFailure
 * @private
 * Handle the submit failure from the server
 * @param {Object} _response Response from the server
 * @param {Object} _context Parameter to be used for any object to keep the the context 
 * @return {void}
 */
function handleSubmitFailure(_response, _context) {
	_response = _response || {};

	doLog && console.log('[submitProgress] - handleSubmitFailure()');

	var _quoteModel = _context;
	var _requestModel = _quoteModel.get('activeRequest');
	var _httpRequest = _quoteModel.get('httpRequest');

	// TODO: Save SSN/DOB data for failed quotes

	_requestModel.set({
		'submitStatus': Alloy.Globals.submitStatus.pending
	});

	_quoteModel
		.unset('activeRequest')
		.set({
			'submitStatus': Alloy.Globals.submitStatus.pending
		})
		.save();

	// quotesToSubmitQueue.remove(_quoteModel);

	// alert('An error has ocurred, please try again later');
};

/**
 * @method deleteDocs
 * @private
 * Deletes the PDF, and images associated with the Quote
 * @param {Models.quote} _quoteModel Parameter to be used to delete a document
 * @return {void}
 */
function deleteDocs(_quoteModel) {
	analytics.captureApm('[submitProgress] - deleteDocs()');

	_.each(Alloy.Globals.submitDocs, function (_docName) {
		var _docFileName = _quoteModel.get(_docName);
		var _docFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, _docFileName);

		_docFile.exists() && _docFile.deleteFile();

		_quoteModel.unset(_docName);
	});

	_quoteModel.save();
};

/**
 * @method handleAppStateChange
 * @private
 * Handle the network change state
 * @param {Object} _evt Parameter to handle the network change state
 * @return {void}
 */
function handleAppStateChange(_evt) {
	doLog && console.log('[submitProgress] - handleAppStateChange()');

	_.defer(sendPendingQuotes, false);
};

init();
