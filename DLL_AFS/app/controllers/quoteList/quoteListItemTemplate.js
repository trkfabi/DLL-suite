/**
 * Description
 * @class Controllers.quoteList.quoteListItemTemplate
 * @uses appNavigation
 */
var doLog = Alloy.Globals.doLog;

var args = arguments[0] || {};
var configsManager = require('/utils/configsManager');
var quoteRowHandler = configsManager.getLib('quoteRowHandler') || {};
var analytics = require('/utils/analytics');

const LOG_TAG = '\x1b[31m' + '[quoteList/quoteListItemTemplate]' + '\x1b[39;49m ';

/**
 * @method init
 * @private
 * Initializes the controller
 * @return {void}
 */
function init() {
	doLog && console.log(LOG_TAG, '- init');
}

// +-------------------
// | Event Handlers declaration.
// +-------------------

/**
 * @method handleQuoteNameLongpress
 * @private
 * Event handler for longpress on the quotename field
 * @param {Object} _evt longpress event
 * @return {void}
 */
function handleQuoteNameLongpress(_evt) {
	doLog && console.log(LOG_TAG, '- handleQuoteNameLongpress');
	analytics.captureTiAnalytics('QuoteList.UpdateQuoteName');

	quoteRowHandler.handleQuoteNameLongpress && quoteRowHandler.handleQuoteNameLongpress(_evt);
}

/**
 * @method handleQuoteNameReturn
 * @private
 * Event handler for return on the quotename field
 * @param {Object} _evt return event
 * @return {void}
 */
function handleQuoteNameReturn(_evt) {
	doLog && console.log(LOG_TAG, '- handleQuoteNameReturn');

	quoteRowHandler.handleQuoteNameReturn && quoteRowHandler.handleQuoteNameReturn(_evt);
}

/**
 * @method handleQuoteNameChange
 * @private
 * Event handler for change on the quotename field
 * @param {Object} _evt change event
 * @return {void}
 */
function handleQuoteNameChange(_evt) {
	doLog && console.log(LOG_TAG, '- handleQuoteNameChange');

	quoteRowHandler.handleQuoteNameChange && quoteRowHandler.handleQuoteNameChange(_evt);
}

init();
