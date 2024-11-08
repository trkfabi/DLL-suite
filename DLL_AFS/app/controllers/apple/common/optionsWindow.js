/**
 * @class Controllers.apple.common.optionsWindow
 * Options Window
 * @uses appNavigation
 */
var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var appNavigation = require('/appNavigation');

/**
 * @property {Object} options 
 * @private
 * Holds the option list used in the listview
 */
var options = args.options || {};

/**
 * @property {String} windowTitle 
 * @private
 * Holds the title of the window
 */
var windowTitle = args.title || null;

/**
 * @property {Function} doneCallback 
 * @private
 * Function executed after the user selection
 */
var doneCallback = args.doneCallback || {};

/**
 * @property {Function} cancelCallBack 
 * @private
 * Function executed after the user cancels
 */
var cancelCallBack = args.cancelCallBack || null;

/**
 * @method init
 * @private
 * Initializes the controller
 * return {void}
 */
function init() {
	if (windowTitle) {
		$.headerTitleLabel.text = windowTitle;
	}
	var listSections = [];
	var sections = options.sections || [];

	_.each(sections, function (_section) {
		var productSection = Alloy.createController('apple/common/optionsSection', {
			sectionData: _section
		});

		listSections.push(productSection.getView());
	});

	$.optionsList.sections = listSections;
};

/**
 * @method handleOptionsListClick
 * @private
 * Handles option list click
 * @param {Object} _evt
 * @return {void}
 */
function handleOptionsListClick(_evt) {
	var section = options.sections[_evt.sectionIndex] || {};
	var option = section.options[_evt.itemIndex] || {};

	doneCallback && doneCallback({
		option: option
	});
	appNavigation.closeOptionsWindow();
};

/**
 * @method handleCancelButtonClick
 * @private
 * Handles the cancel button click
 * @param {Object} _evt
 * @return {void}
 */
function handleCancelButtonClick(_evt) {
	cancelCallBack && cancelCallBack();
	appNavigation.closeOptionsWindow();
}

$.cancelButton.addEventListener('click', handleCancelButtonClick);
$.optionsList.addEventListener('itemclick', handleOptionsListClick);

init();
