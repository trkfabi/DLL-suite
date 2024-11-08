/**
 * @class Controllers.summary.submitView
 * Controller showing the status of the PDF submit 
 */
var args = arguments[0] || {};
var analytics = require('/utils/analytics');
var appNavigation = require('/appNavigation');
var quote = args.quote;
var customer = quote.get('customer');
var updateCallback = args.updateCallback;
var authorizations = args.authorizations || [];
var container = args.container;

var authorizationsData = [];

function init() {

};

/**
 * @method generatePDF
 * @private
 * Generation of the PDF
 * @param {String} _recipient information
 * @param {Function} _callback Function
 * @return {void}
 */
function generatePDF(_params) {
	doLog && console.log('[summaryWindow] - generatePDF()');

	_params = _params || {};
	var pdfToGenerate = 'othc_quote';
	var recipient = _params.recipient;
	var pdfCompleteCallback = _params.pdfCompleteCallback;

	appNavigation.hideKeyboard();

	appNavigation.openGenerateWindow({
		quote: quote,
		authorizationsData: authorizationsData,
		recipient: recipient,
		doneCallback: pdfCompleteCallback
	});
};

/**
 * @method submitPDFToWS
 * @private
 * Submit the PDF to web service
 * @return {void}
 */
function submitPDFToWS() {
	analytics.captureApm('[summaryWindow] - submitPDFToWS()');

	appNavigation.handleQuoteSubmit({
		quote: quote,
		authorizationsData: authorizationsData
	});

	if (Ti.Network.online) {
		appNavigation.showAlertMessage(L('transaction_is_being_processed'));
	} else {
		appNavigation.showAlertMessage(L('reestablish_internet_connection_to_submit'));
	}
};

/**
 * @method handleSignContractClick
 * @private
 * Handle the click event of the signContractButton control
 * @param {Object} Click event
 * @return {void}
 */
function handleSignContractClick(_evt) {
	analytics.captureTiAnalytics('Summary.SignContract.Click');
	doLog && console.log('[summaryWindow] - handleSignContractClick');

	appNavigation.hideKeyboard();
	appNavigation.openSummaryPoliciesWindow({
		container: container,
		authorizations: authorizations,
		doneCallback: handleAuthorizationComplete,
		cancelCallback: handleAuthorizationComplete
	});
};

/**
 * @method handleAuthorizationComplete
 * @private
 * Handles the authorization process when it finishes
 * @param {Object} _response Authorizations data filled by the user
 * @param {Array} _response.authorizations Authorizations information for each data filled by the user

 * @param {Boolean} [_response.isDone = false] Flag indicating if the user completed the whole process until the `Done` button
 * @return {void}
 */
function handleAuthorizationComplete(_response) {
	_response = _response || {};

	doLog && console.log('[summaryWindow] - handleAuthorizationComplete()');

	var isDone = _response.isDone;
	var shouldGeneratePDF = false;
	authorizationsData = _response.authorizationsData || [];

	if (isDone) {
		_response.source = 'submitView';

		updateCallback && updateCallback(_response);

		shouldGeneratePDF = _.any(authorizationsData, function (_authorizationData) {
			return _authorizationData.hasData;
		});

		if (shouldGeneratePDF) {
			generatePDF({
				recipient: 'dll',
				pdfCompleteCallback: handlePDFComplete
			});
		}
	}
};

/**
 * @method handlePDFComplete
 * @private
 * Handles the PDF creation
 * @return {void}
 */
function handlePDFComplete(_response) {
	var attachments = _response.attachments || [];
	var recipient = _response.recipient;

	if (_response.success && attachments.length > 0) {
		switch (recipient) {
		case 'dll':
			quote.set({
				'leaseFileName': attachments[0].fileName
			}).save();

			_.defer(submitPDFToWS);
			break;
		case 'customer':
			appNavigation.sharePDF({
				subject: '',
				attachments: attachments
			});
			break;
		}
	}
};

/**
 * @method handleSendContractToCustomerClick
 * @private
 * Handle the click event for the sendContractToCustomerButton control
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleSendContractToCustomerClick(_evt) {
	analytics.captureTiAnalytics('Summary.SendContract.Click');
	// sendEmail(_evt.source.tag);

	appNavigation.hideKeyboard();
	generatePDF({
		recipient: 'customer',
		pdfCompleteCallback: handlePDFComplete
	});
};

init();

$.signContractButton.addEventListener('click', handleSignContractClick);
$.sendContractToCustomerButton.addEventListener('click', handleSendContractToCustomerClick);
