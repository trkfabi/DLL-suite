/**
 * @class Controllers.apple.main.quoteView
 * Quote View
 * @uses appNavigation
 * @uses stringFormatter
 * @uses uiHelpers
 * @uses customizations
 * @uses sessionManager
 * @uses apple.rateCards
 */
var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var appNavigation = require('/appNavigation');
var analytics = require('/utils/analytics');
var stringFormatter = require('/helpers/stringFormatter');
var uiHelpers = require('/helpers/uiHelpers');
var customizations = require('/customizations');
var sessionManager = require('/utils/sessionManager');
var configsManager = require('/utils/configsManager');
var calculatorManager = require('/apple/calculations/calculatorManager');
var rateCards = require('/apple/rateCards');

// Models/Collections

/**
 *
 * @property {Models.Customer} customer
 * @private
 * gets customers and set customer information to the quote model
 */
var customer;

/**
 * @property {Models.SalesRep} salesRep
 * @private
 * holds the user's data from the active session
 */
var salesRep = sessionManager.getSalesRep();

/**
 * @property {Models.Quote} quote
 * @private
 * holds the selected quote model, selecting the first quote if no quote is selected
 */
var quote = null;

/**
 * @property {Models.PaymentOption} paymentOptions
 * @private
 * contains payment option information
 */
var paymentOptions = null;

// Nested Controllers

/**
 * @property {Controllers.paymentOption} paymentControllers
 * @private
 * has payment options controllers
 */
var paymentControllers = {};

/**
 * @property {Controllers.paymentOption} paymentControllerSelected
 * @private
 * determines which payment controller is selected
 */
var paymentControllerSelected = null;

/**
 * @property {Controllers.paymentOption} paymentControllerOpened
 * @private
 * determines which payment controller is opened
 */
var paymentControllerOpened;

/**
 * @property {Collection.CreditRatings} creditRatings
 * @private
 * Credit ratings collection
 */
var creditRatings;

/**
 * @property {Object} creditRatingsList
 * @private
 * The list of credit rating used by the list
 */
var creditRatingsList;

/**
 * @property {Boolean} hasShownAlert
 * @private
 * Flag to know if the alert has been shown
 */
var hasShownAlert = false;

/**
 * @property {Number} maxUpdateDelay
 * @private
 * The number of times it will test if the update has ended (500ms each)
 */
var maxUpdateDelay = 10;

/**
 * @property {Number} actualUpdateDelay
 * @private
 * The number of times it has tested if the update has ended
 */
var actualUpdateDelay = 0;

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	analytics.captureEvent('[Apple-quoteView] - init()');

	if (doLog) {
		$.exportQuoteButton.addEventListener('click', handleExportQuoteButton);
	} else {
		$.headerBar.remove($.exportQuoteButton);
	}
};

/**
 * @method createNewPaymentController
 * @private
 * Utility Function: Creates a PaymentOption Controller form the given PaymentOption model
 * @param {Models.PaymentOption} _paymentOption Payment Option model
 * @return {Controller.PaymentOption} Payment Option Controller
 */
function createNewPaymentController(_paymentOption) {
	doLog && console.log('[Apple-quoteView] - createNewPaymentController()');

	return Alloy.createController('apple/payment/paymentRow', {
		quote: quote,
		paymentOption: _paymentOption,
		clickCallback: handlePaymentOptionClick,
		longpressCallback: handlePaymentOptionLongpress
	});
};

/**
 * @method selectPaymentOption
 * @private
 * Select payment option
 * @param {Models.PaymentOption} _paymentOption Payment Option model
 * @return {void}
 */
function selectPaymentOption(_paymentOption) {
	doLog && console.log('[Apple-quoteView] - selectPaymentOption()');
	_.defer(function () {
		paymentControllerSelected && paymentControllerSelected.setSelected(false);
		paymentControllerSelected = paymentControllers[_paymentOption.id];
		paymentControllerSelected && paymentControllerSelected.setSelected(true);
	});
};

/**
 * @method hasValidCustomizations
 * @private
 * Checking valid customizations
 * @return {Boolean} it returns true or false if it has a valid customization
 */
