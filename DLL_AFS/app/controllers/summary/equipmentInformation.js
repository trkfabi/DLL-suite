/**
 * @class Controllers.summary.equipmentInformation
 * Displays all the equipment info of the selected payment option
 */

var args = arguments[0] || {};
var quote = args.quote;
var doLog = Alloy.Globals.doLog || false;
var equipments = quote.get('equipments');
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');

/**
 * @method init
 * @private
 * Initializes the Equipment Information Controller
 * @return {void}
 */
function init() {
	doLog && console.log('[equipmentInformation] - init');
	$.sectionHeader.setTitle(L(args.titleid));
	if (equipments) {
		equipments.each(addEquipmentRow);
	}
};

/**
 * @method addEquipmentRow
 * @private
 * Adds a new label with the given equipment information
 * @param {Object} _equipment Equipment information to be shown
 */
function addEquipmentRow(_equipment) {
	if (_equipment.get('isTradein') === 0) {
		var text = stringFormatter.formatList([_equipment.get('quantity'), _equipment.get('make'), _equipment.get('model')],
			' ');
		var equipmentLabel = Ti.UI.createLabel();
		$.addClass(equipmentLabel, 'summaryLabel', {
			text: text,
			bottom: 10
		});
		$.container.add(equipmentLabel);
	}
};

/**
 * @method handleSectionHeaderClick
 * @private
 * Handles the section header click event
 * @return {void}
 */
function handleSectionHeaderClick() {
	uiHelpers.expandCollapse({
		container: $.equipmentInformation,
		button: $.sectionHeader.expandColapseButton
	});
};

$.sectionHeader.addEventListener('click', handleSectionHeaderClick);

init();
