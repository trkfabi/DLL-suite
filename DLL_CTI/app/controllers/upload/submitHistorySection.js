/**
 * @class Controllers.upload.submitHistorySection
 * Submit history data Section
 * 
 */
var args = arguments[0] || {};
var stringFormatter = require('/helpers/stringFormatter');

var quote = args.quote;
var requests = quote.get('requests');
var attemptItems = [];

/**
 * @method init
 * @private
 * Initialize values for submit history section
 * @return {void}
 */
function init() {
	doLog && console.log('[submitHistorySection] - init()');

	quote.on('change:submitStatus', refresh);
	requests.on('add', handleSubmitAttemptAdded);
	requests.on('change:submitStatus', handleSubmitAttemptChanged);

	refresh();
};

/**
 * @method refresh
 * @private
 * Initialize values for submit history section
 * @return {void}
 */
function refresh() {
	doLog && console.log('[submitHistorySection] - refresh()');

	var _paymentOption = quote.getSelectedPaymentOption();

	$.quoteNameLabel.text = quote.get('name');
	_paymentOption && ($.paymentAmountLabel.text = stringFormatter.formatCurrency(_paymentOption.get('payment')));
	switch (quote.get('submitStatus')) {
	case Alloy.Globals.submitStatus.submitted:
	case Alloy.Globals.submitStatus.unsubmitted:
		$.footerContainer.remove($.retryButton);
		break;
	case Alloy.Globals.submitStatus.sent:
		$.retryButton.applyProperties({
			touchEnabled: false,
			opacity: 0.2
		});
		break;
	case Alloy.Globals.submitStatus.pending:
		$.retryButton.applyProperties({
			touchEnabled: true,
			opacity: 1.0
		});
	};

	attemptItems = [];
	requests.each(addRequestItem);
	$.submitHistorySection.items = attemptItems;
};

/**
 * @method addRequestItem
 * @private
 * Add a request item 
 * @param {Object} _requestModel Parameter to be used it to add a request item
 * @return {void}
 */
function addRequestItem(_requestModel) {
	doLog && console.log('[submitHistorySection] - addRequestItem()');

	attemptItems.push(createRequestItem(_requestModel));
};

/**
 * @method createRequestItem
 * @private
 * Initialize values for submit history window
 * @param {Object} _requestModel Parameter to be used it to create a request item
 * @return {Object} Return a request item data
 */
function createRequestItem(_requestModel) {
	doLog && console.log('[submitHistorySection] - createRequestItem()');

	var _tryDate = new moment(_requestModel.get('date'));
	var _tryStatus = 'N/A';
	var _tryStatusColor = Alloy.Globals.colors.black;
	var _itemData = {};

	switch (_requestModel.get('submitStatus')) {
	case Alloy.Globals.submitStatus.sent:
		_tryStatus = 'In Progress';
		_tryStatusColor = Alloy.Globals.colors.inProgress;
		break;
	case Alloy.Globals.submitStatus.pending:
		_tryStatus = 'Error';
		_tryStatusColor = Alloy.Globals.colors.error;
		break;
	case Alloy.Globals.submitStatus.submitted:
		_tryStatus = 'Successful';
		_tryStatusColor = Alloy.Globals.colors.success;
	}

	_itemData = {
		'attemptNumberLabel': {
			text: 'Attempt ' + (attemptItems.length + 1)
		},
		'attemptDateLabel': {
			text: _tryDate.format(L('format_date'))
		},
		'attemptTimeLabel': {
			text: _tryDate.format(L('format_time'))
		},
		'attemptStatusLabel': {
			text: _tryStatus,
			color: _tryStatusColor
		},
	};

	return _itemData;
};

/**
 * @method handleSubmitAttemptAdded
 * @private
 * Handle the submit attempt added
 * param {Object} _requestModel Parameter to be used it to submit attempt added
 * @return {void}
 */
function handleSubmitAttemptAdded(_requestModel) {
	doLog && console.log('[submitHistorySection] - handleSubmitAttemptAdded() - _requestModel: ' + JSON.stringify(
		_requestModel));

	var _tryItem = createRequestItem(_requestModel);
	attemptItems.push(_tryItem);
	$.submitHistorySection.appendItems([_tryItem]);
};

/**
 * @method handleSubmitAttemptChanged
 * @private
 * Handle the submit attempt changed 
 * @return {void}
 */
function handleSubmitAttemptChanged() {
	doLog && console.log('[submitHistorySection] - handleSubmitAttemptChanged()');
	args.onRefresh && args.onRefresh();
};

/**
 * @method handleRetryButtonClick
 * @private
 * Handle the click event for the retryButton control.
 * @param {Object} _evt Parameter for the click event on the retryButton control
 * @return {void}
 */
function handleRetryButtonClick(_evt) {
	appNavigation.handleQuoteSubmit(quote);
	refresh();
};

$.retryButton.addEventListener('click', handleRetryButtonClick);

init();
