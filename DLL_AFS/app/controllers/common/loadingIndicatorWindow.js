/**
 * @class Controllers.common.loadingIndicatorWindow
 * Loading indicator variation with window element in order to prevent user interactions while is displayed
 */

/**
 * @method init
 * @private
 * Show the activity indicator
 * @return {void}
 */
function init() {
	$.loadingIndicator.removeActivityIndicator();
};

/**
 * @method show
 * Displays loading indicator
 * @return {void}
 */
$.show = function () {
	$.window.open();
	$.loadingIndicator.show();
};

/**
 * @method hide
 * Hides loading indicator
 * @return {void}
 */
$.hide = function () {
	$.window.close();
	$.loadingIndicator.hide();
};

init();
