/**
 * @class Controllers.apple.customer.customerWindow
 * Quote View
 * @uses appNavigation
 * @uses Helpers.uiHelpers
 * @uses Utils.sessionManager
 * @uses Utils.configsManager
 * @uses Helpers.stringFormatter
 * @uses Helpers.emailHelper
 * @uses Utils.analytics
 */
const LOG_TAG = '\x1b[31m' + '[apple/customer/customerWindow]' + '\x1b[39;49m ';

var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var appNavigation = require('/appNavigation');
var uiHelpers = require('/helpers/uiHelpers');
var sessionManager = require('/utils/sessionManager');
var configsManager = require('/utils/configsManager');
var stringFormatter = require('/helpers/stringFormatter');
var emailHelper = require('/helpers/emailHelper');
var analytics = require('/utils/analytics');

/**
 * @property {Models.Quote} quote 
 * @private
 * holds the selected quote model, selecting the first quote if no quote is selected
 */
var quote = null;

/**
 * @property {Models.Customer} customer
 * @private
 * holds the selected customer model
 */
var customer = null;

/**
 * @property {Object} statesList 
 * @private
 * holds the country states formatted for optionsWindow
 */
var statesList = {
	'sections': [{
		'id': '1',
		'name': '',
		'value': 'States',
		'options': configsManager.getConfig('customer.state.list')
	}]
};

/**
 * @property {Object} textFields 
 * @private
 * handles blur method and sets tags of Ti.UI.TextFields
 */
var textFields = {};

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	analytics.captureEvent('[Apple-quoteView] - init()');

	var _state = configsManager.getConfig('customer.state');
	var _zipInfo = configsManager.getConfig('customer.zip');

	uiHelpers.addDoneButton($.phoneField, $.blurFields);
	uiHelpers.addDoneButton($.zipField, $.blurFields);

	$.stateField.hintText = L(_state.titleid);

	uiHelpers.initTextFieldFormat({
		textField: $.zipField,
		inputType: _zipInfo.type,
		hintText: L(_zipInfo.titleid),
		lookup: _zipInfo.lookup,
		replacement: _zipInfo.replacement,
		maxLength: _zipInfo.maxLength
	});

	$.updateQuote(args.quote);
};

/**
 * @method updateQuote
 * Updates the UI from 
 * @param {Models.quote} _quote Quote to update the UI from this model
 * @return {void}
 */
$.updateQuote = function (_quote) {
	doLog && console.log(LOG_TAG, '- updateQuote');

	$.cleanUp();

	quote = _quote;
	customer = quote.get('customer');

	_.each($, function (_object) {
		if (_.isObject(_object) && _object.apiName === 'Ti.UI.TextField' && _object.tag) {
			textFields[_object.tag] = _object;
			_object.value = customer.get(_object.tag);
		}
	});

	if (quote && quote.isSubmitted()) {
		uiHelpers.setElementEnabled($.customerInfoView, false);
	}
};

/**
 * @method blurFields
 * Do blur to the TextField controls to hide the softkeyboard
 * @return {void}
 */
$.blurFields = function () {
	doLog && console.log('[customerWindow] - blurFields');
	_.each(textFields, function (_textField) {
		_textField.blur();
	});
};

/**
 * @method cleanUp
 * Removes global events and variables
 * @return {void}
 */
$.cleanUp = function () {
	doLog && console.log(LOG_TAG, '- cleanUp');

};

/**
 * @method handleStateClick
 * @private
 * Handle the click event of the State textfield - Opens State picker window
 * @param {Object} _evt The source of the event
 * @return {void}
 */
function handleStateClick(_evt) {
	appNavigation.openOptionsWindow({
		title: L('select_state'),
		options: statesList,
		doneCallback: function (_data) {
			_data = _data || {};

			var option = _data.option;

			if (option) {
				$.stateField.value = option.value;

				handleUIChange({
					source: $.stateField
				});
			}
		}
	});
};

/**
 * @method handleApplyPhoneFormatChange
 * @private
 * Handle the change event of the phoneField control
 * @param {Object} _evt Change event
 * @return {void}
 */
function handleApplyPhoneFormatChange(_evt) {
	stringFormatter.phoneNumberFormat(_evt.source);
};

/**
 * @method handleEmailBlur
 * @private
 * Handle the blur event of the emailField control
 * @param {Object} _evt Blur event
 * @return {void}
 */
function handleEmailBlur(_evt) {
	emailHelper.validate({
		email: $.emailField.value.trim(),
		onError: function () {
			(customer) && (customer.set({
				email: ''
			}).save());
			var params = {
				message: L('invalid_email'),
				ok: L('ok'),
				onClick: function () {
					_.defer(function () {
						$.emailField.focus();
					});
				}
			};

			appNavigation.showAlert(params);
		}
	});
};

/**
 * @method handleBackButtonClick
 * @private
 * Handles top nav back button click
 * @param {Object} _evt
 * @return {void}
 */
function handleBackButtonClick(_evt) {
	args.closeCallback && args.closeCallback();
	appNavigation.closeCustomerDetailsWindow();
};

/**
 * @method handleUIChange
 * @private
 * Handle the UI change event of TextField controls
 * @param {Object} _evt Change event
 * @return {void}
 */
function handleUIChange(_evt) {
	var optionsToSave = {};

	var key = _evt.source.tag;
	var value = _evt.source.value;

	if (customer && customer.get(key) != value) {
		if (OS_IOS) {
			value = uiHelpers.replaceQuotes(value);
			_evt.source.value = value;
		}
		optionsToSave[key] = value;

		doLog && console.log('[customerWindow] - handleUIChange - optionsToSave : ' + JSON.stringify(optionsToSave));

		customer.set(optionsToSave);

		quote.save();
	}
};

// Bind event listeners
$.backButtonWhite.addEventListener('click', handleBackButtonClick);
$.emailField.addEventListener('blur', handleEmailBlur);
$.stateField.addEventListener('click', handleStateClick);
$.selectListButton.addEventListener('click', handleStateClick);

$.nameField.addEventListener('change', handleUIChange);
$.addressField.addEventListener('change', handleUIChange);
$.cityField.addEventListener('change', handleUIChange);
$.zipField.addEventListener('change', handleUIChange);

$.firstNameField.addEventListener('change', handleUIChange);
$.middleNameField.addEventListener('change', handleUIChange);
$.lastNameField.addEventListener('change', handleUIChange);
$.phoneField.addEventListener('change', handleApplyPhoneFormatChange);
$.phoneField.addEventListener('change', handleUIChange);
$.emailField.addEventListener('change', handleUIChange);

init();