function hasValidCustomizations() {
	doLog && console.log('[Apple-quoteView] - hasValidCustomizations()');
	var _validation = customizations.validateCustomizations();

	if (!_validation.valid) {
		customizations.fetchCustomizations({
			countryData: configsManager.getConfig(),
			container: $.container,
			failureCallback: function (_data) {
				_data.message && appNavigation.showAlertMessage(_data.message);
			}
		});
	}

	return _validation.valid;
};

/**
 * @method updateCreditList
 * @private
 * Initializes the list of credit ratings
 * @return {void}
 */
function updateCreditList() {
	// TODO: call this on rateCard update callback
	doLog && console.log('[Apple-quoteView] - updateCreditList()');

	var creditRatings = rateCards.getAllCreditRatings();
	var creditRatingsLength = creditRatings.length;
	creditRatingsList = {
		sections: []
	};
	var section = {
		name: '',
		options: []
	};

	creditRatings.each(function (_creditRating, _index) {
		var creditRatingId = _creditRating.get('id');
		var creditRatingName = _creditRating.get('name');

		section.options.push({
			id: creditRatingId,
			name: creditRatingName
		});

		if (creditRatingsLength === _index + 1) {
			creditRatingsList.sections.push(section);
		}
	});
};

/**
 * @method shareQuote
 * @private
 * Attempts to share all the payment options configs via email
 * @return {void}
 */
function shareQuote() {
	doLog && console.log('[Apple-quoteView] - shareQuote()');

	var _customer = quote.get('customer');

	appNavigation.openGenerateWindow({
		quote: quote,
		recipient: 'share',
		pdfFileName: quote.get('pdfFileName'),
		doneCallback: function (_data) {
			appNavigation.openEmailDialog({
				subject: ' ',
				toRecipients: [_customer.get('email') || ''],
				messageBody: L('thank_you') + '.',
				attachments: _data.attachments
			});
		}
	});
};

/**
 * @method openPaymentOption
 * @private
 * Opens the Payment Option Controller for the given Payment Option ID, closing the past one
 * If the specified PaymentOption is already opened, it will be closed instead
 * @param {Models.PaymentOption} _paymentOption Payment Option model
 * @return {void}
 */
function openPaymentOption(_paymentOption) {
	doLog && console.log('[Apple-quoteView] - openPaymentOption() - ' + (_paymentOption ? _paymentOption.id :
		'no paymentOption'));

	paymentControllerOpened && paymentControllerOpened.toggleExpandCollapse('collapsed');
	var delay = paymentControllerOpened ? 300 : 0;

	if (_paymentOption) {
		paymentControllerOpened = paymentControllers[_paymentOption.id];
		_.defer(function () {
			setTimeout(function () {
				paymentControllerOpened && paymentControllerOpened.toggleExpandCollapse('expanded');
			}, delay);

			var index = paymentOptions.indexOf(_paymentOption);
			$.paymentsTable.scrollToIndex(index, {
				animated: false,
				position: Ti.UI.iOS.TableViewScrollPosition.TOP
			});
		});

	} else {
		paymentControllerOpened = null;
	}

};

/**
 * @method checkAddNewButton
 * @private
 * Checks if the Add New button should be enabled or disbled
 * @return {void}
 */
function checkAddNewButton() {
	doLog && console.log('[Apple-quoteView] - checkAddNewButton()');

};

/**
 * @method updateNameField
 * @private
 * Updates customer name textfield only when customQuoteName is set throught longpress and customer name is null.
 * @return {void}
 */
function updateNameField() {
	$.customerNameField.value = customer.get('name');
}

/**
 * @method cleanUpPayments
 * @private
 * Removes all payment controllers from memory
 * @return {void}
 */
function cleanUpPayments() {
	doLog && console.log('[Apple-quoteView] - cleanUpPayments()');

	_.each(paymentControllers, function (_paymentController) {
		_paymentController.cleanUp();
	});

	paymentControllers = {};
}

/**
 * @method showOutdateAlert
 * @private
 * Shows the outdate alert dialog if it hasn't been show before
 * @return {void}
 */
