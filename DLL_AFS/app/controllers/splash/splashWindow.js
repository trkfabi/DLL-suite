/**
 * @class Controllers.splash.splashWindow
 * Splash screen window emulated
 * @uses Libs.analytics
 */
var args = arguments[0] || {};
var analytics = require('/utils/analytics');

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	analytics.captureEvent('[splashWindow] - init()');
	setTimeout(function () {
		args.doneCallback && args.doneCallback();
	}, 1400);
};

/**
 * @method handleWindowClose
 * @private
 * Handle the close event of the window
 * @param {Object} _evt Close event
 * @return {void}
 */
function handleWindowClose(_evt) {
	analytics.captureEvent('[splashWindow] - close()');
	$.cleanUp && $.cleanUp();
};

// Event Handlers
$.window.addEventListener('close', handleWindowClose);

init();
