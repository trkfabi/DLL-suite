/**
 * @class Controllers.Summary.SummaryWindow
 * Shows the summary for the selected payment option
 */
const LOG_TAG = '\x1b[31m' + '[summary/summaryWindow]' + '\x1b[39;49m ';
var args = arguments[0] || {};
var configsManager = require('/utils/configsManager');
var customizations = require('/customizations');
var appNavigation = require('/appNavigation');
var summaryData = configsManager.getConfig('summary') || {};

var quote = null;
var customer = null;

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
	updateCheckCategories();
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
 * @method blurFields
 * Forces all textFields to call `blur()` function
 * @return {void}
 */
$.blurFields = function () {
	doLog && console.log(LOG_TAG, '- blurFields');

	_.each(summaryCategories, function (_summaryCategoryController) {
		_summaryCategoryController.blurFields && _summaryCategoryController.blurFields();
	});
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
		var fieldToUpdate = '';
		switch (_authorizationData.id) {
		case 'signature':
			fieldToUpdate = 'hasSignature';
			break;
		case 'ssn':
			fieldToUpdate = 'hasSSN';
			break;
		case 'dob':
			fieldToUpdate = 'hasDOB';
			break;
		case 'license':
			fieldToUpdate = 'hasLicense';
			break;
		}
		customer.set(fieldToUpdate, _authorizationData.hasData);
	});
	customer.save();
};

/**
 * @method updateCheckCategories
 * @private
 * Show checkmarks on the categories
 * @return {void}
 */
function updateCheckCategories() {
	doLog && console.log(LOG_TAG, '- updateCheckCategories');
	if (customer != null) {
		summaryCategories.contractAcceptance.setCheckmarkActive('signature', customer.get('hasSignature'));
		summaryCategories.contractAcceptance.setCheckmarkActive('ssn', customer.get('hasSSN'));
		summaryCategories.contractAcceptance.setCheckmarkActive('dob', customer.get('hasDOB'));
		summaryCategories.contractAcceptance.setCheckmarkActive('license', customer.get('hasLicense'));
	}
}

$.backButton.addEventListener('click', appNavigation.closeSummaryWindow);
OS_ANDROID && $.window.addEventListener('androidback', appNavigation.closeSummaryWindow);

init();