function showOutdateAlert() {
	if (Alloy.Globals.updateRequestLoading && actualUpdateDelay <= maxUpdateDelay) {
		actualUpdateDelay++;
		setTimeout(showOutdateAlert, 500);
		return;
	}
	actualUpdateDelay = 0;
	if (!Alloy.Globals.updateDialogIsVisible && !hasShownAlert && quote.isOutdated()) {
		hasShownAlert = true;

		_.defer(function () {
			appNavigation.showAlertMessage(L('quote_not_available'));
		});
	}
}

/**
 * @method refreshUI
 * Forces the UI refresh of the whole quote
 * @return {void}
 */
$.refreshUI = function () {
	doLog && console.log('[Apple-quoteView] - refreshUI()');

	var paymentsTableData = [];
	var canDeletePayments = false;

	if (quote && quote !== undefined) {
		$.customerNameField.value = customer.get('name') || '';
		$.spCreditField.value = quote.get('creditRatingName');
		$.amountFinancedValueLabel.text = stringFormatter.formatCurrency(quote.get('amountFinanced'));

		if (!quote.isActive()) {
			uiHelpers.setElementEnabled($.addNewContainer, false);
			uiHelpers.setElementEnabled($.spCreditField, false);
			uiHelpers.setElementEnabled($.customerNameField, !quote.isSubmitted());
			uiHelpers.setElementEnabled($.amountFinancedLabel, false);
			uiHelpers.setElementEnabled($.amountFinancedValueLabel, false);
			uiHelpers.setElementEnabled($.creditSearchButton, false);

			_.each(paymentControllers, function (_paymentController) {
				_paymentController.disableAllControls();
			});
		} else {
			uiHelpers.setElementEnabled($.spCreditField, true);
			uiHelpers.setElementEnabled($.customerNameField, true);
			uiHelpers.setElementEnabled($.amountFinancedLabel, true);
			uiHelpers.setElementEnabled($.amountFinancedValueLabel, true);
			uiHelpers.setElementEnabled($.creditSearchButton, true);

			if (paymentOptions.length >= 5) {
				uiHelpers.setElementEnabled($.addNewContainer, false);
			} else {
				uiHelpers.setElementEnabled($.addNewContainer, true);
			}

			_.each(paymentControllers, function (_paymentController) {
				_paymentController.enableAllControls();
			});
		}

		if (paymentOptions) {
			canDeletePayments = (paymentOptions.length > 1) && quote.isActive();

			paymentOptions.each(function (_paymentOption, _index) {
				var paymentController = paymentControllers[_paymentOption.id];

				if (!paymentController) {
					paymentController = createNewPaymentController(_paymentOption);
					paymentControllers[_paymentOption.id] = paymentController;
				}

				paymentController.setPaymentOptionIndex(_index + 1);
				paymentController.refreshUI();
				paymentController.getView().editable = canDeletePayments;

				paymentsTableData.push(paymentController.getView());
			});
		}

		paymentsTableData.push($.addNewRow);

		$.paymentsTable.editable = canDeletePayments;
		$.paymentsTable.data = paymentsTableData;

		showOutdateAlert();
	}
};

/**
 * @method setQuote
 * Set quotes. Adding, and removing event for quotes, and payments
 * @param {Models.Quote} Quote model
 * @param {Boolean} _showLoading if the loading indicator must be shown
 * @return {void}
 */
