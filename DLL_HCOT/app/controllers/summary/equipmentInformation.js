/**
 * @class Controllers.summary.equipmentInformation
 * Displays all the equipment info of the selected payment option
 */

var args = arguments[0] || {};
var quote = args.quote;
var equipments = quote.get('equipments');
var uiHelpers = require('/helpers/uiHelpers');

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
		addEquipmentRow(equipments.first());
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
		var text = _equipment.getDescriptionAndUpdate();
		var equipmentLabel = Ti.UI.createLabel();
		$.addClass(equipmentLabel, 'summaryLabel', {
			text: text,
			height: Ti.UI.SIZE,
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
