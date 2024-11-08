/**
 * @class Controllers.quoteList.quoteListWindow
 * Active, and submitted quotes list section 
 */

var appNavigation = require('/appNavigation');
var analytics = require('/utils/analytics');

var salesRep = Alloy.Models.instance('salesRep');
var quotes;

var quotesControllers = {};
var quoteControllerSelected;

var START_QUOTES = 15;
var QUOTES_BATCH = 5;
var maxQuotesToLoad = 0;
var currentQuoteLoaded = 0;
var _refreshCount = 0;

/**
 * @method init
 * @private
 * Getting quotes, and add events to the quotes model
 * return {void}
 */
function init() {
	analytics.captureApm('[quoteListWindow] - init()');

	quotes = salesRep.get('quotes');

	if (!quotes) {
		salesRep.set('quotes', []);
		quotes = salesRep.get('quotes');
	}

	quotes.on('add', $.refreshUI);
	quotes.on('remove', $.refreshUI);
	quotes.on('change:submitStatus', $.refreshUI);
};

// TODO: Preserve in case we need lazy loading on the future
// function loadQuotesInTable () {
// 	doLog && console.log('[quoteListWindow] - loadQuotesInTable()');
// 	var _rowsToShow = [];
// 	while(currentQuoteLoaded < maxQuotesToLoad && currentQuoteLoaded < quotesToShow.length) {
// 		var _quote = quotesToShow.at(currentQuoteLoaded);
// 		var row = Alloy.createController("quoteList/quoteRow", { 
// 			quote : _quote,
// 			index : currentQuoteLoaded,
// 			onRefresh : refreshQuoteRow
// 		});
// 		_rowsToShow.push(row.getView());
// 		quotesControllers.push(row);
// 		currentQuoteLoaded++
// 	}
// 	$.quoteListSection.appendItems(_rowsToShow);
// 	if(currentQuoteLoaded < quotesToShow.length){
// 		$.quoteList.setMarker({
// 			sectionIndex : 0,
// 			itemIndex : currentQuoteLoaded - 1
// 		});
// 	}
// };

/**
 * @method refreshQuoteRow
 * @private
 * Refresh the information for the quote rows
 * @param {Object} _params Parameter with details about the refresh quote row
 * @param {Controllers.QuoteRow} _params.source Quote row that launched the event
 * @return {void}
 */
function refreshQuoteRow(_params) {
	doLog && console.log('[quoteListWindow] - refreshQuoteRow()');

	_params = _params || {};
	var _quoteRow = _params.source;
	var _quoteView = _quoteRow.getView();
	var _items = $.quoteListSection.items;
	var _viewIndex = _.indexOf(_items, _.find(_items, function (_itemData) {
		return _itemData.properties.itemId === _quoteRow.getQuote().id;
	}));

	if (_viewIndex != -1) {
		$.quoteListSection.updateItemAt(_viewIndex, _quoteView);
	}
};

/**
 * @method findQuoteController
 * @private
 * Find a quote controller 
 * @param {Models.Quote} _quote Quote model to looks it controller for
 * @return {Controller.QuoteRow} Return the controller model of a row, or return null if did not find a controller model of a row
 */
function findQuoteController(_quote) {
	doLog && console.log('[quoteListWindow] - findQuoteController()');
	return _.find(quotesControllers, function (_quoteController) {
		return _quoteController.getQuote() === _quote;
	});
};

/**
 * @method showSaveQuoteAlert
 * @private
 * Show a dialog message to add a customer name
 * @param {Models.quote} _quote Parameter to set information, and save a quote, and get a customer
 * @param {Function} _callback Callback function to be called after save a quote
 * @return {void}
 */
function showSaveQuoteAlert(_quote, _callback) {
	doLog && console.log('[quoteListWindow] - showSaveQuoteAlert()');
	appNavigation.showAlert({
		title: L("add_customer_name"),
		hasTextInput: true,
		buttonNames: [L("cancel"), L("save")],
		cancel: 0,
		onClick: function (_evt) {
			if (_evt.index === 1) {
				var _strName = (_evt.text || '').trim();
				var _names = _strName.split(' ');
				var _firstName = _names[0] || null;
				var _lastName = null;
				var _customer = _quote.get('customer');

				if (_names.length > 1) {
					for (var i = 1, j = _names.length; i < j; i++) {
						_lastName = (_lastName == null ? '' : _lastName) + _names[i] + " ";
					}
					_lastName = _lastName.trim();
				}

				_customer && _customer.set({
					name: _strName || null,
					firstName: _firstName,
					lastName: _lastName
				});

				_quote.set({
					customerID: _customer.id
				});
				_quote.save();

				_callback && _callback();
			}
		}
	});
};

/**
 * @method checkUnsavedQuote
 * @private
 * Check quote that is not saved
 * @param {Models.Quote} _quote Quote to check if it has been saved
 * @param {Function} _callback Callback function to be called if it is not a new quote
 * @return {void}
 */
