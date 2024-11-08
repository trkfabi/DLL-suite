/**
 * @class Controllers.main.quoteView
 * Quote View
 */
var args = arguments[0] || {};
// Libraries
var appNavigation = require('/appNavigation');
var analytics = require('/utils/analytics');
var customizations = require('/customizations');
var uiUpdateHandler = require('/calculations/uiUpdateHandler');

// Models/Collections
var quote;
var paymentOptions;

// Nested Controllers
var paymentControllers = {};
var paymentControllerOpened;
var paymentControllerSelected;

var previousUIPaymentOptionValuesForUndo = {};

// Utility variables

// Private Functions

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	analytics.captureApm('[quoteView] - init()');
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
		swipeCallback: handlePaymentOptionSwipe,
		interestRateBlurCallback: handlePaymentOptionInterestRateBlur
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
	$.initPaymentsKeyboardToolbar();
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
			// If is an iPhoneX or newer the screen height holds up to 3 options which breaks the scrollTo functionality
			if (Alloy.Globals.hasNotch) {
				if (paymentOptions.length > 3) {
					$.paymentsTableView.scrollTo(0, _newY);
				}
			} else {
				$.paymentsTableView.scrollTo(0, _newY);
			}
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
		customizations.fetchCustomizations({
			container: $.container,
			failureCallback: function (_data) {
				_data.message && appNavigation.showAlertMessage(_data.message);
			}
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
	var _customer = quote.get('customer');

	appNavigation.openGenerateWindow({
		quote: quote,
		preview: true,
		recipient: 'share',
		callback: function (_data) {
			if (_data.attachments) {
				appNavigation.openEmailDialog({
					subject: " ",
					toRecipients: [_customer.get('email') || ''],
					messageBody: L('thank_you') + ".",
					attachments: _data.attachments,
					retryOnMissingAttachments: function () {
						_.defer(shareQuote);
					}
				});
			} else {
				doLog && console.log('[quoteView] - FAILED TO LOAD ATTACHMENT');
				shareQuote();
			}
		}
	});
};

/**
 * @method repaintPaymentOptionsTable
 * @private
 * Repaints the whole Payment Options Table, affects only UI (does not create new controllers)
 * return {void}
 */
function repaintPaymentOptionsTable() {
	analytics.captureApm('[quoteView] - repaintPaymentOptionsTable()');
	$.paymentOptionsContainer.removeAllChildren();

	if (paymentOptions) {
		var _pmntOptLen = paymentOptions.length;
		analytics.captureApm('[quoteView] - repaintPaymentOptionsTable() - _pmntOptLen = ' + _pmntOptLen);

		if (_pmntOptLen > 0) { // Invalid state there are no Payments to paint
			_.defer(function () {
				paymentOptions.each(function (_paymentOption) {
					var _paymentController = paymentControllers[_paymentOption.id];
					$.paymentOptionsContainer.add(_paymentController.getView());
					_paymentController.refreshUI();
				});
				$.paymentOptionsContainer.add($.addRow);
			});
		}
	}

};

/**
 * @method repaintPaymentOptionsFromIndex
 * @private
 * Repaints the whole Payment Options Table fron the given index, affects only UI (does not create new controllers)
 * @param {Number} _index Index from where to start repainting the table
 * @return {void}
 */
function repaintPaymentOptionsFromIndex(_index) {
	if (paymentOptions) {
		var paymentController;
		var length = paymentOptions.length;
		_index = _index == null ? length - 1 : _index;
		(_index < 0) && (_index = 0);

		$.paymentOptionsContainer.remove($.addRow);
		for (var i = _index + 1; i < length; i++) {
			paymentController = paymentControllers[paymentOptions.at(i).id];
			$.paymentOptionsContainer.remove(paymentController.getView());
		}

		for (var j = _index; j < length; j++) {
			paymentController = paymentControllers[paymentOptions.at(j).id];
			$.paymentOptionsContainer.add(paymentController.getView());
		}
		$.paymentOptionsContainer.add($.addRow);
	}
};

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
 * @method refreshPaymentsUI
 * @private
 * Refreshes all the payment options
 * @return {void}
 */
function refreshPaymentsUI() {
	_.each(paymentControllers, function (_paymentController) {
		_paymentController.refreshUI();
	});
};

$.initPaymentsKeyboardToolbar = function () {
	_.each(paymentControllers, function (_paymentController) {
		_paymentController.initKeyboardToolbar && _paymentController.initKeyboardToolbar();
	});
};

/**
 * @method destroy
 * Stop listening to events for quotes, and removing their callbacks
 * @return {void}
 */
exports.destroy = function () {
	if (quote) {
		quote.off('change:paymentOptionSelected', handlePaymentOptionSelectedChange);
		quote.off('change:paymentOptionOpened', handlePaymentOptionOpenedChange);
		paymentOptions.off('add', handlePaymentOptionsAdd);
		paymentOptions.off('remove', handlePaymentOptionsRemove);
	}
};

// Public methods
/**
 * @method blurFields
 * Blurs all fields, hiding the soft keyboard
 * return {void}
 */
$.blurFields = function () {
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

	paymentOptions && paymentOptions.each(function (_paymentOption) {
		var _newPaymentController = createNewPaymentController(_paymentOption);
		paymentControllers[_paymentOption.id] = _newPaymentController;
	});

	repaintPaymentOptionsTable();

	quote && selectPaymentOption(quote.getSelectedPaymentOption());
	quote && openPaymentOption(quote.getOpenedPaymentOption());

	$.equipmentPrice.initKeyboardToolbar();
	$.initPaymentsKeyboardToolbar();
};

/**
 * @method setQuote
 * Set quotes. Adding, and removing event for quotes, and payments
 * @param {Models.Quote} Quote model
 * @return {void}
 */
$.setQuote = function (_quote) {

	if (_quote === quote) {
		return false;
	}

	if (quote) {
		quote.off('change:paymentOptionSelected', handlePaymentOptionSelectedChange);
		quote.off('change:paymentOptionOpened', handlePaymentOptionOpenedChange);
		paymentOptions && paymentOptions.off('add', handlePaymentOptionsAdd);
		paymentOptions && paymentOptions.off('remove', handlePaymentOptionsRemove);
	}

	quote = _quote;

	if (quote) {
		paymentOptions = quote.get('paymentOptions');

		quote.on('change:paymentOptionSelected', handlePaymentOptionSelectedChange);
		quote.on('change:paymentOptionOpened', handlePaymentOptionOpenedChange);
		paymentOptions && paymentOptions.on('add', handlePaymentOptionsAdd);
		paymentOptions && paymentOptions.on('remove', handlePaymentOptionsRemove);
		quote.set({
			paymentOptionOpened: quote.get('paymentOptionSelected')
		});

	}

	$.refreshUI();
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

	repaintPaymentOptionsFromIndex(_options.index);

	refreshPaymentsUI();

	if (!paymentControllerSelected) { //Workaround as it is not selecting if last one removed and new created
		selectPaymentOption(quote.getSelectedPaymentOption());
	}

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

	refreshPaymentsUI();
};

/**
 * @method setActive
 * @private
 * Set active flip button
 * @return {void}
 */
function setActive() {
	$.flipButton.enabled = true;
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
		analytics.captureTiAnalytics('MainWindow.LeftButton.Click');
		analytics.captureApm('[quoteView] - Nav Left Button Click');
		$.blurFields();
		appNavigation.handleNavLeftButton();
		break;
	case 'flipButton':
		analytics.captureTiAnalytics('MainWindow.FlipButton.Click');
		analytics.captureApm('[quoteView] - Flip Button Click');
		$.blurFields();
		if (OS_IOS) {
			$.flipButton.enabled = false;
			appNavigation.handleFlipButton({
				callback: function (_params) {
					setActive();
					if (_params.name === 'quoteContainer') {
						$.equipmentPrice.initKeyboardToolbar();
						$.initPaymentsKeyboardToolbar();
					}
				}
			});
		} else {
			appNavigation.handleFlipButton();
		}

		break;
	case 'uploadButton':
		if (!hasValidCustomizations()) {
			return;
		}

		analytics.captureTiAnalytics('MainWindow.UploadButton.Click');
		analytics.captureApm('[quoteView] - Upload Button');

		shareQuote();
		break;
	case 'summaryButton':
		if (!hasValidCustomizations()) {
			return;
		}

		analytics.captureTiAnalytics('MainWindow.SummaryButton.Click');
		analytics.captureApm('[quoteView] - Summary Click');

		appNavigation.openSummaryWindow({
			quote: quote
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
	$.equipmentPrice.toggleExpanded();
};

/**
 * @method handlePaymentControllerClick
 * @private
 * Callback to handle the payment controller click 
 * @param {Object} _evt to detect the deleteButton, duplicateButton, and the goalSeekButton controls
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
		case "deleteButton":
			analytics.captureTiAnalytics('MainWindow.Payment.Delete');

			quote.removePaymentOption(_paymentOption);
			quote.save();
			break;
		case "duplicateButton":
			doLog && console.log("[quoteView] - handlePaymentControllerClick - duplicate");
			analytics.captureTiAnalytics('MainWindow.Payment.Duplicate');

			quote.copyPaymentOption(_paymentOption);
			quote.save();
			break;

			// TODO: rename to solveForButton
		case "goalSeekButton":
			doLog && console.log("[quoteView] - handlePaymentControllerClick - solve for");

			previousUIPaymentOptionValuesForUndo = {
				'payment': _paymentOption.get('payment'),
				'equipmentCost': _paymentOption.get('equipmentCost'),
				'tradeAllowance': _paymentOption.get('tradeAllowance'),
				'interestRate': _paymentOption.get('interestRate')
			};

			appNavigation.openSolveForWindow({
				paymentOption: _paymentOption,
				closeCallback: handleSolveForClose
			});
			break;
		default:
			doLog && console.log("[quoteView] - handlePaymentControllerClick - default");

			quote.togglePaymentOptionOpened(_paymentOption);
			break;
		}

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
	doLog && console.log("[mainWindow] - longpress");
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
	uiUpdateHandler.handlePaymentOptionChange(previousUIPaymentOptionValuesForUndo);
};

/**
 * @method handlePaymentOptionInterestRateBlur
 * @private
 * Handle the payment option interest rate textfield blur callback
 * @param {Object} _evt Used it for the payment option of the event   
 * @return {void}
 */
function handlePaymentOptionInterestRateBlur(_evt) {
	doLog && console.log('[mainWindow] - handlePaymentOptionInterestRateBlur');
	$.paymentsTableView.scrollTo(0, 0);
}

// Event Listeners
$.header.addEventListener('click', handleHeaderClick);
$.addRow.addEventListener("click", handleAddRowClick);
$.equipmentWrapper.addEventListener('click', handleEquipmentWrapperClick);

init();
