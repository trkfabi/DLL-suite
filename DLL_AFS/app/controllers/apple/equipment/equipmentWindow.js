/**
 * @class Controllers.apple.equipment.equipmentWindow
 * Equipment Window
 * @uses appNavigation
 * @uses helpers.stringFormatter
 * @uses helpers.uiHelpers
 */
const LOG_TAG = '\x1b[31m' + '[apple/equipment/equipmentWindow]' + '\x1b[39;49m ';

var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var appNavigation = require('/appNavigation');
var stringFormatter = require('/helpers/stringFormatter');
var uiHelpers = require('/helpers/uiHelpers');
var calculatorManager = require('/apple/calculations/calculatorManager');
var analytics = require('/utils/analytics');

/**
 * @property {Models.Quote} quote
 * @private
 * Quote containing the equipment list to show
 */
var quote = null;

/**
 * @property {Collection.Equipments} equipments
 * @private
 * Equipments collection used to show the rows
 */
var equipments = null;

/**
 * @property {Array} equipmentsControllers
 * @private
 * The list of rows controllers
 */
var equipmentRows = {};

/**
 * @property {Boolean} isEditing
 * @private
 * Flag to know if the window is on Edit mode or not
 */
var isEditing = false;

/**
 * @method init
 * @private
 * Initializes the controller
 * return {void}
 */
function init() {
	$.updateQuote(args.quote);
};

/**
 * @method createEquipmentList
 * @private
 * Initilizes the equipment table with rows loaded from the collection
 * @return {void}
 */
function createEquipmentList() {
	var tableData = [];
	equipments.each(function (_equipment) {
		var equipmentRow = equipmentRows[_equipment.id];

		if (!equipmentRow) {
			equipmentRow = createEquipmentRow(_equipment);
			equipmentRows[_equipment.id] = equipmentRow;
		}

		tableData.push(equipmentRow.getView());
	});

	$.equipmentTable.data = tableData;
};

/**
 * @method createEquipmentRow
 * @private
 * Creates a new #Controllers.apple.equipmentRow based on the Equipment Model
 * @param {Models.equipment} Equipment model to load
 * @return {Controllers.apple.equipmentRow} Controller to load on the TableVlew
 */
function createEquipmentRow(_equipment) {
	return Alloy.createController('apple/equipment/equipmentRow', {
		quote: quote,
		equipment: _equipment
	});
};

/**
 * @method updateQuote
 * Updates the UI from 
 * @param {Models.quote} _quote Quote to update the UI from this model
 * @return {void}
 */
$.updateQuote = function (_quote) {
	doLog && console.log(LOG_TAG, '- updateQuote');

	$.cleanUp();

	quote = _quote;
	equipments = quote.get('equipments');

	quote.on('change:amountFinanced', $.refreshUI);
	equipments.on('add', handleEquipmentAdd);
	equipments.on('remove', handleEquipmentRemove);

	createEquipmentList();

	$.refreshUI();
};

/**
 * @method refreshUI
 * Updates the window UI
 * @return {void}
 */
$.refreshUI = function () {

	_.each(equipmentRows, function (_equipmentController) {
		if (isEditing || !quote.isActive()) {
			_equipmentController.blurFields();
			_equipmentController.disableAllControls();
		} else {
			_equipmentController.enableAllControls();
		}
		_equipmentController.checkAmountLength(isEditing);
	});

	if (!quote.isActive()) {
		$.headerTitleLabel.text = stringFormatter.formatCurrency(quote.get('amountFinanced'));
		$.editButton.visible = false;
		$.addNewView.height = $.addNewView.heightCollapsed;
		$.equipmentTable.bottom = $.equipmentTable.bottomEdit;
	} else {

		if (isEditing) {
			var suffix = equipments.length === 0 || equipments.length > 1 ? L('items') : L('item');
			$.headerTitleLabel.text = String.format('%1$s %2$s', '' + equipments.length, suffix);
			$.editButton.title = L('done');
			$.addNewView.height = $.addNewView.heightCollapsed;
			$.equipmentTable.editing = true;
			$.equipmentTable.bottom = $.equipmentTable.bottomEdit;
			$.backButtonWhite.visible = false;
		} else {
			var canAddNew = equipments.length < 20;

			$.headerTitleLabel.text = stringFormatter.formatCurrency(quote.get('amountFinanced'));
			$.editButton.title = L('edit');
			$.addNewView.height = canAddNew ? $.addNewView.heightExpanded : $.addNewView.heightCollapsed;
			$.equipmentTable.editing = false;
			$.equipmentTable.bottom = canAddNew ? $.equipmentTable.bottomNoEdit : $.equipmentTable.bottomEdit;
			$.backButtonWhite.visible = true;
			$.editButton.visible = equipments.length > 0;
		}

	}

	if (equipments.length > 0 || isEditing) {
		$.equipmentTable.visible = true;
		$.noProductsView.visible = false;
	} else {
		$.equipmentTable.visible = false;
		$.noProductsView.visible = true;
		$.tapNewLabel.visible = quote.isActive();
		$.tapNewLabel.height = quote.isActive() ? $.tapNewLabel.heightActive : $.tapNewLabel.heightInactive;
	}
};

