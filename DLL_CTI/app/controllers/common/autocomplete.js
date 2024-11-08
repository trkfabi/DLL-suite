/**
 * # Auto Complete
 * @class Controllers.common.autocomplete
 */

var doLog = Alloy.Globals.doLog;
var args = arguments[0] || {};
var changeEvent;

/**
 * @method init
 * @private
 * Initialize values for the current View
 * @param {Object} _params textField and strings to auto complete
 * @return {void}
 */
$.init = function (_params) {
	var params = _params || {};
	$.textField = params.textField;
	$.data = params.data ||  [];
	changeEvent = params.changeEvent;

	$.addListeners();
};

/**
 * @method refreshEvt
 * @private
 * Event to be called every time the textfield changes; refreshes the container
 * @param {Object} _evt Refresh event
 * @return {void}
 */
function refreshEvt(_evt) {
	doLog && console.log('[autocomplete] - refreshEvt - id : ' + _evt.source.id);
	var lookup = _evt.value.trim();
	if (lookup === '' || !$.textField.hasFocus) {
		clearRows();
	} else {
		refresh(lookup);
	}
};

/**
 * @method updateFieldEvt
 * @private
 * Event to be called once the user clicks an option
 * @param {Object} _evt Refresh event
 * @return {void}
 */
function updateFieldEvt(_evt) {
	doLog && console.log('[autocomplete] - updateFieldEvt - id : ' + JSON.stringify(_evt.source));
	var source = _evt.source;
	if (source.isRow) {
		var selection = source.value;
		$.textField.value = selection;
		clearRows();
		if (OS_ANDROID) {
			$.removeListeners();
		}

		changeEvent && changeEvent({
			textField: $.textField,
			value: source.value,
			selected: true
		});

		if (OS_ANDROID) {
			setTimeout(function () {
				$.addListeners();
			}, 1000);
		}
	}
};

/**
 * @method refresh
 * @private
 * Event to be called once the user clicks an option
 * @param {String} _lookup string to be searched on autocomplete strings
 * @return {void}
 */
function refresh(_lookup) {
	doLog && console.log('[autocomplete] - refresh - _lookup : ' + _lookup);
	_lookup = _lookup.toUpperCase();
	var matches = _.filter($.data, function (value) {
		value = value.toUpperCase();
		return value.indexOf(_lookup) != -1;
	});

	clearRows();
	var labelStyle = _.clone($.container.labelStyle);
	for (var i = 0, j = matches.length; i < j; i++) {
		labelStyle.text = matches[i];
		labelStyle.value = matches[i];
		$.container.add(Ti.UI.createLabel(labelStyle));
	}
};

/**
 * @method clearRows
 * @private
 * Removes all the rows from the container
 * @return {void}
 */
function clearRows() {
	doLog && console.log('[autocomplete] - clearRows');

	$.container.removeAllChildren();
};

/**
 * @method handleFocus
 * @private
 * Focus handler
 * @param {Object} _evt Focus event
 * @return {void}
 */
function handleFocus(_evt) {
	$.textField.hasFocus = true;
}

/**
 * @method handleBlur
 * @private
 * Blur handler
 * @param {Object} _evt Blur event
 * @return {void}
 */
function handleBlur(_evt) {
	$.textField.hasFocus = false;
}

/**
 * @method removeListeners
 * Function that removes the event listeners for textfield and container
 * @return {void}
 */
$.removeListeners = function () {
	if ($.textField) {
		$.textField.removeEventListener('focus', handleFocus);
		$.textField.removeEventListener('blur', handleBlur);
		$.textField.removeEventListener('change', refreshEvt);
		$.textField.removeEventListener('blur', clearRows);
		$.container.removeEventListener('click', updateFieldEvt);
	}
};

/**
 * @method addListeners
 * Function to add event listeners for textfield and container
 * @return {void}
 */
$.addListeners = function () {
	if ($.textField) {
		$.textField.addEventListener('focus', handleFocus);
		$.textField.addEventListener('blur', handleBlur);
		$.textField.addEventListener('change', refreshEvt);
		$.textField.addEventListener('blur', clearRows);
		$.container.addEventListener('click', updateFieldEvt);
	}
};

/**
 * @method remove
 * Removes all the rows in the autocomplete container
 * @return {void}
 */
$.remove = function () {
	clearRows();
};
