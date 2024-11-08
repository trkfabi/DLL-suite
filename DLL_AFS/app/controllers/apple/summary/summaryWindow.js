var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;

function init() {

};

init();

// TODO: Reference from prototype
// var args = arguments[0] || {};
// var doLog = Alloy.Globals.doLog;
// var appNavigation = require('appNavigation');
// var uiHelpers = require('helpers/uiHelpers');
// var stringFormatter = require('helpers/stringFormatter');

// var quoteModel = args.quoteModel || {};

// function init () {
// 	$.refreshUI();
// };

// $.refreshUI = function () {
// 	var paymentSelected = _.findWhere(quoteModel.payments, {
// 		id : quoteModel.paymentSelectedId
// 	}) || {};
// 	var customerModel = quoteModel.customer || {};
// 	var customerAddress = _.compact([
// 		customerModel.address,
// 		customerModel.city,
// 		customerModel.state,
// 		customerModel.zip
// 	]) || [];
// 	var customerData = _.compact([
// 		customerModel.name,
// 		customerAddress.join(', '),
// 		customerModel.email,
// 		customerModel.phone
// 	]) || [];

// 	_.each(quoteModel.equipments, function (_equipmentModel) {
// 		var productInfoView = Alloy.createController('summary/productInfoView', {
// 			equipmentModel : _equipmentModel
// 		});

// 		$.productsView.add(productInfoView.getView());
// 	});

// 	$.customerInfoLabel.text = customerData.join('\n');
// 	$.amountFinancedValueLabel.text = stringFormatter.formatCurrency(quoteModel.amountFinanced);

// 	$.termView.valueLabel.text = paymentSelected.term + ' Months';
// 	$.paymentView.valueLabel.text = stringFormatter.formatCurrency(paymentSelected.paymentAmount);
// 	$.frequencyView.valueLabel.text = 'Monthly';
// 	$.rateFactorView.valueLabel.text = paymentSelected.rateFactor;
// };

// function handleWrapperClick(_evt) {
// 	var sourceId = _evt.source.id;
// 	var container = null;
// 	var button = null;

// 	switch (sourceId) {
// 		case 'customerInfoHeaderLabel':
// 			container = $.customerInfoSection;
// 			button = $.customerInfoButton;
// 			break;

// 		case 'productInfoHeaderLabel':
// 			container = $.productInfoSection;
// 			button = $.productInfoButton;
// 			break;

// 		case 'paymentInfoHeaderLabel':
// 			container = $.paymentInfoSection;
// 			button = $.paymentInfoButton;
// 			break;
// 	}

// 	if (container && button) {
// 		uiHelpers.expandCollapse({
// 			container : container,
// 			button : button
// 		});

// 	}
// };

// function handleSubmitClick(_evt) {
// 	appNavigation.openGenerateWindow({
// 		doneCallback : function () {
// 			alert(L('transaction_is_being_processed'));
// 		}
// 	});
// };

// init();

// $.backButton.addEventListener('click', appNavigation.closeSummaryWindow);
// $.wrapperView.addEventListener('click', handleWrapperClick);
// $.submitButton.addEventListener('click', handleSubmitClick);
