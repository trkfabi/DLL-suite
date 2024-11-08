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
const TOTAL_FORCE_TRIES = 3;

var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var analytics = require('/utils/analytics');
var sessionManager = require('/utils/sessionManager');
var configsManager = require('/utils/configsManager');
var dataManager = require('/utils/dataManager');
var DrawerFactory = require('dk.napp.drawer');
var customizations = require('/customizations');
var application = require('/application');
var appNavigation = require('/appNavigation');
var rateCards = configsManager.getLib('rateCards');
var identifer = configsManager.getConfig('basePath');
var webservices = require('/utils/webservices');

/**
 * @property {Lib.entityRatings} entityRatings holds the entities ratings.
 */
var entityRatings = configsManager.getLib('entityRatings');

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
var isSyncing = false;

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
	analytics.captureEvent('[mainWindow] - init()');

	// Check if the app is already waiting for a request
	!Alloy.Globals.updateRequestLoading && dataManager.checkForUpdates(function (_error, _updateDialog) {
		if (_updateDialog) {
			_updateDialog.show();
			Alloy.Globals.updateDialogIsVisible = true;
		}
	}, function () {
		$.quoteView.refreshUI();
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
		leftDrawerWidth: (Alloy.Globals.iPhoneX) ? 271 : 280,
		orientationModes: [Ti.UI.PORTRAIT]
	};

	if (OS_IOS) {
		_drawerOptions.statusBarStyle = DrawerFactory.STATUSBAR_WHITE;

		if (identifer === 'apple/') {
			application.addAppStatusChangeHandler(handleAppStatusChange);
			application.addNetworkHandler(handleNetworkChange);
		}
	}

	if (OS_ANDROID) {
		_drawerOptions.windowSoftInputMode = Ti.UI.Android.SOFT_INPUT_STATE_HIDDEN;
		_drawerOptions.closeDrawerGestureMode = DrawerFactory.CLOSE_MODE_MARGIN;
		_drawerOptions.exitOnClose = false;
	}

	$.drawer = DrawerFactory.createDrawer(_drawerOptions);

	syncData({
		forceSync: true
	});
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

	if (OS_IOS && identifer === 'apple/') {
		application.removeAppStatusChangeHandler(handleAppStatusChange);
	}

	$.quoteView.cleanUp();
	$.quoteListWindow.cleanUp();
	salesRep.off('change:quoteSelected', handleQuoteSelectedChange);
	quotes.off('reset', handleQuotesReset);
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
			_params.flipCompleteCallback && _params.flipCompleteCallback();
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
	analytics.captureEvent('[mainWindow] - selectQuote() - ' + (_quote ? _quote.id : 'no _quote'));

	_quote.updateDefaultExpirationDate();

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
	analytics.captureEvent('[mainWindow] - refreshQuotes()');

	syncData();
};

function syncData(_options) {
	var totalTries = 0;
	if (isSyncing) {
		return false;
	}

	doLog && console.log(LOG_TAG, '- syncData');

	_options = _options || {};
	var forceSync = _options.forceSync || false;

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

	entityRatings.fetchEntityRatings();

	function syncQuotes() {
		dataManager.syncQuotes(quotes, function (response) {
			doLog && console.log(LOG_TAG, '- syncData - syncQuotes');

			if (forceSync && !response.success && Ti.Network.online && totalTries < TOTAL_FORCE_TRIES) {
				totalTries++;
				return syncQuotes();
			}

			appNavigation.handleQuotesRefresh({
				quote: salesRep.getSelectedQuote()
			});

			// calculatorManager.handleRateCardUpdatesValidation && calculatorManager.handleRateCardUpdatesValidation(quotes);

			_.defer(function () {
				finishSync();
			});
		});
	}

	function finishSync() {
		doLog && console.log(LOG_TAG, '- syncData - finishSync');
		loadingIndicatorWindow.hide();
		$.quoteListWindow.endRefreshing();
		hideLoadingIndicator();
		isSyncing = false;
	}
}

/**
 * @method handleQuoteSelectedChange
 * @private
 * Handler function for the selection updates on the salesRep.quoteSelected changes
 * @param {Models.salesRep} Model triggering the event
 * @oparam {String} _quoteId Quote's id newly selected
 * @return {void}
 */
function handleQuoteSelectedChange(_salesRep, _quoteId) {
	$.selectQuote(quotes.get(_quoteId), true);
};

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

	salesRep.updateSelectedQuote({
		list: 'unsubmitted'
	});
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
	doLog && console.log(LOG_TAG, '- handleAppStatusChange ' + _evt.type);

	if (_evt.type === 'resumed') {
		// Check if the app is already waiting for a request
		!Alloy.Globals.updateRequestLoading && dataManager.checkForUpdates(function (_error, _updateDialog) {
			if (_updateDialog) {
				_updateDialog.show();
				Alloy.Globals.updateDialogIsVisible = true;
			}
		});
	}
	if (_evt.type === 'resume') {
		$.refreshQuotes();
	}
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

		webservices.processQueue();
	}
}

init();

if (OS_ANDROID) {
	$.drawer.addEventListener('open', handleDrawerOpen);
}
