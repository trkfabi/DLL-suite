/**
 * @class Helpers.uiHelpers
 * Generic function to change UI values.
 * @singleton
 * @uses Helpers.stringFormatter
 * @uses Helpers.parser
 */
var stringFormatter = require('/helpers/stringFormatter');
var parser = require('/helpers/parser');

var uiHelpers = (function () {

	/**
	 * @method expandCollapse
	 * Expands or collapses a view.
	 * Params: params dictionary
	 * @param {Object} _params
	 * @param {Ti.UI.View} _params.container View to expand or collapse
	 * @param {Ti.UI.Button} _params.button Button to change its backgroundImage to reflect container expanded status
	 * @param {String} _params.forced Either <"expanded"/"collapsed"> to force the container status. Will be neglected status if not specified
	 * Additional properties are needed for container & button params:
	 * container.heightCollapsed : height the View should have once collapsed
	 * container.heightExpanded : height the View should have once expanded
	 * [container.expanded] : current status of the container, automatically updated by the function, defaults to true
	 * button.imageCollapsed : button image to have once collapsed
	 * button.imageExpanded : button image to have once expanded
	 * [button.expandProperty] : button property to change, defaults to "backgroundImage"
	 * @return {void}
	 */
	var expandCollapse = function (_params) {
		var params = _params || {};
		var container = params.container;
		var button = params.button;
		var property = 'backgroundImage';
		if (container) {
			(container.expanded == null) && (container.expanded = true);
			if (params.forced) {
				container.expanded = (params.forced == 'expanded');
			} else {
				container.expanded = !container.expanded;
			}

			if (params.shouldExpand != null) {
				container.expanded = !!params.shouldExpand;
			}
			doLog && console.debug('[uiHelpers] - expandCollapse() - ' + (container.expanded ? 'expanded' : 'collapsed'));
			button && button.expandProperty && (property = button.expandProperty);
			if (container.expanded) {
				container.height = container.heightExpanded || Ti.UI.SIZE;
				button && (button[property] = button.imageExpanded);
			} else {
				container.height = container.heightCollapsed || 40;
				button && (button[property] = button.imageCollapsed);
			}
			container.isExpandedSet = true;
		}
	};

	/**
	 * @method expandCollapseTop
	 * Expands or collapses a view.
	 * Params: params dictionary
	 * @param {Object} _params
	 * @param {Ti.UI.View} _params.container View to expand or collapse
	 * @param {Ti.UI.Button} _params.button Button to change its backgroundImage to reflect container expanded status
	 * @param {String} _params.forced Either <"expanded"/"collapsed"> to force the container status. Will be neglected status if not specified
	 * Additional properties are needed for container & button params:
	 * container.topCollapsed : top the View should have once collapsed
	 * container.topExpanded : top the View should have once expanded
	 * [container.expanded] : current status of the container, automatically updated by the function, defaults to true
	 * button.imageCollapsed : button image to have once collapsed
	 * button.imageExpanded : button image to have once expanded
	 * [button.expandProperty] : button property to change, defaults to "backgroundImage"
	 * @return {void}
	 */
	var expandCollapseTop = function (_params) {
		var params = _params || {};
		var container = params.container;
		var button = params.button;
		var property = 'backgroundImage';
		if (container) {
			(container.expanded == null) && (container.expanded = true);
			if (params.forced) {
				container.expanded = (params.forced == 'expanded');
			} else {
				container.expanded = !container.expanded;
			}

			if (params.shouldExpand != null) {
				container.expanded = !!params.shouldExpand;
			}
			doLog && console.debug('[paymentRow] - expandCollapse() - ' + (container.expanded ? 'expanded' : 'collapsed'));
			button && button.expandProperty && (property = button.expandProperty);
			if (container.expanded) {
				container.animate({
					top: container.topExpanded,
					duration: 100
				});
				button && (button[property] = button.imageExpanded);
			} else {
				container.animate({
					top: container.topCollapsed,
					duration: 100
				});
				button && (button[property] = button.imageCollapsed);
			}
			container.isExpandedSet = true;
		}
	};

	/**
	 * @method applyHintTextStyle
	 * Applies a custom hintText style to the specified textField.
	 * IOS only
	 * @param {Ti.UI.TextField} _textField Texfield to apply hint text
	 * @return {void}
	 */
	var applyHintTextStyle = function (_textField) {
		if (OS_IOS) {
			_textField = _textField || {};
			var text = _textField.hintText || "";

			var attr = Ti.UI.iOS.createAttributedString({
				text: text,
				attributes: [{
					type: Ti.UI.iOS.ATTRIBUTE_FOREGROUND_COLOR,
					value: Alloy.Globals.colors.alto,
					range: [0, text.length]
				}, {
					type: Ti.UI.iOS.ATTRIBUTE_FONT,
					value: {
						fontSize: 13,
						fontFamily: Alloy.Globals.fonts.primary.light
					},
					range: [0, text.length]
				}]
			});

			_textField.attributedHintText = attr;
		}
	};

	/**
	 * @method createDoneButton
	 * Creates a new DONE system button for iOS
	 * @return {Ti.UI.Button} Done button
	 */
	var createDoneButton = function () {
		return Ti.UI.createButton({
			systemButton: Ti.UI.iOS.SystemButton.DONE
		});
	};

	/**
	 * @method createSearchButton
	 * Creates a new SEARCH system button for iOS
	 * @return {Ti.UI.Button} Search Button
	 */
	var createSearchButton = function () {
		return Ti.UI.createButton({
			systemButton: Titanium.UI.iPhone.SystemButton.SEARCH
		});
	};

	/**
	 * @method addDoneButton
	 * Adds a new DONE button into a keyboard toolbar for iOS or adds a return event on Android
	 * @param {Ti.UI.TextField} _textField to add the done button
	 * @param {Function} _onDone function to call after the DONE button is pressed
	 * @param {Boolean} isSearch parameter, if true displays "Search" button instead of "Done".
	 * @param {Boolean} _addExtraSpace workaround for modal windows on iOS, true means that it is displayed on a modal window and adds a space to the right
	 * @return {void}
	 */
	var addDoneButton = function (_textField, _onDone, _isSearch, _addExtraSpace) {
		_isSearch = typeof _isSearch !== 'undefined' ? _isSearch : false;
		_addExtraSpace = typeof _addExtraSpace !== 'undefined' ? _addExtraSpace : false;

		if (_textField) {
			if (OS_IOS) {
				var flexButton = Ti.UI.createButton({
					systemButton: Ti.UI.iOS.SystemButton.FLEXIBLE_SPACE
				});
				var doneButton = _isSearch ? createSearchButton() : createDoneButton();
				var rightSpace = Ti.UI.createButton({
					systemButton: Ti.UI.iOS.SystemButton.FIXED_SPACE,
					width: _addExtraSpace ? 15 : 0
				});

				_onDone && doneButton.addEventListener('click', function (e) {
					_onDone({
						source: _textField
					});
				});
				var toolbar = Ti.UI.createToolbar({
					items: [flexButton, doneButton, rightSpace]
				});

				if (!_textField.hasKeyboardEvents) {
					_textField.hasKeyboardEvents = true;
					_textField.addEventListener('blur', function () {
						toolbar.hide();
					});
					_textField.addEventListener('focus', function () {
						toolbar.show();
					});
				}
				_textField.keyboardToolbar = toolbar;

			} else {
				_onDone && _textField.addEventListener('return', _onDone);
			}

		}
	};

	/**
	 * @method setElementEnabled
	 * Applies enabled/disabled effect to ui elements.
	 * Applies touchEnabled : [value] to all subviews on android (TIMOB-12989)
	 * @param {Ti.UI.View} _tiView View to aply touchEnabled properties
	 * @param {Boolean} _status Indicates if the element is enabled/disabled
	 * @return {void}
	 */
	var setElementEnabled = function (_tiView, _status) {
		if (!_tiView) return;

		_tiView && _tiView.applyProperties({
			touchEnabled: _status,
			opacity: _status ? 1.0 : (OS_ANDROID) ? 1.0 : Alloy.Globals.opacityDisabled
		});

		(OS_ANDROID) && setSubelementsEnabled(_tiView, _status);
	};

	/**
	 * @method setSubelementsEnabled
	 * Recursive function to set enabled/disable effect to all childeren ui elements of a given view
	 * @param {Ti.UI.View} _tiView View to aply touchEnabled properties and which children controls will be enabled/disabled to
	 * @param {Boolean} _status Indicates if the element is enabled/disabled
	 * @return {void}
	 */
	var setSubelementsEnabled = function (_tiView, _status) {
		if (!_tiView) return;
		var children = _tiView.children || [];
		_tiView.touchEnabled = _status;

		if (_tiView.apiName != 'Ti.UI.View' && _tiView.apiName != 'Ti.UI.ScrollView') {
			_tiView.opacity = _status ? 1.0 : Alloy.Globals.opacityDisabled;
		}

		for (var i = 0, j = children.length; i < j; i++) {
			setSubelementsEnabled(children[i], _status);
		}
	};

	/**
	 * @method initExpanderHandler
	 * Creates an event handler for expand/collapse a view
	 * @param {Ti.UI.Button} _button Button to add event hadler for expand/collapse
	 * @return {void}
	 */
	var initExpanderHandler = function (_button, _container) {

		_button.addEventListener('click', function (_evt) {
			expandCollapse({
				container: _container,
				button: _button
			});
		});
	};

	/**
	 * @method handleClearButtonStatus
	 * Handles the visible status for a clear button, based on the textField value
	 * @param {Ti.UI.TextField} _textField the text field
	 * @param {Ti.UI.Button} _clearButton the clear button
	 * @return {void}
	 */
	var handleClearButtonStatus = function (_textField, _clearButton) {
		var _newVal = _textField.value || '';
		_clearButton.visible = (_newVal !== '');
	};

	/**
	 * @method initClearButton
	 * Adds the event handlers for showing/hide the clear button, based on the value of the text field
	 * @param {Ti.UI.TextField} _textField the text field
	 * @param {Ti.UI.Button} _clearButton the clear button
	 * @return {void}
	 */
	var initClearButton = function (_textField, _clearButton) {
		// TODO :  We need to change the event for 'change' instead of blur
		_textField.addEventListener('blur', function (_evt) {
			handleClearButtonStatus(_textField, _clearButton);
		});

		_clearButton.addEventListener('click', function (_evt) {
			_clearButton.visible = false;
			_textField.value = '';
			_textField.fireEvent('blur');
			_.defer(function () { // We make sure that the blur event its called before we set the focus in the textfield again
				OS_ANDROID && _textField.setSoftKeyboardOnFocus(Ti.UI.Android.SOFT_KEYBOARD_SHOW_ON_FOCUS);
				_textField.fireEvent('focus');
				_textField.focus();
				_textField.hasFocus = true;
			});

		});

		handleClearButtonStatus(_textField, _clearButton);
	};

	/**
	 * @method initNumberFormatHandler
	 * Adds focus / blur / change events to a Text Field that will have a number format given by Pattern
	 * @param {Ti.UI.TextField} _textField Text Field to apply format
	 * @param {String} _pattern Format pattern to be implemented in the Text Field
	 * @param {Boolean} _shouldRetainOnZero It defines the valueIfZero for the format
	 * @return {void}
	 */
	var initNumberFormatHandler = function (_textField, _pattern, _shouldRetainOnZero, _forceDecimals) {
		var _valueIfZero = _shouldRetainOnZero ? undefined : '';
		_forceDecimals = (_forceDecimals === undefined) ? true : _forceDecimals;
		_pattern = _pattern || '#,##0.00';
		var pattern = _pattern.split('.');
		var numberOfDecimals = 0;
		if (pattern.length > 1) {
			numberOfDecimals = pattern[1].length;
		}

		_textField.addEventListener('focus', function (_evt) {
			var _number = parser.parseToNumber(_evt.source.value);
			if (_number) {
				_evt.source.value = stringFormatter.cleanNonNumericString(_evt.source.value);
			} else {
				_evt.source.value = '';
			}
			_evt.source.hasFocus = true;
		});

		_textField.addEventListener('blur', function (_evt) {
			_evt.source.hasFocus = false;
			_evt.source.value = stringFormatter.formatDecimal(_evt.source.value, _valueIfZero, _pattern);
			_evt.source.fireEvent('change');
		});

		_textField.addEventListener('change', function (_evt) {
			var _newVal = stringFormatter.cleanNonNumericString(_evt.source.value).replace(/^[0]/g, '0');
			(_forceDecimals) && (_newVal = forceDecimals(_newVal, numberOfDecimals));
			if (_evt.source.hasFocus && _newVal != _evt.source.value) {
				_evt.source.value = _newVal;
			}
		});
	};

	/**
	 * @method hideAutoCompleteControl
	 * @private
	 * It makes a blur but leaves the focus in the text field that has auto complete features
	 * @param {Object} _evt return event
	 * @return {void}
	 */
	function initAutoCompleteHideHandler(_textField) {
		_textField.addEventListener('return', function (_evt) {
			_textField.blur();
			if (_textField.value.length > 0 && OS_ANDROID) {
				_.defer(function () {
					_textField.focus();
				});
			}
		});
	};

	/**
	 * @method forceDecimals
	 * @private
	 * Function to force number string to have certain number of decimals
	 * @param {String} _value Value to be analized
	 * @param {Number} _decimals Max decimals that _value should have
	 * @return {String} stirng with exact number of decimals
	 */
	function forceDecimals(_value, _decimals) {
		var result = _value;
		var regularExpression = '^\\d*(\\' + Alloy.Globals.decimalSeparator + '\\d{1,' + _decimals + '})?$';
		var replaceRegex = new RegExp(regularExpression, 'g');

		if (!result.match(replaceRegex)) {
			var splits = result.split('.');
			splits && (splits.length > 1) && splits.splice(1, 0, '.');
			var lastSplit = splits[splits.length - 1];
			lastSplit = lastSplit.substring(0, _decimals);
			splits[splits.length - 1] = lastSplit;
			result = splits.join('');
		}
		return result;
	};

	/**
	 * @method initTextFieldReplaceQuotes
	 * Replaces non-ascii single and double quotes introduced by iOS11 smart punctuation
	 * @param {Object} _params
	 * @param {Ti.UI.TextField} _params.textField
	 * @return {void}
	 */
	function initTextFieldReplaceQuotes(_params) {
		var params = _params || {};
		var _textField = params.textField;
		OS_IOS && _textField.addEventListener('change', function handleOnChange(e) {
			e.source.value = replaceQuotes(e.source.value);
		});
	}
	/**
	 * @method replaceQuotes
	 * Replaces non-ascii single and double quotes introduced by iOS11 smart punctuation
	 * @param {String} _value
	 * @return {String}
	 */
	function replaceQuotes(_value) {
		const singleQuotes = /[‘’‛'′´`']/g;
		const doubleQuotes = /[“”‟"″˝¨"]/g;
		return _value.replace(doubleQuotes, '"').replace(singleQuotes, '\'');
	}

	/**
	 * @method initTextFieldFormat
	 * Set initial properties for text fields
	 * @param {Object} _params
	 * @param {Ti.UI.TextField} _params.textField
	 * @param {String} _params.inputType Keyboard type for the text field
	 * @param {String} _params.hintText
	 * @param {Number} _params.maxLength 
	 * @param {String} _params.lookup
	 * @param {String} _params.replacement
	 * @return {void}
	 */
	function initTextFieldFormat(_params) {
		var params = _params || {};
		var _textField = params.textField;
		var _inputType = params.inputType;
		var _hintText = params.hintText;
		var _maxLength = params.maxLength;
		var _lookup = params.lookup;
		var _replacement = params.replacement;

		if (_textField) {
			_textField.hintText = _hintText;
			_textField.maxLength = _maxLength;

			switch (_inputType) {
			case 'text':
				_textField.keyboardType = Ti.UI.KEYBOARD_DEFAULT;
				break;
			case 'numeric':
				_textField.keyboardType = Ti.UI.KEYBOARD_TYPE_DECIMAL_PAD;
				break;
				// TODO: add more keyboards here
			}

			if (_lookup && _.isString(_replacement)) {
				_textField.addEventListener('change', function (_evt) {
					var _newVal = _textField.value.replace(new RegExp(_lookup, 'g'), _replacement);
					if (_newVal !== _textField.value) {
						_textField.value = _newVal;
						if (OS_ANDROID) {
							_.defer(function () {
								_textField.setSelection(_textField.value.length, _textField.value.length);
							});
						}
					}
				});
			}

		}
	};

	// Public API.
	return {
		expandCollapse: expandCollapse,
		expandCollapseTop: expandCollapseTop,
		applyHintTextStyle: applyHintTextStyle,
		addDoneButton: addDoneButton,
		setElementEnabled: setElementEnabled,

		// Add handlers
		initExpanderHandler: initExpanderHandler,
		initClearButton: initClearButton,
		initNumberFormatHandler: initNumberFormatHandler,
		initTextFieldFormat: initTextFieldFormat,
		initAutoCompleteHideHandler: initAutoCompleteHideHandler,
		initTextFieldReplaceQuotes: initTextFieldReplaceQuotes,
		replaceQuotes: replaceQuotes,
		// Event Listeners
		handleClearButtonStatus: handleClearButtonStatus
	};
})();

module.exports = uiHelpers;
