/**
 * Controller for the stand-alone ITAD functionality in equipment rows
 * @class Controllers.apple.equipment.itadView
 * @uses Helpers.uiHelpers
 */
var doLog = Alloy.Globals.doLog;
var args = arguments[0] || {};

const LOG_TAG = '\x1b[31m' + '[apple/controllers/equipment/itadView]' + '\x1b[39;49m ';

var uiHelpers = require('/helpers/uiHelpers');

/**
 * @property {Boolean} isEnabled Internal flag to track the status of the switch value
 */
var isEnabled = false;

/**
 * @property {Function} onChange=args.onChange Callback function called everytime the switch value's changes
 */
var onChange = args.onChange;

/**
 * @method init
 * @private
 * Initializes the controller
 * @return {void}
 */
function init() {
	doLog && console.log(LOG_TAG, '- init');
}

// +-------------------
// | Public members.
// +-------------------

/**
 * @method setEnabled
 * Updates the enabled status of the itad rate
 * @param {Boolean} _isEnabled flag to enabled or disable the switch
 * @return {void}
 */
$.setEnabled = function (_isEnabled) {
	doLog && console.log(LOG_TAG, '- setEnabled');

	isEnabled = _isEnabled;

	$.itadSwitch.value = isEnabled;
};

/**
 * @method disableAllControls
 * Disabled all user interactions with this controller's UI
 * @return {void}
 */
$.disableAllControls = function () {
	doLog && console.log(LOG_TAG, '- disableAllControls');

	uiHelpers.setElementEnabled($.itadView, false);
};

/**
 * @method enableAllControls
 * Enables all user interactions with this controller's UI
 * @return {void}
 */
$.enableAllControls = function () {
	doLog && console.log(LOG_TAG, '- enableAllControls');

	uiHelpers.setElementEnabled($.itadView, true);
};

// +-------------------
// | Event Handlers declaration.
// +-------------------

/**
 * @method handleItadClick
 * @private
 * Handler for the click event on the itadView
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleItadClick(_evt) {
	doLog && console.log(LOG_TAG, '- handleItadClick');

	$.setEnabled(!isEnabled);

	onChange && onChange({
		value: isEnabled
	});
}

init();

$.itadView.addEventListener('click', handleItadClick);
