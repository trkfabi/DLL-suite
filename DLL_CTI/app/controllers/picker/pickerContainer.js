/**
 * @class Controllers.picker.pickerContainer
 * Custom Picker for iOS & android, kind of similar to Ti.UI.Picker
 */
var args = arguments[0] || {};
var appNavigation = require('/appNavigation');
var rows = [];
var isMultiple = args.isMultiple || false;
var animation = Ti.UI.createAnimation({
	duration: 300
});
var fadeAnimation = Ti.UI.createAnimation({
	duration: 200
});
var maxListHeight = Alloy.Globals.hasNotch ? 220 : 180;

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	if (!isMultiple) {
		$.container.remove($.header);
	}

	createList();
};

/**
 * @method createList
 * @private
 * Creation of a list
 * @return {void}
 */
function createList() {
	var rowHeight = 0;
	var tableViewRows = [];
	for (var i = 0; i < args.options.length; i++) {
		var option = args.options[i];
		var row = Alloy.createController('picker/pickerRow', {
			isMultiple: isMultiple || false,
			title: option.title,
			value: option.value,
			callback: handleRowClick
		});
		tableViewRows.push(row.container);
		rows.push(row);
		(i === 0) && (rowHeight = row.container.height);
	}
	$.listContainer.data = tableViewRows;
	$.listContainer.height = Math.min(maxListHeight, rows.length * rowHeight);
};

/**
 * @method handleRowClick
 * @private
 * Callback function executed after doing the click on a row of the picker
 * @param {Object} _params Parameter to use additional information for the row
 * @param {String} _params.title Title of the selected option of the picker
 * @param {String} _params.value Value of the selected option of the picker
 * @return {void}
 */
function handleRowClick(_params) {
	_params = _params || {};
	if (!isMultiple) {
		args.callback && args.callback(_params);
		$.hide();
	}
};

/**
 * @method show
 * Show the picker
 * @param {Object} _params Parameter to use additional information for the picker
 * @return {void}
 */
$.show = function (_params) {
	_params = _params || {};
	animation.bottom = 0;
	fadeAnimation.opacity = 0.3;
	$.container.bottom = -($.listContainer.height);
	$.window.open();
	$.container.animate(animation);
	$.backgroundMask.animate(fadeAnimation);
};

/**
 * @method hide
 * Hide the picker 
 * @return {void}
 */
$.hide = function () {
	animation.bottom = -($.listContainer.height);
	fadeAnimation.opacity = 0;
	$.backgroundMask.animate(fadeAnimation);
	$.container.animate(animation, function () {
		appNavigation.closePickerWindow();
	});
};

/**
 * @method doClickDone
 * @private
 * Handle the click event for the done button control
 * @return {void}
 */
function doClickDone() {
	var titles = [];
	var values = [];
	for (var i = 0; i < rows.length; i++) {
		var row = rows[i];
		if (row.isSelected) {
			titles.push(row.title);
			values.push(row.value);
		}
	}
	args.callback && args.callback({
		titles: titles,
		values: values
	});
	$.hide();
};

/**
 * @method doClickClear
 * @private
 * Handle the click event for the clear button control
 * @return {void}
 */
function doClickClear() {
	for (var i = 0; i < rows.length; i++) {
		var row = rows[i];
		row.toggle(0);
	}
};

$.window.addEventListener('click', $.hide);
$.doneButton.addEventListener('click', doClickDone);
$.clearButton.addEventListener('click', doClickClear);

init();
