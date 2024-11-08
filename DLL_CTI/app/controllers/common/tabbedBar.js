/**
 * @class Controllers.customer.tabbedBar
 * Tabbed bar
 */
var args = arguments[0] || {};

var labels = args.labels || [];
var tintColor = args.tintColor || 'white';
var bgColor = args.backgroundColor || 'transparent';
var markerColor = args.markerColor || 'blue';
var selectColor = args.selectColor;
var style = args.style || Alloy.Globals.tabbedBar.STYLE_HEADER;

var buttons = [];
var buttonLabels = [];
var callbacks = {};
var index;
var lastButton;
var lastLabel;
var marker;

/**
 * @method addEventListener
 * Add event listener 
 * @param {String} _evtName Event name
 * @param {Function} _callback Callback function
 * @return {void}
 */
$.addEventListener = function (_evtName, _callback) {
	if (OS_ANDROID) {
		callbacks[_evtName] = _callback;
	} else {
		$.container.addEventListener(_evtName, _callback);
	}
};

/**
 * @method fireEvent
 * Fire an event 
 * @param {String} _evtName Name of the event
 * @param {Object} _obj Details of the event
 * @return {void}
 */
$.fireEvent = function (_evtName, _obj) {
	_obj = _obj || {};
	_obj.source = $;
	callbacks[_evtName] && callbacks[_evtName](_obj);
};

/**
 * @method setIndex
 * Set index to have a selected button
 * @param {Number} _newIndex Index number
 * @return {void}
 */
$.setIndex = function (_newIndex) {
	if (OS_ANDROID) {
		lastButton && setButtonSelected(lastButton, lastLabel, false);

		index = _newIndex;
		lastButton = buttons[index];
		lastLabel = buttonLabels[index];
		lastButton && setButtonSelected(lastButton, lastLabel, true);
	} else {
		$.container.index = _newIndex;
	}
};

/**
 * @method getIndex
 * @private
 * Get index
 * @return {Number} Index 
 */
$.getIndex = function () {
	if (OS_ANDROID) {
		return index;
	} else {
		return $.container.index;
	}
};

/**
 * @method setLabels
 * @private
 * Set labels
 * @param {Array} _labels Array of labels
 * @return {void}
 */
$.setLabels = function (_labels) {
	labels = _labels;

	if (OS_ANDROID) {
		$.container.removeAllChildren();
		initButtons();
	} else {
		$.container.labels = labels;
	}
};

/**
 * @method getLabels
 * @private
 * Get labels
 * @return {Array} Array of labels
 */
$.getLabels = function () {
	return labels;
};

/**
 * @method init
 * @private
 * Initialize values for the tabbed bar
 * @return {void}
 */
function init() {
	$.container.applyProperties(args);

	if (OS_ANDROID) {
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
	}
};

/**
 * @method initButtons
 * @private
 * Initialize buttons
 * @return {void}
 */
function initButtons() {
	buttons = [];
	buttonLabels = [];

	for (var i = 0, j = labels.length; i < j; i++) {
		var _tabButton = Ti.UI.createView();
		var _tabLabel = Ti.UI.createLabel();
		var _percent = 100 / j;

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

/**
 * @method handleClick
 * @private
 * Handle the the click event of the container control
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleClick(_evt) {
	var _index = _evt.source.index;
	if (_index != null) {
		_evt.index = _index;
		$.setIndex(_index);
		$.fireEvent('click', _evt);
	}
};

/**
 * @method setButtonSelected
 * @private
 * Set buttons selected
 * @param {Ti.UI.View} _tiButton Selected button
 * @param {Ti.UI.Label} _tiLabel Label for the selected button
 * @param {Boolean} _state Used to know if the button is selected
 * @return {void}
 */
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
};

init();
