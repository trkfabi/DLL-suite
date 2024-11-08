/**
 * # Amount Row
 * @class Controllers.additionalCosts.tradeUpAmountRow
 * Cnotroller for Trade Up Amount, Inherates from Controllers.AdditionalCosts.AmountRow
 * @uses Helpers.uiHelpers
 * @uses Helpers.stringFormatter
 * @uses Helpers.parser
 */
var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var appNavigation = require('/appNavigation');
var parser = require('/helpers/parser');
var uiStateChangeCallback = args.uiStateChangeCallback;
var property = args.property;

$.searchButton = $.UI.create('Button', {
	classes: 'searchButton'
});

exports.baseController = 'additionalCosts/amountRow';

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	$.amountRow.add($.searchButton);

};

function handleSearchButton(_evt) {
	appNavigation.openTradeUpSearchWindow({
		doneCallback: handleTradeUpSearchDone,
		paymentOption: $.paymentOption
	});
};

function handleTradeUpSearchDone(_evt) {
	var paymentData = {};
	var data = _evt.data || {};
	var address = data.Address || {};
	var quote = null;
	var customer = null;

	paymentData[property] = parser.parseToNumber(_evt.value);

	if ($.paymentOption && $.paymentOption.getQuote()) {
		quote = $.paymentOption.getQuote();
		customer = quote.get('customer');

		customer
			.set({
				'name': data.CustomerName,
				'phone': data.LeaseSignerPhone,
				'physicalAddress': address.Address1,
				'physicalCity': address.City,
				'physicalState': address.StateProvince,
				'physicalZip': address.ZipPostal
			})
			.save();

		appNavigation.handleCustomerAddressChange();
	}

	uiStateChangeCallback && uiStateChangeCallback(paymentData);
};

/**
 * @method setEnabled
 * Enables or disables the UI elements
 * @param {Boolean} _enable Indicates if the control has to be enabled or disabled
 * @return {void}
 */
$.setEnabled = function (_enable) {
	$.amountField.enabled = _enable;
	$.clearAmountButton.enabled = _enable;
	$.searchButton.enabled = _enable;
};

// Alloy Inheritance

$.searchButton.addEventListener('click', handleSearchButton);

init();
