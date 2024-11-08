/**
 * @class Controllers.main.mainWindow
 * Main window
 * @uses Utils.analytics
 * @uses Utils.sessionManager
 * @uses Calculations.calculatorManager
 * @uses dk.napp.drawer
 * @uses customizations
 * @uses application
 * @uses rateCards
 */
const LOG_TAG = '\x1b[31m' + '[main/mainWindow]' + '\x1b[39;49m ';

var args = arguments[0] || {};
var analytics = require('/utils/analytics');
var sessionManager = require('/utils/sessionManager');
var configsManager = require('/utils/configsManager');
var DrawerFactory = require('dk.napp.drawer');
var customizations = require('/customizations');
var application = require('/application');
var appNavigation = require('/appNavigation');
var calculatorManager = configsManager.getLib('calculations/calculatorManager');
var rateCards = configsManager.getLib('rateCards');
var dataManager = configsManager.getLib('/utils/dataManager');
/**
 * @property {Models.SalesRep} salesRep holds the user's data from the active session
 */
var salesRep = sessionManager.getSalesRep();

/**
 * @property {Models.Quote} quotes holds the selected quote model, selecting the first quote if no quote is selected
 */
var quotes = null;

/**
 * @property {Number} loadingCounter
 * @private
 * Number of activities to load before hiding the loading indicator
 */
var loadingCounter = 1;

/**
 * @property {Function} paymentLoadedCallback
 * @private
 * Callback called once the payment option UI has been loaded
 */
var paymentLoadedCallback = args.paymentLoadedCallback;

/**
 * @property {Boolean} isSyncing flag to prevent sync more than once at the time
 */
var isSyncing = true;

/**
 * @property {Common.LoadingIndicatorWindow} loadingIndicatorWindow=Alloy.createController('common/loadingIndicatorWindow') loading indicator window
 */
var loadingIndicatorWindow = Alloy.createController('common/loadingIndicatorWindow');

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	analytics.captureApm('[mainWindow] - init()');

	// Check if the app is already waiting for a request
	!Alloy.Globals.updateRequestLoading && dataManager.checkForUpdates(function (_error, _updateDialog) {
		if (_updateDialog) {
			_updateDialog.show();
			Alloy.Globals.updateDialogIsVisible = true;
		}
	});

	quotes = salesRep.get('quotes');

	quotes.on('reset', handleQuotesReset);

	salesRep.on('change:quoteSelected', handleQuoteSelectedChange);
	loadQuoteView();
	loadQuoteList();
	$.quoteView.loadingIndicator.show();

	var _drawerOptions = {
		centerWindow: $.quoteDetail,
		leftWindow: $.quoteList,
		closeDrawerGestureMode: DrawerFactory.CLOSE_MODE_TAP_CENTERWINDOW,
		openDrawerGestureMode: DrawerFactory.OPEN_MODE_NONE,
		showShadow: true,
		leftDrawerWidth: (Alloy.Globals.hasNotch) ? 271.8 : 280,
		orientationModes: [Ti.UI.PORTRAIT]
	};

	if (OS_IOS) {
		_drawerOptions.statusBarStyle = DrawerFactory.STATUSBAR_WHITE;
		application.addAppStatusChangeHandler(handleAppStatusChange);
		application.addNetworkHandler(handleNetworkChange);
	}

	if (OS_ANDROID) {
		_drawerOptions.windowSoftInputMode = Ti.UI.Android.SOFT_INPUT_STATE_HIDDEN | Ti.UI.Android.SOFT_INPUT_ADJUST_PAN;
		_drawerOptions.closeDrawerGestureMode = DrawerFactory.CLOSE_MODE_MARGIN;
		_drawerOptions.exitOnClose = false;
	}

	$.drawer = DrawerFactory.createDrawer(_drawerOptions);

	customizations.fetchCustomizations({
		countryData: configsManager.getConfig(),
		container: $.quoteDetail
	});

	rateCards.fetchRateCards({
		salesRep: salesRep,
		successCallback: syncQuotes,
		failureCallback: syncQuotes
	});

	function syncQuotes() {
		dataManager.syncQuotes(quotes, handleQuotesFetch);
	}

	// application.addNetworkHandler($.refreshQuotes);
};

