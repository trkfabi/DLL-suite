/**
 * @class Controllers.apple.common.optionsSection
 * Options Section
 */
var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;

/**
 * @property {Object} sectionData
 * @private
 * Holds the data to populate the list
 */
var sectionData = args.sectionData || {};

/**
 * @method init
 * @private
 * Initializes the controller
 * return {void}
 */
function init() {
	var listItems = [];

	$.headerLabel.text = sectionData.name || '';

	// Hide the header view if the section has no title
	var sectionName = sectionData.name || '';
	if (!sectionName || !sectionName.length) {
		$.headerView.height = 0;
	}

	_.each(sectionData.options, function (_option) {
		var rowItem = {
			listItem: {
				text: _option.name,
				color: _option.customColor || null
			},
			properties: {
				selectedBackgroundColor: Alloy.Globals.colors.tropicalBlue,
				height: 44
			}
		};

		listItems.push(rowItem);
	});

	$.optionsSection.items = listItems;
};

init();
