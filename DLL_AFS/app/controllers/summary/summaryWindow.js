/**
 * @class Controllers.Summary.SummaryWindow
 * Shows the summary for the selected payment option
 */
const LOG_TAG = '\x1b[31m' + '[summary/summaryWindow]' + '\x1b[39;49m ';
var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var analytics = require('/utils/analytics');
var configsManager = require('/utils/configsManager');
var customizations = require('/customizations');
var appNavigation = require('/appNavigation');
var summaryData = configsManager.getConfig('summary') || {};

var quote = null;
var customer = null;
var paymentOption = null;

// Nested Controllers
var summaryCategories = {};

/**
 * @method init
 * @private
 * Initializes the Summary Window controller
 * @return {void}
 */
function init() {
	var logo = customizations.getFile('logo');

	logo && logo.exists() && ($.brandLogo.image = logo.read());
	$.backLabel.text = args.backLabel != null ? args.backLabel : L('back');

	if (args.backButton != null) {
		$.backImage.image = args.backButton;
		$.backButton.left = 0;
	}

	$.updateQuote(args.quote);
};

/**
 * @method updateQuote
 * Updates the UI from 
 * @param {Models.quote} _quote Quote to update the UI from this model
 * @return {void}
 */
$.updateQuote = function (_quote) {
	doLog && console.log(LOG_TAG, '- updateQuote');

	$.cleanUp();

	quote = _quote;
	customer = quote.get('customer');
	paymentOption = quote.getSelectedPaymentOption();

	summaryCategories = {};

	$.scrollView.removeAllChildren();

	loadSummarySections();
};

/**
 * @method cleanUp
 * Removes global events and variables
 * @return {void}
 */
$.cleanUp = function () {
	doLog && console.log(LOG_TAG, '- cleanUp');
};

/**
 * @method loadSummarySections
 * @private
 * Load Summary Sections
 * @return {void}
 */
function loadSummarySections() {
	doLog && console.log('[summaryWindow] - loadSummarySections');

	var authorizations = summaryData.authorizations;

	_.each(summaryData.categories, function (_category) {
		var _summaryCategory = Alloy.createController(_category.controller, {
			quote: quote,
			titleid: _category.titleid,
			container: $.window,
			authorizations: authorizations,
			updateCallback: handleCategoryUpdate
		});
		summaryCategories[_category.id] = _summaryCategory;

		$.scrollView.add(_summaryCategory.getView());
	});
};

/**
 * @method handleCategoryUpdate
 * @private
 * Handler function called after something gets updated  on some section
 * @param {Object} _data
 * @return {void}
 */
function handleCategoryUpdate(_data) {
	var authorizationsData = _data.authorizationsData || [];

	_.each(authorizationsData, function (_authorizationData) {
		summaryCategories.contractAcceptance.setCheckmarkActive(_authorizationData.id, _authorizationData.hasData);
	});
};

/**
 * @method handleShareButtonClick
 * @private
 * Handles the share button click event 
 * @param {Object} _evt click parameter event
 * @return {void}
 */
function handleShareButtonClick(_evt) {
	doLog && console.log(LOG_TAG, '- handleShareButtonClick');
	var _customer = quote.get('customer');

	quote.addAnalyticsCounter('shareSummary');
	appNavigation.openGenerateWindow({
		quote: quote,
		recipient: 'share',
		pdfFileName: quote.get('pdfFileName'),
		doneCallback: function (_data) {
			appNavigation.openEmailDialog({
				subject: ' ',
				toRecipients: [_customer.get('email') || ''],
				messageBody: L('thank_you') + '.',
				attachments: _data.attachments
			});
		}
	});
}

$.backButton.addEventListener('click', appNavigation.closeSummaryWindow);
$.shareButton.addEventListener('click', handleShareButtonClick);
OS_ANDROID && $.window.addEventListener('androidback', appNavigation.closeSummaryWindow);

init();
