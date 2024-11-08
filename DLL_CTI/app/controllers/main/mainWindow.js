/**
 * @class Controllers.main.MainWindow
 * Main window
 */
var args = arguments[0] || {};
var analytics = require('/utils/analytics');
var DrawerFactory = require('dk.napp.drawer');
var customizations = require('/customizations');
var salesRep = Alloy.Models.instance('salesRep');
var application = require('application');

/**
 * @property {Number} loadingCounter
 * @private
 * Number of activities to load before hiding the loading indicator
 */
var loadingCounter = 1;

/**
 * @property {Models.quote} quotes Holds quotes model
 * @private
 */
var quotes;

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	analytics.captureApm('[mainWindow] - init()');
	quotes = salesRep.get('quotes');

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

	if (OS_ANDROID) {
		_drawerOptions.windowSoftInputMode = Ti.UI.Android.SOFT_INPUT_STATE_HIDDEN;
		_drawerOptions.closeDrawerGestureMode = DrawerFactory.CLOSE_MODE_MARGIN;
		_drawerOptions.exitOnClose = false;
	} else {
		_drawerOptions.statusBarStyle = DrawerFactory.STATUSBAR_WHITE;
		application.addAppStatusChangeHandler(handleAppStatusChange);
	}

	$.drawer = DrawerFactory.createDrawer(_drawerOptions);
};

// Note: only works with exports.destroy
/**
 * @method destroy
 * Stop listening to events for quotes, and removing their callbacks
 * @return {void}
 */
exports.destroy = function () {
	$.quoteView.destroy();
	$.quoteListWindow.destroy();
	$.drawer.removeEventListener('open', handleDrawerOpen);
	application.removeAppStatusChangeHandler(handleAppStatusChange);
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
			_params.callback && _params.callback(_params);
		});
	} else {
		$.quoteView.flipContainer.removeAllChildren();
		$.quoteView.flipContainer.add(_params.view);
	}
};

/**
 * @method selectQuote
 * Selection of a quote
 * @param {Models.Quote} _quote Model to select a quote
 * @return {void}
 */
$.selectQuote = function (_quote) {
	analytics.captureApm('[mainWindow] - selectQuote() - ' + (_quote ? _quote.id : 'no _quote'));
	$.quoteListWindow.selectQuote(_quote);
	$.quoteView.setQuote(_quote);

	_quote && salesRep.set('quoteSelected', _quote.id).save();
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

/**
 * @method handleFetch
 * @private
 * Fetch quotes
 * @param {Object} _data Remote data information
 * @param {Boolean} _data.isRemote Value to know if the remote fetch has been done
 * @return {void}
 */
function handleFetch(_data) {
	_data = _data || {};

	doLog && console.log('[mainWindow] - handleFetch()');

	var quotes = salesRep.get('quotes');
	var quote = salesRep.getSelectedQuote();

	$.quoteListWindow.refreshUI();

	// Load sleected quote if found
	if (quote) {
		doLog && console.log('[mainWindow] - handleFetch() - select quote: ' + quote.id);
		$.selectQuote(quote);
		hideLoadingIndicator();
	} else {
		// Load first quote if there is a list of quotes, but the selected one is not there
		if (quotes.length > 0) {
			doLog && console.log('[mainWindow] - handleFetch() - select first quote: ' + quotes.length);
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
			hideLoadingIndicator();
			// Create a new quote only if the remote fecth has been done already (it's supposed to come AFTER the local one)
		} else if (_data.isRemote) {
			doLog && console.log('[mainWindow] - handleFetch() - select new quote');
			$.selectQuote(salesRep.addQuote());
			hideLoadingIndicator();
		}
	}
};

/**
 * @method fetchQuotes
 * @private
 * Fetches quotes
 * @return {void}
 */
function fetchQuotes() {
	_.delay(function () {
		customizations.fetchCustomizations({
			container: $.quoteDetail
		});

		// TODO: Change this lines when the quotes sync gets required everytime
		// quotes.fetch({
		// 	salesRepID : salesRep.id,
		// 	success : handleFetch,
		// 	error : handleFetch
		// });

		quotes.fetch({
			salesRepID: salesRep.id,
			localOnly: true
		});

		if (quotes.length > 1) {
			handleFetch();
		} else {
			quotes.fetch({
				salesRepID: salesRep.id,
				success: handleFetch,
				error: handleFetch
			});
		}

		// END TODO
	}, 500);
}

init();

/**
 * @method handleDrawerOpen
 * @private
 * Function handler for the drawer open
 * @return {void}
 */
function handleDrawerOpen() {
	doLog && console.log('[mainWindow] - handleDrawerOpen');
	fetchQuotes();
}

/**
 * @method handleAppStatusChange
 * @private
 * Function handler for the app status change (pause/resume)
 * @param {Object} _evt Change event
 * @return {void}
 */
function handleAppStatusChange(_evt) {
	doLog && console.log('[mainWindow] - handleAppStatusChange');

	if (_evt.type === 'resume') {
		customizations.fetchCustomizations({
			container: $.quoteDetail
		});
	}
}

$.drawer.addEventListener('open', handleDrawerOpen);
