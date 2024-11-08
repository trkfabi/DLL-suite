/**
 * @class Controllers.customer.customerSearch
 * Customer search
 * @uses appNavigation
 * @uses Libs.http
 * @uses Libs.webservices
 * @uses Libs.analytics
 * @uses Helpers.uiHelpers
 */
var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var appNavigation = require('/appNavigation');
var http = require('/utils/http');
var webservices = require('/utils/webservices');
var analytics = require('/utils/analytics');

/**
 * @property {Function} rowSelected contains listener function to determine when a row is selected
 */
var rowSelected;

/**
 * @property {Object} position determines last item position
 */
var position = null;

/**
 * @property {Number} page holds page number
 */
var page = 1;

/**
 * @property {Boolean} loading determines when data is loading
 */
var loading = false;

/**
 * @property {Number} totalPageCount contains the total page count
 */
var totalPageCount = 1;

/**
 * @property {Boolean} stopRequest determines when to stop requests 
 */
var stopRequest = false;

var loadingIndicator = null;

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	analytics.captureEvent('[customerSearch] - init()');

	loadingIndicator = Alloy.createController('common/loadingIndicator', {
		message: L('searching_for_customers'),
		cancelCallback: function () {
			stopRequest = true;
			loading = false;
		}
	});

	$.window.add(loadingIndicator.getView());

	if (args.textToSearch && args.textToSearch.trim().length > 0) {
		$.searchBar.value = args.textToSearch;
		handleLoadDataClick();
	}
};

/**
 * @method open
 * Open window. Customer search window
 * @return {void}
 */
$.open = function () {
	$.window.open();
};

/**
 * @method close
 * Close window. Customer search window
 * @return {void}
 */
$.close = function () {
	appNavigation.closeSearchCustomerWindow();
};

/**
 * @method searchCustomer
 * @private
 * Search customer
 * @return {void}
 */
function searchCustomer() {
	$.window.removeEventListener('focus', searchCustomer);
	if (args.textToSearch && args.textToSearch.trim().length > 0) {
		$.searchBar.value = args.textToSearch;
		handleLoadDataClick();
	}
};

/**
 * @method loadData
 * @private
 * Load data
 * @param {Number} _pageNum Page number
 * @param {Boolean} _cleanTable Used to clean a table
 * @return {void}
 */
function loadData(_pageNum, _cleanTable) {
	doLog && console.log('[customerSearch] - loadData');
	$.searchBar.blur();

	if (!http.isOnline()) {
		appNavigation.showAlertMessage(L('no_internet_connection'));
	} else {

		if (loading) {
			return;
		}

		if (Number(page) > Number(totalPageCount)) {
			return;
		}

		var _partyName = $.searchBar.value;

		loading = true;

		var page_num = _pageNum || 1;

		(OS_ANDROID) && $.searchBar.blur();

		loadingIndicator.show();

		webservices.searchCustomers({
			partyName: _partyName,
			partyPhone: null,
			page: page_num,
			successCallback: function (_response) {
				if (stopRequest) {
					stopRequest = false;
					return;
				}
				var pageInfo = _response.PageInfo || {};
				totalPageCount = pageInfo.TotalPageCount || 1;
				(_cleanTable) && ($.customerList.data = []);
				var _parties = _response.Parties || {};
				var _partyType = _parties.PartyType || [];
				loadingIndicator.hide();
				if (_partyType.length > 0) {
					for (var i = 0, j = _partyType.length; i < j; i++) {
						var _partyInfo = _partyType[i];
						addCustomerRow({
							data: _partyInfo
						});
					}
				} else {
					var _status = _response.Status || {};
					var _message = _status.Message;
					(page == 1) && appNavigation.showAlertMessage(L('no_results_found'));
				}
				page++;
				loading = false;
			},
			failCallback: function (_response) {
				loading = false;
				loadingIndicator.hide();

				if (stopRequest) {
					stopRequest = false;
					return;
				}

				appNavigation.showAlertMessage(L('please_try_again_later'));
				var _status = _response.Status || {};
				var _message = _status.Message;
				doLog && console.log(_message);
			}
		});
	}
};

/**
 * @method addCustomerRow
 * @private
 * Add customer row
 * @param {Object} _params Used for customerSearchRow
 * @return {void}
 */
