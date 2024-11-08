/**
 * @class Controllers.picker.pickerContainer
 * Custom Picker for iOS & android, kind of similar to Ti.UI.Picker
 */
var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var appNavigation = require('/appNavigation');

var MAX_LIST_HEIGHT = 180;
var options = [];
var slideAnimation;
var fadeAnimation;

/**
 * @method init
 * @private
 * Initialize values for the current wrapper
 * @return {void}
 */
function init() {
	options = args.options || [];
	slideAnimation = {
		duration: 300
	};
	fadeAnimation = {
		duration: 200
	};
	createList();
};

/**
 * @method createList
 * @private
 * Creation of a list
 * @return {void}
 */
function createList() {
	var rowHeight = 40;
	var rows = [];

	_.each(options, function (_option) {
		var row = {
			optionLabel: {
				text: _option.title || ''
			}
		};

		rows.push(row);
	});

	$.listContainer.height = Math.min(MAX_LIST_HEIGHT, rows.length * rowHeight);
	$.listSection.items = rows;
};

/**
 * @method open
 * Show the picker
 * @param {Object} _params Parameter to use additional information for the picker
 * @return {void}
 */
$.open = function () {
	slideAnimation.bottom = 0;
	fadeAnimation.opacity = 1.0;

	args.container && args.container.add($.wrapper);

	$.container.bottom = -($.listContainer.height);
	$.container.animate(slideAnimation);
	$.wrapper.animate(fadeAnimation);
};

/**
 * @method close
 * Hide the picker 
 * @return {void}
 */
$.close = function () {
	slideAnimation.bottom = -($.listContainer.height);
	fadeAnimation.opacity = 0;
	$.wrapper.animate(fadeAnimation);
	$.container.animate(slideAnimation, function () {
		args.container && args.container.remove($.wrapper);
		args.callback && args.callback();
	});
};

/**
 * @method handleListClick
 * @private
 * Callback function executed after doing the click on a row of the picker
 * @param {Object} _params Parameter to use additional information for the row
 * @param {String} _params.title Title of the selected option of the picker
 * @param {String} _params.value Value of the selected option of the picker
 * @return {void}
 */
function handleListClick(_evt) {
	$.listContainer.removeEventListener('itemclick', handleListClick);
	appNavigation.closePickerWindow();

	_.defer(function () {
		var option = options[_evt.itemIndex] || {};
		args.callback && args.callback(option);
	});
};

$.wrapper.addEventListener('click', appNavigation.closePickerWindow);
$.listContainer.addEventListener('itemclick', handleListClick);

init();