$.setQuote = function (_quote, _showLoading) {
	if (_quote && _quote === quote) {
		return false;
	}

	hasShownAlert = false;

	_showLoading && $.loadingIndicator.show();

	cleanUpPayments();

	if (quote) {
		quote.off('change:paymentOptionSelected', handlePaymentOptionSelectedChange);
		quote.off('change:paymentOptionOpened', handlePaymentOptionOpenedChange);
		quote.off('change:submitStatus', handleSubmitStatusChange);
		quote.off('change:creditRatingName', handleCreditRatingChange);
		quote.off('change:amountFinanced', handleAmountFinancedChange);
		quote.off('change:isOutdated', handleQuoteOutdatedChange);
		customer.off('change:name', updateNameField);
		paymentOptions && paymentOptions.off('add', handlePaymentOptionsAdd);
		paymentOptions && paymentOptions.off('remove', handlePaymentOptionsRemove);
	}

	quote = _quote;

	if (quote) {
		paymentOptions = quote.get('paymentOptions');
		customer = quote.get('customer');

		if (quote.shouldRecalculate()) {
			calculatorManager.handleQuoteChange({
				quote: quote,
				shouldRecalculate: true
			});
		}

		quote.on('change:paymentOptionSelected', handlePaymentOptionSelectedChange);
		quote.on('change:paymentOptionOpened', handlePaymentOptionOpenedChange);
		quote.on('change:submitStatus', handleSubmitStatusChange);
		quote.on('change:creditRatingName', handleCreditRatingChange);
		quote.on('change:amountFinanced', handleAmountFinancedChange);
		quote.on('change:isOutdated', handleQuoteOutdatedChange);
		customer.on('change:name', updateNameField);
		paymentOptions && paymentOptions.on('add', handlePaymentOptionsAdd);
		paymentOptions && paymentOptions.on('remove', handlePaymentOptionsRemove);
	}
	if (quote) {
		selectPaymentOption(quote.getSelectedPaymentOption());
		if (quote.isSubmitted()) {
			openPaymentOption(quote.getSelectedPaymentOption());
		} else {
			var openPayment = _.debounce(function () {
				openPaymentOption(quote.getOpenedPaymentOption());
			}, 1000);

			openPayment();

			calculatorManager.handleRateCardUpdateValidationSingleQuote(quote);
		}
	}
	$.refreshUI();

	_showLoading && $.loadingIndicator.hide();

};

/**
 * @method blurFields
 * Blurs all fields, hiding the soft keyboard
 * return {void}
 */
$.blurFields = function () {
	doLog && console.log('[Apple-quoteView] - blurFields()');
	$.customerNameField.blur();
};

/**
 * @method cleanUp
 * Removes all memory dependencies
 * @return {void}
 */
$.cleanUp = function () {
	doLog && console.log('[Apple-quoteView] - cleanUp()');

	cleanUpPayments();

	if (quote) {
		quote.off('change:paymentOptionSelected', handlePaymentOptionSelectedChange);
		quote.off('change:paymentOptionOpened', handlePaymentOptionOpenedChange);
		quote.off('change:submitStatus', handleSubmitStatusChange);
		quote.off('change:creditRatingName', handleCreditRatingChange);
		quote.off('change:amountFinanced', handleAmountFinancedChange);
		quote.off('change:isOutdated', handleQuoteOutdatedChange);
		customer.off('change:name', updateNameField);
		paymentOptions && paymentOptions.off('add', handlePaymentOptionsAdd);
		paymentOptions && paymentOptions.off('remove', handlePaymentOptionsRemove);
	}
};

// Model events

/**
 * @method handlePaymentOptionSelectedChange
 * @private
 * Handle the payment option selected change
 * @param {Models.Quote} _quote Quote Model
 * @param {String} _paymentOptionID Id of the payment option
 * @param {Object} _options Payment options
 * @return {void}
 */
function handlePaymentOptionSelectedChange(_quote, _paymentOptionID, _options) {
	doLog && console.debug('[Apple-quoteView] - handlePaymentOptionSelectedChange()');

	var _paymentOption = paymentOptions.get(_paymentOptionID);
	selectPaymentOption(_paymentOption);
};

/**
 * @method handlePaymentOptionOpenedChange
 * @private
 * Handle the payment option opened change
 * @param {Models.Quote} _quote Quote Model
 * @param {String} _paymentOptionID Id of the payment option
 * @param {Object} _options Payment options
 * @return {void}
 */
function handlePaymentOptionOpenedChange(_quote, _paymentOptionID, _options) {
	doLog && console.debug('[Apple-quoteView] - handlePaymentOptionOpenedChange()');

	var _paymentOption = paymentOptions.get(_paymentOptionID);
	openPaymentOption(_paymentOption);
};

/**
 * @method handlePaymentOptionsAdd
 * @private
 * Handle the payment options add
 * @param {Models.PaymentOption} _paymentOption Payment option model
 * @param {Object} _paymentOptions Payment option for the model
 * @param {Object} _options Payment options
 * @return {void}
 */
function handlePaymentOptionsAdd(_paymentOption, _paymentOptions, _options) {
	doLog && console.debug('[Apple-quoteView] - handlePaymentOptionOpenedChange()');

	var newPaymentController = createNewPaymentController(_paymentOption);

	paymentControllers[_paymentOption.id] = newPaymentController;

	$.paymentsTable.insertRowBefore(_options.index, newPaymentController.getView());

	$.refreshUI();
};

