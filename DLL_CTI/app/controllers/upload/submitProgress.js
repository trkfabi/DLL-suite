/**
 * @class Controllers.upload.submitProgress
 * Submit quotes to the server
 * 
 */
var analytics = require('/utils/analytics');
var webservices = require('/utils/webservices');
var amortization = require('/calculations/amortization');
var application = require('/application');
var stringFormatter = require('/helpers/stringFormatter');

var salesRep = Alloy.Models.instance('salesRep');
var quotesToSubmitQueue = Alloy.createCollection('quote');

var isSendingQuotes = false;

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	analytics.captureApm('[submitProgress] - init()');
	quotesToSubmitQueue.on('change:submitStatus', refreshUI);
	quotesToSubmitQueue.on('add', refreshUI);
	// quotesToSubmitQueue.on('remove', refreshUI);

	_.delay(function () {
		checkUnsubmittedQuotesWithActiveRequest();
		sendPendingQuotes(true);
		removeUnusedFiles();
	}, 5000);

	application.addNetworkHandler(handleNetworkChange);
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

	doLog && console.log('_allQuotes.length: ' + JSON.stringify(_allQuotes.length, null, '\t'));

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
	var counter = 0;

	_pendingQuotes.each(function (_pendingQuote) {
		if (_includeSent) {
			if (_pendingQuote.get('submitStatus') === Alloy.Globals.submitStatus.sent && _pendingQuote.has('activeRequest')) {
				_pendingQuote.unset('activeRequest').save();
			}
		}
		doSubmit(_pendingQuote);
		counter++;
		if (counter >= _pendingQuotes.length) {
			isSendingQuotes = false;
		}
	});
};

/**
 * @method doSubmit
 * @private
 * Do the submit to the server
 * @param {Models.Quote} _quoteModel Model of the quote to be sent to the server
 * @return {void}
 */
function doSubmit(_quoteModel) {
	if (_quoteModel && !_quoteModel.has('activeRequest')) {
		doLog && console.log('[submitProgress] - doSubmit() - _quoteModel: ' + JSON.stringify(_quoteModel));

		var _requestModel = Alloy.createModel('request');
		var _httpRequest = null;
		var _quoteJSON = generateSubmitJSON(_quoteModel);

		if (_quoteJSON.documents.length === 0) {
			// TODO: Breadcrumb/handled exception
			console.error('[submitProgress] - doSubmit() - cannot submit quote without documents: ' + _quoteModel.id);
			return false;
		}

		_quoteModel.set({
			'submitStatus': Alloy.Globals.submitStatus.sent
		}).save();

		if (Alloy.Globals.isDemo) {
			_httpRequest = {};
			_.defer(function () {
				handleSubmitSuccess && handleSubmitSuccess({
					Status: {
						Code: 'S',
						Message: 'Quote submitted'
					}
				}, {}, _quoteModel);
			});
		} else {
			_httpRequest = webservices.submitQuote({
				quote: _quoteJSON,
				successCallback: handleSubmitSuccess,
				failCallback: handleSubmitFailure,
				context: _quoteModel
			});
		}

		_requestModel.set({
			'submitStatus': Alloy.Globals.submitStatus.sent,
			'httpRequest': _httpRequest
		});

		_quoteModel.get('requests').add(_requestModel);
		_quoteModel.set({
			'activeRequest': _requestModel,
		}).save();

		quotesToSubmitQueue.add(_quoteModel);
	}
};

/**
 * @method cancelSubmit
 * @private
 * Aborts a submit and marks the quote submit as an error
 * @param {Models.Quote} _quoteModel Quote to cancel its submission
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
 * @method destroy
 * Remove the network handler
 * @return {void}
 */
exports.destroy = function () {
	quotesToSubmitQueue.off('change:submitStatus', refreshUI);
	quotesToSubmitQueue.off('add', refreshUI);
	// quotesToSubmitQueue.off('remove', refreshUI);
	application.removeNetworkHandler(handleNetworkChange);
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
	// $.window.animate(animation, function(){
	// 	$.window.close();
	// });
};

/**
 * @method addQuoteToSubmit
 * Add a quote to submit it
 * Adds a Quote Model to the queue to be submitted
 * @param {Model.Quote} _quoteModel Quote model to submit
 * @return {void}
 */
$.addQuoteToSubmit = function (_quoteModel) {
	doLog && console.log('[submitProgress] - addQuoteToSubmit() - _quoteModel: ' + JSON.stringify(_quoteModel));

	doSubmit(_quoteModel);

	refreshUI();
};

