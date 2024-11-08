/**
 * Text Area with Hint Text helper
 * @class Controllers.UI.textAreaHint
 * ##version 1.0.0
 */

var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog || false;

/**
 * @property {String} color
 * Color of the text
 */
var color;

/**
 * @property {String} hintTextColor
 * Color of the hint text
 */
var hintTextColor;

/**
 * @property {String} hintText
 * Hint text string
 */
var hintText;

/**
 * @method init
 * @private
 * Initialices the widget
 * @return {void}
 */
function init () {
	$.id = args.id;
	hintText = args.hintText;
	hintTextColor = args.hintTextColor || Alloy.Globals.colors.gray;

	color = args.color;

	if (args.children && args.children[0]) {
		$.setKeyboardToolbar(args.children[0]);
		delete args.children;
	}
	
	$.textArea.applyProperties(args);

	textAreaBlurHandler();
}

/**
 * @method addEventListener
 * Adds a callback function to be called for an specific event. Similar to `Ti.Proxy.addEventListener()`
 * @param {String} _event Event name
 * @param {Function} _callback Callback function to be called
 * @return {Function} callback function added
 */
$.addEventListener = function (_event, _callback) {
	doLog && console.log('[textArea] - addEventListener()');
	return $.textArea.addEventListener(_event, _callback);
};

/**
 * @method removeEventListener
 * Removes a callback function from the specified event name. Similar to `Ti.Proxy.removeEventListener()`
 * @param {String} _event Event name
 * @param {Function} _callback Callback function to be removed
 * @return {void}
 */
$.removeEventListener = function (_event, _callback) {
	doLog && console.log('[textArea] - removeEventListener()');
	return $.textArea.removeEventListener(_event, _callback);
};

/**
 * @method setValue
 * Sets a text value into the text area. Similar to `Ti.TextArea.setValue()`
 * @param {String} _value Value to set in the text area
 * @return {void}
 */
$.setValue = function (_value) {
	doLog && console.log('[textArea] - setValue()');
	$.textArea.value = _value;
	textAreaChangeHandler();
	!$.textArea.hasFocus && textAreaBlurHandler();	
};

/**
 * @method getValue
 * Returns the current value of the text area, if the HintText is present, it will return an empty string. Similar to `Ti.TextArea.getValue()`
 * @return {String} value assigned in the text area
 */
$.getValue = function () {
	doLog && console.log('[textArea] - getValue()');
	return $.textArea.hasContent ? $.textArea.value : '';
};

/**
 * @method focus
 * Forces a focus in the text area. Similar to `Ti.TextArea.focus()`
 * @return {void}
 */
$.focus = function () {
	doLog && console.log('[textArea] - focus()');
	$.textArea.focus();	
};

/**
 * @method blur
 * Forces a blur in the text area. Similar to `Ti.TextArea.blur()`
 * @return {void}
 */
$.blur = function () {
	doLog && console.log('[textArea] - blur()');
	$.textArea.blur();
};

/**
 * @method setKeyboardToolbar
 * Assigns a Toolbar above the TextArea. Similar to `Ti.TextArea.setKeyboardToolbar()`
 * @param {Ti.UI.iOS.Toolbar} _keyboardToolbar Toolbar to add above the iOS Keyboard
 * @return {void}
 */
$.setKeyboardToolbar = function (_keyboardToolbar) {
	doLog && console.log('[textArea] - setKeyboardToolbar()');
	$.textArea.keyboardToolbar = _keyboardToolbar;
};

/**
 * @method hasText
 * Validates if the text area has some text in it. Hint text will be ignored.
 * @return {Boolean} true if the text area has any value setted
 */
$.hasText = function () {
	doLog && console.log('[textArea] - hasText()');
	return !!$.textArea.hasContent;
};

/**
 * @method textAreaFocusHandler
 * @private
 * Handler for the focus event of the text area.
 * @param {Object} _evt Focus event
 * @return {void}
 */
function textAreaFocusHandler (_evt) {
	doLog && console.log('[textArea] - textAreaFocusHandler()');
	$.textArea.hasFocus = true;
	
	if( !$.textArea.hasContent ) {
		$.textArea.value = '';
		$.textArea.color = color;
	}
	
	$.onFocus && $.onFocus({
		source : $
	});
};

/**
 * @method textAreaBlurHandler
 * @private
 * Handler for the blur event of the text area.
 * @param {Object} _evt Focus event
 * @return {void}
 */
function textAreaBlurHandler (_evt) {
	doLog && console.log('[textArea] - textAreaBlurHandler()');
	$.textArea.hasContent = ($.textArea.value.trim() != '' && $.textArea.value !== $.textArea.hintText);
	if ($.textArea.hasContent) {
		$.textArea.color = color;
	} else {
		$.textArea.color = hintTextColor;
		$.textArea.value = hintText;
	}
	$.textArea.hasFocus = false;

	$.onChange && $.onChange({
		source : $,
		value : $.textArea.value
	});
};

/**
 * @method textAreaChangeHandler
 * @private
 * Handler for the change event of the text area.
 * @param {Object} _evt Focus event
 * @return {void}
 */
function textAreaChangeHandler (_evt) {
	$.textArea.hasContent = ($.textArea.value.trim() != '');
};

init();

$.textArea.addEventListener('focus', textAreaFocusHandler);
$.textArea.addEventListener('blur', textAreaBlurHandler);
$.textArea.addEventListener('change', textAreaChangeHandler);