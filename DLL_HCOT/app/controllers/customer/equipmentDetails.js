/**
 * @class Controllers.customer.equipmentDetails
 * Equipment details
 * @uses Helpers.uiHelpers
 */
var args = arguments[0] || {};
var uiHelpers = require('/helpers/uiHelpers');

/**
 * @property {Models.equipment} equipment holds equipment model attributes
 */
var equipment = args.equipment;

/**
 * @property {Boolean} hasFocus
 * @private
 * If description field has focus or not.
 */
var hasFocus = false;

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	$.descriptionField.setValue(equipment.getDescriptionAndUpdate() || '');
	uiHelpers.addDoneButton($.qtyField, $.blurFields);
};
/**
 * @method blurFields
 * Do the blur for the quantity textfield 
 * @return {void}
 */
$.blurFields = function () {
	doLog && console.log('[equipmentDetails] - blurFields()');
	$.descriptionField.blur();
};

/**
 * @method setIndex
 * Updates the index number of the equipment row
 * @param {Number} _index Index number to update the title
 * @return {void}
 */
$.setIndex = function (_index) {

};

/**
 * @method setEnabled
 * Enables or disables the controls based on _enabled parameter
 * @param {Boolean} _enabled Enable state to be set in the controls
 * @return {void}
 */
$.setEnabled = function (_enabled) {
	doLog && console.log('[equipmentDetails] - setEnabled() - ' + _enabled);
	uiHelpers.setElementEnabled($.descriptionField.getView(), _enabled);
};

/**
 * @method cleanUp
 * @deprecated
 * Releases memory usage by this controller
 * @return {void}
 */
$.cleanUp = function () {
	// TODO Remove somthing, maybe?
};

/**
 * @method handleFieldBlur
 * @private
 * Handler for description field blur
 * @param {Object} _evt
 * @return {void}
 */
function handleFieldBlur(_evt) {
	hasFocus = false;
}

/**
 * @method handleFieldFocus
 * @private
 * Handler for description field focus
 * @param {Object} _evt
 * @return {void}
 */
function handleFieldFocus(_evt) {
	hasFocus = true;
}

/**
 * @method handleDescriptionPostLayout
 * @private
 * Handler for description textarea height change. 
 * @param {Object} _evt
 * @return {void}
 */
function handleDescriptionPostLayout(_evt) {
	$.descriptionRow.height = _evt.source.rect.height + $.descriptionBottomLine.height + $.descriptionBottomLine.bottom;
}

/**
 * @method handleFieldChange
 * @private
 * Handler for the change event on the text area
 * @param {Object} _evt 
 * @return {void}
 */
function handleFieldChange(_evt) {
	doLog && console.log('[equipmentDetails] - handleFieldChange');
	if (!hasFocus) {
		return;
	}

	var value = _evt.source.value;
	if (OS_IOS && value.length > 0) {
		var valueCopy = value;
		value = uiHelpers.replaceQuotes(value);
		if (value != valueCopy) {
			_evt.source.value = value;
		}
	}

	equipment.set({
		description: value
	});

	args.updateCallback && args.updateCallback({
		source: $,
		equipment: equipment
	});
}

$.descriptionField.addEventListener('blur', handleFieldBlur);
$.descriptionField.addEventListener('focus', handleFieldFocus);
$.descriptionField.addEventListener('change', handleFieldChange);
$.descriptionField.addEventListener('postlayout', handleDescriptionPostLayout);

init();
