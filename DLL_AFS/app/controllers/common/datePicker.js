/**
 * Shows a generic date picker contained in a transparent screen
 * @class Controllers.common.datePicker
 * @uses appNavigation
 */
var doLog = Alloy.Globals.doLog;

var args = arguments[0] || {};

const LOG_TAG = '\x1b[31m' + '[controllers/common/datePicker]' + '\x1b[39;49m ';

/**
 * @property {Function} [onDone=args.onDone] Callback called after the user 
 * presses the done button, sending the selected date
 */
var onDone = args.onDone;

/**
 * @property {Function} [onCancel=args.onCancel] Callback called after the user 
 * presses the cancel button or clicks outside the picker
 */
var onCancel = args.onCancel;

/**
 * @property {Date} [minDate=args.minDate] Minimum date to select from the picker
 */
var minDate = args.minDate;

/**
 * @property {Date} [maxDate=args.maxDate] Maximum date to select from the picker
 */
var maxDate = args.maxDate;

/**
 * @property {Date} [value=args.value] Value to start with the picker selected
 */
var value = args.value;

/**
 * @method init
 * @private
 * Initializes the controller
 * @return {void}
 */
function init() {
	doLog && console.log(LOG_TAG, '- init');

	var minMoment = new moment(minDate);
	var maxMoment = new moment(maxDate);
	var valueMoment = new moment(value);
	var daysDifference = maxMoment.diff(minMoment, 'days');
	var pickerRows = [];
	var selectedRow = 0;

	_.each(_.range(daysDifference), function (_addedDays, _index) {
		var dayToAdd = new moment(minDate).add(_addedDays, 'days');

		var datePickerRow = Alloy.createController('common/datePickerRow', {
			title: dayToAdd.format('ddd MMM DD'),
			value: dayToAdd.format()
		});

		pickerRows.push(datePickerRow.getView());

		if (valueMoment.isSame(dayToAdd, 'day')) {
			selectedRow = _index;
		}
	});

	$.datePicker.add(pickerRows);
	$.datePicker.setSelectedRow(0, selectedRow);
}

// +-------------------
// | Public members.
// +-------------------

/**
 * @method show
 * Shows the container with the date picker inside
 * @return {void}
 */
$.show = function () {
	doLog && console.log(LOG_TAG, '- show');

	$.window.open();
};

/**
 * @method hide
 * Hides the picker container
 * @return {void}
 */
$.hide = function () {
	doLog && console.log(LOG_TAG, '- hide');

	$.window.close();
};

// +-------------------
// | Private members.
// +-------------------

/**
 * @method cancel
 * @private
 * Cancels the picker, hiding it and triggering the cancel event
 * @return {void}
 */
function cancel() {
	doLog && console.log(LOG_TAG, '- cancel');

	$.hide();

	onCancel && onCancel();
}

// +-------------------
// | Event Handlers declaration.
// +-------------------

/**
 * @method handleDoneButtonClick
 * @private
 * Handler for the done button click
 * @param {Object} _evt CLick event
 * @return {void}
 */
function handleDoneButtonClick(_evt) {
	doLog && console.log(LOG_TAG, '- handleDoneButtonClick');

	$.hide();

	onDone && onDone({
		value: value
	});
}

/**
 * @method handleDatePickerChange
 * @private
 * Handler for the change event in the date picker
 * @param {Object} _evt Change event
 * @return {void}
 */
function handleDatePickerChange(_evt) {
	doLog && console.log(LOG_TAG, '- handleDatePickerChange');

	value = _evt.row.value;
}

$.window.addEventListener('click', cancel);
$.cancelButton.addEventListener('click', cancel);
$.doneButton.addEventListener('click', handleDoneButtonClick);
$.datePicker.addEventListener('change', handleDatePickerChange);

init();
