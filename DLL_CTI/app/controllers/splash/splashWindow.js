/**
 * @class Controllers.splash.splashWindow
 * Splash screen window emulated
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
	analytics.captureApm('[splashWindow] - init()');
	setTimeout(function () {
		args.doneCallback && args.doneCallback();
	}, 1400);
};

$.window.addEventListener('close', function () {
	analytics.captureApm('[splashWindow] - close()');
	$.destroy && $.destroy();
});

init();
