/**
 * @class Controllers.apple.main.productInfoDetail
 * Definition of view to load product details in the summary window
 * @uses Helpers.stringFormatter
 */
var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var stringFormatter = require('/helpers/stringFormatter');

/**
 * @property {Models.equipment} product
 * @private
 * Contains product detail information
 */
var product;

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	doLog && console.log('[productInfoDetail] - init()');
	product = args || {};
	$.refreshUI();
};

/**
 * @method refreshUI
 * @private
 * Refresh information for the product
 * @return {void}
 */
$.refreshUI = function () {
	$.quantityLabel.text = stringFormatter.formatDecimal(product.quantity, '0', '#,###.##');
	$.productLabel.text = product.name;
	$.unitPriceValue.text = stringFormatter.formatCurrency(product.unitPrice);
	$.totalLabel.text = stringFormatter.formatCurrency(product.total);
};

init();
