/**
 * @class Controllers.customer.customerWindow
 * Customer Window
 * @uses Libs.analytics
 * @uses appNavigation
 * @uses Helpers.uiHelpers
 * @uses Helpers.stringFormatter
 * @uses Libs.sessionManager
 */
var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;

var analytics = require('/utils/analytics');
var appNavigation = require('/appNavigation');
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');
var sessionManager = require('/utils/sessionManager');
var configsManager = require('/utils/configsManager');

/**
 * @property {Models.salesRep} salesRep holds the user's data from the active session
 */
var salesRep = sessionManager.getSalesRep();

/**
 * @property {Collections.equipment} equipments gets access to equipment model
 */
var equipments;

/**
 * @property {Models.quote} quote holds the selected quote model, selecting the first quote if no quote is selected
 */
var quote;

/**
 * @property {Models.customer} customer gets customers and set customer information to the quote model
 */
var customer;

/**
 * @property {Object} textFields handles blur method and sets tags of Ti.UI.TextFields
 */
var textFields = {};

/**
 * @property {Object} usageControllers holds usage data
 */
var usageControllers = {};

/**
 * @property {Object} equipmentControllers holds equipment id
 */
var equipmentControllers = {};

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	analytics.captureEvent('[customerWindow] - init()');
	var _state = configsManager.getConfig('customer.state');
	var _zipInfo = configsManager.getConfig('customer.zip');

	uiHelpers.addDoneButton($.phoneTextField, $.blurFields);
	uiHelpers.addDoneButton($.zipTextField, $.blurFields);
	uiHelpers.addDoneButton($.zipEquipmentTextField, $.blurFields);

	uiHelpers.initTextFieldFormat({
		textField: $.zipTextField,
		inputType: _zipInfo.type,
		hintText: L(_zipInfo.titleid),
		lookup: _zipInfo.lookup,
		replacement: _zipInfo.replacement,
		maxLength: _zipInfo.maxLength
	});

	uiHelpers.initTextFieldFormat({
		textField: $.zipEquipmentTextField,
		inputType: _zipInfo.type,
		hintText: L(_zipInfo.titleid),
		lookup: _zipInfo.lookup,
		replacement: _zipInfo.replacement,
		maxLength: _zipInfo.maxLength
	});

	$.stateTextField.hintText = L(_state.titleid);
	$.stateEquipmentTextField.hintText = L(_state.titleid);

	_.each($, function (_object) {
		if (_.isObject(_object) && _object.apiName === 'Ti.UI.TextField' && _object.tag) {
			textFields[_object.tag] = _object;
		}
	});

	salesRep.on('change:quoteSelected', handleSelectedQuoteChange);

	obtainSelectedQuote();
};

/**
 * @method obtainSelectedQuote
 * @private
 * Obtain selected quote
 * @return {void}
 */
function obtainSelectedQuote() {
	analytics.captureEvent('[customerWindow] - obtainSelectedQuote()');
	if (equipments) {
		equipments.off('add', addEquipmentRow);
		equipments.off('remove', removeEquipmentRow);
	}

	quote = salesRep.getSelectedQuote();

	if (quote) {
		customer = quote.get('customer');
		equipments = quote.get('equipments');

		equipments.on('add', addEquipmentRow);
		equipments.on('remove', removeEquipmentRow);
	}

	$.refreshUI();
};

/**
 * @method searchCustomer
 * @private
 * It opens the search customer window
 * @param {Object} _e Details source
 * @param {Boolean} _searchPhone Used it to know if search is by phone
 * @param {String} _textToSearch Text used for doing the search
 * @return {void}
 */
function searchCustomer(_e, _searchPhone, _textToSearch) {
	doLog && console.log('[customerWindow] - searchCustomer');

	appNavigation.openSearchCustomerWindow({
		doneCallback: updateFromSearch,
		searchPhone: _searchPhone,
		textToSearch: _textToSearch
	});
};

/**
 * @method updateFromSearch
 * @private
 * Update from search
 * @param {Object} _option Options for the update
 * @return {void}
 */
function updateFromSearch(_option) {
	doLog && console.log('[customerWindow] - updateFromSearch');

	var data = _option.data;
	var address = data.Address || {};

	customer.set({
		name: stringFormatter.capitalCase(data.DisplayName),
		phone: stringFormatter.capitalCase(data.PhoneNumber),
		physicalAddress: stringFormatter.capitalCase(address.Address1),
		physicalCity: stringFormatter.capitalCase(address.City),
		physicalState: stringFormatter.capitalCase(address.StateProvince),
		physicalZip: stringFormatter.capitalCase(address.ZipPostal)
	}).save();

	$.refreshUI();

	_.defer(function () {
		$.setCopyAddressStatus(false);
	});

};

