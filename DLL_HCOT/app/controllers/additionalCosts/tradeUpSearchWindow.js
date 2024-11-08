/**
 * @class Controllers.additionalCosts.tradeUpWindow
 * Trade Up Window
 * @uses Utils.analytics
 */
var args = arguments[0] || {};
var appNavigation = require('/appNavigation');
var webservices = require('/utils/webservices');
var stringFormatter = require('/helpers/stringFormatter');
var analytics = require('/utils/analytics');
var rowSelected;
var page = 1;
var loading = false;
var totalPageCount = 1;
var stopRequest = false;
var position = null;
var paymentOption = null;
var loadingIndicator = null;

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	paymentOption = args.paymentOption;
	var paymentsText = null;

	if (paymentOption) {
		loadingIndicator = Alloy.createController('common/loadingIndicator', {
			message: L('searching_for_customers_contracts'),
			cancelCallback: function () {
				stopRequest = true;
				loading = false;
			}
		});

		var equipmentCost = paymentOption.get('equipmentCost') || '';
		var servicePayment = paymentOption.get('servicePayment') || '';

		if (equipmentCost) {
			equipmentCost = L('ep_value') + ' ' + stringFormatter.formatCurrency(equipmentCost);
		}

		if (servicePayment) {
			servicePayment = L('sp_value') + ' ' + stringFormatter.formatCurrency(servicePayment);
		}

		paymentsText = stringFormatter.formatList([equipmentCost, servicePayment], ' / ');
	}

	if (paymentsText) {
		$.titleLabel.top = $.titleLabel.topWithPayment;
		$.paymentsLabel.text = paymentsText;
		$.paymentsLabel.visible = true;
	}
	if (OS_ANDROID) {
		$.optionsSelector.onClick = function () {
			handleOptionSelectorClick();
		};
	}

	$.window.add(loadingIndicator.getView());
};

/**
 * @method handleTradeUpListClick
 * @private
 * 
 * @return {void}
 */
function handleTradeUpListClick() {
	$.searchBar.blur();
};

/**
 * @method handleOptionsSelectorClick
 * @private
 * Handle the option selector
 * @return {void}
 */
function handleOptionsSelectorClick() {
	analytics.captureTiAnalytics('OTHC-TradeUp-SearchByContract');
	if ($.optionsSelector.getIndex() === 0) {
		$.searchBar.hintText = L('customer_name');
	} else {
		$.searchBar.hintText = L('contract_number_with_symbol');
	}
};

/**
 * @method handleDoneButtonClick
 * @private
 * Clear rows
 * @return {void}
 */
function handleDoneButtonClick() {
	if (rowSelected && rowSelected.optionIndex != null) {
		args.doneCallback && args.doneCallback({
			data: rowSelected.data,
			value: rowSelected.data.optionAmounts[rowSelected.optionIndex]
		});
		appNavigation.closeTradeUpSearchWindow();
	} else {
		appNavigation.showAlertMessage(L('please_select_trade_up_option'));
	}
};

/**
 * @method handleSearchbarClick
 * @private
 * Clear rows
 * @return {void}
 */
function handleSearchbarClick() {
	analytics.captureTiAnalytics('OTHC-TradeUp-SearchButton');
	if ($.searchBar.value.trim().length < 5) {
		appNavigation.showAlertMessage(L('search_term_characters'));
		return;
	}
	page = 1;
	totalPageCount = 1;
	loadData(page, true);
};

/**
 * @method loadData
 * @private
 * Load data
 * @param {Number} _page_num Page number
 * @param {Boolean} _cleanTable Value to clean the rows 
 * @return {void}
 */
function loadData(_page_num, _cleanTable) {
	doLog && console.log('[customerSearch] - loadData');
	$.searchBar.blur();
	if (Titanium.Network.networkType === Titanium.Network.NETWORK_NONE) {
		appNavigation.showAlertMessage('No internet connection. Please check your signal and try again');
	} else {
		if (loading) {
			return;
		}
		if (Number(page) > Number(totalPageCount)) {
			return;
		}
		loading = true;
		_page_num = _page_num || 1;

		loadingIndicator.show();

		if ($.optionsSelector.getIndex() === 0) {
			searchByCustomer(_page_num, _cleanTable);
		} else {
			searchByContract(_page_num, _cleanTable);
		}
	}
};

