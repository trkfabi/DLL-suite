/**
 * @class Controllers.apple.quoteList.QuoteRow
 * Represents a single quote model in the quote list
 * @uses Helpers.stringFormatter
 */
var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var stringFormatter = require('/helpers/stringFormatter');

/**
 * @property {Models.Quote} quote contains qoute model used it with a quote row
 */
var quote = args.quote;

/**
 * @method init
 * @private
 * Initialize values, and refresh UI for quotes
 * @return {void}
 */
function init() {
	doLog && console.debug('[Apple-quoteRow] - init()');
	exports.baseController = 'quoteList/quoteRow';

	$.dataItem.financedLabel.text = L('financed_amount');

	//Hidding equipment container
	$.dataItem.equipmentContainer.height = 0;
};

/**
 * @method $.updateQuoteModel
 * Updates the quote Models
 * @return {void}
 */
$.updateQuoteModel = function (_quote) {
	doLog && console.debug('[Apple-quoteRow] - updateQuoteModel()');
	quote = _quote;
};

/**
 * @method $.updateListItem
 * @private
 * Updates the whole listItem JSON object for Apple
 * @return {void}
 */
$.updateListItem = function () {
	doLog && console.log('[Apple-quoteRow] - updateListItem()');
	var paymentOptionSelected = quote.getSelectedPaymentOption();
	var isFavorited = quote.get('isFavorited');
	var dateCreated = new moment(quote.get('dateCreated'));

	$.dataItem.dateLabel.text = dateCreated.format(L('format_date'));
	// $.dataItem.quoteNameField.value = quote.getQuoteName() || L('no_name');
	$.dataItem.nameLabel.text = quote.get('customQuoteName') || quote.getQuoteName() || L('no_name');

	if ($.dataItem.nameLabel.text.length > 15) {
		$.dataItem.nameLabel.top = 13;
	} else {
		$.dataItem.nameLabel.top = 8;
	}
	$.dataItem.favoriteButton.backgroundImage = (isFavorited) ? '/images/bt_quotelist_favorite_active.png' :
		'/images/bt_quotelist_favorite_out.png';

	$.dataItem.numberLabel.text = '' + (paymentOptionSelected.get('orderNo') || '1');
	$.dataItem.financedTotalLabel.text = stringFormatter.formatDecimal(quote.get('amountFinanced'));
	$.dataItem.paymentTotalLabel.text = stringFormatter.formatCurrency(paymentOptionSelected.get('payment'));
	$.dataItem.paymentDetailLabel.text = paymentOptionSelected.get('term') + ' ' + L('months') + ', ' + L('rate_factor') +
		': ' + stringFormatter.formatDecimal(paymentOptionSelected.get('rateFactor'), '', '#.000000');
};

init();
