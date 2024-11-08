/**
 * @class Controllers.terms.TermsPopup
 * Credit application agreement
 */
var args = arguments[0] || {};
var appNavigation = require('/appNavigation');
var analytics = require('/utils/analytics');
var customizations = require('/customizations');
var sessionManager = require('/utils/sessionManager');
var terms = customizations.getTerms();
var countryData = sessionManager.getCountryData();

/**
 * @method init
 * @private
 * Inits the controller
 * @return {void}
 */
function init() {
	var htmlFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, '/htmls/agco_credit_terms.html');
	var htmlString = htmlFile.read().text;
	$.policy.html = htmlString;
};

/**
 * @method open
 * Open window with the agreement information
 * @return {void}
 */
$.open = function () {
	$.window.open();
};

/**
 * @method close
 * Close window with the agreement information
 * @return {void}
 */
$.close = function () {
	$.window.close();
};

/**
 * @method cancelClick
 * @private
 * Handle the click event of the cancelButton control
 * @param {Object} _evt Parameter for the click event to be used it on the cancelClick control
 * @return {void}
 */
function cancelClick(_evt) {
	analytics.captureTiAnalytics('TermsPopup.Cancel.Click');
	appNavigation.closeSummaryPoliciesWindow();
};

/**
 * @method okClick
 * @private
 * Handle the click event of the okButton control
 * @param {Object} _evt Parameter for the click event on the okButton control
 * @return {void}
 */
function okClick(_evt) {
	analytics.captureTiAnalytics('TermsPopup.OK.Click');
	args.authorizations = countryData.summary.authorizations;
	// TODO : this needs to be checked once the summary is fully configurable
	appNavigation.openSignatureWindow(args);
};

/**
 * @method loadTerms
 * @private
 * Load terms about the credit application agreement
 * @return {void}
 */
function loadTerms() {
	$.policy.removeEventListener('load', loadTerms);
	if (terms) {
		Ti.App.fireEvent('app:loadTermsPopup', {
			terms: terms
		});
	}
};

$.policy.addEventListener('load', loadTerms);
$.cancelButton.addEventListener('click', cancelClick);
$.okButton.addEventListener('click', okClick);

init();
