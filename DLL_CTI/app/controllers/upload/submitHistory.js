/**
 * @class Controllers.upload.submitHistory
 * Submit history data
 * 
 */
var appNavigation = require('/appNavigation');
var analytics = require('/utils/analytics');

var salesRep = Alloy.Models.instance('salesRep');
var quotes = salesRep.get('quotes');
var quoteSections = [];

/**
 * @method init
 * @private
 * Initialize values for submit history window
 * @return {void}
 */
function init() {
	analytics.captureApm('[submitHistory] - init()');
	refresh();
};

/**
 * @method refresh
 * @private
 * Refresh information for submit history window
 * @return {void}
 */
function refresh() {
	doLog && console.log('[submitHistory] - refresh()');

	quoteSections = [];
	var _statusSelected = $.statusBar.index;
	var _quotesToPaint = quotes.filter(function (_quoteModel) {
		var _result = false;
		if ($.statusBar.index === 0) {
			_result = (_quoteModel.get('submitStatus') === Alloy.Globals.submitStatus.submitted);
		} else {
			_result = (
				_quoteModel.get('submitStatus') === Alloy.Globals.submitStatus.pending ||
				_quoteModel.get('submitStatus') === Alloy.Globals.submitStatus.sent
			);
		}

		return _result;
	});

	_.each(_quotesToPaint, addQuoteSection);

	$.historyList.sections = quoteSections;
};

/**
 * @method addQuoteSection
 * @private
 * Adding a quote section
 * @param {Object} _quoteModel Parameter to be used it to add a quote section
 * @return {void}
 */
function addQuoteSection(_quoteModel) {
	doLog && console.log('[submitHistory] - addQuoteSection() - _quoteModel: ' + JSON.stringify(_quoteModel));

	quoteSections.push(createQuoteSection(_quoteModel).getView());
};

/**
 * @method createQuoteSection
 * @private
 * Creation of a quote section
 * @param {Object} _quoteModel Parameter to be used it to create a quote section
 * @return {void}
 */
function createQuoteSection(_quoteModel) {
	doLog && console.log('[submitHistory] - createQuoteSection() - _quoteModel: ' + JSON.stringify(_quoteModel));
	var _quoteSection = Alloy.createController('upload/submitHistorySection', {
		'quote': _quoteModel,
		'onRefresh': refresh
	});

	return _quoteSection;
};

/**
 * @method handleCloseButtonClick
 * @private
 * Handle the click event for the handleCloseButtonClick control
 * @param {Object} _evt Parameter for the click event to be used it on the handleCloseButtonClick control
 * @return {void}
 */
function handleCloseButtonClick(_evt) {
	appNavigation.closeSubmitHistoryWindow();
};

$.statusBar.addEventListener('click', refresh);
$.closeButton.addEventListener('click', handleCloseButtonClick);

init();