/**
 *
 * @method handlePaymentOptionsRemove
 * @private
 * Handle the payment options remove
 * @param {Models.PaymentOption} _paymentOption
 * @param {Object} _paymentOptions Payment options for the model
 * @param {Object} _options Payment option
 * @return {void}
 */
function handlePaymentOptionsRemove(_paymentOption, _paymentOptions, _options) {
	doLog && console.debug('[Apple-quoteView] - handlePaymentOptionsRemove()');

	var paymentOptionId = _paymentOption.id;
	var paymentController = paymentControllers[paymentOptionId];
	var paymentSelectedId = paymentControllerSelected ? paymentControllerSelected.getPaymentOption().id : null;
	var paymentOpenedId = paymentControllerOpened ? paymentControllerOpened.getPaymentOption().id : null;

	if (paymentSelectedId && paymentSelectedId === paymentOptionId) {
		paymentControllerSelected = null;
	}

	if (paymentOpenedId && paymentOpenedId === paymentOptionId) {
		paymentControllerOpened = null;
	}

	if (paymentController) {
		$.paymentsTable.deleteRow(paymentController.getView());
		delete paymentControllers[paymentOptionId];
	}

	_.defer(function () {
		$.refreshUI();
	});
};

/**
 * @method handlePaymentOptionClick
 * @private
 * Callback to handle the payment option click
 * @param {Object} _evt to detect the deleteButton, duplicateButton, and the solveForButton controls
 * @return {void}
 */
function handlePaymentOptionClick(_evt) {
	doLog && console.debug('[Apple-quoteView] - handlePaymentOptionClick()');

	var paymentOption = _evt.paymentOption;

	if (paymentOption) {
		quote.togglePaymentOptionOpened(paymentOption);
	}
};

/**
 * @method handlePaymentOptionLongpress
 * @private
 * Handle the payment option longpress callback
 * @param {Object} _evt Used it for the payment option of the event
 * @return {void}
 */
function handlePaymentOptionLongpress(_evt) {
	doLog && console.debug('[Apple-quoteView] - handlePaymentOptionLongpress()');

	var paymentOption = _evt.paymentOption;

	if (paymentOption && !quote.isSubmitted()) {
		quote.set('paymentOptionSelected', paymentOption.id).save();
	}
};

/**
 * @method handleSubmitStatusChange
 * @private
 * Handler for the submitStatus change callbacks
 * @param {Model.Quote} _quote Quote that changed
 * @param {Object} [_options] Optional parameters coming from the change event
 * @return {void}
 */
function handleSubmitStatusChange(_quote, _options) {
	doLog && console.debug('[Apple-quoteView] - handleSubmitStatusChange()');
	$.refreshUI();
};

/**
 * @method handleCreditRatingChange
 * @private
 * Handler for the credit rating change callbacks
 * @param {Model.Quote} _quote Quote that changed
 * @param {Object} [_options] Optional parameters coming from the change event
 * @return {void}
 */
function handleCreditRatingChange(_quote, _options) {
	doLog && console.debug('[Apple-quoteView] - handleCreditRatingChange()');

	$.refreshUI();
};

/**
 * @method handleQuoteOutdatedChange
 * @private
 * Function handler for the isOutdated status of any of the quote within the quote
 * @param {Models._quote} __quote Quote that changed
 * @param {Object} [_options] Optional parameters coming from the change event
 * @return {void}
 */
function handleQuoteOutdatedChange(__quote, _isOutdated) {
	doLog && console.log('[Apple-quoteView] - handleQuoteOutdatedChange()');

	if (quote && (quote.isOutdated() || quote.isSubmitted())) {

		uiHelpers.setElementEnabled($.addNewContainer, false);
		uiHelpers.setElementEnabled($.spCreditField, false);
		uiHelpers.setElementEnabled($.customerNameField, !quote.isSubmitted());
		uiHelpers.setElementEnabled($.amountFinancedLabel, false);
		uiHelpers.setElementEnabled($.amountFinancedValueLabel, false);

		_.each(paymentControllers, function (_paymentController) {
			_paymentController.disableAllControls();
		});

		showOutdateAlert();
	}
}