/**
 * @method addEquipmentRow
 * @private
 * Creates an EquipmentRow controller and adds it in the list
 * @param {Models.equipment} _equipment Model about the equipment
 * @return {void}
 */
function addEquipmentRow(_equipment) {
	analytics.captureEvent('[customerWindow] - addEquipmentRow()');

	var _containerView = $.equipmentListContainer;
	var parentContainer = $.equipmentContainer;
	var _equipmentRow = Alloy.createController('customer/equipmentDetails', {
		equipment: _equipment,
		parentContainer: parentContainer,
		updateCallback: handleEquipmentOrUsageUpdate
	});

	_containerView.add(_equipmentRow.getView());

	doLog && console.log('_equipment.id: ' + _equipment.id);

	equipmentControllers[_equipment.id] = _equipmentRow;

	updateEquipmentsIndex();
};

/**
 * @method removeEquipmentRow
 * @private
 * Remove an EquipmentRow, and remove it from the list
 * @param {Models.equipment} _equipment Models equipment
 * @return {void}
 */
function removeEquipmentRow(_equipment) {
	analytics.captureEvent('[customerWindow] - removeEquipmentRow()');
	var _containerView = $.equipmentListContainer;
	var _equipmentRow = equipmentControllers[_equipment.id];

	_equipmentRow && _containerView.remove(_equipmentRow.getView());

	delete equipmentControllers[_equipment.id];

	if (equipments.length === 0) {
		equipments.add(new Alloy.createModel('equipment'));
		_.defer(function () {
			$.detailContainer.scrollToBottom();
		});
	}

	updateEquipmentsIndex();
};

/**
 * @method updateEquipmentsIndex
 * @private
 * Updates the index number for each equipment row title
 * @return {void}
 */
function updateEquipmentsIndex() {
	var index = 0;
	_.each(equipmentControllers, function (_equipmentRow) {
		_equipmentRow.setIndex(++index);
	});
};

/**
 * @method addUsageRow
 * @private
 * Creates an EquipmentUsageRow controller and adds it in the list
 * @param {Object} _usage Usage data
 * @return {void}
 */
function addUsageRow(_usage) {
	analytics.captureEvent('[customerWindow] - addUsageRow()');
	var _usageRow = Alloy.createController('customer/equipmentUsageRow', {
		usage: _usage,
		updateCallback: handleEquipmentOrUsageUpdate
	});

	doLog && console.log('_usage.id: ' + _usage.id);

	$.equipmentUseRow.add(_usageRow.getView());
	usageControllers[_usage.id] = _usageRow;
};

/**
 * @method refreshEquipment
 * @private
 * Refresh equipment removing all info about the equipment list, and add it again
 * @return {void}
 */
function refreshEquipment() {
	doLog && console.log('[customerWindow] - refreshEquipment()');

	$.equipmentListContainer.removeAllChildren();

	_.each(equipmentControllers, function (_equipmentRow) {
		_equipmentRow.cleanUp();
	});

	equipmentControllers = {};

	equipments.each(addEquipmentRow);
};

/**
 * @method refreshUsage
 * @private
 * Refresh usage. Removing all info about the equipmentUseRow, and add it again
 * @return {void}
 */
function refreshUsage() {
	doLog && console.log('[customerWindow] - refreshUsage()');

	$.equipmentUseRow.removeAllChildren();

	_.each(usageControllers, function (_usageRow) {
		_usageRow.cleanUp();
	});

	usageControllers = {};
};

/**
 * @method handleApplyPhoneFormatChange
 * @private
 * Handle the change event of the phoneTextField control
 * @param {Object} _e Change event
 * @return {void}
 */
