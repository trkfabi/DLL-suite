/**
 * @class Controllers.solveFor.undoSolveForWindow
 * Restore default values for solveForWindow
 */
var args = arguments[0] || {};
var analytics = require('/utils/analytics');
var appNavigation = require('/appNavigation');
var undoCallback = args.undoCallback;

/**
 * @method closeWindow
 * @private
 * Execute an animation to modify the opacity of the  buttonFrame control 
 * @return {void}
 */
function closeWindow() {
	$.buttonFrame.animate({
		opacity: 0,
		duration: 150
	}, function () {
		appNavigation.closeUndoSolveForWindow();
	});
};

/**
 * @method keepValues
 * @private
 * Close window, and keep values
 * @return {void}
 */
function keepValues() {
	analytics.captureApm('[undoSolveForWindow] - keepValues()');
	closeWindow();
};

/**
 * @method undoValues
 * @private
 * Close window, and undo values
 * @return {void}
 */
function undoValues() {
	analytics.captureApm('[undoSolveForWindow] - undoValues()');
	closeWindow();
	(undoCallback) && (undoCallback());
};

$.undoButton.addEventListener('click', undoValues);
$.container.addEventListener('click', keepValues);
