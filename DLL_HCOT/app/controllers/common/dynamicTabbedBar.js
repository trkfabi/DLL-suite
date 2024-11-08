/**
 * # Dynamic Tabbed Bar
 * @class Controllers.common.dynamicTabbedBar
 */
var args = arguments[0] || {};

/**
 * @property {Array} labels array of labels to be added on tabbed bar
 */
var labels = args.labels || [];

/**
 * @property {String} tintColor holds hex color value
 */
var tintColor = args.tintColor || Alloy.Globals.colors.white;

/**
 * @property {String} bgColor holds background color value
 */
var bgColor = args.backgroundColor || Alloy.Globals.colors.transparent;

/**
 * @property {String} markerColor defines maker color when is provided
 */
var markerColor = args.markerColor || Alloy.Globals.colors.blue;

/**
 * @property {String} selectColor contains select color when active tab
 */
var selectColor = args.selectColor;

/**
 * @property {String} disableColor contains select color when disabled tab
 */
var disableColor = args.disableColor;

/**
 * @property {number} style defines the Style of the tabbed bar
 */
var style = args.style || Alloy.Globals.tabbedBar.STYLE_HEADER;

/**
 * @property {Number} buttonWidth defines the width of each button
 */
var buttonWidth = args.buttonWidth || 85;

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

/**
 * @property {Ti.UI.View} oldContainer The view where the buttons are appended.
 */
var oldContainer;

/**
 * @property {Array} activeLabels array of labels to be active on the tabbed bar
 */
var activeLabels = [];

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	$.scrollContainer.applyProperties(args);

	$.values = args.values || [];
	if (style === Alloy.Globals.tabbedBar.STYLE_HEADER) {
		marker = Ti.UI.createView();
		$.addClass(marker, 'marker', {
			backgroundColor: (markerColor || tintColor)
		});
	}

	$.tag = args.tag;

	initButtons();
};

/**
 * @method addEventListener
 * Refreshes the index of multi option bar
 * @param {Object} _evt
 * @param {Function} _callback
 * @return {void}
 */
$.addEventListener = function (_evt, _callback) {
	callbacks[_evt] = _callback;
};

/**
 * @method fireEvent
 * Refreshes the index of multi option bar
 * @param {Object} _evt
 * @param {Object} _obj
 * @return {void}
 */
$.fireEvent = function (_evt, _obj) {
	_obj = _obj || {};
	_obj.source = $;
	callbacks[_evt] && callbacks[_evt](_obj);
};

/**
 * @method setIndex
 * Refreshes the index of multi option bar
 * @param {Number} _newIndex
 * @param {Boolean} _preventScroll Determines if setIndex was invoked by a user click to avoid scroll of terms buttons
 * @return {void}
 */
$.setIndex = function (_newIndex, _preventScroll) {
	if (!lastButton || (index !== _newIndex)) {
		index = _newIndex;
		lastButton && setButtonSelected(lastButton, lastLabel, false, _preventScroll);

		lastButton = buttons[index];
		lastLabel = buttonLabels[index];
		lastButton && setButtonSelected(lastButton, lastLabel, true, _preventScroll);
	}
};

/**
 * @method getIndex
 * Refreshes the index of multi option bar
 * @return {void}
 */
$.getIndex = function () {
	return index;
};

/**
 * @method setActiveLabels
 * Sets the active buttons showed in the bar
 * @param {Array} _labels Labels marked as active
 * @return {void}
 */
$.setActiveLabels = function (_labels) {
	activeLabels = _labels;

	_.each(buttons, function (_button) {
		_button.activated = false;
	});

	_.each(activeLabels, function (_activeLabel) {
		_.each(buttons, function (_button, _index) {
			var button = _button;
			var label = buttonLabels[_index];

			if (!button.activated) {
				if (_button.id_name === _activeLabel) {
					setButtonActivated(button, label, true);
					button.activated = true;
				} else {
					setButtonActivated(button, label, false);
				}
			}

		});
	});

	$.setIndex(index);
};

/**
 * @method getActiveLabels
 * Gets the active buttons showed in the bar
 * @return {void}
 */
$.getActiveLabels = function () {
	return labels;
};

/**
 * @method addItem
 * Adds an item to the view
 * @return {void}
 */
$.addItem = function () {
	//TODO: implement functionality if needed
};

/**
 * @method removeItem
 * Removes the item from the view
 * @return {void}
 */