/**
 * @method handleAmountFinancedChange
 * @private
 * Handler for the amount financed change callbacks
 * @param {Model.Quote} _quote Quote that changed
 * @param {Object} [_options] Optional parameters coming from the change event
 * @return {void}
 */
function handleAmountFinancedChange(_quote, _options) {
	doLog && console.debug('[Apple-quoteView] - handleAmountFinancedChange()');

	$.amountFinancedValueLabel.text = stringFormatter.formatCurrency(quote.get('amountFinanced'));
};

// UI Events
/**
 * @method handleHeaderClick
 * @private
 * Handle the click event of the header control
 * @param {Object} _evt Click event to detect the navLeftButton, flipButton, uploadButton, and summaryButton
 * @return {void}
 */
function handleHeaderClick(_evt) {
	var id = _evt.source.id;
	doLog && console.debug('[Apple-quoteView] - handleHeaderClick() - ' + id);

	switch (id) {
	case 'menuButton':
		// TODO: use analytics.capture() instead
		analytics.captureTiAnalytics('AFS-MainWindow-OpenQuoteList');
		analytics.captureEvent('[quoteView] - Nav Left Button Click');
		$.blurFields();
		appNavigation.handleNavLeftButton();
		break;

	case 'shareButton':
		if (!hasValidCustomizations()) {
			return;
		}

		analytics.captureTiAnalytics('AFS-MainWindow-ShareQuoteViaEmail');
		analytics.captureEvent('[quoteView] - Upload Button');

		quote.addAnalyticsCounter('share');

		shareQuote();
		break;

	case 'summaryButton':
		if (!hasValidCustomizations()) {
			return;
		}

		analytics.captureEvent('[quoteView] - Summary Click');

		appNavigation.openSummaryWindow({
			quote: quote,
			backLabel: '',
			backButton: '/images/ic_topbar_gray.png'
		});
		break;
	}
};

/**
 * @method handleTextFieldChange
 * @private
 * Handles changes on textfields and saves the values
 * @param {Object} _evt gets the click event
 * @return {void}
 */
function handleTextFieldChange(_evt) {
	doLog && console.debug('[Apple-quoteView] - handleTextFieldChange()');

	var customerData = {};
	var value = _evt.source.value;
	if (OS_IOS) {
		value = uiHelpers.replaceQuotes(value);
		_evt.source.value = value;
	}
	customerData.name = value;

	customer.set(customerData);
	quote.save();
};

/**
 * @method handleAmountFinancedClick
 * @private
 * //TBD
 * @return {void}
 */
function handleAmountFinancedClick(_evt) {
	analytics.captureTiAnalytics('AFS-MainWindow-AccessProductsServices');
	appNavigation.openEquipmentWindow({
		quote: quote
	});
};

/**
 * @method handleAddDetailsButtonClick
 * @private
 * //TBD
 * @return {void}
 */
function handleAddDetailsButtonClick(_evt) {
	analytics.captureTiAnalytics('AFS-MainWindow-TapIntoCustomerName');

	appNavigation.openCustomerDetailsWindow({
		quote: quote,
		closeCallback: handleCustomerDetailsWindowClose
	});
}

/**
 * @method handleCustomerNameTextFieldFocus
 * @private
 * Handler for the focus event on the Customer Name Text Field
 * @param {Object} _evt
 * @return {void}
 */
function handleCustomerNameTextFieldFocus(_evt) {
	analytics.captureTiAnalytics('AFS-MainWindow-TapIntoCustomerName');
}

/**
 * @method handleCustomerDetailsWindowClose
 * @private
 * @return {void}
 */
function handleCustomerDetailsWindowClose(_data) {
	$.refreshUI();
};

/**
 * @method handlePaymentsTableClick
 * @private
 * //TBD
 * @return {void}
 */
function handlePaymentsTableClick(_evt) {
	doLog && console.debug('[Apple-quoteView] - handlePaymentsTableClick()');
	var id = _evt.source.id;
	var rowData = _evt.rowData;
	$.blurFields();
	switch (id) {
	case 'addNewContainer':
		analytics.captureTiAnalytics('AFS-MainWindow-Payment-Add');
		quote.addPaymentOption();
		quote.save();
		break;
		// TODO: manage another click that affects the quote view
	}
};

