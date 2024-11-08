/**
 * @class Controllers.settings.documentSelectorView
 * Change document language on the settings screen
 * @uses appNavigation
 * @uses Libs.analytics
 * @uses Libs.sessionManager
 * @uses customizations
 */

var args = arguments[0] || {};
var analytics = require('/utils/analytics');
var appNavigation = require('/appNavigation');
var sessionManager = require('/utils/sessionManager');
var configsManager = require('/utils/configsManager');
var customizations = require('/customizations');

/**
 * @property {Object} languageSelected obtains the language data for the currently selected language
 */
var languageSelected = sessionManager.getDocsLang();

/**
 * @property {String} newLanguage holds the language name, such as 'en' or 'fr'
 */
var newLanguage;

var languages = configsManager.getConfig('languages') || [];

/**
 * @method init
 * @private
 * Initialize values for the settings window
 * return {void}
 */
function init() {
	if (languages.length <= 1) {
		$.documentLanguageContainer.enabled = false;
		$.documentLanguageContainer.touchEnabled = false;
		$.changeLanguageImage.visible = false;
	}

	$.selectedLanguageLabel.text = languageSelected.language;

	analytics.captureEvent('[settingsWindow] - init() - selected lang - ' + languageSelected.key);
};

/**
 * @method handleDone
 * Function called by the settings window after the user selects `Done` in the UI
 * @return {void}
 */
$.handleDone = function () {
	if (newLanguage) {
		analytics.captureEvent('[settingsWindow] - handleDoneClick() - ' + newLanguage);
		sessionManager.setDocsLang(newLanguage);
		customizations.updateCustomizationsLanguage(newLanguage);
	}
};

/**
 * @method handleDocumentLanguageClick
 * @private
 * @deprecated
 * Handle the click event of the document language container view
 * @param {Object} _evt Click Event of the documentLanguageContainer
 * @return {void}
 */
function handleDocumentLanguageClick(_evt) {
	var params = {
		options: [],
		callback: function (_option) {
			$.selectedLanguageLabel.text = _option.title;
			newLanguage = _option.value;
		}
	};

	for (var i = 0, len = languages.length; i < len; i++) {
		params.options.push({
			'title': languages[i].language,
			'value': languages[i].key
		});
	}

	appNavigation.openPickerWindow(params);
};

// Event Handlers
$.documentLanguageContainer.addEventListener('click', handleDocumentLanguageClick);

init();
