/**
 * @class Controllers.customer.customerSearch
 * Customer search
 */
var args = arguments[0] || {};
var searchPhone = args.searchPhone;
var appNavigation = require('/appNavigation');
var sessionManager = require('/utils/sessionManager');
var webservices = require('/utils/webservices');
var analytics = require('/utils/analytics');
var uiHelpers = require('/helpers/uiHelpers');
var rowSelected;
var position = null;
var page = 1;
var loading = false;
var totalPageCount = 1;
var stopRequest = false;

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	analytics.captureApm('[customerSearch] - init()');

	// TODO: Correct refactor this controller

	if (args.textToSearch && args.textToSearch.trim().length > 0) {
		$.searchBarTextField.value = args.textToSearch;

		if (OS_IOS) {
			handleLoadDataClick();
		} else {
			$.window.addEventListener('focus', searchCustomer);
		}
	}

	if (searchPhone) {
		$.searchBarTextField.hintText = L("customer_phone");
		$.searchBarTextField.keyboardType = Ti.UI.KEYBOARD_TYPE_NUMBER_PAD;
		(OS_IOS) && uiHelpers.addDoneButton($.searchBarTextField, handleLoadDataClick, true);
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
	handleLoadDataClick();
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
	$.searchBarTextField.blur();

	if (Ti.Network.networkType === Ti.Network.NETWORK_NONE) {
		appNavigation.showAlertMessage(L("no_internet_connection"));
	} else {

		if (loading) {
			return;
		}

		if (Number(page) > Number(totalPageCount)) {
			return;
		}

		var partyName = $.searchBarTextField.value;

		if (partyName.trim().length < 5) {
			if (searchPhone) {
				appNavigation.showAlertMessage(L("customer_phone_must_be_at_least"));
			} else {
				appNavigation.showAlertMessage(L("customer_name_must_be_at_least"));
			}
			return;
		}

		loading = true;

		var page_num = _pageNum || 1;

		var partyPhone = (searchPhone) ? partyName : null;
		(searchPhone) && (partyName = null);

		(OS_ANDROID) && $.searchBarTextField.blur();
		var activityMessage = (searchPhone) ? L('searching_for_phone_number') : L('searching_for_customers');

		appNavigation.showLoadingIndicator({
			autoShow: true,
			message: activityMessage,
			container: $.window,
			cancelCallback: function () {
				stopRequest = true;
				loading = false;
			}
		});

		webservices.searchCustomers({
			partyName: partyName,
			partyPhone: partyPhone,
			sourceSystemID: sessionManager.getUser().group,
			page: page_num,
			successCallback: function (response) {
				if (stopRequest) {
					stopRequest = false;
					return;
				}
				var pageInfo = response.PageInfo || {};
				totalPageCount = pageInfo.TotalPageCount || 1;
				(_cleanTable) && ($.customerList.data = []);
				var parties = response.Parties || {};
				var partyType = parties.PartyType || [];
				appNavigation.hideLoadingIndicator();
				if (partyType.length > 0) {
					for (var i = 0, j = partyType.length; i < j; i++) {
						var partyInfo = partyType[i];
						addCustomerRow({
							data: partyInfo
						});
					}
				} else {
					var status = response.Status || {};
					var message = status.Message;
					(page == 1) && appNavigation.showAlertMessage(L("no_results_found"));
				}
				page++;
				loading = false;
			},
			failCallback: function (response) {
				doLog && console.warn('[customerSearch] - loadData.failure');
				doLog && response.event && response.event.error && console.log(response.event.error);
				doLog && response.http && response.http.status && console.log(response.http.status);
				loading = false;
				appNavigation.hideLoadingIndicator();

				if (stopRequest) {
					stopRequest = false;
					return;
				}
				appNavigation.showAlertMessage(L("please_try_again_later"));
				var status = response.Status || {};
				var message = status.Message;
				doLog && console.log(message);
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

	var customerRowController = Alloy.createController('customer/customerSearchRow', _params);

	$.customerList.appendRow(customerRowController.row);
};

/**
 * @method selectCustomerCallback
 * @private
 * Select a customer row
 * @param {Object} _params 
 * @param {Controller.CustomerSearchRow} _param.controller Controller customerSearchrow
 * @return {void}
 */
function selectCustomerCallback(_params) {
	_params = _params || {};
	var newRowSelected = _params.controller;

	if (newRowSelected !== rowSelected) {
		if (rowSelected) {
			rowSelected.selectRow(false);
		}

		rowSelected = newRowSelected;
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

	var triggerLoad;

	if (OS_ANDROID) {
		// last item shown
		triggerLoad = (position && _e.firstVisibleItem >= position && _e.totalItemCount <= (_e.firstVisibleItem + _e.visibleItemCount));

		// remember position
		position = _e.firstVisibleItem;
	} else {
		// last pixel shown
		triggerLoad = (position && _e.contentOffset.y > position) && (_e.contentOffset.y + _e.size.height > _e.contentSize.height);

		// remember position
		position = _e.contentOffset.y;

	}

	if (triggerLoad) {
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
		appNavigation.showAlertMessage(L("please_select_a_customer"));
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
 * Handle the click event of searchBarTextField, and searchBar controls.
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleLoadDataClick(_evt) {
	$.searchBarTextField.blur();
	page = 1;
	totalPageCount = 1;
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
	$.searchBarTextField.blur();
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

// Public methods---------

//TODO : Change maybe to exports.destroy to match other files
$.window.addEventListener('close', handleWindoClose);
$.customerList.addEventListener('scroll', handleOnScroll);
$.doneButton.addEventListener('click', handleDoneClick);
if (OS_IOS) {
	$.searchBarTextField.addEventListener('return', handleLoadDataClick);
	$.backView.addEventListener('click', handleBackClick);
} else {
	$.searchBar.addEventListener('click', handleLoadDataClick);
	$.titleLabel.addEventListener('click', handleBackClick);
	$.backButton.addEventListener('click', handleBackClick);
	$.searchBarTextField.addEventListener('return', handleLoadDataClick);
	$.window.addEventListener('android:back', appNavigation.closeSearchCustomerWindow);
}
$.customerList.addEventListener('click', handleCustomerListClick);

init();