/**
 * @method cleanUp
 * Removes global events and variables
 * @return {void}
 */
$.cleanUp = function () {
	doLog && console.log(LOG_TAG, '- cleanUp');

	quote && quote.off('change:amountFinanced', $.refreshUI);
	equipments && equipments.off('add', handleEquipmentAdd);
	equipments && equipments.off('remove', handleEquipmentRemove);

	equipmentRows = {};
};

/**
 * @method handleEquipmentAdd
 * @private
 * Handler for the `add` event of the equipments collection
 * @param {Models.equipment} _equipment Model added
 * @return {void}
 */
function handleEquipmentAdd(_equipment) {
	var equipmentRow = equipmentRows[_equipment.id];

	if (!equipmentRow) {
		equipmentRow = createEquipmentRow(_equipment);
		equipmentRows[_equipment.id] = equipmentRow;
	}

	$.equipmentTable.appendRow(equipmentRow.getView());

	calculatorManager.handleQuoteChange({
		quote: quote,
		equipment: _equipment
	});

	$.refreshUI();
};

/**
 * @method handleEquipmentRemove
 * @private
 * Handler for the `remove` event of the equipments collection
 * @param {Models.equipment} _equipment Model removed
 * @return {void}
 */
function handleEquipmentRemove(_equipment) {
	var equipmentRow = equipmentRows[_equipment.id];

	if (equipmentRow) {
		delete equipmentRows[_equipment.id];
		$.equipmentTable.deleteRow(equipmentRow.getView());
	}

	calculatorManager.handleQuoteChange({
		quote: quote,
		equipment: _equipment
	});

	$.refreshUI();
};

/**
 * @method handleBackButtonClick
 * @private
 * Handles the back button click
 * @param {Object} _evt
 * @return {void}
 */
function handleBackButtonClick(_evt) {
	if ($.equipmentTable.editing) {
		$.equipmentTable.editing = false;
	}
	appNavigation.closeEquipmentWindow();
}

/**
 * @method handleEditButtonClick
 * @private
 * Handles the edit button click
 * @param {Object} _evt
 * @return {void}
 */
function handleEditButtonClick(_evt) {
	isEditing = !isEditing;

	$.refreshUI();

};

/**
 * @method handleAddNewClick
 * @private
 * Handles the add new click
 * @param {Object} _evt
 * @return {void}
 */
function handleAddNewClick(_evt) {
	analytics.captureTiAnalytics('AFS-ProductsServices-TapAddNew');
	if (equipments.length < 20) {
		var equipment = Alloy.createModel('equipment');
		var equipmentRow = createEquipmentRow(equipment);

		equipmentRows[equipment.id] = equipmentRow;

		equipmentRow.selectProduct(function () {
			equipments.add(equipment);
			if (equipments.length > 0) {
				$.equipmentTable.scrollToIndex(equipments.length - 1);
			}
		});
	}
};

/**
 * @method handleEquipmentTableDelete
 * @private
 * Handles the equipment table delete event
 * @param {Object} _evt
 * @return {void}
 */
function handleEquipmentTableDelete(_evt) {
	var equipmentId = _evt.row.equipmentId;
	var equipment = equipments.get(equipmentId);

	if (equipment) {
		delete equipmentRows[equipmentId];
		equipments.remove(equipment);
	}

};

$.backButtonWhite.addEventListener('click', handleBackButtonClick);
$.editButton.addEventListener('click', handleEditButtonClick);
$.addNewView.addEventListener('click', handleAddNewClick);
$.equipmentTable.addEventListener('delete', handleEquipmentTableDelete);
init();