/**
 * @method loadQuoteView
 * @private
 * Initialices the quoteView based on the country data. Loading `main/quoteView' by default.
 * @return {void}
 */
function loadQuoteView() {
	$.quoteView = configsManager.getController('main/quoteView', args);

	if (OS_IOS) {
		$.dashboardWindow.add($.quoteView.getView());
	}

	if (OS_ANDROID) {
		$.quoteDetail.add($.quoteView.getView());
	}
};

/**
 * @method loadQuoteList
 * @private
 * Initialices the quote list window based on the loaded config
 * @return {void}
 */
function loadQuoteList() {
	doLog && console.log(LOG_TAG, '- loadQuoteList');

	$.quoteListWindow = configsManager.getController('quoteList/quoteListWindow', args);

	$.quoteList.add($.quoteListWindow.getView());
}

/**
 * @method hideLoadingIndicator
 * @private
 * Sequence to be validate before actually hiding the loading indicator in the app
 * @return {void}
 */
function hideLoadingIndicator() {
	loadingCounter--;

	if (loadingCounter <= 0) {
		_.delay(function () {
			$.quoteView.loadingIndicator.hide();
		}, 1000);
	}
};

// Note: only works with $.cleanUp
/**
 * @method cleanUp
 * Stop listening to events for quotes, and removing their callbacks
 * @return {void}
 */
$.cleanUp = function () {
	doLog && console.log('[mainWindow] - cleanUp()');

	$.quoteView.cleanUp();
	$.quoteListWindow.cleanUp();
	salesRep.off('change:quoteSelected', handleQuoteSelectedChange);
	quotes.off('reset', handleQuotesReset);
	if (OS_ANDROID) {
		$.drawer.removeEventListener('open', handleDrawerOpen);
		$.drawer.removeEventListener('blur', handleDrawerBlur);
	} else {
		application.removeAppStatusChangeHandler(handleAppStatusChange);
	}

	// application.removeNetworkHandler($.refreshQuotes);
};

/**
 * @method getView
 * @Override
 * Calls the main view from the controller (Drawer Window)
 * @return {void}
 */
$.getView = function () {
	return $.drawer;
};

/**
 * @method getQuoteContainer
 * Obtains the quote view
 * @return {Ti.UI.View} Quote View
 */
$.getQuoteContainer = function () {
	return $.quoteView.body;
};

/**
 * @method flipCenterView
 * Attempts to flip from the quote view into any other given view
 * @param {Object} _params View, and callback used it for the flipCenterView
 * @param {Object} _params.view New view to show instead of the quote view
 * @param {Function} _params.callback Callback to enable the flip button
 * @return {void}
 */
$.flipCenterView = function (_params) {
	if (OS_IOS) {
		$.quoteView.flipContainer.animate({
			duration: 700,
			view: _params.view,
			transition: Ti.UI.iOS.AnimationStyle.FLIP_FROM_LEFT
		}, function () {
			_params.flipCompleteCallback && _params.flipCompleteCallback(_params);
		});
	} else {
		$.quoteView.flipContainer.removeAllChildren();
		$.quoteView.flipContainer.add(_params.view);
		_params.flipCompleteCallback && _params.flipCompleteCallback();
	}
};

/**
 * @method selectQuote
 * Selection of a quote
 * @param {Models.Quote} _quote Model to select a quote
 * @param {Boolean} _showLoading if the loading indicator must be shown
 * @return {void}
 */
$.selectQuote = function (_quote, _showLoading) {
	analytics.captureApm('[mainWindow] - selectQuote() - ' + (_quote ? _quote.id : 'no _quote'));
	$.quoteListWindow.selectQuote(_quote);
	$.quoteView.setQuote(_quote, _showLoading);
};

/**
 * @method refresh
 * Refresh UI about the quote list window, and quote view
 * @return {void}
 */
$.refreshUI = function () {
	$.quoteListWindow.refreshUI();
	$.quoteView.refreshUI();
};

