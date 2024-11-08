/**
 * @class Controllers.picker.PickerRow
 * Represents a single Picker Row. To be used inside Controllers.Picker
 */
var args = arguments[0] || {};

$.isSelected = false;
$.title = args.title;
$.value = args.value;

$.rowLabel.text = args.title;
if (args.isMultiple) {
	$.rowImage.visible = true;
}

/**
 * @method toggle
 * Change the backgroundColor, and image according to the toggle.
 * @param {Boolean} state Parameter to know if the row is selected
 * @return {void}
 */
$.toggle = function (state) {
	$.isSelected = (state != null ? state : !$.isSelected);
	$.container.backgroundColor = ($.isSelected ? $.container.backgroundSelectedColor : $.container.backgroundNormalColor);

	$.rowImage.image = ($.isSelected ? $.rowImage.selectedImage : $.rowImage.normalImage);
};

/**
 * @method doClickContainer
 * @private
 * Handle the click event for the container control
 * @param {Object} _evt Parameter to detect the click on the container control
 * @return {void}
 */
function doClickContainer(_evt) {
	args.isMultiple && $.toggle();

	args.callback && args.callback({
		title: args.title,
		value: args.value
	});
};

$.container.addEventListener('click', doClickContainer);
