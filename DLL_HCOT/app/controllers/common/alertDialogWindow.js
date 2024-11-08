/**
 * Custom alert dialog with textfield
 * @class
 * @version 1.0.0
 */

var args = arguments[0] || {};

/**
 * @property {Function} okCallback callback executed when user press confirmation button
 * @private
 */
var okCallback = args.okCallback;

/**
 * @property {Function} cancelCallback callback function executed when user press cancel button
 * @private
 */
var cancelCallback = args.cancelCallback;
/**
 * @method init
 * @private
 * initializes controller 
 * @return {void}
 */
function init() {
	$.title.text = args.title || 'Update Quote';
	$.cancelButton.title = args.cancelButton || 'Cancel';
	$.okButton.title = args.ok || 'Save';
	$.textField.value = args.text;
}

/**
 * @method show
 * Displays alert dialog
 * @return {void}
 */
$.show = function () {
	$.window.open();
};

/**
 * @method hide
 * Hides alert dialog
 * @return {void}
 */
$.hide = function () {
	$.window.close();
};

/**
 * @method focus
 * Makes the textfield to gain focus
 * @return {void}
 */
$.focus = function () {
	$.textField.focus();
};

/**
 * @method blur
 * Makes the textfield to blur
 * @return {void}
 */
$.blur = function () {
	$.textField.focus();
};

/**
 * @method handleCancelClick
 * @private
 * Handles cancel button click if cancel callback exists excuted after window is closed
 * @param {Object} _evt event object
 * @return {void}
 */
function handleCancelClick(_evt) {
	$.hide();
	cancelCallback && cancelCallback();
}

/**
 * @method handleOkClick
 * @private
 * Handles ok button click if confirmation callback exists excuted after window is closed and pass text as parameter
 * @param {Object} _evt event object
 * @return {void}
 */
function handleOkClick(_evt) {
	$.hide();
	okCallback && okCallback($.textField.value);
}

//Event listeners
$.leftView.addEventListener('click', handleCancelClick);
$.rightView.addEventListener('click', handleOkClick);

init();
