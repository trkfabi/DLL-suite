/**
 * # Android Switch Button
 * @class Controllers.common.androidSwitch
 */
var args = arguments[0] || {};
var callbacks = {};

/**
 * @method init
 * @private
 * Initialize values for the current Control
 * @return {void}
 */
function init() {
	$.switchButton.applyProperties(args);
	$.value = args.value || false;
	$.setValue($.value);
};

/**
 * @method setValue
 * Sets the button value, displays the UI depending on value and calls back the change in the value
 * @param {Boolean} _value Value to be set on the button 
 * @return {void}
 */
$.setValue = function (_value) {
	$.value = _value;
	if ($.value) {
		$.switchButton.backgroundImage = '/images/ic_switch_on.png';
	} else {
		$.switchButton.backgroundImage = '/images/ic_switch_off.png';
	}
	if (callbacks['change']) {
		for (var key in callbacks['change']) {
			callbacks['change'][key]({
				source: $,
				value: $.value
			});
		}
	}
};

/**
 * @method addEventListener
 * Creates a callback function based on the event and callback sent on params
 * @param {String} _event Name of the event to create a callback
 * @param {Function} _callback function to executed
 * @return {void}
 */
$.addEventListener = function (_event, _callback) {
	!callbacks[_event] && (callbacks[_event] = {});
	callbacks[_event][_callback] = _callback;
};

/**
 * @method handleSwitchButtonClick
 * @private
 * Handles the event click for switchButton
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleSwitchButtonClick(_evt) {
	$.setValue(!$.value);
}

$.switchButton.addEventListener('click', handleSwitchButtonClick);

init();
