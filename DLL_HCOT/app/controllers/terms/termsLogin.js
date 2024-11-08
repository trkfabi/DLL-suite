/**
 * @class Controllers.terms.termsLogin
 * Terms and conditions window
 * @uses Libs.analytics
 * @uses appNavigation
 */
var analytics = require('/utils/analytics');
var appNavigation = require('/appNavigation');

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	analytics.captureApm('[termsLogin] - init()');
	var eulaPath = Ti.Filesystem.resourcesDirectory + 'htmls/' + Ti.Locale.currentLocale;

	if (Ti.Filesystem.getFile(eulaPath, 'dll_terms.html').exists()) {
		$.policy.url = eulaPath + '/dll_terms.html';
		doLog && console.log(" policy URL = " + $.policy.url);
	}

};

/**
 * @method handleCloseButtonClick
 * @private
 * Handle the click event for the okButton
 * @param {Object} _evt Parameter for the click event to be used it on the okButton control
 * @return {void}
 */
function handleCloseButtonClick(_evt) {
	Ti.App.Properties.setString('policy_version', Alloy.Globals.policyVersion);
	appNavigation.closeLoginPoliciesWindow();
};

$.okButton.addEventListener('click', handleCloseButtonClick);

init();
