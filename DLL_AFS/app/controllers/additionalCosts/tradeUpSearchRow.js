/**
 * @class Controllers.additionalCosts.tradeUpRow
 * Trade Up Row
 */
var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var webservices = require('/utils/webservices');
var sessionManager = require('/utils/sessionManager');
var stringFormatter = require('/helpers/stringFormatter');
var moment = require('alloy/moment');
var http = require('/utils/http');
var alertHelper = require('/helpers/alertHelper');
var loadedOptions = false;

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {

	var monthsRemain = '';
	var quotesNotFound = false;

	$.isExpanded = false;
	$.isSelected = false;
	$.optionIndex = null;
	$.data = args.data || {};
	$.data.optionAmounts = [];

	$.customerLabel.text = ($.data.CustomerName) || '';
	$.amountLabel.text = stringFormatter.formatDecimal($.data.PaymentAmount);

	if ($.data.ContractNumber) {
		$.contractNumberLabel.text = L('contract_number') + ' : ' + $.data.ContractNumber;
	} else {
		$.contractNumberLabel.visible = false;
	}

	monthsRemain = ($.data.PaymentsRemaining != '') ? (($.data.PaymentsRemaining || '0') + L('months_remain')) : '';

	if ($.data.BookedDate != '') {
		var _bookedDate = new moment($.data.BookedDate);
		$.dateLabel.text = _bookedDate.format('MM/DD/YYYY');
		$.descriptionLabel.text = (monthsRemain != '') ? (' - ' + monthsRemain) : '';
	} else {
		$.dateLabel.text = '';
		$.descriptionLabel.text = monthsRemain;
		$.descriptionLabel.left = 16;
	}
};

/**
 * @method expandRow
 * Expand a row
 * @param {Boolean} _isExpanded Variable that indicates if the row is expanded
 * @return {void}
 */
$.expandRow = function (_isExpanded) {

	if (!_isExpanded && !http.isOnline()) {
		alertHelper.showAlertDialog({
			message: L('no_internet_connection')
		});
	} else {
		$.isExpanded = (_isExpanded != null ? _isExpanded : !$.isExpanded);
		$.container.height = $.isExpanded ? $.container.heightExpanded : $.container.heightCollapsed;
		$.header.backgroundColor = $.isExpanded ? $.header.backgroundColorExpanded : $.header.backgroundColorCollapsed;
		if (OS_ANDROID) {
			$.row.height = $.isExpanded ? $.container.heightExpanded : $.container.heightCollapsed;
		}
		if ($.isExpanded && !loadedOptions) {
			requestCustomerData();
			requestTerminationQuote('KEEP');
			requestTerminationQuote('RETURN');
		}
		args.expandCallback && args.expandCallback({
			controller: $,
			isExpanded: $.isExpanded,

		});
	}
};

/**
 * @method selectRow
 * Selection of a row
 * @param {Boolean} _isSelected Variable that indicates if the row is selected
 * @return {void}
 */
$.selectRow = function (_isSelected) {
	$.isSelected = (_isSelected != null ? _isSelected : !$.isSelected);
	$.leftSelectMark.visible = $.isSelected;
	$.selectMark.visible = $.isSelected;
	args.selectionCallback && args.selectionCallback({
		controller: $,
		isSelected: $.isSelected
	});

};

/**
 * @method selectOption
 * Selection an option
 * @param {String} _quoteType Quote type
 * @return {void}
 */
$.selectOption = function (_optionIndex) {
	var _title = null;
	var _checkImage = null;
	var _options = [
		$.keepRow,
		$.returnRow
	];

	if ($.optionIndex != _optionIndex) {
		if ($.optionIndex != null) {
			_title = $[_options[$.optionIndex].title];
			_checkImage = $[_options[$.optionIndex].checkImage];
			_title.color = _title.colorUnselected;
			_checkImage.image = _checkImage.imageUnchecked;
		}
		if (_optionIndex != null) {
			_title = $[_options[_optionIndex].title];
			_checkImage = $[_options[_optionIndex].checkImage];
			_title.color = _title.colorSelected;
			_checkImage.image = _checkImage.imageChecked;
		}
		$.optionIndex = _optionIndex;
		args.selectOptionCallback && args.selectOptionCallback({
			controller: $,
			optionIndex: $.optionIndex
		});
	}
};

/**
 * @method requestTerminationQuote
 * @private
 * Request termination quote
 * @param {String} _quoteType Quote type
 * @return {void}
 */
function requestTerminationQuote(_quoteType) {
	webservices.terminationQuote({
		contractID: $.data.ContractID,
		customerName: $.data.CustomerName,
		contractNumber: $.data.ContractNumber,
		quoteType: _quoteType,
		successCallback: function (_response) {
			var _quotes = _response.Quotes || {};
			var _terminationQuoteType = _quotes.TerminationQuoteType || [];
			if (_response.Status.Code == "S") {
				if (_terminationQuoteType[0]) {
					var _quoteType = _terminationQuoteType[0].Type;
					var _amount = stringFormatter.formatDecimal(_terminationQuoteType[0].QuoteAmount);
					switch (_quoteType) {
					case 'KEEP':
						$.keepAmountLabel.text = _amount;
						$.data.optionAmounts[0] = _amount;
						break;
					case 'RETURN':
						$.returnAmountLabel.text = _amount;
						$.data.optionAmounts[1] = _amount;
					}
					loadedOptions = true;
					$.loadingContainer.visible = false;
				}
			} else {
				(!quotesNotFound) && alertHelper.showAlertDialog({
					message: L('please_contact')
				});
				quotesNotFound = true;
				$.expandRow(false);
			}
		},
		failCallback: function (_response) {
			alertHelper.showAlertDialog({
				message: L('please_contact')
			});
			$.expandRow(false);
		}
	});
	quotesNotFound = false;
};

/**
 * @method requestCustomerData
 * @private
 * Request customer data
 * @return {void}
 */
function requestCustomerData() {
	webservices.searchBySourceSystemID({
		sourceSystemID: $.data.CustomerAccountNumber,
		successCallback: function (_response) {
			var _parties = _response.Parties || {};
			var _partyType = _parties.PartyType || [];
			var _party = _partyType[0] || {};
			for (var key in _party) {
				$.data[key] = _party[key];
			}
			doLog && console.log('[tradeUpRow] - requestCustomerData() $.data: ' + JSON.stringify($.data));
		},
		failCallback: function (_response) {
			alertHelper.showAlertDialog({
				message: L('an_error_ocurred')
			});
		}
	});
};

/**
 * @method handleRowClick
 * @private
 * Handle the click event for the row
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleRowClick(_evt) {
	var _id = _evt.source.id;
	switch (_id) {
	case 'header':
		$.expandRow();
		break;
	case 'keepRow':
	case 'returnRow':
		$.selectOption(_evt.source.optionIndex);
		break;
	default:
		$.selectOption(_evt.source.optionIndex);
	}
};

$.container.addEventListener('click', handleRowClick);

init();