function checkUnsavedQuote(_quote, _callback) {
	doLog && console.log('[quoteListWindow] - checkUnsavedQuote()');
	if (_quote && _quote.isNew()) {

		appNavigation.showAlert({
			title: L("save_current_quote"),
			cancel: 2,
			buttonNames: [L("save"), L("delete"), L("cancel")],
			onClick: function (_evt) {
				switch (_evt.index) {
				case 0:
					showSaveQuoteAlert(_quote, _callback);
					break;
				case 1:
					salesRep.removeQuote(_quote, true);
					_callback && _callback();
					break;
				}
			}
		});

	} else {
		_callback && _callback();
	}
};

/**
 * @method createQuoteRow
 * @private
 * Create a quote row for the list
 * @param {Models.Quote} _quote Quote model used it with a quote row
 * @return {Controller.QuoteRow} Return the controller of a quote row
 */
function createQuoteRow(_quote) {
	if (_quote && quotesControllers[_quote.id]) {
		return quotesControllers[_quote.id];
	} else {
		return Alloy.createController('quoteList/quoteRow', {
			quote: _quote,
			refreshCallback: refreshQuoteRow
		});
	}

};

/**
 * @method destroy
 * Destroy an object, and remove some events of the quote
 * @return {void}
 */
exports.destroy = function () {
	doLog && console.log('[quoteListWindow] - destroy()');

	_.each(quotesControllers, function (_quoteRow) {
		_quoteRow.destroy();
	});

	quotes.off('add', $.refreshUI);
	quotes.off('remove', $.refreshUI);
	quotes.off('change:submitStatus', $.refreshUI);
};

/**
 * @method getQuotesToShow
 * Check if there are quotes in the list.
 * @return {Quotes}
 */
function getQuotesToShow() {
	var _isSubmitted = $.optionsSelector.getIndex() || 0;
	return quotes.filter(function (_quote) {
		var _submitStatus = _quote.get('submitStatus') || Alloy.Globals.submitStatus.unsubmitted;

		if (_quote.get('deleted')) {
			return false;
		} else {
			if (_isSubmitted) {
				return _submitStatus != Alloy.Globals.submitStatus.unsubmitted;
			} else {
				return _submitStatus == Alloy.Globals.submitStatus.unsubmitted;
			}
		}
	});
}
/**
 * @method refreshUI
 * Refresh the UI loading the quotes in the table
 * @return {void}
 */
$.refreshUI = function () {
	doLog && console.log('[quoteListWindow] - refreshUI()');
	var _listItems = [];

	var selectedQuote = salesRep.getSelectedQuote();
	if (selectedQuote) {
		var quoteChangedAttributes = selectedQuote.changedAttributes();
		if (selectedQuote.hasChanged('submitStatus') && quoteChangedAttributes && quoteChangedAttributes.submitStatus ===
			Alloy.Globals.submitStatus.sent) {
			$.optionsSelector.setIndex(Alloy.Globals.submitStatus.sent);
		}
	}

	var _quotesToShow = getQuotesToShow();

	if (_quotesToShow.length > 0) {
		_.each(_quotesToShow, function (_quote) {
			if (_quote && _quote.id) {
				var _quoteRow = createQuoteRow(_quote);

				quotesControllers[_quote.id] = _quoteRow;

				_listItems.push(_quoteRow.getView());
			}
		});
		$.quoteListSection.items = _listItems;

		_refreshCount++;
	} else {
		$.quoteListSection.items = [];
	}

	// doLog && console.log('_refreshCount: ' + JSON.stringify(_refreshCount, null, '\t'));
	// doLog && console.log('quotes.length: ' + JSON.stringify(quotes.length, null, '\t'));
	// doLog && console.log('_quotesToShow.length: ' + JSON.stringify(_quotesToShow.length, null, '\t'));
};

/**
 * @method selectQuote
 * Select an active quote or submitted quote of a list
 * @param {Models.Quote} _quote Quote model used to find a quote controller of a selected row
 * @return {void}
 */
$.selectQuote = function (_quote) {
	analytics.captureApm('[quoteListWindow] - $.selectQuote()');
	var _isSubmitted = ((_quote.get('submitStatus') || 0) === Alloy.Globals.submitStatus.unsubmitted) ? 0 : 1;
	var _items = [];
	var _viewIndex = -1;

	if (_isSubmitted !== $.optionsSelector.getIndex()) {
		$.optionsSelector.setIndex(_isSubmitted);
		$.refreshUI();
	}

	quoteControllerSelected && quoteControllerSelected.setSelected(false);
	quoteControllerSelected = findQuoteController(_quote);
	quoteControllerSelected && quoteControllerSelected.setSelected(true);

	if (quoteControllerSelected) {
		_items = $.quoteListSection.items;
		_viewIndex = _.indexOf(_items, _.find(_items, function (_itemData) {
			return _itemData.properties.itemId === quoteControllerSelected.getQuote().id;
		}));

		if (_viewIndex != -1) {
			$.quoteList.scrollToItem(0, _viewIndex);
		}
	}
};