/**
 * @method searchByCustomer
 * @private
 * Seach by customer name
 * @param {Number} _page_num Page number
 * @param {Boolean} _cleanTable Value to clean the rows 
 * @return {void}
 */
function searchByCustomer(_page_num, _cleanTable) {
	webservices.searchByCustomer({
		customerName: $.searchBar.value,
		page: _page_num,
		successCallback: function (_response) {
			if (stopRequest) {
				stopRequest = false;
				return;
			}
			loadingIndicator.hide();
			var _pageInfo = _response.PageInfo || {};
			totalPageCount = _pageInfo.TotalPageCount || 1;
			(_cleanTable) && ($.tradeupList.data = []);
			rowSelected = null;
			var _contracts = _response.Contracts || {};
			var _contractType = _contracts.ContractType || [];
			if (_contractType.length > 0) {
				for (var i = 0, j = _contractType.length; i < j; i++) {
					addTradeUpRow({
						data: _contractType[i]
					});
				}
			} else {
				var _status = _response.Status || {};
				var _message = _status.Message;
				doLog && console.error(_message);
				if (_status.Code === 'F' && _message != 'SC-OF1-0003W No contracts were found matching the search criteria') {
					appNavigation.showAlertMessage('Please try again later');
				} else {
					(page == 1) && appNavigation.showAlertMessage('No results found');
				}
			}
			page++;
			loading = false;
		},
		failCallback: searchFailureCallback
	});
};

/**
 * @method searchByContract
 * @private
 * search by contract number
 * @param {Number} _page_num Page number
 * @param {Boolean} _cleanTable Value to clean the rows 
 * @return {void}
 */
function searchByContract(_page_num, _cleanTable) {
	webservices.searchByContractNumber({
		contractNumber: $.searchBar.value,
		page: _page_num,
		successCallback: function (_response) {
			if (stopRequest) {
				stopRequest = false;
				return;
			}
			loadingIndicator.hide();
			var _pageInfo = _response.PageInfo || {};
			totalPageCount = _pageInfo.TotalPageCount || 1;
			(_cleanTable) && ($.tradeupList.data = []);
			rowSelected = null;
			var _contracts = _response.Contracts || {};
			var _contractType = _contracts.ContractType || [];
			if (_contractType.length > 0) {
				for (var i = 0, j = _contractType.length; i < j; i++) {
					addTradeUpRow({
						data: _contractType[i]
					});
				}
			} else {
				var _status = _response.Status || {};
				var _message = _status.Message;
				doLog && console.error(_message);
				if (_status.Code === 'F' && _message != 'SC-OF1-0003W No contracts were found matching the search criteria') {
					appNavigation.showAlertMessage('Please try again later');
				} else {
					(page == 1) && appNavigation.showAlertMessage('No results found');
				}
			}
			page++;
			loading = false;
		},
		failCallback: searchFailureCallback
	});
};

/**
 * @method searchFailureCallback
 * @private
 * search Failure Callback
 * @param {Object} _response Details about the callback response
 * @return {void}
 */
function searchFailureCallback(_response) {
	doLog && console.log('[tradeUpWindow] - searchFailureCallback');
	doLog && _response.event && _response.event.error && console.log(_response.event.error);
	doLog && _response.http && _response.http.status && console.log(_response.http.status);
	loading = false;
	if (stopRequest) {
		stopRequest = false;
		return;
	}
	loadingIndicator.hide();
	appNavigation.showAlertMessage('Please try again later');
};

/**
 * @method addTradeUpRow
 * @private
 * Add trade up row
 * @param {Object} _params Details for adding a trade up row
 * @param {Function} _params.expandCallback Callback function
 * @param {Function} _params.selectOptionCallback Callback function
 * @return {void}
 */