/**
 * @method handlePaymentsTableDelete
 * @private
 * //TBD
 * @return {void}
 */
function handlePaymentsTableDelete(_evt) {
	doLog && console.debug('[Apple-quoteView] - handlePaymentsTableDelete()');

	var index = _evt.index || 0;
	var paymentId = _evt.rowData.paymentId;
	var paymentOption = paymentOptions.get(paymentId);

	if (paymentOption) {
		analytics.captureTiAnalytics('AFS-MainWindow-DeletePaymentOption');

		delete paymentControllers[paymentId];
		quote.removePaymentOption(paymentOption);
		quote.save();
	}
};

/**
 * @method handleSPCreditClick
 * @private
 * //TBD
 * @return {void}
 */
function handleSPCreditClick(_evt) {
	analytics.captureTiAnalytics('AFS-MainWindow-TapIntoCreditRating');
	doLog && console.debug('[Apple-quoteView] - handleSPCreditClick()');

	if (!creditRatingsList) {
		updateCreditList();
	}

	appNavigation.openOptionsWindow({
		title: L('s_p_rating'),
		options: creditRatingsList,
		doneCallback: handleSPCreditWindowDone,
		cancelCallBack: handleSPCreditWindowCancel
	});
};

/**
 * @method handleSPCreditWindowDone
 * @private
 * Handles S&P Credit Window done
 * @param {Object} _data credit rating selected
 * @param {String} _data.id credit rating id selected
 * @param {String} _data.name credit rating name selected
 * @return {void}
 */
function handleSPCreditWindowDone(_data) {
	analytics.captureTiAnalytics('AFS-CreditRatingList-SelectRating');
	doLog && console.debug('[Apple-quoteView] - handleSPCreditWindowDone()');
	var option = _data.option || {};

	quote.addAnalyticsCounter('creditRating');
	calculatorManager.handleQuoteChange({
		quote: quote,
		creditRatingId: option.id,
		creditRatingName: option.name,
	});
};

/**
 * @method handleSPCreditWindowCancel
 * @private
 * Handles S&P Credit Window done
 * @return {void}
 */
function handleSPCreditWindowCancel() {
	doLog && console.debug('[Apple-quoteView] - handleSPCreditWindowCancel()');
	quote.addAnalyticsCounter('creditRatingCancel');
};

/**
 * @method handleCreditRatingSearchClick
 * @private
 * Handles rating search click
 * @param {Object} _evt event object
 * @return {void}
 */
function handleCreditRatingSearchClick(_evt) {
	analytics.captureTiAnalytics('AFS-MainWindow-SearchCreditRating');
	appNavigation.openCreditRatingSearchWindow({
		quote: quote,
		searchTerm: $.customerNameField.value.trim(),
		callback: handleCreditRatingSearchDone
	});
}

/**
 * @method handleCreditRatingSearchDone
 * @private
 * Handles Credit Rating Search done
 * @param {Object} _entity Selected entity
 * @param {String} _entity.selectedSection Selected entity type, 
 * @param {Object} _entity.entitySelected Selected entity
 * @param {String} _entity.entitySelected.accountName Selected entity account name
 * @param {String} _entity.entitySelected.parentName Selected entity parent name
 * @param {String} _entity.entitySelected.rating Selected entity
 * @return {void}
 */
function handleCreditRatingSearchDone(_entity) {
	doLog && console.log('[Apple-quoteView] - handleCreditRatingSearchDone');

	if (!creditRatingsList) {
		updateCreditList();
	}

	var customerData = {};
	var ratingFound = null;
	var ratingName = _entity.entitySelected.rating;
	var accountName = _entity.entitySelected.accountName;
	var validRatings = rateCards.getValidRatings();

	customer.set('name', accountName);

	if (creditRatingsList.sections.length === 0) {
		doLog && console.warn('[Apple-quoteView] - handleCreditRatingSearchDone - no SP ratings to validate');
		return false;
	}

	if (_entity.selectedSection !== 'foundSection') {
		ratingName = 'BBB+';
	}

	if (!_.contains(validRatings, ratingName)) {
		ratingName = 'BBB+';
	}

	ratingFound = _.find(creditRatingsList.sections[0].options, function (_rating) {
		return _rating.name === ratingName;
	});

	if (!ratingFound) {
		var options = creditRatingsList.sections[0].options;

		ratingFound = _.last(options);
	}

	calculatorManager.handleQuoteChange({
		quote: quote,
		creditRatingId: ratingFound.id,
		creditRatingName: ratingFound.name
	});
}

