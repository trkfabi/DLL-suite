/**
 * # Scrollable Tabbed Bar
 * @class Controllers.common.scrollableTabbedBar
 * @uses helpers.animations
 */
var args = arguments[0] || {};
var animations = require('/helpers/animations');

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
 * @property {Number} scrollPosition The current scroll position.
 */
var scrollPosition;

/**
 * @property {Boolean} [animateButtons=true]. Flag to see if buttons should animate. 
 */
var animateButtons = args.animateButtons != null ? args.animateButtons : true;

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

	$.setIndex(args.index || 0);
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
 * @return {void}
 */
$.setIndex = function (_newIndex) {
	if (!lastButton || (index !== _newIndex)) {
		index = _newIndex;
		lastButton && setButtonSelected(lastButton, lastLabel, false, true);

		lastButton = buttons[index];
		lastLabel = buttonLabels[index];
		lastButton && setButtonSelected(lastButton, lastLabel, true, false);
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
 * @method setLabels
 * Sets the current values showed in the bar
 * @param {Array} _labels
 * @param {Number} _index Option's index to mark as selected
 * @param {Boolean} _animate Flag to change animateButtons
 * @return {void}
 */
$.setLabels = function (_labels, _index, _animate) {
	labels = _labels || [];
	index = _index || 0;
	if (_animate !== null) {
		animateButtons = _animate;
	}

	if (labels.length) {

		if (oldContainer) {
			$.scrollContainer.remove(oldContainer);
		}

		$.scrollContainer.setContentOffset({
			x: 0,
			y: 0
		}, {
			animated: false
		});
		_.delay(initButtons, 200);
	}
};

/**
 * @method getLabels
 * Gets the current values showed in the bar
 * @return {void}
 */
$.getLabels = function () {
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
 * @method disableUI
 * Displays only selected term
 * @return {void}
 */
$.disableUI = function () {
	var transparentColor = Alloy.Globals.colors.transparent;
	$.scrollContainer.backgroundColor = transparentColor;
	$.scrollContainer.borderColor = transparentColor;
	$.scrollContainer.left = 0;
};

/**
 * @method initButtons
 * @private
 * Init used to set the buttons
 * @return {void}
 */
function initButtons() {
	buttons = [];
	buttonLabels = [];
	var container = $.UI.create('View', {
		classes: ['container']
	});
	var counter = 0;

	var callbackAnimation = function () {
		if (buttons[counter]) {
			buttons[counter].opacity = 1;
		}

		counter = counter + 1;

		// if (counter === index) {
		// 	$.updateScrollPosition(container);
		// }

		if (counter === len) {
			$.updateScrollPosition(container);
			return;
		}

		animatePuffIn(buttons[counter], 50, callbackAnimation);
	};

	for (var i = 0, len = labels.length; i < len; i++) {
		var _tabButton = Ti.UI.createView();
		var _tabLabel = Ti.UI.createLabel();
		var _percent = 100 / len;
		var buttonOptions = {
			left: 10 + ((buttonWidth + 6) * i),
			width: buttonWidth,
			backgroundColor: selectColor,
			borderColor: tintColor,
			opacity: 0
		};

		if (i === len - 1) {
			buttonOptions.right = 10;
		}

		$.addClass(_tabButton, 'tabButton', buttonOptions);

		$.addClass(_tabLabel, 'tabLabel', {
			text: labels[i],
			color: tintColor
		});
		_tabButton.index = i;
		_tabButton.isButton = true;

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

			animatePuffIn(buttons[counter], 50, callbackAnimation);
		}
	}
};

/**
 * @method animatePuffIn
 * @private
 * Animates elements with a puff in animation
 * @param {Ti.UI.View} _tiObject View to animate
 * @param {Number} _duration Determines the duration of the animation
 * @param {Function} _callback Function to execute at the end of the animation
 */
function animatePuffIn(_tiObject, _duration, _callback) {
	if (!_tiObject) {
		return;
	}

	var duration = _duration || 250;
	if (animateButtons) {
		animations.puffIn(_tiObject, {
			scale: 1.1,
			duration: duration,
			fade: 1.0,
			defaultScale: 1.0,
			callback: _callback
		});
	} else {
		_callback();
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

			// if (oldContainer) {
			// 	$.updateScrollPosition(oldContainer, _preventScroll);
			// }
		}
	} else {
		if (style === Alloy.Globals.tabbedBar.STYLE_HEADER) {
			_tiButton.remove(marker);
		} else {
			_tiLabel.color = tintColor;
			_tiButton.backgroundColor = selectColor;
		}
	}
}

/**
 * @method updateScrollPosition
 * Determines if the scroll position should be updated or not
 * @param {Ti.UI.View} _container
 * @param {Boolean} _preventScroll Determines if setIndex was invoked by a user click to avoid scroll of terms buttons
 * @return {void}
 */
$.updateScrollPosition = function (_container, _preventScroll) {
	var container = _container || oldContainer;
	var delayTime = OS_IOS ? 400 : 500;

	//if user click terms _preventScroll is true
	if (_preventScroll || !container) {
		return false;
	}

	_.delay(function () {

		var index = $.getIndex() || 0;
		var button = buttons[index] || [];
		var buttonLeft = button ? button.left : 0;
		var deviceWidth = Alloy.Globals.width;
		var buttonWidth = button ? button.width : 0;
		var scrollWidth = container.rect.width + 20;
		var scrollViewWidth = $.scrollContainer.rect.width;
		var totalScrollArea = 0;
		var MARGIN = 6;

		scrollPosition = $.scrollContainer.contentOffset.x;

		if (OS_ANDROID) {
			deviceWidth = deviceWidth / Alloy.Globals.logicalDensityFactor;
		}

		if (!button) {
			return false;
		}

		totalScrollArea = scrollWidth - deviceWidth;

		var scrollValue = buttonLeft - scrollViewWidth + buttonWidth + MARGIN;

		if (buttonLeft > scrollValue && scrollValue > 0) {
			if (scrollPosition < totalScrollArea) {
				if (OS_ANDROID) {
					scrollValue = scrollValue * Alloy.Globals.logicalDensityFactor;
				}

				$.scrollContainer.scrollTo(scrollValue, 0);
			}
		} else {
			if (scrollPosition > buttonLeft) {
				buttonLeft = buttonLeft - MARGIN;

				if (OS_ANDROID) {
					buttonLeft = buttonLeft * Alloy.Globals.logicalDensityFactor;
				}

				$.scrollContainer.scrollTo(buttonLeft, 0);
			}
		}
	}, delayTime);

};

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
