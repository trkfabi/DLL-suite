/**
 * @class Controllers.additionalCosts.tradeUpRow
 * Trade Up Row
 * @uses Utils.analytics
 */
var args = arguments[0] || {};
var webservices = require('/utils/webservices');
var analytics = require('/utils/analytics');
var sessionManager = require('/utils/sessionManager');
var appNavigation = require('/appNavigation');
var stringFormatter = require('/helpers/stringFormatter');
var http = require('/utils/http');

/**
 * @property {Boolean} loadedKeepOk will become true when the HTTP request for KEEP termination returns a SUCCESS result
 */
var loadedKeepOk = false;
/**
 * @property {Boolean} loadedReturnOk will become true when the HTTP request for RETURN termination returns a SUCCESS result
 */
var loadedReturnOk = false;
/**
 * @property {Boolean} keepLoaded will become true when the HTTP request for termination returns any result
 */
var keepLoaded = false;
/**
 * @property {Boolean} returnLoaded will become true when the HTTP request for termination returns any result
 */
var returnLoaded = false;
/**
 * @property {Boolean} customerDataLoaded will become true when the HTTP request for customer data returns any result
 */
var customerDataLoaded = false;
/**
 * @property {Models.salesRep} salesRep holds the user's data from the active session
 */
var salesRep = sessionManager.getSalesRep();

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
	keepLoaded = false;
	returnLoaded = false;
	customerDataLoaded = false;
	if (!_isExpanded && !http.isOnline()) {
		appNavigation.showAlertMessage(L('no_internet_connection'));
	} else {
		$.isExpanded = (_isExpanded != null ? _isExpanded : !$.isExpanded);
		var heightExpanded = salesRep.isHealthCare() ? $.container.heightNoReturn : $.container.heightExpanded;
		$.container.height = $.isExpanded ? heightExpanded : $.container.heightCollapsed;
		$.returnRow.height = salesRep.isHealthCare() ? 0 : $.returnRow.heightExpanded;
		$.keepLabel.text = salesRep.isHealthCare() ? $.keepLabel.textHealthCare : $.keepLabel.textDefault;

		if (OS_ANDROID) {
			$.row.height = $.isExpanded ? heightExpanded : $.container.heightCollapsed;
			$.collectingLabel.bottom = salesRep.isHealthCare() ? $.collectingLabel.bottomNoReturn : $.collectingLabel.bottomReturn;
		} else {
			if (salesRep.isHealthCare()) {
				$.activity.top = $.activity.topNoReturn;
				$.activity.left = $.activity.leftNoReturn;
				$.collectingLabel.top = $.collectingLabel.topNoReturn;
				$.collectingLabel.left = $.collectingLabel.leftNoReturn;
				$.collectingLabel.text = $.collectingLabel.textNoReturn;
			} else {
				$.activity.top = $.activity.topReturn;
			}

		}
		$.header.backgroundColor = $.isExpanded ? $.header.backgroundColorExpanded : $.header.backgroundColorCollapsed;

		if ($.isExpanded && (!loadedKeepOk || !loadedReturnOk)) {
			$.loadingContainer.visible = true;
			requestCustomerData();
			requestTerminationQuote('KEEP');

			// Added to prevent an extra request
			if (!salesRep.isHealthCare()) {
				requestTerminationQuote('RETURN');
			} else {
				returnLoaded = true;
				loadedReturnOk = true;
			}
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
	var _parmQuoteType = _quoteType;
	webservices.terminationQuote({
		contractID: $.data.ContractID,
		customerName: $.data.CustomerName,
		contractNumber: $.data.ContractNumber,
		quoteType: _parmQuoteType,
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
						keepLoaded = true;
						loadedKeepOk = true;
						doLog && console.log('[tradeUpSearchRow] - requestTerminationQuote() ' + _parmQuoteType + ' returned amount.');
						break;
					case 'RETURN':
						$.returnAmountLabel.text = _amount;
						$.data.optionAmounts[1] = _amount;
						returnLoaded = true;
						loadedReturnOk = true;
						doLog && console.log('[tradeUpSearchRow] - requestTerminationQuote() ' + _parmQuoteType + ' returned amount.');
					}
				}
			} else {
				(!quotesNotFound) && appNavigation.showAlertMessage(L('please_contact'));
				quotesNotFound = true;
				$.expandRow(false);
				keepLoaded = true;
				returnLoaded = true;
				doLog && console.log('[tradeUpSearchRow] - requestTerminationQuote() ' + _parmQuoteType +
					' returned but NO amount.');
			}
			checkRequestsStatus();
		},
		failCallback: function (_response) {
			appNavigation.showAlertMessage(L('please_contact'));
			$.expandRow(false);
			keepLoaded = true;
			returnLoaded = true;
			doLog && console.log('[tradeUpSearchRow] - requestTerminationQuote() ' + _parmQuoteType + ' failed.');
			checkRequestsStatus();
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
			doLog && console.log('[tradeUpSearchRow] - requestCustomerData() returned data.');
			customerDataLoaded = true;
			checkRequestsStatus();
		},
		failCallback: function (_response) {
			// Just inform that the webservice has returned, no matter if it fails
			doLog && console.log('[tradeUpSearchRow] - requestCustomerData() failed.');
			customerDataLoaded = true;
			checkRequestsStatus();
		}
	});
};

/**
 * @method checkRequestsStatus
 * @private
 * Check if all the HTTP calls have returned a result
 * @return {void}
 */
function checkRequestsStatus() {
	if (keepLoaded && returnLoaded && customerDataLoaded) {
		$.loadingContainer.visible = false;
	}
}

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
		analytics.captureTiAnalytics('OTHC-TradeUpResults-ExpandTradeUpDrawer');
		$.expandRow();
		break;
	case 'keepRow':
		analytics.captureTiAnalytics('OTHC-TradeUpResults-Keep');
		$.selectOption(_evt.source.optionIndex);
		break;
	case 'returnRow':
		analytics.captureTiAnalytics('OTHC-TradeUpResults-Return');
		$.selectOption(_evt.source.optionIndex);
		break;
	default:
		$.selectOption(_evt.source.optionIndex);
	}
};

$.container.addEventListener('click', handleRowClick);

init();
