/**
 * @class Controllers.apple.main.productInfoView
 * Main view displayed on the product services in the summary window
 * @uses Helpers.uiHelpers
 * @uses Helpers.stringFormatter
 */
var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');

/**
 * @property {Models.quote} quote
 * @private
 * holds the received quote model
 */
var quote = args.quote;

/**
 * @property {Models.equipment} equipments
 * @private
 * holds the equipments of the quote
 */
var equipments = quote.get('equipments');

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	$.refreshUI();
};

/**
 * @method refreshUI
 * @private
 * Refresh information for the product
 * @return {void}
 */
$.refreshUI = function () {
	$.sectionHeader.setTitle(L(args.titleid));
	$.amountFinancedValue.text = stringFormatter.formatCurrency(quote.get('amountFinanced'));

	if (equipments) {
		equipments.each(createProductInfoDetail);
	}

};

/**
 * @method handleSectionHeaderClick
 * @private
 * Handles the section header click event
 * @return {void}
 */
function handleSectionHeaderClick() {
	uiHelpers.expandCollapse({
		container: $.productInfoView,
		button: $.sectionHeader.expandColapseButton
	});
};

/**
 * @method createProductInfoDetail
 * @private
 * Creates product info detail views
 * @return {void}
 */
function createProductInfoDetail(_equipment) {
	var quantity = _equipment.get('quantity');
	var productDetail = {
		name: _equipment.get('productName'),
		quantity: quantity,
		unitPrice: _equipment.get('unitPrice'),
		total: _equipment.get('extendedPrice')
	};

	var productView = Alloy.createController('apple/summary/productInfoDetail', productDetail).getView();
	$.productDetailView.add(productView);

	if (_equipment.hasItad()) {
		var itadRate = _equipment.getItadRate();
		var itadProductDetail = {
			name: itadRate.name,
			quantity: quantity,
			unitPrice: itadRate.unitPrice,
			total: itadRate.extendedPrice
		};

		var itadView = Alloy.createController('apple/summary/productInfoDetail', itadProductDetail).getView();
		$.productDetailView.add(itadView);
	}
};

$.sectionHeader.addEventListener('click', handleSectionHeaderClick);

init();
