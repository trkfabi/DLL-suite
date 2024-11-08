/**
 * @class Controllers.customer.equipmentDetails
 * Equipment details
 * @uses Helpers.uiHelpers
 */
var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var uiHelpers = require('/helpers/uiHelpers');

/**
 * @property {Models.equipment} equipment holds equipment model attributes
 */
var equipment = args.equipment;

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	$.makeField.value = equipment.get('make') || '';
	$.modelField.value = equipment.get('model') || '';
	$.qtyField.value = equipment.get('quantity') || '';

	uiHelpers.addDoneButton($.qtyField, $.blurFields);
	changeQtyFieldFontSize();
};

/**
 * @method blurFields
 * Do the blur for the quantity textfield 
 * @return {void}
 */
$.blurFields = function () {
	doLog && console.log('[equipmentDetails] - blurFields()');
	$.makeField.blur();
	$.modelField.blur();
	$.qtyField.blur();
};

/**
 * @method setIndex
 * Updates the index number of the equipment row
 * @param {Number} _index Index number to update the title
 * @return {void}
 */
$.setIndex = function (_index) {
	$.titleLabel.text = L('equipment_item') + ' ' + _index;
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
 * @method changeQtyFieldFontSize
 * @private
 * Change the font size of the qtyField
 * @return {void}
 */
function changeQtyFieldFontSize() {
	if ($.qtyField.value > 99) {
		$.qtyField.font = {
			fontSize: 12
		};
	} else {
		$.qtyField.font = {
			fontSize: 16
		};
	}
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
 * @method handleFieldChange
 * @private
 * Handle blur event of TextFields controls
 * @param {Object} _evt Blur event
 * @return {void}
 */
function handleFieldChange(_evt) {
	doLog && console.log('[equipmentDetails] - handleFieldChange');

	equipment.set({
		make: $.makeField.value,
		model: $.modelField.value,
		quantity: $.qtyField.value
	});

	args.updateCallback && args.updateCallback({
		source: $,
		equipment: equipment
	});

	changeQtyFieldFontSize();
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
	handleFieldChange(_evt);
};

/**
 * @method handleAddQuantityClick
 * @private
 * Increase, and decrease value for the quantity of the equipment item
 * @param {Object} _evt Click Event
 * @return {void}
 */
function handleAddQuantityClick(_evt) {
	var _qty;
	var _quantity = parseInt($.qtyField.value) || 0;

	if (_evt.source.id === 'qtyMoreButton') {
		_qty = 1;
	} else {
		_qty = -1;
	}

	_quantity += _qty;

	if (_quantity < 0) {
		_quantity = 0;
	}

	$.qtyField.value = 0 + _quantity;
};

$.qtyField.addEventListener('change', handleFieldChange);
$.modelField.addEventListener('change', handleFieldChange);
$.makeField.addEventListener('change', handleChangeMakeField);
$.headerContainer.addEventListener('click', handleExpandCollapseClick);
$.deleteButton.addEventListener('click', handleDelete);
$.qtyMinusButton.addEventListener('click', handleAddQuantityClick);
$.qtyMoreButton.addEventListener('click', handleAddQuantityClick);

init();
