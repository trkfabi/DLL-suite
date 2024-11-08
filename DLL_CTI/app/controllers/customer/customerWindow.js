/**
 * @class Controllers.customer.customerWindow
 * Customer Window
 */
var args = arguments[0] || {};
var analytics = require('/utils/analytics');
var appNavigation = require('/appNavigation');
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');
var sessionManager = require('/utils/sessionManager');

var countryData = sessionManager.getCountryData();

var salesRep = Alloy.Models.instance('salesRep');
var quote;
var customer;
var equipments;
var usages;

var textFields = {};
var usageControllers = {};
var equipmentControllers = {};

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	analytics.captureApm('[customerWindow] - init()');
	var _state = countryData.customer.state;
	var _zipInfo = countryData.customer.zip;

	$.initKeyboardToolbar();
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

	$.stateAutocomplete.init({
		textField: $.stateTextField,
		changeEvent: handleStateChange,
		data: _state.list
	});

	$.stateEquipmentAutocomplete.init({
		textField: $.stateEquipmentTextField,
		changeEvent: handleStateChange,
		data: _state.list
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

$.initKeyboardToolbar = function () {
	uiHelpers.addDoneButton($.phoneTextField, $.blurFields);
	uiHelpers.addDoneButton($.zipTextField, $.blurFields);
	uiHelpers.addDoneButton($.zipEquipmentTextField, $.blurFields);
};
/**
 * @method obtainSelectedQuote
 * @private
 * Obtain selected quote
 * @return {void}
 */
function obtainSelectedQuote() {
	analytics.captureApm('[customerWindow] - obtainSelectedQuote()');
	if (equipments) {
		equipments.off('add', addEquipmentRow);
		equipments.off('remove', removeEquipmentRow);
	}

	quote = salesRep.getSelectedQuote();

	if (quote) {
		customer = quote.get('customer');
		equipments = quote.get('equipments');
		usages = quote.get('usages');

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
		name: data.DisplayName,
		phone: data.PhoneNumber,
		physicalAddress: address.Address1,
		physicalCity: address.City,
		physicalState: address.StateProvince,
		physicalZip: address.ZipPostal
	}).save();

	$.refreshUI();
	_.defer($.copyCustomerAddrOnEquipmentAddr, false);
	_.defer(function () {
		$.stateAutocomplete.remove();
	});
};

/**
 * @method handleUpdateEquipmentAddressBlur
 * @private
 * Update equipment address
 * @param {Object} _evt Blur event
 * @return {void}
 */
function handleUpdateEquipmentAddressBlur(_evt) {
	doLog && console.log('[customerWindow] - updateEquipmentAddress');
	var fieldTo = _evt.source.fieldTo;
	$[fieldTo].value = _evt.value;
	handleUIChange({
		source: $[fieldTo],
		value: _evt.value
	});
};

/**
 * @method scrollTo
 * @private
 * Scroll to specific point of the scrollview
 * @param {Number} _y Y position to scroll
 * @return {void}
 */
function scrollTo(_y) {
	// $.detailContainer.scrollTo(0, _y);
};

/**
 * @method addEquipmentRow
 * @private
 * Creates an EquipmentRow controller and adds it in the list
 * @param {Models.Equipment} _equipment Model about the equipment
 * @return {void}
 */
function addEquipmentRow(_equipment) {
	analytics.captureApm('[customerWindow] - addEquipmentRow()');
	var _isTradein = _equipment.get('isTradein');
	var _containerView = _isTradein ? $.tradeListContainer : $.equipmentListContainer;

	var currentContainer = _isTradein ? $.tradeContainer : $.equipmentContainer;

	var _equipmentRow = Alloy.createController("customer/equipmentDetails", {
		equipment: _equipment,
		parentContainer: currentContainer,
		scrollTo: scrollTo,
		updateCallback: handleEquipmentOrUsageUpdate
	});

	_containerView.add(_equipmentRow.getView());

	doLog && console.log('_equipment.id: ' + _equipment.id);

	equipmentControllers[_equipment.id] = _equipmentRow;

	var parentContainer = _isTradein ? $.tradeContainer : $.equipmentContainer;
	var parentY = parentContainer.rect.y;
	var lastItemY = _containerView.children[_containerView.children.length - 1].rect
		.y;
	var totalY = parseInt(parentY) + parseInt(lastItemY);

	doLog && console.log('parentY: ' + parentY);
	doLog && console.log('lastItemY: ' + lastItemY);

	// if (OS_ANDROID) {
	// 	totalY = totalY * (Ti.Platform.displayCaps.dpi / 160);
	// }

	// scrollTo(totalY);

};

/**
 * @method removeEquipmentRow
 * @private
 * Remove an EquipmentRow, and remove it from the list
 * @param {Models.Equipment} _equipment Models equipment
 * @return {void}
 */
function removeEquipmentRow(_equipment) {
	analytics.captureApm('[customerWindow] - removeEquipmentRow()');
	var _isTradein = _equipment.get('isTradein');
	var _containerView = _isTradein ? $.tradeListContainer : $.equipmentListContainer;
	var _equipmentRow = equipmentControllers[_equipment.id];

	_equipmentRow && _containerView.remove(_equipmentRow.getView());

	delete equipmentControllers[_equipment.id];
};

/**
 * @method addUsageRow
 * @private
 * Creates an EquipmentUsageRow controller and adds it in the list
 * @param {Object} _usage Usage data
 * @return {void}
 */
function addUsageRow(_usage) {
	analytics.captureApm('[customerWindow] - addUsageRow()');
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

	$.tradeListContainer.removeAllChildren();
	$.equipmentListContainer.removeAllChildren();

	_.each(equipmentControllers, function (_equipmentRow) {
		_equipmentRow.destroy();
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
		_usageRow.destroy();
	});

	usageControllers = {};

	usages.each(addUsageRow);
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
 * @method destroy
 * Stop listening to events for equipments, and removing their callbacks
 * @return {void}
 */
exports.destroy = function () {
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
	_.each(equipmentControllers, function (_controller) {
		_controller && _controller.blurFields && _controller.blurFields();
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
		_textField.value = stringFormatter.restoreSingleQuote(customer.get(_tag) || '');
	});

	updateAddrOnEquipment(customer.get('mailingAddressSameAsPhysical'));

	refreshEquipment();
	//refreshUsage();
};

/**
 * @method copyCustomerAddrOnEquipmentAddr
 * Copy customer address on equipment address
 * @param {Boolean} Used for copy customer addresss on equipment address
 * @return {void}
 */
$.copyCustomerAddrOnEquipmentAddr = function (_copy) {
	doLog && console.log('[customerWindow] - copyCustomerAddrOnEquipmentAddr');

	// $.stateEquipmentAutocomplete.removeListeners();
	updateAddrOnEquipment(_copy);
	customer.set({
		mailingAddressSameAsPhysical: _copy
	});

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

	for (var index in fields) {
		var field = fields[index];
		var value = (_copy ? field.from.value : '');
		field.to.enabled = !_copy;
		field.to.value = value;
		field.from.fieldTo = field.to.id;
		handleUIChange({
			source: field.to,
			value: value
		});
		if (_copy) {
			field.from.addEventListener('blur', handleUpdateEquipmentAddressBlur);
		} else {
			field.from.removeEventListener('blur', handleUpdateEquipmentAddressBlur);
		}
	}

	setTimeout(function () {
		// $.stateEquipmentAutocomplete.addListeners();
	}, 0);

};

/**
 * @method updateAddrOnEquipment
 * @private
 * Update Address on a equipment
 * @param {Boolean} _copy Used to duplicate information
 * @return {void}
 */
function updateAddrOnEquipment(_copy) {

	$.markCheck.image = _copy ? $.markCheck.imageOn : $.markCheck.imageOff;

	if (_copy) {
		$.mailingAddressRow.height = $.mailingAddressRow.collapsedHeight;
		$.mailingCityRow.height = $.mailingCityRow.collapsedHeight;
		$.mailingStateRow.height = $.mailingStateRow.collapsedHeight;
	} else {
		$.mailingAddressRow.height = $.mailingAddressRow.expandedHeight;
		$.mailingCityRow.height = $.mailingCityRow.expandedHeight;
		$.mailingStateRow.height = $.mailingStateRow.expandedHeight;
	}
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
function handleUIChange(_e) {
	doLog && console.log('[customerWindow] - handleUIChange - e : ' + JSON.stringify(_e));
	var optionsToSave = {};

	var key = _e.source.tag;
	var value = _e.source.value;
	var isSelected = _e.selected;

	if (customer && customer.get(key) != value) {
		doLog && console.log("[customerWindow] - handleUIChange - key : " + key + " value : " + value);
		doLog && console.log("[customerWindow] - handleUIChange - key : " + key + " value : " + customer.get(key));
		if (OS_IOS) {
			value = uiHelpers.replaceQuotes(value);
			_e.source.value = value;
		}
		optionsToSave[key] = value;

		customer.set(optionsToSave);

		quote.save();

		if (_e.source.id === 'stateTextField') {
			// doScroll(150);
		}

		if (_e.source.id === 'stateEquipmentTextField') {
			// OS_ANDROID ? doScroll(1000) : doScroll(400);
		}

		if (isSelected && (key == 'physicalState' || key == 'mailingState')) {
			$.stateAutocomplete.remove();
			$.stateEquipmentAutocomplete.remove();
		}
	}
};

/**
 * @method doScroll
 * @private
 * Scroll to specific point 
 * @param {Number} _val Value for scroll to specific position
 * @return {void}
 */
function doScroll(_val) {
	// $.detailContainer.scrollTo(0, (Alloy.Globals.height / 2) + _val);
};

/**
 * @method handleStateChange
 * @private
 * Handle the state change of TextField controls
 * @param {Object} _evt Details about the textfield
 * @param {TextField} _evt.textfield TextField control
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

};

/**
 * @method handlePhoneButtonClick
 * @private
 * Handle the click event of the phoneButton control
 * @param {Object} _evt Click event
 * @return {void}
 */
function handlePhoneButtonClick(_evt) {
	// TODO: check these parameters
	searchCustomer(_evt, true, $.phoneTextField.value);
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
	var _useSame = !_evt.source.useSame;
	_evt.source.useSame = !_evt.source.useSame;
	$.copyCustomerAddrOnEquipmentAddr(_useSame);
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

	var emailRegex =
		/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,63})$/i;

	if (emailText.length > 0) {

		if (!emailRegex.test(emailText)) {
			var params = {
				message: L("invalid_email"),
				ok: L('ok'),
				onClick: function () {
					_.defer(function () {
						$.emailTextField.focus();
					});
				}

			};

			appNavigation.showAlert(params);
		}
	}
};

$.addEquipmentRow.addEventListener('click', handleAddEquipmentClick);
$.addTradeRow.addEventListener('click', handleAddEquipmentClick);
$.phoneButton.addEventListener('click', handlePhoneButtonClick);
$.searchCustomerButton.addEventListener('click', handleCustomerSearchClick);
$.markEquipmentSame.addEventListener('click', handleMarkEquipmentSameClick);
$.customerHeader.addEventListener('click', handleCategoryHeaderClick);
$.equipmentHeader.addEventListener('click', handleCategoryHeaderClick);
$.tradeHeader.addEventListener('click', handleCategoryHeaderClick);
$.emailTextField.addEventListener('blur', handleEmailBlur);
$.wrapper.addEventListener('click', $.blurFields);
$.phoneTextField.addEventListener('change', handleApplyPhoneFormatChange);
$.customerNameTextField.addEventListener('change', handleUIChange);
$.nameTextField.addEventListener('change', handleUIChange);
$.middleTextField.addEventListener('change', handleUIChange);
$.lastNameTextField.addEventListener('change', handleUIChange);
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

init();
