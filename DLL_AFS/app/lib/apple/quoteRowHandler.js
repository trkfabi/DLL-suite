/**
 * Handler object for quote row custom events such as longpress and change
 * @class Apple.quoteRowHandler
 * @singleton
 */
var doLog = Alloy.Globals.doLog;
var sessionManager = require('/utils/sessionManager');
var appNavigation = require('/appNavigation');

const LOG_TAG = '\x1b[35m' + '[apple/quoteRowHandler]' + '\x1b[39;49m ';

var quoteRowHandler = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method handleQuoteNameLongpress
	 * Handles the longpress event in the quote name
	 * @param {Object} _evt Longpress event
	 * @return {void}
	 */
	function handleQuoteNameLongpress(_evt) {
		doLog && console.log(LOG_TAG, '- handleQuoteNameLongpress');

		var salesRep = sessionManager.getSalesRep();
		var quotes = salesRep.get('quotes');

		var quote = quotes.get(_evt.itemId);

		quote && appNavigation.handleQuoteNameLongpress({
			quote: quote
		});

		// quote && appNavigation.handleQuoteNameEditableChange({
		// 	quote: quote,
		// 	editable: true
		// });
	}

	/**
	 * @method handleQuoteNameReturn
	 * Handles the return event on the quotename field
	 * @param {Object} _evt return event
	 * @return {void}
	 */
	function handleQuoteNameReturn(_evt) {
		doLog && console.log(LOG_TAG, '- handleQuoteNameReturn');

		var salesRep = sessionManager.getSalesRep();
		var quotes = salesRep.get('quotes');

		var quote = quotes.get(_evt.itemId);

		quote && appNavigation.handleQuoteNameEditableChange({
			quote: quote,
			editable: false
		});
	}

	return {
		handleQuoteNameLongpress: handleQuoteNameLongpress,
		handleQuoteNameReturn: handleQuoteNameReturn
	};
})();

module.exports = quoteRowHandler;