function handleApplyPhoneFormatChange(_e) {
	var phone = _e.source.value.replace(/\D/g, '');
	var newPhone;
	var startDigit = phone.charAt(0);

	switch (startDigit) {
	case '0':
		_e.source.maxLength = 10;
		newPhone = phone;
		break;
	case '1':
		_e.source.maxLength = 15;
		if (phone.length < 5) {
			newPhone = phone.replace(/(1)(\d{1,3})/, '$1 ($2');
		} else if (phone.length < 8) {
			newPhone = phone.replace(/(1)(\d{3})(\d{1,3})/, '$1 ($2) $3');
		} else {
			newPhone = phone.replace(/(1)(\d{3})(\d{3})(\d{1,3})/, '$1 ($2) $3-$4');
		}
		break;
	default:
		_e.source.maxLength = (OS_IOS) ? 14 : 15;
		if (phone.length < 8) {
			newPhone = phone.replace(/(\d{3})(\d{1,4})/, '$1-$2');
		} else {
			newPhone = phone.replace(/(\d{3})(\d{3})(\d{2,4})/, '($1) $2-$3');
		}
	}

	if (_e.source.value !== newPhone) {
		_e.source.value = newPhone;
		if (_e.source.hasText()) {
			_e.source.setSelection(newPhone.length, newPhone.length);
		}
	}
};

/**
 * @method cleanUp
 * Stop listening to events for equipments, and removing their callbacks
 * @return {void}
 */
$.cleanUp = function () {
	salesRep.off('change:quoteSelected', handleSelectedQuoteChange);
	if (equipments) {
		equipments.off('add', addEquipmentRow);
		equipments.off('remove', removeEquipmentRow);
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
	_.each(equipmentControllers, function (_equipmentRow) {
		_equipmentRow.blurFields();
	});
};

/**
 * @method refreshUI
 * @private
 * Refresh equipments
 * @return {void}
 */
$.refreshUI = function () {
	doLog && console.log('[customerWindow] - refreshUI');

	_.each(textFields, function (_textField, _tag) {
		_textField.value = customer.get(_tag) || '';
	});

	var copyCustomerAddress = customer.get('copyCustomerAddress');
	$.markCheck.image = copyCustomerAddress ? $.markCheck.imageOn : $.markCheck.imageOff;

	refreshEquipment();
	refreshUsage();
};

/**
 * @method setCopyAddressStatus
 * Copy customer address on equipment address
 * @param {Boolean} _copy Used for copy customer addresss on equipment address
 * @return {void}
 */
$.setCopyAddressStatus = function (_copy) {
	var copyCustomerAddress = _copy;
	customer.set('copyCustomerAddress', copyCustomerAddress);
	$.markCheck.image = copyCustomerAddress ? $.markCheck.imageOn : $.markCheck.imageOff;

	var fields = [{
		from: $.addressTextField,
		to: $.equipmentAddressTextField
	}, {
		from: $.cityTextField,
		to: $.cityEquipmentTextField
	}, {
		from: $.stateTextField,
		to: $.stateEquipmentTextField
	}, {
		from: $.zipTextField,
		to: $.zipEquipmentTextField
	}];

	_.each(fields, function (_field) {
		var value = (copyCustomerAddress ? _field.from.value : '');

		_field.to.enabled = !copyCustomerAddress;
		_field.to.value = value;

		handleUIChange({
			source: _field.to,
			value: value
		});
	});
};

/**
 * @method handleSelectedQuoteChange
 * @private
 * Handle the selected quote change
 * @return {void}
 */
function handleSelectedQuoteChange() {
	doLog && console.log('[customerWindow] - handleSelectedQuoteChange');

	obtainSelectedQuote();
};

/**
 * @method handleEquipmentOrUsageUpdate
 * @private
 * Callback to handle the equipment or usage update
 * @param {Object} _evt Callback event
 * @return {void}
 */
function handleEquipmentOrUsageUpdate(_evt) {
	doLog && console.log('[customerWindow] - handleEquipmentOrUsageUpdate');
	quote.save();
};

/**
 * @method handleUIChange
 * @private
 * Handle the UI change event of TextField controls
 * @param {Object} _e Change event
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

/**
 * @method handleStateChange
 * @private
 * Handle the state change of TextField controls
 * @param {Object} _evt Details about the textfield
 * @param {Ti.UI.TextField} _evt.textfield TextField control
 * @param {String} _evt.value Value of the Textfield
 * @param {Boolean} _evt.selected Value to know if it is selected
 * @return {void}
 */
function handleStateChange(_evt) {
	handleUIChange({
		source: _evt.textField,
		value: _evt.value,
		selected: _evt.selected
	});
};

/**
 * @method handleAddEquipmentClick
 * @private
 * Handle the click event of the addEquipmentRow, and addTradeRow controls
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleAddEquipmentClick(_evt) {
	var _tag = _evt.source.tag;

	var _equipment = Alloy.createModel('equipment', {
		'isTradein': (_tag === 'tradein') ? 1 : 0
	});

	equipments.add(_equipment);

	$.detailContainer.scrollToBottom();
};

/**
 * @method handleCustomerSearchClick
 * @private
 * Handle the customer search click of the searchCustomerButton control
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleCustomerSearchClick(_evt) {
	searchCustomer(_evt, false, $.customerNameTextField.value);
};

/**
 * @method handleMarkEquipmentSameClick
 * @private
 * Handle the click event of markEquipmentSame control
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleMarkEquipmentSameClick(_evt) {
	$.setCopyAddressStatus(!customer.get('copyCustomerAddress'));
};

/**
 * @method handleCategoryHeaderClick
 * @private
 * Handle the click event for customerHeader, equipmentHeader, and tradeHeader controls
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleCategoryHeaderClick(_evt) {
	var _header = _evt.source;

	if (_header.expandImage && _header.container) {

		uiHelpers.expandCollapse({
			container: $[_header.container],
			button: $[_header.expandImage]
		});
	}
};

/**
 * @method handleEmailBlur
 * @private
 * Handle the blur event of the emailTextField control
 * @param {Object} _evt Blur event
 * @return {void}
 */
function handleEmailBlur(_evt) {
	var emailText = $.emailTextField.value.trim();

	if (emailText.length > 0) {
		var emailRegEx = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,63})$/;

		if (!emailRegEx.test(emailText)) {
			(customer) && (customer.set({
				email: ''
			}).save());
			var params = {
				message: L('invalid_email'),
				ok: L('ok'),
				onClick: function () {
					$.emailTextField.focus();
				}
			};

			appNavigation.showAlert(params);
		}
	}
};

