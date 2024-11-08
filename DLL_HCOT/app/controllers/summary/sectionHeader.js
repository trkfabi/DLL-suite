/**
 * @class Controllers.summary.sectionHeader
 * Section Header controller
 */
var args = arguments[0] || {};

/**
 * @method init
 * @private
 * Initializes the section header controller
 * @return {void}
 */
function init() {

	var title = args.font;
	var color = args.color;
	var expander = args.expander;

	if (title && expander) {
		var titleStyle = $.createStyle({
			font: title,
			color: color
		});

		var expanderStyle = $.createStyle({
			backgroundImage: expander.backgroundImage,
			imageExpanded: expander.imageExpanded,
			imageCollapsed: expander.imageCollapsed
		});

		$.titleLabel.applyProperties(titleStyle);
		$.expandColapseButton.applyProperties(expanderStyle);
	}
};

/**
 * @method setTitle
 * Sets the title of the section given a string
 * @param {String} _title Title to be displayed in the section header
 * @return {void}
 */
$.setTitle = function (_title) {
	$.titleLabel.text = _title;
};

/**
 * @method addEventListener
 * Function to associate all the event listeners of the controller to summarySectionHeader
 * @param {String} _listenerName Name of the event
 * @param {Function} _listenerFunction function to be run when the event is fired
 * @return {void}
 */
$.addEventListener = function (_listenerName, _listenerFunction) {
	$.summarySectionHeader.addEventListener(_listenerName, _listenerFunction);
};

init();