/**
 * @method setQuoteNameEditable
 * Makes the quote name editable
 * @param {Models.quote} _quote Quote to make editable
 * @param {Boolean} _editable `true` if the field should be editable, `false` otherwise
 * @return {void}
 */
$.setQuoteNameEditable = function (_quote, _editable) {
	doLog && console.log(LOG_TAG, '- setQuoteNameEditable');

	$.quoteListWindow.setQuoteNameEditable(_quote, _editable);
};

/**
 * @method updateQuoteName
 * Updates the quote name from the quote list controller
 * @param {Models.quote} _quote Quote to edit
 * @return {void}
 */
$.updateQuoteName = function (_quote) {
	doLog && console.log(LOG_TAG, '- updateQuoteName');

	$.quoteListWindow.updateQuoteName(_quote);
};

/**
 * @method refreshQuotes
 * Forces the quotes collection to be re-synced from the server
 * @return {void}
 */
$.refreshQuotes = function () {
	analytics.captureApm('[mainWindow] - refreshQuotes()');

	if (isSyncing || !quotes) {
		return false;
	}

	isSyncing = true;

	loadingIndicatorWindow.show();

	customizations.fetchCustomizations({
		countryData: configsManager.getConfig(),
		container: $.quoteDetail
	});

	rateCards.fetchRateCards({
		salesRep: salesRep,
		successCallback: syncQuotes,
		failureCallback: syncQuotes
	});

	function syncQuotes() {
		dataManager.syncQuotes(quotes, function () {
			appNavigation.handleQuotesRefresh({
				quote: salesRep.getSelectedQuote()
			});

			calculatorManager.handleRateCardUpdatesValidation && calculatorManager.handleRateCardUpdatesValidation(quotes);

			// checkSelectedQuote();
			$.quoteListWindow.refreshUI(null, {
				reset: true
			});
			loadingIndicatorWindow.hide();

			isSyncing = false;
		});
	}
};

/**
 * @method blurFields
 * Hides the keyboard from this controller's textfields
 * @return {void}
 */
$.blurFields = function () {
	doLog && console.log(LOG_TAG, '- blurFields');

	$.quoteView.blurFields();
};

/**
 * @method handleQuoteSelectedChange
 * @private
 * Handler function for the selection updates on the salesRep.quoteSelected changes
 * @param {Models.salesRep} Model triggering the event
 * @oparam {String} _quoteId Quote's id newly selected
 * @return {void}
 */
function handleQuoteSelectedChange(_salesRep, _quoteId) {
	doLog && console.log(LOG_TAG, '- handleQuoteSelectedChange: ' + _quoteId);
	$.selectQuote(quotes.get(_quoteId), true);
};

/**
 * @method handleQuotesFetch
 * @private
 * Fetch quotes
 * @param {Object} _data Remote data information
 * @param {Boolean} _data.isRemote Value to know if the remote fetch has been done
 * @return {void}
 */
function handleQuotesFetch(_quotes, _data) {
	doLog && console.log('[mainWindow] - handleQuotesFetch()');
	_data = _data || {};

	// // calculatorManager.handleRateCardUpdatesValidation && calculatorManager.handleRateCardUpdatesValidation(quotes);

	// // $.quoteListWindow.refreshUI();

	checkSelectedQuote();

	paymentLoadedCallback && paymentLoadedCallback();

	isSyncing = false;

	hideLoadingIndicator();
};

/**
 * @method checkSelectedQuote
 * @private
 * Handler function to review the selected quote after sync
 * @return {void}
 */
function checkSelectedQuote() {
	doLog && console.log(LOG_TAG, '- checkSelectedQuote');
	var quote = salesRep.getSelectedQuote();
	// Load sleected quote if found
	if (!quote || quote.get('deleted')) {
		if (quotes.length > 0) {
			var activeQuotes = [];
			quotes.each(function (_quote) {
				if (!_quote.isSubmitted()) {
					activeQuotes.push(_quote);
				}
			});
			if (activeQuotes.length > 0) {
				salesRep.set('quoteSelected', _.first(activeQuotes).id).save();
			} else {
				salesRep.set('quoteSelected', quotes.first().id).save();
			}
		} else {
			salesRep.addQuote();
		}
	} else {
		handleQuoteSelectedChange(salesRep, quote.id);
	}

	// $.quoteListWindow.refreshUI(null, {
	// 	reset: true
	// });
}

