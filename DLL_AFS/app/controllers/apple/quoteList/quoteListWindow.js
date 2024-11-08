/**
 * Custom controller for AFS quote list
 * @class Controllers.apple.quoteList.quoteListWindow
 * @uses appNavigation
 */
var doLog = Alloy.Globals.doLog;

var args = arguments[0] || {};
var appNavigation = require('/appNavigation');
var sessionManager = require('/utils/sessionManager');

const LOG_TAG = '\x1b[31m' + '[apple/quoteList/quoteListWindow]' + '\x1b[39;49m ';

/**
 * @property {Models.SalesRep} salesRep holds the user's data from the active session
 */
var salesRep = sessionManager.getSalesRep();

/**
 * @property {Controller.common.loadingIndicatorWindow} Window preventing interaction form the user
 */
var loadingIndicatorWindow = Alloy.createController('common/loadingIndicatorWindow');

/**
 * @method init
 * @private
 * Initializes the controller
 * @return {void}
 */
function init() {
	doLog && console.log(LOG_TAG, '- init');

	exports.baseController = 'quoteList/quoteListWindow';

	if (OS_IOS) {
		refreshControl = Ti.UI.createRefreshControl();
		$.quoteList.refreshControl = refreshControl;
		refreshControl.addEventListener('refreshstart', handleRefreshStart);
	}
}

// +-------------------
// | Public members.
// +-------------------

/**
 * @method endRefreshing
 * Forces the refreshControl to stop
 * @return {void}
 */
$.endRefreshing = function () {
	doLog && console.log(LOG_TAG, '- endRefreshing');

	refreshControl.endRefreshing();
};

// +-------------------
// | Private members.
// +-------------------

// +-------------------
// | Event Handlers declaration.
// +-------------------

/**
 * @method handleRefreshStart
 * @private
 * Handles refresh start event making a request to updates the qoutes
 * @param {Object} _evt Parameter for the refreshstart
 * @return {void}
 */
function handleRefreshStart(_evt) {
	doLog && console.log(LOG_TAG, '- handleRefreshStart()');

	appNavigation.handleQuoteListWindowRefresh(_evt);
}

init();
