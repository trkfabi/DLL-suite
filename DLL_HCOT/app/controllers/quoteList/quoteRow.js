/**
 * @class Controllers.quoteList.quoteRow
 * Represents a single quote model in the quote list
 * @uses Helpers.stringFormatter
 */
var args = arguments[0] || {};
var stringFormatter = require('/helpers/stringFormatter');

const LOG_TAG = '\x1b[31m' + '[quoteList/quoteRow]' + '\x1b[39;49m ';

/**
 * @property {Models.Quote} quote contains qoute model used it with a quote row
 */
var quote = args.quote;

/**
 * @property {Models.Customer} customer contains customer model information
 */
var customer = quote.get('customer');

/**
 * @property {Object} paymentOptionSelected holds selected payment option
 */
var paymentOptionSelected = quote.getSelectedPaymentOption();

/**
 * @property {Function} refreshCallback holds callback that refresh the information for the quote rows
 */
var refreshCallback = args.refreshCallback;

var EXPAND_COLLAPSE_HEIGHT = [];

/**
 * @method init
 * @private
 * Initialize values, and refresh UI for quotes
 * @return {void}
 */
function init() {
	// doLog && console.log(LOG_TAG, '- init');

	paymentOptionSelected.on('change', $.refreshUI);
	quote.on('change:paymentOptionSelected', handlePaymentOptionSelectedChange);
	quote.on('change:isFavorited', $.refreshUI);
	customer.on('change:name', $.refreshUI);
	customer.on('change:firstName', $.refreshUI);
	customer.on('change:lastName', $.refreshUI);
	quote.on('change:customQuoteName', $.refreshUI);

	if (OS_IOS) {
		EXPAND_COLLAPSE_HEIGHT = [
			180,
			39.5
		];
	}

	if (OS_ANDROID) {
		EXPAND_COLLAPSE_HEIGHT = [
			194,
			46
		];
	}

	$.expanded = false;
	$.dataItem = {
		properties: {
			itemId: quote.id,
			height: Ti.UI.SIZE
		},
		container: {
			height: EXPAND_COLLAPSE_HEIGHT[1]
		},
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
		nameLabel: {
			sortTop: 8,
			longTop: 13
		},
		quoteNameField: {},
		dateLabel: {},
		equipmentTotalLabel: {},
		financedLabel: {},
		financedTotalSymbolLabel: {},
		financedTotalLabel: {},
		numberLabel: {},
		paymentTotalLabel: {},
		paymentDetailLabel: {},
		equipmentContainer: {}
	};

	(OS_IOS) && ($.dataItem.properties.selectionStyle = Ti.UI.iOS.ListViewCellSelectionStyle.NONE);
};

/**
 * @method $.updateListItem
 * @private
 * Updates the whole listItem JSON object
 * @return {void}
 */
$.updateListItem = function () {
	// doLog && console.log(LOG_TAG, '- updateListItem');
	var isFavorited = quote.get('isFavorited');
	var dateCreated = new moment(quote.get('dateCreated'));
	var customerName = customer.getCustomerName();
	var purchaseOption = paymentOptionSelected.get('purchaseOptions');
	var quoteName = '';

	switch (purchaseOption) {
	case 'F':
		purchaseOption = 'FMV';
		break;
	case 'D':
		purchaseOption = '$1';
		break;
	case 'P':
		purchaseOption = 'FPO';
		break;
	default:
		purchaseOption = '';
	}

	$.dataItem.dateLabel.text = dateCreated.format(L('format_date'));
	// $.dataItem.quoteNameField.value = quote.getQuoteName() || L('no_name');
	$.dataItem.nameLabel.text = stringFormatter.restoreSingleQuote(quote.getQuoteName() || L('no_name'));
	// Validate text length and assign a top value
	if ($.dataItem.nameLabel.text.length > 15) {
		$.dataItem.nameLabel.top = $.dataItem.nameLabel.longTop;
	} else {
		$.dataItem.nameLabel.top = $.dataItem.nameLabel.sortTop;
	}
	$.dataItem.favoriteButton.backgroundImage = (isFavorited) ? '/images/bt_quotelist_favorite_active.png' :
		'/images/bt_quotelist_favorite_out.png';
	$.dataItem.equipmentTotalLabel.text = stringFormatter.formatDecimal(paymentOptionSelected.get('equipmentCost'));
	$.dataItem.financedTotalLabel.text = stringFormatter.formatDecimal(paymentOptionSelected.get('amountFinanced'));
	//The below validation is when the information from the orderNo is undefined.
	$.dataItem.numberLabel.text = '' + (paymentOptionSelected.get('orderNo') || '1');
	$.dataItem.paymentTotalLabel.text = stringFormatter.formatCurrency(paymentOptionSelected.get('payment'));
	$.dataItem.paymentDetailLabel.text = paymentOptionSelected.get('term') + ' Months ' + purchaseOption + ' ' +
		stringFormatter.formatDecimal(paymentOptionSelected.get('rateFactor'), '', '#.000000');
};