function addCustomerRow(_params) {
	_params = _params || {};

	_params.selectionCallback = selectCustomerCallback;
	var _customerRowController = Alloy.createController('customer/customerSearchRow', _params);

	$.customerList.appendRow(_customerRowController.row);
};

/**
 * @method selectCustomerCallback
 * @private
 * Select a customer row
 * @param {Object} _params 
 * @param {Controllers.customer.customerSearchRow} _params.controller Controller customerSearchrow
 * @return {void}
 */
function selectCustomerCallback(_params) {
	_params = _params || {};
	var _newRowSelected = _params.controller;

	if (_newRowSelected !== rowSelected) {
		if (rowSelected) {
			rowSelected.selectRow(false);
		}
		rowSelected = _newRowSelected;
	}
};

/**
 * @method handleOnScroll
 * @private
 * Handle the scroll event of the customerList control
 * @param {Object} _e Scroll event
 * @return {void}
 */
function handleOnScroll(_e) {

	if (_e.source.apiName && _e.source.apiName !== 'Ti.UI.TableView') {
		return;
	}

	var _triggerLoad;

	if (OS_ANDROID) {
		// last item shown
		_triggerLoad = (position && _e.firstVisibleItem >= position && _e.totalItemCount <= (_e.firstVisibleItem + _e.visibleItemCount));

		// remember position
		position = _e.firstVisibleItem;
	} else {
		// last pixel shown
		_triggerLoad = (position && _e.contentOffset.y > position) && (_e.contentOffset.y + _e.size.height > _e.contentSize.height);

		// remember position
		position = _e.contentOffset.y;

	}

	if (_triggerLoad) {
		loadData(page);
	}
};

/**
 * @method handleDoneClick
 * @private
 * Handle the click event of the doneButton control
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleDoneClick(_evt) {
	if (rowSelected) {
		args.doneCallback && args.doneCallback({
			data: rowSelected.data
		});
		$.close();
	} else {
		appNavigation.showAlertMessage(L('please_select_a_customer'));
	}
};

/**
 * @method handleWindoClose
 * @private
 * Handle the close event of the window
 * @param {Object} _evt Close event
 * @return {void}
 */
function handleWindoClose(_evt) {
	$.window.removeEventListener('close', handleWindoClose);
	OS_IOS && appNavigation.closeSearchCustomerWindow();
};

/**
 * @method handleLoadDataClick
 * @private
 * Handle the click event of searchBar, and searchBar controls.
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleLoadDataClick(_evt) {
	$.searchBar.blur();
	page = 1;
	totalPageCount = 1;

	if ($.searchBar.value.trim().length < 5) {
		appNavigation.showAlertMessage(L('customer_name_must_be_at_least'));
		return;
	}

	loadData(page, true);
};

/**
 * @method handleCustomerListClick
 * @private
 * Handle the click event of the customerList control
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleCustomerListClick(_evt) {
	$.searchBar.blur();
};

/**
 * @method handleBackClick
 * @private
 * Handle the click event of the titleLabel, and backButton controls
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleBackClick(_evt) {
	$.close();
};

/**
 * @method handleWindowOpen
 * @private
 * Handles the open event from the window
 * @param {Object} _evt Text change event
 * @return {void}
 */
function handleWindowOpen(_evt) {
	if (!args.textToSearch) {
		$.searchBar.focus();
	}
};

// Public methods---------

$.window.addEventListener('close', handleWindoClose);
$.customerList.addEventListener('scroll', handleOnScroll);
$.customerList.addEventListener('click', handleCustomerListClick);
$.doneButton.addEventListener('click', handleDoneClick);
$.searchBar.addEventListener('return', handleLoadDataClick);
OS_ANDROID && $.window.addEventListener('open', handleWindowOpen);
OS_ANDROID && $.searchBarButton.addEventListener('click', handleLoadDataClick);
OS_ANDROID && $.titleLabel.addEventListener('click', handleBackClick);
OS_ANDROID && $.backButton.addEventListener('click', handleBackClick);
OS_ANDROID && $.window.addEventListener('androidback', appNavigation.closeSearchCustomerWindow);
OS_ANDROID && $.window.addEventListener('focus', searchCustomer);

init();
