/**
 * @class Controllers.main.quoteView
 * Quote View
 * @uses appNavigation
 * @uses Utils.analytics
 * @uses customizations
 * @uses Calculations.calculatorManager
 * @uses Helpers.uiHelpers
 * @uses Utils.analytics
 * @uses Libs.sessionManager
 */

const LOG_TAG = '\x1b[31m' + '[main/quoteView]' + '\x1b[39;49m ';

var args = arguments[0] || {};
// Libraries
var appNavigation = require('/appNavigation');
var analytics = require('/utils/analytics');
var customizations = require('/customizations');
var configsManager = require('/utils/configsManager');
var calculatorManager = require('/calculations/calculatorManager');
var uiHelpers = require('/helpers/uiHelpers');
var sessionManager = require('/utils/sessionManager');

// Models/Collections

/**
 * @property {Models.Quote} quote holds the selected quote model, selecting the first quote if no quote is selected
 */
var quote;

/**
 * @property {Models.PaymentOption} paymentOptions contains payment option information
 */
var paymentOptions;

// Nested Controllers

/**
 * @property {Controllers.paymentOption} paymentControllers has payment options controllers
 */
var paymentControllers = {};

/**
 * @property {Controllers.paymentOption} paymentControllerOpened determines which payment controller is opened
 */
var paymentControllerOpened;

/**
 * @property {Controllers.paymentOption} paymentControllerSelected  determines which payment controller is selected
 */
var paymentControllerSelected;

/**
 * @property {Object} previousUIPaymentOptionValuesForUndo sets the previous payment option values
 */
var previousUIPaymentOptionValuesForUndo = {};

/**
 * @property {Integer} maxPaymentsQuantityAllowed maximum quantity of payments allowed so proposal fits 1 page
 */
const maxPaymentsQuantityAllowed = 5;

/**
 * @property {Boolean} isSharingPDF prevents multiple alert dialogs if the user taps the button multiple times
 */
var isSharingPDF = false;

// Utility variables

// Private Functions

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	doLog && console.log('[quoteView] - init()');

	if (doLog) {
		$.exportQuoteButton.addEventListener('click', handleExportQuoteButton);
	} else {
		$.header.remove($.exportQuoteButton);
	}
};

/**
 * @method findPaymentController
 * @private
 * Find a payment controller
 * @param {Models.PaymentOption} _paymentOption Model used it to be compared  with a payment option
 * @return {Models.PaymentOption} Model with the payment option
 */
function findPaymentController(_paymentOption) {
	return _.find(paymentControllers, function (_paymentController) {
		return _paymentController.getPaymentOption() === _paymentOption;
	});
};

/**
 * @method createNewPaymentController
 * @private
 * Utility Function: Creates a PaymentOption Controller form the given PaymentOption model
 * @param {Models.PaymentOption} _paymentOption Payment Option model
 * @return {Controller.PaymentOption} Payment Option Controller
 */