function handleDrawerOpen(_evt) {
	// $.drawer.getActivity().addEventListener('pause', handleActivityStateChange);
	// $.drawer.getActivity().addEventListener('resume', handleActivityStateChange);

	$.drawer.getActivity().onResume = handleActivityStateChange;
	$.drawer.getActivity().onPause = handleActivityStateChange;
};

/**
 * @method handleActivityStateChange
 * @private
 * Handler function to be called whener the activity status changes
 * @param {Object} _evt event information
 * @return {void}
 */
function handleActivityStateChange(_evt) {
	args.stateChangeCallback && args.stateChangeCallback(_evt);
};

/**
 * @method handleQuotesReset
 * @private
 * Function handler for the reset of the quotes, called when the fetch takes place
 * @param {Collections.quote} _quotes Quotes resetted
 * @param {Object} _options Options taken for the quotes to be resetted
 * @return {void}
 */
function handleQuotesReset(_quotes, _options) {
	doLog && console.log(LOG_TAG, '- handleQuotesReset');

	var selectedQuote = salesRep.getSelectedQuote();

	$.quoteListWindow.refreshUI(_quotes, _options);
	$.quoteView.setQuote(selectedQuote, false);
}

/**
 * @method handleAppStatusChange
 * @private
 * Function handler for the app status change (pause/resume)
 * @param {Object} _evt Change event
 * @return {void}
 */
function handleAppStatusChange(_evt) {
	doLog && console.log(LOG_TAG, '- handleAppStatusChange');
	if (_evt.type === 'resume') {
		// Check if the app is already waiting for a request
		!Alloy.Globals.updateRequestLoading && dataManager.checkForUpdates(function (_error, _updateDialog) {
			if (_updateDialog) {
				_updateDialog.show();
				Alloy.Globals.updateDialogIsVisible = true;
			}
		});
		handleAppResume();
	}
}

/**
 * @method handleAppResume
 * @private
 * Function handler for the app resume
 * @return {void}
 */
function handleAppResume() {
	doLog && console.log('[mainWindow] - handleAppResume');

	customizations.fetchCustomizations({
		countryData: configsManager.getConfig(),
		container: $.quoteDetail
	});

	rateCards.fetchRateCards({
		salesRep: salesRep,
		successCallback: handleRateCardUpdatesValidation,
		failureCallback: handleRateCardUpdatesValidation
	});

	function handleRateCardUpdatesValidation() {
		calculatorManager.handleRateCardUpdatesValidation && calculatorManager.handleRateCardUpdatesValidation(quotes);
	}
}

/**
 * @method handleDrawerBlur
 * @private
 * Handles window blur event and closes the softkeyboard if it is open
 * @return {void}
 */
function handleDrawerBlur() {
	doLog && console.log(LOG_TAG, '- handleDrawerBlur()');
	appNavigation.hideKeyboard();
}

/**
 * @method handleNetworkChange
 * @private
 * Function handler for the network change
 * @param {Object} _evt Change event
 * @return {void}
 */
function handleNetworkChange(_evt) {
	doLog && console.log(LOG_TAG, '- handleNetworkChange is online: ' + _evt.networkOnline);

	if (_evt.networkOnline) {
		// Check if the app is already waiting for a request
		!Alloy.Globals.updateRequestLoading && dataManager.checkForUpdates(function (_error, _updateDialog) {
			if (_updateDialog) {
				_updateDialog.show();
				Alloy.Globals.updateDialogIsVisible = true;
			}
		});
	}
}

init();

if (OS_ANDROID) {
	$.drawer.addEventListener('open', handleDrawerOpen);
	$.drawer.addEventListener('blur', handleDrawerBlur);
}
