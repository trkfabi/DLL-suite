/**
 * @class Controllers.settings.SettingsWindow
 * Change document language, application version, and do the log out of the application
 */

var analytics = require('/utils/analytics');
var appNavigation = require('/appNavigation');
var sessionManager = require('/utils/sessionManager');
var application = require('application');
var customizations = require('/customizations');
var languageSelected = sessionManager.getDocsLang();
var newLanguage;

/**
 * @method init
 * @private
 * Initialize values for the settings window
 * return {void}
 */
function init() {
	analytics.captureApm('[settingsWindow] - init()');
	$.versionLabel.text = L('version') + ' ' + Ti.App.version;

	analytics.captureApm('[settingsWindow] - init() - selected lang - ' + languageSelected.key);

	if (OS_IOS) {
		$.window.rightNavButton = $.doneButton;
	}

	if (doLog) {
		$.crash.addEventListener('click', handleCrash);
	} else {
		$.wrapper.remove($.crash);
	}
};

/**
 * @method handleLogOutClick
 * @private
 * Handle the click event of the log out button 
 * @param {Object} _evt Click Event of the logOutButton
 * @return {void}
 */
function handleLogOutClick(_evt) {
	sessionManager.logout();
	appNavigation.handleNavLeftButton();
	application.logout();
	_.defer(appNavigation.closeSettingsWindow);
};

/**
 * @method handleDoneClick
 * @private
 * Handle the click event of the done button
 * @param {Object} _evt Click event of the doneButton
 * @return {void}
 */
function handleDoneClick(_evt) {
	if (newLanguage) {
		analytics.captureApm('[settingsWindow] - handleDoneClick() - ' + newLanguage);
		sessionManager.setDocsLang(newLanguage);
		customizations.updateCustomizationsLanguage(newLanguage);
	}
	_.defer(appNavigation.closeSettingsWindow);
};

/**
 * @method handleCrash
 * @private
 * Throws an error for test
 * @return {void}
 */
function handleCrash(_param) {
	throw Error('C R A S H');
}

$.logOutButton.addEventListener('click', handleLogOutClick);
$.doneButton.addEventListener('click', handleDoneClick);

init();