function createNewPaymentController(_paymentOption) {
	return Alloy.createController('paymentOption/paymentOption', {
		paymentOptions: paymentOptions,
		paymentOption: _paymentOption,
		clickCallback: handlePaymentControllerClick,
		longpressCallback: handlePaymentOptionLongpress,
		swipeCallback: handlePaymentOptionSwipe
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
	analytics.captureApm('[quoteView] - selectPaymentOption() - ' + (_paymentOption ? _paymentOption.id :
		'no _paymentOption'));
	paymentControllerSelected && paymentControllerSelected.setSelected(false);
	paymentControllerSelected = paymentControllers[_paymentOption.id];
	paymentControllerSelected && paymentControllerSelected.setSelected(true);
	paymentControllerSelected && $.equipmentPrice.setPaymentOption(_paymentOption);
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
	paymentControllerOpened && paymentControllerOpened.toggleExpanded(false);

	if (_paymentOption) {
		analytics.captureApm('[quoteView] - selectPaymentOption() - ' + _paymentOption.id);
		paymentControllerOpened = paymentControllers[_paymentOption.id];
		paymentControllerOpened && paymentControllerOpened.toggleExpanded(true);
		paymentControllerOpened && $.equipmentPrice.setPaymentOption(_paymentOption);

		setTimeout(function () {
			var _index = paymentOptions.indexOf(_paymentOption);
			var _newY = _index * Alloy.Globals.paymentRowHeight;
			$.paymentsTableView.scrollTo(0, _newY);

		}, 300);
	} else {
		paymentControllerOpened = null;
	}
};

/**
 * @method hasValidCustomizations
 * @private
 * Checking valid customizations
 * @return {Boolean} it returns true or false if it has a valid customization
 */
function hasValidCustomizations() {
	analytics.captureApm('[quoteView] - hasValidCustomizations()');
	var _validation = customizations.validateCustomizations();
	if (!_validation.valid) {
		appNavigation.showAlertMessage(L('error_downloading_terms_and_conditions'));
		customizations.fetchCustomizations({
			countryData: configsManager.getConfig(),
			container: $.container
		});
	}

	return _validation.valid;
};

/**
 * @method shareQuote
 * @private
 * Attempts to share all the payment options configs via email
 * @return {void}
 */
function shareQuote() {
	appNavigation.hideKeyboard();

	$.optionDialog.show();
};

/**
 * @method handleDialogClick
 * @private
 * Handle dialog button click
 * @param {Object} _evt Dialog selected option
 * @return {void}
 */
function handleDialogClick(_evt) {
	var _customer = quote.get('customer');

	switch (_evt.index) {
	case 0:
		analytics.captureTiAnalytics('OTHC-MainWindow-ShareCreateProposal');
		analytics.captureApm('[quoteView] - Create Proposal Button');
		quote.addAnalyticsCounter('proposal');
		// Do not delete, in case DLL wants to modify this behaviour again.
		//var proposalHtmlExists = customizations.getFile('proposal');
		//if (!proposalHtmlExists) {
		//	return;
		//}
		break;
	case 1:
		analytics.captureTiAnalytics('OTHC-MainWindow-ShareCreateLease');
		analytics.captureApm('[quoteView] - Create Lease Button');
		quote.addAnalyticsCounter('lease');
		break;
	case 2:
		return;
	}

	appNavigation.openGenerateWindow({
		quote: quote,
		recipient: _evt.index == 0 ? 'proposal' : 'lease',
		doneCallback: function (_data) {
			if (_data.attachments) {
				appNavigation.sharePDF({
					subject: '',
					attachments: _data.attachments
				});
			} else {
				doLog && console.log('[quoteView] - FAILED TO LOAD ATTACHMENT');
				handleDialogClick(_evt);
			}
		}
	});
}

/**
 * @method closeAllPaymentsMenus
 * @private
 * Close all the the payments menus
 * @param {String} _paymentOptionID It will close all the menus, but that one
 * @return {void}
 */
function closeAllPaymentsMenus(_paymentOptionID) {
	doLog && console.log('[quoteView] - closeAllPaymentsMenus()');

	_.each(paymentControllers, function (_paymentController, _paymentID) {
		if (_paymentOptionID !== _paymentID) {
			_paymentController.toggleMenuOpened(false);
		}
	});
};

/**
 * @method updatePaymentsStatus
 * @private
 * Updates all the delete button status and payment index for each payment option
 * @return {void}
 */
function updatePaymentsStatus() {
	doLog && console.log('[quoteView] - updatePaymentsStatus()');

	_.each(paymentControllers, function (_paymentController) {
		var index = paymentOptions.indexOf(_paymentController.getPaymentOption());

		_paymentController.setDeleteButtonActive(paymentOptions.length > 1);
		_paymentController.setDuplicateButtonActive(paymentOptions.length < maxPaymentsQuantityAllowed);
		_paymentController.setPaymentOptionIndex(index + 1);
	});

	setPaymentOptionsAddRowStatus();
};

/**
 * @method cleanUp
 * Stop listening to events for quotes, and removing their callbacks
 * @return {void}
 */
$.cleanUp = function () {
	if (quote) {
		doLog && console.log('[quoteView] - cleanUp()');

		quote.off('change:paymentOptionSelected', handlePaymentOptionSelectedChange);
		quote.off('change:paymentOptionOpened', handlePaymentOptionOpenedChange);
		quote.off('change:submitStatus', handleSubmitStatusChange);
		paymentOptions.off('add', handlePaymentOptionsAdd);
		paymentOptions.off('remove', handlePaymentOptionsRemove);
	}

	$.equipmentPrice.cleanUp();
	_.each(paymentControllers, function (_paymentController) {
		_paymentController.cleanUp();
	});
};

// Public methods
/**
 * @method blurFields
 * Blurs all fields, hiding the soft keyboard
 * return {void}
 */
$.blurFields = function () {
	doLog && console.log('[quoteView] - blurFields()');
	$.equipmentPrice.blurFields();
	paymentControllerOpened && paymentControllerOpened.blurFields();
};

/**
 * @method refreshUI
 * Forces the UI refresh of the whole quote
 * return {void}
 */
$.refreshUI = function () {
	paymentControllers = {};

	_.defer(function () {
		$.paymentOptionsContainer.removeAllChildren();
		paymentOptions && paymentOptions.each(function (_paymentOption, _index) {
			var _newPaymentController = createNewPaymentController(_paymentOption);
			_newPaymentController.setPaymentOptionIndex(_index + 1);
			paymentControllers[_paymentOption.id] = _newPaymentController;

			$.paymentOptionsContainer.add(_newPaymentController.getView());
			_newPaymentController.refreshUI();

		});
		$.paymentOptionsContainer.add($.addRow);

		updatePaymentsStatus();

		if (quote) {
			selectPaymentOption(quote.getSelectedPaymentOption());
			openPaymentOption(quote.getOpenedPaymentOption());
			setPaymentOptionsAddRowStatus();
			$.equipmentPrice.initKeyboardToolbar();
		}
	});

};

/**
 * @method setQuote
 * Set quotes. Adding, and removing event for quotes, and payments
 * @param {Models.Quote} Quote model
 * @return {void}
 */
$.setQuote = function (_quote, _showLoading) {

	if (!_quote || (_quote && _quote === quote)) {
		return false;
	}

	doLog && console.log(LOG_TAG, '- setQuote: ' + _quote.id);

	_showLoading && $.loadingIndicator.show();

	if (quote) {
		quote.off('change:paymentOptionSelected', handlePaymentOptionSelectedChange);
		quote.off('change:paymentOptionOpened', handlePaymentOptionOpenedChange);
		paymentOptions && paymentOptions.off('add', handlePaymentOptionsAdd);
		paymentOptions && paymentOptions.off('remove', handlePaymentOptionsRemove);
	}

	quote = _quote;

	if (quote) {

		var equipments = quote.get('equipments');
		if (equipments.length > 1) {
			quote.mergeEquipments();
		}

		calculatorManager.handleRateCardUpdateValidationSingleQuote(quote);
		paymentOptions = quote.get('paymentOptions');

		quote.on('change:paymentOptionSelected', handlePaymentOptionSelectedChange);
		quote.on('change:paymentOptionOpened', handlePaymentOptionOpenedChange);
		quote.on('change:submitStatus', handleSubmitStatusChange);
		paymentOptions && paymentOptions.on('add', handlePaymentOptionsAdd);
		paymentOptions && paymentOptions.on('remove', handlePaymentOptionsRemove);
		quote.set({
			paymentOptionOpened: quote.get('paymentOptionSelected')
		});
	}

	$.refreshUI();

	if (_showLoading) {

		_.delay(function () {
			$.loadingIndicator.hide();
		}, 1000);

	}
};

/**
 * @method setPaymentOptionsAddRowStatus
 * @private
 * Checks if the quote is submitted and the total quantity of payments to set the add row button status
 * @return {void}
 */
function setPaymentOptionsAddRowStatus() {
	var isSubmitted = quote.isSubmitted();
	if (!isSubmitted && paymentOptions.length < maxPaymentsQuantityAllowed) {
		uiHelpers.setElementEnabled($.addRow, true);
	} else {
		uiHelpers.setElementEnabled($.addRow, false);
	}
}

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
	var _paymentOption = paymentOptions.get(_paymentOptionID);

	closeAllPaymentsMenus();
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
	var _paymentOption = paymentOptions.get(_paymentOptionID);

	closeAllPaymentsMenus();
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
	_newPaymentController = createNewPaymentController(_paymentOption);

	paymentControllers[_paymentOption.id] = _newPaymentController;

	$.paymentOptionsContainer.insertAt({
		view: _newPaymentController.getView(),
		position: _options.index
	});

	updatePaymentsStatus();
};

/**
 * @method handlePaymentOptionsRemove
 * @private
 * Handle the payment options remove
 * @param {Models.PaymentOption} _paymentOption 
 * @param {Object} _paymentOptions Payment options for the model
 * @param {Object} _options Payment option
 * @return {void}
 */
function handlePaymentOptionsRemove(_paymentOption, _paymentOptions, _options) {
	var _paymentController = paymentControllers[_paymentOption.id];
	_paymentController && $.paymentOptionsContainer.remove(_paymentController.getView());

	delete paymentControllers[_paymentOption.id];

	updatePaymentsStatus();
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
	var isSubmitted = quote.isSubmitted();

	setPaymentOptionsAddRowStatus();

	$.equipmentPrice.refreshUI();

	if (isSubmitted) {
		_.each(paymentControllers, function (_paymentController) {
			_paymentController.disableAllControls();
		});
	}

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
	var _id = _evt.source.id;

	switch (_id) {
	case 'navLeftButton':
		// TODO: use analytics.capture() instead
		analytics.captureTiAnalytics('OTHC-MainWindow-OpenQuoteList');
		analytics.captureApm('[quoteView] - Nav Left Button Click');
		$.blurFields();
		appNavigation.handleNavLeftButton();
		break;
	case 'flipButton':
		analytics.captureTiAnalytics('OTHC-MainWindow-SwivelTopCenter');
		analytics.captureApm('[quoteView] - Flip Button Click');
		$.blurFields();
		appNavigation.handleFlipButton({
			flipAdditionalCallback: function (_params) {
				if (_params.name === 'quoteContainer') {
					$.equipmentPrice.initKeyboardToolbar();
					_.each(paymentControllers, function (_paymentController) {
						_paymentController.initKeyboardToolbar();
					});
				}
			}
		});

		break;
	case 'uploadButton':
		if (!isSharingPDF) {
			isSharingPDF = true;
			if (!hasValidCustomizations()) {
				isSharingPDF = false;
				return;
			}

			analytics.captureTiAnalytics('OTHC-MainWindow-ShareQuoteViaEmail');
			analytics.captureApm('[quoteView] - Upload Button');
			quote.addAnalyticsCounter('share');

			shareQuote();

			_.defer(function () {
				isSharingPDF = false;
			});
		}
		break;
	case 'summaryButton':
		if (!hasValidCustomizations()) {
			return;
		}

		analytics.captureTiAnalytics('OTHC-MainWindow-OpenCustomerPreview');
		analytics.captureApm('[quoteView] - Summary Click');

		appNavigation.openSummaryWindow({
			quote: quote,
			backLabel: L('quote')
		});
		break;
	}
};

/**
 * @method handleAddRowClick
 * @private
 * Handle the click event of the addRow control
 * @param {Object} _evt Click Event 
 * @return {void}
 */
function handleAddRowClick(_evt) {
	// TODO: use analytics.capture() instead
	analytics.captureTiAnalytics('MainWindow.Payment.Add');
	analytics.captureApm('[quoteView] - Add New Row');
	quote.addPaymentOption();
	quote.save();
};

/**
 * @method handleEquipmentWrapperClick
 * @private
 * Handle the click event for the equipmentWrapper control to expand it
 * @param {Object} _evt Click Event 
 * @return {void}
 */
function handleEquipmentWrapperClick(_evt) {
	analytics.captureTiAnalytics('OTHC-MainWindow-ExpandEquipmentPriceDrawer');
	$.equipmentPrice.toggleExpanded();
};

/**
 * @method handlePaymentControllerClick
 * @private
 * Callback to handle the payment controller click 
 * @param {Object} _evt to detect the deleteButton, duplicateButton, and the solveForButton controls
 * @return {void}
 */
function handlePaymentControllerClick(_evt) {
	var _id = _evt.source.id;
	analytics.captureApm('[quoteView] - handlePaymentControllerClick() - _id = ' + _id);
	var _paymentOption = _evt.paymentOption;
	var _paymentController = _paymentOption ? paymentControllers[_paymentOption.id] : null;

	if (_paymentController) {
		_paymentController.toggleMenuOpened(false);

		switch (_id) {
		case 'deleteButton':
			analytics.captureTiAnalytics('OTHC-MainWindow-DeletePaymentOption');

			quote.removePaymentOption(_paymentOption);
			quote.save();
			break;
		case 'duplicateButton':
			doLog && console.log('[quoteView] - handlePaymentControllerClick - duplicate');
			analytics.captureTiAnalytics('OTHC-MainWindow-CopyPaymentOption');

			quote.copyPaymentOption(_paymentOption);
			quote.save();
			break;

			// TODO: rename to solveForButton
		case 'solveForButton':
			doLog && console.log('[quoteView] - handlePaymentControllerClick - solve for');
			analytics.captureTiAnalytics('OTHC-MainWindow-AccessSolveFor');
			quote.toggleAnalyticsSolveForEdit('solveFor');

			previousUIPaymentOptionValuesForUndo = {
				'payment': _paymentOption.get('payment'),
				'useRateCard': _paymentOption.get('useRateCard'),
				'manualRateFactor': _paymentOption.get('manualRateFactor'),
				'equipmentCost': _paymentOption.get('equipmentCost'),
				'additionalCost': _paymentOption.get('additionalCost'),
				'interestRate': _paymentOption.get('interestRate')
			};

			appNavigation.openSolveForWindow({
				paymentOption: _paymentOption,
				closeCallback: handleSolveForClose,
				toggleAnalyticsSolveForEdit: handleToggleSolveForAnalytics
			});
			break;
		default:
			doLog && console.log('[quoteView] - handlePaymentControllerClick - default');

			quote.togglePaymentOptionOpened(_paymentOption);
			break;
		}

	}

};

/**
 * @method handleToggleSolveForAnalytics
 * @private
 * Handles the analytics for solve for
 * @param {String} _option Selected option
 * @return {void}
 */
function handleToggleSolveForAnalytics(_option) {
	doLog && console.log(LOG_TAG, '- handleToggleSolveForAnalytics');
	quote.toggleAnalyticsSolveForEdit(_option);
}

/**
 * @method handlePaymentOptionLongpress
 * @private
 * Handle the payment option longpress callback
 * @param {Object} _evt Used it for the payment option of the event   
 * @return {void}
 */
function handlePaymentOptionLongpress(_evt) {
	doLog && console.log('[mainWindow] - longpress');
	var _paymentOption = _evt.paymentOption;
	var _paymentController = _paymentOption ? paymentControllers[_paymentOption.id] : null;
	if (_paymentController) {
		quote.set('paymentOptionSelected', _paymentOption.id).save();
	}
};

/**
 * @method handlePaymentOptionSwipe
 * @private
 * Callback about handle the payment option swipe
 * @params {Object} _evt Used it to get a payment option, and see if it is opened
 * @return {void}
 */
function handlePaymentOptionSwipe(_evt) {
	var _paymentOption = _evt.paymentOption;
	var _paymentController = _paymentOption ? paymentControllers[_paymentOption.id] : null;
	var _isOpened = _evt.isOpened;

	if (_paymentController) {
		if (_isOpened) {
			closeAllPaymentsMenus(_paymentOption.id);
		} else {
			closeAllPaymentsMenus();
		}
	}

};

/**
 * @method handleSolveForClose
 * @private
 * Callback about handle the solverForClose section
 * @params {Models.PaymentOption} _paymentOption Payment option model
 * @return {void}
 */
function handleSolveForClose(_paymentOption) {
	var params = {
		undoCallback: handleUndoSolveForClick
	};
	previousUIPaymentOptionValuesForUndo.paymentOption = _paymentOption;
	appNavigation.openUndoSolveForWindow(params);
};

/**
 * @method handleUndoSolveForClick
 * @private
 * Callback to get the previous payment option values
 * @return {void}
 */
function handleUndoSolveForClick() {
	analytics.captureTiAnalytics('OTHC-MainWindow-UndoSolveFor');
	calculatorManager.handlePaymentOptionChange(previousUIPaymentOptionValuesForUndo);
};

/**
 * @method handleExportQuoteButton
 * @private
 * Exportthe quote information in an email
 * @param {Object} _evt
 * @return {void}
 */
function handleExportQuoteButton(_evt) {
	doLog && console.log(LOG_TAG, '- handleExportQuoteButton');
	var salesRep = sessionManager.getSalesRep();
	var customer = quote.get('customer');
	var quoteName = customer.get('name');
	var exportedQuote = quote.exportQuote();
	var quoteFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'quote_' + quoteName + '.json');

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

// Event Listeners
$.header.addEventListener('click', handleHeaderClick);
$.addRow.addEventListener('click', handleAddRowClick);
$.equipmentWrapper.addEventListener('click', handleEquipmentWrapperClick);
$.optionDialog.addEventListener('click', handleDialogClick);
init();