/**
 * @method removeQuoteToSubmit
 * Removes the Quote Model from the list of submissions
 * @param {Models.Quote} _quoteModel Quote Model to abort its submission
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

	doLog && console.log("[submitProgress] - handleSubmitSuccess()");

	var _status = _response.Status || {};

	var _code = _status.Code;
	var _quoteModel = _context;
	var _requestModel = _quoteModel.get('activeRequest');
	var _httpRequest = _quoteModel.get('httpRequest');

	_quoteModel.unset('activeRequest');

	if (_code === 'S') {
		_requestModel.set({
			'submitStatus': Alloy.Globals.submitStatus.submitted
		});

		_quoteModel.set({
			'submitStatus': Alloy.Globals.submitStatus.submitted
		}).save();

		deleteDocs(_quoteModel);
	} else {
		_requestModel.set({
			'submitStatus': Alloy.Globals.submitStatus.pending
		});

		_quoteModel.set({
			'submitStatus': Alloy.Globals.submitStatus.pending
		}).save();

		// alert(_status.Message || '');
	}

	// quotesToSubmitQueue.remove(_quoteModel);

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

	doLog && console.log("[submitProgress] - handleSubmitFailure()");

	var _quoteModel = _context;
	var _requestModel = _quoteModel.get('activeRequest');
	var _httpRequest = _quoteModel.get('httpRequest');

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
 * @method generateSubmitJSON
 * @private
 * Generates the expected JSON for submitting a Quote Model
 * @param {Models.Quote} _quoteModel Parameter to be used to generate information
 * @return {Object} Return generated data to be used for submit it
 */
function generateSubmitJSON(_quoteModel) {
	analytics.captureApm('[submitProgress] - generateSubmitJSON()');

	var _documents = [];
	var _selectedPayment = _quoteModel.getSelectedPaymentOption();
	var _json = {
		'quote': _quoteModel.toJSON({
			removeNested: true
		}),
		'customer': _quoteModel.get('customer').toJSON(),
		'paymentOption': _selectedPayment.toJSON(),
		'equipment': _quoteModel.get('equipments').toJSON(),
		'equipmentUsage': _quoteModel.get('usages').toJSON(),
		'amortization': amortization.getAmortizationInfo({
			payment: _selectedPayment
		})
	};

	_.each(Alloy.Globals.submitDocs, function (_docName) {
		var _type = '';
		var _docFileName = _quoteModel.get(_docName);
		var docFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, _docFileName);

		if (_docFileName && docFile.exists()) {
			var docName = docFile.name;

			// TODO: comparisons may depend on the country JSON, so it will be compatible with OTHC
			if (docName.indexOf('lease') !== -1) {
				_type = 'LEASEQUOTE';
			} else if (docName.indexOf('finance') !== -1) {
				_type = 'FINANCEQUOTE';
			} else if (docName.indexOf('credit') !== -1) {
				_type = 'CREDITAPP';
			}

			_documents.push({
				content: Ti.Utils.base64encode(docFile.read()).toString().replace(/\s\n/g, ''),
				contentType: 'application/pdf',
				type: _type
			});
			docFile = null;
		}
	});

	_json.documents = _documents;

	// doLog && console.debug('[submitProgress] - generateSubmitJSON() - _json: ' + JSON.stringify(_json));

	try {
		_json = JSON.parse(stringFormatter.restoreSingleQuote(JSON.stringify(_json)));
	} catch (_error) {
		console.error('[submitProgress] - Error parsing JSON: ' + JSON.stringify(_error, null, '	'));
	}

	return _json;
};

/**
 * @method deleteDocs
 * @private
 * Deletes the PDF, and images associated with the Quote
 * @param {Model.Quote} _quoteModel Parameter to be used to delete a document
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
 * @method handleNetworkChange
 * @private
 * Handle the network change state
 * @param {Object} _evt Parameter to handle the network change state
 * @return {void}
 */
function handleNetworkChange(_evt) {
	doLog && console.log('[submitProgress] - handleNetworkChange()');

	if (!Alloy.Globals.isDemo && !isSendingQuotes && _evt.networkOnline) {
		isSendingQuotes = true;
		_.defer(sendPendingQuotes, false);
	}
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
	if (!isSendingQuotes && _evt.type === 'resume') {
		isSendingQuotes = true;
		_.defer(sendPendingQuotes, false);
	}
};

init();