/**
 * @method cleanUp
 * Stop listening to events for quote,customer, paymentOptions mode, and removing their callbacks
 * @return {void}
 */
$.cleanUp = function () {
	// doLog && console.log(LOG_TAG, '- cleanUp');

	paymentOptionSelected.off('change', $.refreshUI);
	quote.off('change:paymentOptionSelected', handlePaymentOptionSelectedChange);
	quote.off('change:isFavorited', $.refreshUI);
	quote.off('change:customQuoteName', $.refreshUI);
	customer.off('change:name', $.refreshUI);
	customer.off('change:firstName', $.refreshUI);
	customer.off('change:lastName', $.refreshUI);
};

/**
 * @method getView
 * Get Ti.UI.ListItem object
 * return {Object} with Ti.UI.ListItem
 */
$.getView = function () {
	doLog && console.debug(LOG_TAG, '- getView');
	return $.dataItem;
};

/**
 * @method refreshUI
 * Refresh information for the UI of a quote row
 * @return {void}
 */
$.refreshUI = function () {
	doLog && console.debug(LOG_TAG, '- refreshUI');
	$.updateListItem();
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
	// doLog && console.log(LOG_TAG, '- setSelected');

	if (_selected) {
		_.extend($.dataItem.grayBG, $.dataItem.grayBG.selected);
	} else {
		_.extend($.dataItem.grayBG, $.dataItem.grayBG.unselected);
	}

	refreshCallback && refreshCallback({
		source: $
	});
};

/**
 * @method toggleExpanded
 * Set expand or collapse quote template
 * @param {Boolean} _isExpanded Param to know if expand or collapse
 * @return {void}
 */
$.toggleExpanded = function (_isExpanded) {
	// doLog && console.log(LOG_TAG, '- toggleExpanded');

	if ($.expanded != _isExpanded) {
		$.toggle();
	}
};

/**
 * @method toggle
 * Toggle for expand or collapse quote template
 * @return {void}
 */
$.toggle = function () {
	doLog && console.log(LOG_TAG, '- toggle');

	$.expanded = !$.expanded;
	// $.dataItem.template = $.expanded ? 'quoteExpanded' : 'quoteCollapsed';
	$.dataItem.container.height = $.expanded ? EXPAND_COLLAPSE_HEIGHT[0] : EXPAND_COLLAPSE_HEIGHT[1];
	refreshCallback && refreshCallback({
		source: $
	});
};

/**
 * @method setEditable
 * Makes the quote name editable
 * @param {Boolean} _editable Flag to make the quote editable or not
 * @return {void}
 */
$.setEditable = function (_editable) {
	doLog && console.log(LOG_TAG, '- setEditable');

	$.dataItem.quoteNameField.editable = _editable;
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
	doLog && console.debug(LOG_TAG, '- getQuote');
	return quote;
};

/**
 * @method handlePaymentOptionSelectedChange
 * @private
 * Callback function to be called after a quote updates iits selected payment
 * @return {void}
 */
function handlePaymentOptionSelectedChange() {
	// doLog && console.log(LOG_TAG, '- handlePaymentOptionSelectedChange');
	paymentOptionSelected.off('change', $.refreshUI);

	paymentOptionSelected = quote.getSelectedPaymentOption();
	paymentOptionSelected.on('change', $.refreshUI);

	$.refreshUI();
};

init();