/**
 * @method handleNewQuoteClick
 * @private
 * Handle the click event of the new quote container view to start a new quote
 * @param {Object} _evt Parameter for the event click to be use it on the newQuoteContainer
 * @return {void}
 */
function handleNewQuoteClick(_evt) {
	doLog && console.log('[quoteListWindow] - handleNewQuoteClick()');
	analytics.captureTiAnalytics('QuoteList.CreateNewQuote');

	var _quote = quoteControllerSelected && quoteControllerSelected.getQuote();

	checkUnsavedQuote(_quote, function () {
		var _newQuote = salesRep.addQuote();
		appNavigation.selectQuote(_newQuote);
		appNavigation.handleNavLeftButton();
		appNavigation.closeCustomerWindow();
	});
};

/**
 * @method handleQuoteListClick
 * @private
 * Handle the itemclick event of the quoteList control to detect the click on favorite, select, delete, clone button or do the toggle of the control
 * @param {Object} _evt Parameter for the itemclick event to be used it on the quoteList control
 * @return {void}
 */
function handleQuoteListClick(_evt) {
	doLog && console.log('[quoteListWindow] - handleQuoteListClick()');
	var _quoteID = _evt.itemId;
	var _quoteController = quotesControllers[_quoteID];
	var _quote = _quoteController.getQuote();
	var _sourceID = _evt.bindId;
	var _selectedQuote = quoteControllerSelected && quoteControllerSelected.getQuote();

	switch (_sourceID) {
	case "favoriteButton":
		analytics.captureApm('[quoteListWindow] - Set favorite to quote');
		_quote.set({
			'isFavorited': +!_quote.get('isFavorited')
		}).save();
		quotes.sort();
		$.refreshUI();
		break;
	case "selectButton":
		if (!_selectedQuote) {
			appNavigation.selectQuote(_quote);
			appNavigation.handleNavLeftButton();
		} else if (_selectedQuote.id !== _quote.id) {
			checkUnsavedQuote(_selectedQuote, function () {
				appNavigation.selectQuote(_quote);
				appNavigation.handleNavLeftButton();
			});
		} else {
			appNavigation.handleNavLeftButton();
		}
		break;
	case "deleteButton":
		analytics.captureApm('[quoteListWindow] - Click on delete quote');
		appNavigation.showAlert({
			title: L('please_confirm'),
			message: L('do_you_want_to_delete_the_quote'),
			buttonNames: [L('cancel'), L('delete')],
			cancel: 0,
			onClick: function (_evt) {
				if (_evt.index === 1) {
					salesRep.removeQuote(_quote);

					var _quotesToShow = getQuotesToShow();

					appNavigation.selectQuote(salesRep.getSelectedQuote());
					appNavigation.handleNavLeftButton();
				}
			}
		});
		break;
	case "cloneButton":
		analytics.captureApm('[quoteListWindow] - cloneButton click');
		appNavigation.showAlert({
			title: L('please_confirm'),
			message: L('do_you_want_to_copy_the_quote'),
			buttonNames: [L('yes'), L('no')],
			cancel: 0,
			onClick: function (_evt) {
				if (_evt.index === 0) {
					var _newQuote = salesRep.copyQuote(_quote);
					appNavigation.selectQuote(_newQuote);
					appNavigation.handleNavLeftButton();
				}
			}
		});
		break;
	default:
		_quoteController.toggle();
		break;
	}
};

// function handleQuoteListMarker (_evt) {
// 	doLog && console.log('[quoteListWindow] - handleQuoteListMarker()');
// 	maxQuotesToLoad += QUOTES_BATCH;
// 	loadQuotesInTable();
// };

/**
 * @method handleOptionsSelectorClick
 * @private
 * Handle the click event of the optionsSelector view to refresh the UI
 * @param {Object} _evt Parameter for the event click to be used it with the optionsSelector
 * @return {void}
 */
function handleOptionsSelectorClick(_evt) {
	doLog && console.log('[quoteListWindow] - handleOptionsSelectorClick()');
	$.refreshUI();
};

/**
 * @method handleSettingsClick
 * @private
 * Handle the click event of the settingsContainer view to open the settings window
 * @param {Object} _evt Parameter for the click event to be used it on the settingsContainer
 * @return {void}
 */
function handleSettingsClick(_evt) {
	analytics.captureApm('[quoteListWindow] - Settings click');
	appNavigation.openSettingsWindow();
};

$.newQuoteContainer.addEventListener("click", handleNewQuoteClick);
$.quoteList.addEventListener("itemclick", handleQuoteListClick);
// $.quoteList.addEventListener('marker', handleQuoteListMarker);
$.optionsSelector.addEventListener("click", handleOptionsSelectorClick);
$.settingsContainer.addEventListener('click', handleSettingsClick);

init();