function addTradeUpRow(_params) {
	_params = _params || {};
	_params.expandCallback = expandTradeUpRow;
	_params.selectOptionCallback = selectTradeUpOption;
	var _tradeUpRowController = Alloy.createController('additionalCosts/tradeUpSearchRow', _params);
	$.tradeupList.appendRow(_tradeUpRowController.row);
};

/**
 * @method expandTradeUpRow
 * @private
 * Expand trade up row
 * @param {Object} _params parameters
 * @param {Boolean} _params.isExpanded Value to know if it's expanded the row
 * @return {void}
 */
function expandTradeUpRow(_params) {
	_params = _params || {};
	var _newRowSelected = _params.controller;
	if (_params.isExpanded && _newRowSelected !== rowSelected) {
		if (rowSelected) {
			rowSelected.selectRow(false);
			rowSelected.expandRow(false);
		}
		rowSelected = _newRowSelected;
		rowSelected.selectRow(true);
	}
};

/**
 * @method selectTradeUpOption
 * @private
 * Select trade up option
 * @param {Object} _params Details for select trade up option
 * @return {void}
 */
function selectTradeUpOption(_params) {
	_params = _params || {};
};

/**
 * @method handleTradeUpListScroll
 * @private
 * Do Scroll on a object
 * @param {Object} _evt Scroll event
 * @return {void}
 */
function handleTradeUpListScroll(_evt) {
	var _triggerLoad;
	if (_evt.source.apiName && _evt.source.apiName !== 'Ti.UI.TableView') {
		return;
	}
	if (OS_ANDROID) {
		// last item shown
		_triggerLoad = (position && _evt.firstVisibleItem >= position && _evt.totalItemCount <= (_evt.firstVisibleItem + _evt
			.visibleItemCount));
		// remember position
		position = _evt.firstVisibleItem;
	} else {
		// last pixel shown
		_triggerLoad = (position && _evt.contentOffset.y > position) && (_evt.contentOffset.y + _evt.size.height > _evt.contentSize
			.height);
		// remember position
		position = _evt.contentOffset.y;
	}
	if (_triggerLoad) {
		loadData(page);
	}
};

/**
 * @method handleWindowClosing
 * @private
 * Close window
 * @return {void}
 */
function handleWindowClosing() {
	appNavigation.closeTradeUpSearchWindow();
};

/**
 * @method animateOpen
 * @private
 * Handle the animation to open the window
 * @return {void}
 */
function animateOpen() {
	$.window.removeEventListener('postlayout', animateOpen);
	var _animation = Ti.UI.createAnimation({
		top: $.wrapper.visibleTop,
		duration: 250,
		curve: Ti.UI.ANIMATION_CURVE_EASE_OUT
	});
	$.wrapper.animate(_animation);
}

/**
 * @method closeWindow
 * Handle the animation to close the window
 * @return {void}
 */
$.closeWindow = function () {
	if (OS_IOS) {
		var _animation = Ti.UI.createAnimation({
			top: $.wrapper.hiddenTop,
			duration: 250,
			curve: Ti.UI.ANIMATION_CURVE_EASE_IN
		});
		$.wrapper.animate(_animation, function () {
			$.window.close();
		});
	} else {
		$.window.close();
	}
};

$.backButton.addEventListener('click', handleWindowClosing);
$.doneButton.addEventListener('click', handleDoneButtonClick);
$.tradeupList.addEventListener('scroll', handleTradeUpListScroll);
$.searchBar.addEventListener('return', handleSearchbarClick);
$.tradeupList.addEventListener('click', handleTradeUpListClick);
$.optionsSelector.addEventListener('click', handleOptionsSelectorClick);
OS_ANDROID && $.titleLabel.addEventListener('click', handleWindowClosing);
OS_ANDROID && $.searchBarButton.addEventListener('click', handleSearchbarClick);
$.window.addEventListener('close', handleWindowClosing);
$.window.addEventListener('postlayout', animateOpen);
init();