$.removeItem = function () {
	//TODO: implement functionality if needed
};

/**
 * @method initButtons
 * @private
 * Init used to set the buttons
 * @return {void}
 */
function initButtons() {
	var container = $.UI.create('View', {
		classes: ['container']
	});
	buttons = [];
	buttonLabels = [];

	for (var i = 0, len = labels.length; i < len; i++) {
		var _tabButton = Ti.UI.createView();
		var _tabLabel = Ti.UI.createLabel();
		var _percent = 100 / len;
		var buttonOptions = {
			left: 10 + ((buttonWidth + 6) * i),
			width: buttonWidth,
			backgroundColor: bgColor,
			borderColor: disableColor,
			touchEnabled: false
		};

		if (i === len - 1) {
			buttonOptions.right = 10;
		}

		$.addClass(_tabButton, 'tabButton', buttonOptions);

		$.addClass(_tabLabel, 'tabLabel', {
			text: labels[i],
			color: disableColor
		});

		_tabButton.id_name = labels[i];
		_tabButton.index = i;
		_tabButton.isButton = true;
		_tabButton.activated = false;
		_tabButton.selected = false;

		_tabLabel.id_name = labels[i];

		if (i === index) {
			setButtonSelected(_tabButton, _tabLabel, true);
			lastButton = _tabButton;
			lastLabel = _tabLabel;
		}

		_tabButton.add(_tabLabel);

		container.add(_tabButton);

		buttons.push(_tabButton);
		buttonLabels.push(_tabLabel);

		if (i === len - 1) {
			$.scrollContainer.add(container);
			if (oldContainer) {
				$.scrollContainer.remove(oldContainer);
			}

			oldContainer = container;
		}
	}
};

/**
 * @method setButtonActivated
 * @private
 * Changes the style of the button activated
 * @param {Ti.UI.View} _tiButton
 * @param {Ti.UI.View} _tiLabel
 * @param {Boolean} _state
 * @return {void}
 */
function setButtonActivated(_tiButton, _tiLabel, _state) {
	if (_state) {
		if (style === Alloy.Globals.tabbedBar.STYLE_HEADER) {
			_tiButton.remove(marker);
		} else {
			_tiButton.borderColor = tintColor;
			_tiButton.touchEnabled = true;

			if (!_tiButton.selected) {
				_tiLabel.color = tintColor;
			}
		}
	} else {
		if (style === Alloy.Globals.tabbedBar.STYLE_HEADER) {
			_tiButton.add(marker);
		} else {
			_tiButton.borderColor = disableColor;
			_tiButton.touchEnabled = false;

			if (!_tiButton.selected) {
				_tiLabel.color = disableColor;
			}
		}
	}
}

/**
 * @method setButtonSelected
 * @private
 * Changes the style of the button selected
 * @param {Ti.UI.View} _tiButton
 * @param {Ti.UI.View} _tiLabel
 * @param {Boolean} _state
 * @param {Boolean} _preventScroll Determines if setIndex was invoked by a user click to avoid scroll of terms buttons
 * @return {void}
 */
function setButtonSelected(_tiButton, _tiLabel, _state, _preventScroll) {
	if (_state) {
		if (style === Alloy.Globals.tabbedBar.STYLE_HEADER) {
			_tiButton.add(marker);
		} else {
			_tiLabel.color = selectColor || bgColor;
			_tiButton.backgroundColor = tintColor;
			_tiButton.borderColor = tintColor;
			_tiButton.selected = true;
		}
	} else {
		if (style === Alloy.Globals.tabbedBar.STYLE_HEADER) {
			_tiButton.remove(marker);
		} else {
			_tiLabel.color = tintColor;
			_tiButton.backgroundColor = selectColor;
			_tiButton.selected = false;
		}
	}
}

/**
 * @method handleScrollContainerClick
 * @private
 * Handles the click on the controller
 * @param {Object} _evt
 * @return {void}
 */
function handleScrollContainerClick(_evt) {
	var _index = _evt.source.index;
	var isButton = _evt.source.isButton;
	var _preventScroll = true;

	if (isButton && _index != null) {
		_evt.index = _index;
		$.setIndex(_index, _preventScroll);
		$.fireEvent('click', _evt);
	}
};

if (OS_ANDROID) {
	$.scrollContainer.addEventListener('click', handleScrollContainerClick);
}

if (OS_IOS) {
	$.scrollContainer.addEventListener('singletap', handleScrollContainerClick);
}

init();
