/**
 * # Tabbed Bar
 * @class Controllers.common.tabbedBar
 */
var args = arguments[0] || {};

/**
 * @property {Array} labels array of labels to be added on tabbed bar
 */
var labels = args.labels || [];

/**
 * @property {String} tintColor holds hex color value
 */
var tintColor = args.tintColor || 'white';

/**
 * @property {String} bgColor holds background color value
 */
var bgColor = args.backgroundColor || 'transparent';

/**
 * @property {String} markerColor defines maker color when is provided
 */
var markerColor = args.markerColor || 'blue';

/**
 * @property {String} selectColor contains select color when active tab
 */
var selectColor = args.selectColor;

/**
 * @property {number} style defines the Style of the tabbed bar
 */
var style = args.style || Alloy.Globals.tabbedBar.STYLE_HEADER;

/**
 * @property {Array} buttons holds array of buttons
 */
var buttons = [];

/**
 * @property {Array} buttonLabels has array of labels used on buttons
 */
var buttonLabels = [];

/**
 * @property {Object} callbacks contains functions callbacks
 */
var callbacks = {};

/**
 * @property {Number} index defines and hold tab index value
 */
var index;

/**
 * @property {Number} lastButton contains last button index value
 */
var lastButton;

/**
 * @property {Number} lastLabel contains last label index value
 */
var lastLabel;

/**
 * @property {Ti.UI.View} marker defines and holds a view for marker
 */
var marker;

// TODO: custom tabbedBar because they didn't want separators on iOS

$.addEventListener = function (_evtName, _callback) {
	// if (OS_ANDROID) {
	callbacks[_evtName] = _callback;
	// } else {
	// 	$.container.addEventListener(_evtName, _callback);
	// }
};
$.fireEvent = function (_evtName, _obj) {
	_obj = _obj || {};
	_obj.source = $;
	callbacks[_evtName] && callbacks[_evtName](_obj);
};
$.setIndex = function (newIndex) {
	// if (OS_ANDROID) {
	if (!lastButton || (index !== newIndex)) {
		index = newIndex;
		lastButton && setButtonSelected(lastButton, lastLabel, false);

		lastButton = buttons[index];
		lastLabel = buttonLabels[index];
		lastButton && setButtonSelected(lastButton, lastLabel, true);
	}
	// } else {
	// 	$.container.index = newIndex;
	// }
};
$.getIndex = function () {
	// if (OS_ANDROID) {
	return index;
	// } else {
	// 	return $.container.index;
	// }
};
$.setLabels = function (_labels) {
	labels = _labels;

	// if (OS_ANDROID) {
	$.container.removeAllChildren();
	initButtons();
	// } else {
	// 	$.container.labels = labels;
	// }
};
$.getLabels = function () {
	return labels;
};

function init() {
	$.container.applyProperties(args);

	// if (OS_ANDROID) {
	$.values = args.values || [];
	$.container.addEventListener('click', handleClick);
	if (style === Alloy.Globals.tabbedBar.STYLE_HEADER) {
		marker = Ti.UI.createView();
		$.addClass(marker, 'marker', {
			backgroundColor: (markerColor || tintColor)
		});
	} else {
		$.addClass($.container, 'containerTabbed', {
			borderColor: tintColor
		});
	}

	$.tag = args.tag;

	initButtons();

	$.setIndex(args.index || 0);
	// }
};

function initButtons() {
	buttons = [];
	buttonLabels = [];

	for (var i = 0, len = labels.length; i < len; i++) {
		var _tabButton = Ti.UI.createView();
		var _tabLabel = Ti.UI.createLabel();
		var _percent = 100 / len;

		if (style === Alloy.Globals.tabbedBar.STYLE_HEADER && i > 0) {
			var _separator = Ti.UI.createView();
			$.addClass(_separator, 'separator', {
				left: (_percent * i) + '%',
				backgroundColor: tintColor
			});
			$.container.add(_separator);
		}

		$.addClass(_tabButton, 'tabButton', {
			left: (_percent * i) + '%',
			width: _percent + '%',
			backgroundColor: bgColor
		});
		$.addClass(_tabLabel, 'tabLabel', {
			text: labels[i],
			color: tintColor
		});
		_tabButton.index = i;
		_tabButton.add(_tabLabel);
		$.container.add(_tabButton);

		buttons.push(_tabButton);
		buttonLabels.push(_tabLabel);
	}
};

function handleClick(_evt) {
	var _index = _evt.source.index;
	if (_index != null) {
		_evt.index = _index;
		$.setIndex(_index);
		$.fireEvent('click', _evt);
	}
};

function setButtonSelected(_tiButton, _tiLabel, _state) {
	if (_state) {
		if (style === Alloy.Globals.tabbedBar.STYLE_HEADER) {
			_tiButton.add(marker);
		} else {
			_tiLabel.color = selectColor || bgColor;
			_tiButton.backgroundColor = tintColor;
		}
	} else {
		if (style === Alloy.Globals.tabbedBar.STYLE_HEADER) {
			_tiButton.remove(marker);
		} else {
			_tiLabel.color = tintColor;
			_tiButton.backgroundColor = bgColor;
		}
	}
}

init();
