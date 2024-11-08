/**
 * @class Controllers.quoteList.QuoteRow
 * Represents a single quote model in the quote list
 */
var args = arguments[0] || {};
var stringFormatter = require('/helpers/stringFormatter');

var quote = args.quote;
var customer = quote.get('customer');
var paymentOptions = quote.get('paymentOptions');

var refreshCallback = args.refreshCallback;

/**
 * @method init
 * @private
 * Initialize values, and refresh UI for quotes
 * @return {void}
 */
function init() {
	doLog && console.log('[quoteRow] - init()');

	quote.on('change:paymentOptionSelected', $.refreshUI);
	quote.on('change:isFavorited', $.refreshUI);
	customer.on('change:name', $.refreshUI);
	// TODO: imrpove the listeners so it will ONLY listen to the currently selected PO from the quote
	paymentOptions.on('change', $.refreshUI);

	$.expanded = false;
	$.dataItem = {
		properties: {
			itemId: quote.id,
			height: Ti.UI.SIZE
		},
		template: 'quoteCollapsed',
		grayBG: {
			selected: {
				right: 5,
				backgroundColor: Alloy.Globals.colors.gallery
			},
			unselected: {
				right: 0,
				backgroundColor: Alloy.Globals.colors.alabaster
			}
		},
		favoriteButton: {},
		nameLabel: {},
		dateLabel: {},
		equipmentTotalLabel: {},
		financedLabel: {},
		financedTotalLabel: {},
		numberLabel: {},
		paymentTotalLabel: {},
		paymentDetailLabel: {}
	};

	(OS_IOS) && ($.dataItem.properties.selectionStyle = Ti.UI.iOS.ListViewCellSelectionStyle.NONE);

	$.refreshUI();
};

/**
 * @method destroy
 * Stop listening to events for quote,customer, paymentOptions mode, and removing their callbacks
 * @return {void}
 */
exports.destroy = function () {
	doLog && console.log('[quoteRow] - destroy()');

	quote.off('change:paymentOptionSelected', $.refreshUI);
	quote.off('change:isFavorited', $.refreshUI);
	customer.off('change:name', $.refreshUI);
	// TODO: imrpove the listeners so it will ONLY listen to the currently selected PO from the quote
	paymentOptions.off('change', $.refreshUI);
};

/**
 * @method getView
 * Get Ti.UI.ListItem object
 * return {Object} with Ti.UI.ListItem
 */
$.getView = function () {
	return $.dataItem;
};

/**
 * @method refreshUI
 * Refresh information for the UI of a quote row
 * @return {void}
 */
$.refreshUI = function () {
	// doLog && console.log('[quoteRow] - refreshUI()');
	var isFavorited = quote.get("isFavorited");
	var _dateCreated = new moment(quote.get("dateCreated"));
	var _paymentOption = quote.getSelectedPaymentOption();
	var _paymentDescriptionFormat = L('payment_description_format');
	var _term = _paymentOption.get('term');
	var _interestRate = _paymentOption.get('interestRate');
	var _isLease = _paymentOption.isLease();

	$.dataItem.dateLabel.text = _dateCreated.format(L('format_date'));
	$.dataItem.nameLabel.text = stringFormatter.restoreSingleQuote(customer.get("name") ? customer.get("name") : L(
		"no_name"));
	if ($.dataItem.nameLabel.text.length > 15) {
		$.dataItem.nameLabel.top = 13;
	} else {
		$.dataItem.nameLabel.top = 8;
	}
	$.dataItem.favoriteButton.backgroundImage = (isFavorited) ? "/images/bt_quotelist_favorite_active.png" :
		"/images/bt_quotelist_favorite_out.png";
	$.dataItem.financedLabel.text = _isLease ? L("leased_property_value") : L("amount_financed");
	$.dataItem.equipmentTotalLabel.text = stringFormatter.formatDecimal(_paymentOption.get("equipmentCost"));
	$.dataItem.financedTotalLabel.text = stringFormatter.formatDecimal(_paymentOption.get("amountFinanced"));
	$.dataItem.numberLabel.text = _paymentOption.get('orderNo');
	$.dataItem.paymentTotalLabel.text = stringFormatter.formatDecimal(_paymentOption.get('payment'));
	$.dataItem.paymentDetailLabel.text = String.format(_paymentDescriptionFormat,
		(_isLease ? L('lease') : L('finance')),
		_term,
		stringFormatter.formatPercentage(_interestRate)
	);

	quote.set({
		name: customer.get('name')
	});

	refreshCallback && refreshCallback({
		source: $
	});
};

/**
 * @method setSelected
 * Select a row on the active quotes or submitted list section
 * @param {Boolean} _selected Param to know if it is selected or not a quote
 * @return {void}
 */
$.setSelected = function (_selected) {
	doLog && console.log('[quoteRow] - setSelected()');
	if (_selected) {
		// $.grayBG.applyProperties($.grayBG.selected);
		_.extend($.dataItem.grayBG, $.dataItem.grayBG.selected);
	} else {
		// $.grayBG.applyProperties($.grayBG.unselected);
		_.extend($.dataItem.grayBG, $.dataItem.grayBG.unselected);
	}

	refreshCallback && refreshCallback({
		source: $
	});
};

/**
 * @method toggle
 * Toggle for expand or collapse quote template
 * @return {void}
 */
$.toggle = function () {
	doLog && console.log('[quoteRow] - toggle()');
	// Alloy.Globals.stringFormatter.expandCollapse({
	// 	container : $.container
	// });
	// $.row.height = $.container.height;
	$.expanded = !$.expanded;
	$.dataItem.template = $.expanded ? 'quoteExpanded' : 'quoteCollapsed';
	// _.extend( $.dataItem.properties, ($.expanded ? $.dataItem.properties.expanded : $.dataItem.properties.collapsed) );
	refreshCallback && refreshCallback({
		source: $
	});
};

/**
 * @method getQuote
 * Getting a quote model
 * @return {Models.Quote} Returns a quote model 
 */
$.getQuote = function () {
	return quote;
};

init();
