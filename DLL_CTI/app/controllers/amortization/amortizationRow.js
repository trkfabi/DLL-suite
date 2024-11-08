/**
 * # Amortization Row
 * @class Controllers.amortization.amortizationRow
 * @uses helpers/stringFormatter
 */

var args = arguments[0] || {};
var stringFormatter = require('/helpers/stringFormatter');

var scheduleRow = args.scheduleRow || {};

/**
 * @method init
 * @private
 * Initialize values for the current view
 * @return {void}
 */
function init() {
	$.dateRow.text = scheduleRow.date.format(L('format_date'));
	$.paymentRow.text = stringFormatter.formatCurrency(scheduleRow.payment);
	$.principalRow.text = stringFormatter.formatCurrency(scheduleRow.principal);
	$.interestRow.text = stringFormatter.formatCurrency(scheduleRow.interest);
	$.balanceRow.text = stringFormatter.formatCurrency(scheduleRow.balance);
};

init();