/**
 * @method handleAddressTextBlur
 * @private
 * Handle the blur event of any address textfield control
 * @param {Object} _evt Blur event
 * @return {void}
 */
function handleAddressTextBlur(_evt) {
	if (customer.get('copyCustomerAddress')) {
		var addressField = _evt.source;
		var equipmentField = null;

		switch (_evt.source.id) {
		case 'addressTextField':
			equipmentField = $.equipmentAddressTextField;
			break;
		case 'cityTextField':
			equipmentField = $.cityEquipmentTextField;
			break;
		case 'stateTextField':
			equipmentField = $.stateEquipmentTextField;
			break;
		case 'zipTextField':
			equipmentField = $.zipEquipmentTextField;
			break;
		}

		if (equipmentField) {
			equipmentField.value = addressField.value;
			handleUIChange({
				source: equipmentField
			});
		}
	}
}

$.addEquipmentRow.addEventListener('click', handleAddEquipmentClick);
$.searchCustomerButton.addEventListener('click', handleCustomerSearchClick);
$.markEquipmentSame.addEventListener('click', handleMarkEquipmentSameClick);
$.customerHeader.addEventListener('click', handleCategoryHeaderClick);
$.equipmentHeader.addEventListener('click', handleCategoryHeaderClick);
$.emailTextField.addEventListener('blur', handleEmailBlur);
$.wrapper.addEventListener('click', $.blurFields);

$.phoneTextField.addEventListener('change', handleApplyPhoneFormatChange);
$.customerNameTextField.addEventListener('change', handleUIChange);
$.nameTextField.addEventListener('change', handleUIChange);
$.middleTextField.addEventListener('change', handleUIChange);
$.lastNameTextField.addEventListener('change', handleUIChange);
$.titleTextField.addEventListener('change', handleUIChange);
$.phoneTextField.addEventListener('change', handleUIChange);
$.emailTextField.addEventListener('change', handleUIChange);
$.addressTextField.addEventListener('change', handleUIChange);
$.cityTextField.addEventListener('change', handleUIChange);
$.stateTextField.addEventListener('change', handleUIChange);
$.zipTextField.addEventListener('change', handleUIChange);
$.equipmentAddressTextField.addEventListener('change', handleUIChange);
$.cityEquipmentTextField.addEventListener('change', handleUIChange);
$.stateEquipmentTextField.addEventListener('change', handleUIChange);
$.zipEquipmentTextField.addEventListener('change', handleUIChange);

$.addressTextField.addEventListener('blur', handleAddressTextBlur);
$.cityTextField.addEventListener('blur', handleAddressTextBlur);
$.stateTextField.addEventListener('blur', handleAddressTextBlur);
$.zipTextField.addEventListener('blur', handleAddressTextBlur);

init();
