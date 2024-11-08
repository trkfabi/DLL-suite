/**
 * @class Controllers.terms.termsPopup
 * Credit application agreement
 * @uses Libs.analytics
 * @uses appNavigation
 * @uses customizations
 */
var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var appNavigation = require('/appNavigation');
var analytics = require('/utils/analytics');
var customizations = require('/customizations');

/**
 * @property {String} terms contains terms and conditions text
 */
var terms = customizations.getTerms();

/**
 * @property {Ti.UI.Window} container holds summary window used to add terms pop up wrapper
 */
var container = args.container;

/**
 * @method init
 * @private
 * Inits the controller
 * @return {void}
 */
function init() {

};

/**
 * @method open
 * Adding background to the container
 * @return {void}
 */
$.open = function () {
	container.add($.wrapper);
};

/**
 * @method close
 * @private
 * Removing background to the container
 * @return {void}
 */
$.close = function () {
	container.remove($.wrapper);
};

/**
 * @method handleCancelClick
 * @private
 * Handle the click event of the cancelButton control
 * @param {Object} _evt Parameter for the click event to be used it on the handleCancelClick control
 * @return {void}
 */
function handleCancelClick(_evt) {
	analytics.captureTiAnalytics('TermsPopup.Cancel.Click');
	appNavigation.closeSummaryPoliciesWindow();
	args.cancelCallback && args.cancelCallback();
};

/**
 * @method handleOkClick
 * @private
 * Handle the click event of the okButton control
 * @param {Object} _evt Parameter for the click event on the okButton control
 * @return {void}
 */
function handleOkClick(_evt) {
	analytics.captureTiAnalytics('TermsPopup.OK.Click');
	// TODO : this needs to be checked once the summary is fully configurable
	// appNavigation.handleFirstAuthorization(args);
	appNavigation.openSignatureWindow(args);
};

/**
 * @method handlePolicyLoad
 * @private
 * Load terms about the credit application agreement
 * @return {void}
 */
function handlePolicyLoad() {
	$.policy.removeEventListener('load', handlePolicyLoad);
	if (terms) {
		Ti.App.fireEvent('app:loadTermsPopup', {
			terms: terms
		});
	}
};

$.policy.addEventListener('load', handlePolicyLoad);
$.cancelButton.addEventListener('click', handleCancelClick);
$.okButton.addEventListener('click', handleOkClick);

init();