/**
 * @method handleExportQuoteButton
 * @private
 * Exportthe quote information in an email
 * @param {Object} _evt
 * @return {void}
 */
function handleExportQuoteButton(_evt) {
	doLog && console.log('[Apple-quoteView] - handleExportQuoteButton');

	var opts = {
		cancel: 2,
		options: ['Current', 'All', L('cancel')],
		selectedIndex: 2,
		destructive: 0,
		title: 'Export Quotes'
	};
	var dialog = Ti.UI.createOptionDialog(opts);
	dialog.addEventListener('click', function (_click) {
		if (_click.index === 0) {
			exportCurrentQuote();
		} else if (_click.index === 1) {
			exportAllQuotes();
		}
	});
	dialog.show();
}

/**
 * @method exportCurrentQuote
 * @private
 * Exports the current quote selected
 * @return {void}
 */
function exportCurrentQuote() {
	doLog && console.log('[Apple-quoteView] - exportCurrentQuote');

	var salesRep = sessionManager.getSalesRep();
	var customer = quote.get('customer');
	var quoteName = customer.get('name');
	var exportedQuote = quote.exportQuote();
	var quoteFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'quote_' + quoteName + '.json');

	doLog && console.log('[Apple-quoteView] - exportedQuote: ' + JSON.stringify(quote.toJSON(), null, '	'));

	quoteFile.write(exportedQuote);

	appNavigation.openEmailDialog({
		subject: 'Quote for: ' + quoteName,
		toRecipients: [salesRep.get('email') || ''],
		messageBody: L('thank_you') + '.',
		attachments: [{
			fileName: quoteFile.name
		}]
	});
}

/**
 * @method exportAllQuotes
 * @private
 * Export all quotes from current user
 * @return {void}
 */
function exportAllQuotes() {
	doLog && console.log('[Apple-quoteView] - exportAllQuotes');

	var salesRep = sessionManager.getSalesRep();
	var localQuotes = Alloy.createCollection('quote');
	var salesRepUser = salesRep.get('username');
	var quoteFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'quote_' + salesRepUser + '.csv');
	var exportedQuotes = [];
	var position = 1;

	localQuotes.fetch({
		localOnly: true,
		salesRepID: salesRep.id
	});
	localQuotes = localQuotes.toJSON({
		parseNested: true
	});

	doLog && console.log('localQuotes.length: ' + JSON.stringify(localQuotes.length, null, '	'));

	_.each(localQuotes, function (_quote) {
		exportedQuotes.push({
			number: position,
			name: _quote.name,
			customer: _quote.customer.name,
			created_date: _quote.dateCreated,
			alloy_id: _quote.alloy_id
		});
		position++;
	});
	var csvText = 'Position,Name,Customer,Created Date, Alloy Id\n';
	csvText += stringFormatter.convertJsonToCSV(exportedQuotes);
	quoteFile.write(csvText);

	appNavigation.openEmailDialog({
		subject: 'Quotes for: ' + salesRepUser,
		toRecipients: [salesRep.get('email') || ''],
		messageBody: L('thank_you') + '.',
		attachments: [{
			fileName: quoteFile.name
		}]
	});
}

$.headerView.addEventListener('click', handleHeaderClick);
$.amountFinancedView.addEventListener('click', handleAmountFinancedClick);
$.creditSearchButton.addEventListener('click', handleCreditRatingSearchClick);
$.paymentsTable.addEventListener('click', handlePaymentsTableClick);
$.paymentsTable.addEventListener('delete', handlePaymentsTableDelete);

$.addDetailsButton.addEventListener('click', handleAddDetailsButtonClick);
$.customerNameField.addEventListener('change', handleTextFieldChange);
$.customerNameField.addEventListener('focus', handleCustomerNameTextFieldFocus);
$.spCreditField.addEventListener('click', handleSPCreditClick);

init();
