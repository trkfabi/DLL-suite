/**
 * @class Controllers.summary.submitButtonView
 * Simple button definition
 */
var args = arguments[0] || [];
var appNavigation = require('/appNavigation');
var analytics = require('/utils/analytics');

var quote = args.quote;

/**
 * @method init
 * @private
 * Initializes the submitButtonView Controller
 * @return {void}
 */
function init() {

};

/**
 * @method submitPDFToWS
 * @private
 * Submit the PDF to web service
 * @return {void}
 */
function submitPDFToWS() {

	appNavigation.handleQuoteSubmit({
		quote: quote
	});

	if (Ti.Network.online) {
		appNavigation.showAlertMessage(L('transaction_is_being_processed'));
	} else {
		appNavigation.showAlertMessage(L('reestablish_internet_connection_to_submit'));
	}
};

/**
 * @method handleSubmitClick
 * @private
 * Handler function for the submit click
 * @param {Object} _evt
 * @return {void}
 */
function handleSubmitClick(_evt) {
	analytics.captureTiAnalytics('AFS-Submit-Quote');

	appNavigation.openGenerateWindow({
		quote: quote,
		recipient: 'dll',
		doneCallback: handlePDFDone
	});
};

/**
 * @method handlePDFDone
 * @private
 * Handler function to be called once the PDF is generated
 * @param {Object} _response Information for the PDF generated
 * @param {String} _response.recipient Name of recipient that was thi PDF generated for
 * @param {Object[]} _response.attachments List of PDF's generated
 * @return {void}
 */
function handlePDFDone(_response) {
	_response = _response || {};
	var attachments = _response.attachments || [];

	quote.set({
		'leaseFileName': attachments[0].fileName
	}).save();

	_.defer(submitPDFToWS);
};

init();

$.submitButton.addEventListener('click', handleSubmitClick);
