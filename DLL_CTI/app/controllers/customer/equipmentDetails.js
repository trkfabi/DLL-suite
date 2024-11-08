/**
 * @class Controllers.customer.equipmentDetails
 * Equipment details
 */
var args = arguments[0] || {};
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');

var equipment = args.equipment;

var textFields = [$.makeField, $.modelField, $.descriptionField, $.yearField, $.serialNoField];
/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	$.makeField.value = stringFormatter.restoreSingleQuote(equipment.get('make') || '');
	$.modelField.value = stringFormatter.restoreSingleQuote(equipment.get('model') || '');
	$.descriptionField.value = stringFormatter.restoreSingleQuote(equipment.get('description') || '');

	if (equipment.get('isTradein')) {
		$.wrapper.remove($.yearRow);
		$.wrapper.remove($.serialRow);
		$.wrapper.remove($.statusRow);
	} else {
		$.yearField.addEventListener('blur', handleFieldBlur);
		$.serialNoField.addEventListener('blur', handleFieldBlur);
		$.equipmentStatus.addEventListener('click', handleFieldBlur);

		$.yearField.value = equipment.get('year') || '';
		$.serialNoField.value = equipment.get('serialNumber') || '';
		$.equipmentStatus.setIndex(equipment.get('isUsed'));
	}

	// $.makeAutocomplete.init({
	// 	textField : $.makeField,
	// 	changeEvent : handleFieldBlur,		
	// 	data : [
	// 		'Massey Ferguson',
	// 		'AGCO',
	// 		'AGCO Gleaner',
	// 		'AGCO Hesston',
	// 		'AGCO Spra Coupe',
	// 		'AGCO White',
	// 		'Fendt',
	// 		'Hesston',
	// 		'Challenger',
	// 		'Valtra',
	// 		'Ag-chem',
	// 		'White',
	// 		'Sunflower',
	// 		'Spra Cou'
	// 	]
	// });
};

/**
 * @method blurFields
 * Do blur to the TextField controls to hide the softkeyboard
 * @return {void}
 */
$.blurFields = function () {
	doLog && console.log('[equipmentDetails] - blurFields');
	_.each(textFields, function (_textField) {
		_textField.blur();
	});
};

/**
 * @method handleExpandCollapseClick
 * @private
 * Handle click event for the header control
 * @return {void}
 */
function handleExpandCollapseClick() {
	uiHelpers.expandCollapse({
		container: $.wrapper,
		button: $.expandCollapseButton
	});

};

/**
 * @method handleFieldBlur
 * @private
 * Handle blur event of TextFields controls
 * @param {Object} _evt Blur event
 * @return {void}
 */
function handleFieldBlur(_evt) {

	doLog && console.log('[equipmentDetails] - handleFieldBlur');

	equipment.set({
		make: $.makeField.value,
		model: $.modelField.value,
		description: $.descriptionField.value,
		year: $.yearField.value,
		serialNumber: $.serialNoField.value,
		isUsed: $.equipmentStatus.getIndex()
	});

	args.updateCallback && args.updateCallback({
		source: $,
		equipment: equipment
	});
};

/**
 * @method handleDelete
 * @private
 * Handle the click event of the deleteButton control
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleDelete(_evt) {
	var _equipments = equipment.collection;
	_equipments && _equipments.remove(equipment);

	args.updateCallback && args.updateCallback({
		source: $,
		equipment: equipment
	});
};

/**
 * @method handleChangeMakeField
 * @private
 * Handle the change event for the makeField control
 * @param {Object} _evt Change event
 * @return {void}
 */
function handleChangeMakeField(_evt) {
	var parentContainer = args.parentContainer;
	var totalY = parseInt($.wrapper.rect.y) + parseInt(parentContainer.rect.y);
	// if (OS_ANDROID) {
	// 	totalY = totalY * (Ti.Platform.displayCaps.dpi / 160);
	// }
	// (args.scrollTo) && (args.scrollTo(totalY));
};

$.header.addEventListener('click', handleExpandCollapseClick);
$.deleteButton.addEventListener('click', handleDelete);
$.makeField.addEventListener('blur', handleFieldBlur);
$.modelField.addEventListener('blur', handleFieldBlur);
$.descriptionField.addEventListener('blur', handleFieldBlur);
// $.makeField.addEventListener('change', handleChangeMakeField);

init();
