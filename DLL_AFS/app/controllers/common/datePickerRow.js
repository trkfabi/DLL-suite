/**
 * Standalone controller for the pickerRow added into the datePicker controller
 * @class Controllers.common.datePickerRow
 */
var doLog = Alloy.Globals.doLog;

var args = arguments[0] || {};

const LOG_TAG = '\x1b[31m' + '[controllers/common/datePickerRow]' + '\x1b[39;49m ';

/**
 * @property {String} title=args.title Title to show in the picker row
 */
var title = args.title || '';

/**
 * @property {String} value=args.value Value of the pickerRow when it getes selected
 */
var value = args.value || '';

/**
 * @method init
 * @private
 * Initializes the controller
 * @return {void}
 */
function init() {
	doLog && console.log(LOG_TAG, '- init');

	$.pickerRowLabel.text = title;
	$.pickerRow.value = value;
}

// +-------------------
// | Public members.
// +-------------------

// +-------------------
// | Private members.
// +-------------------

// +-------------------
// | Event Handlers declaration.
// +-------------------

init();
