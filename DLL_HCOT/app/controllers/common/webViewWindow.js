/**
 * Description
 * @class Controllers.common.webViewWindow
 * @uses appNavigation
 */
const LOG_TAG = '\x1b[31m' + '[controllers/common/webViewWindow]' + '\x1b[39;49m ';

var args = arguments[0] || {};
var appNavigation = require('/appNavigation');
var safariDialog = OS_IOS ? require('ti.safaridialog') : {};

var url = args.url || '';

/**
 * @method init
 * @private
 * Initializes the controller
 * @return {void}
 */
function init() {
	if (OS_ANDROID) {
		$.webView.url = url;
	}
}

// +-------------------
// | Public members.
// +-------------------

/**
 * @method open
 * Opens the safaridialog for iOS
 * @return {void}
 */
$.open = function () {
	safariDialog.open({
		url: url,
		tintColor: Alloy.Globals.colors.azureRadiance
	});
};

/**
 * @method close
 * Closes the safaridialog for iOS
 * @return {void}
 */
$.close = function () {
	safariDialog.close();
};

// +-------------------
// | Private members.
// +-------------------

// +-------------------
// | Event Handlers declaration.
// +-------------------

/**
 * @method handleWindowClose
 * @private
 * Event handler for the closing this controller's window
 * @param {Object} _evt close event
 * @return {void}
 */
function handleWindowClose(_evt) {
	appNavigation.closeWebViewWindow();
}

init();

if (OS_IOS) {
	safariDialog.addEventListener('close', handleWindowClose);
} else {
	$.window.addEventListener('close', handleWindowClose);
	$.backButton.addEventListener('click', handleWindowClose);
	$.titleLabel.addEventListener('click', handleWindowClose);
}
