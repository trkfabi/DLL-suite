/**
 * @class Controllers.quoteList.quoteListWindow
 * Active, and submitted quotes list section
 * @uses appNavigation
 * @uses Utils.analytics
 * @uses Utils.sessionManager
 */

const LOG_TAG = '\x1b[31m' + '[quoteList/quoteListWindow]' + '\x1b[39;49m ';

var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var appNavigation = require('/appNavigation');
var analytics = require('/utils/analytics');
var sessionManager = require('/utils/sessionManager');
var configsManager = require('/utils/configsManager');

/**
 * @property {Models.SalesRep} salesRep holds the user's data from the active session
 */
var salesRep = sessionManager.getSalesRep();

/**
 * @property {Models.Quote} quote contains qoute model used it with a quote row
 */
var quotes;

/**
 * @property {Controllers.quoteRow} quotesControllers holds qoute Rows controllers
 */
var quotesControllers = {};

/**
 * @property {Object} quoteControllerSelected used to find a quote controller of a selected row
 */
var quoteControllerSelected;

/**
 * @property {Array} quotesToShow List of quote models that are being showed on the Quote List
 * @private
 */
var quotesToShow = [];

/**
 * @property {Number} quoteIndexLoaded=0 index of the last quote loaded by lazy loading
 */
var quoteIndexLoaded = 0;

/**
 * @property {Ti.UI.RefreshControl} refreshControl=null on pull to refresh creates a refresh control and fetchs quotes
 * @private
 */
var refreshControl = null;

/**
 * @property {Controllers.quoteList.quoteRow} quoteEditable=null last quote editable
 * @private
 */
var quoteEditable = null;

/**
 * @property {Boolean} isQuoteNameEditing=false is quote name being edited
 * @private
 */
var isQuoteNameEditing = false;

/**
 * @property {Controllers.common.alertDialogWindow} alertDialogWindow=null alert dialog window for update quote name
 * @private
 */
var alertDialogWindow = null;

/**
 * @method init
 * @private
 * Getting quotes, and add events to the quotes model
 * return {void}
 */
function init() {
	doLog && console.log(LOG_TAG, '- init');

	quotes = salesRep.get('quotes');

	if (!quotes) {
		salesRep.set('quotes', []);
		quotes = salesRep.get('quotes');
	}

	quotes.on('add', handleQuoteAdded);
	quotes.on('remove', handleQuoteRemoved);
	quotes.on('change:submitStatus', $.refreshUI);
	quotes.on('change:quoteSelected', $.refreshUI);
}

/**
 * @method cleanUp
 * Destroy an object, and remove some events of the quote
 * @return {void}
 */
$.cleanUp = function () {
	doLog && console.log(LOG_TAG, '- cleanUp');

	_.each(quotesControllers, function (_quoteRow) {
		_quoteRow.cleanUp();
	});

	quotes.off('add', handleQuoteAdded);
	quotes.off('remove', handleQuoteRemoved);
	quotes.off('change:submitStatus', $.refreshUI);
	quotes.off('change:quoteSelected', $.refreshUI);
};

/**
 * @method refreshUI
 * Refresh the UI loading the quotes in the table
 * @return {void}
 */
$.refreshUI = function (_quotes, _options) {
	doLog && console.log(LOG_TAG, '- refreshUI');
	_options = _options || {};

	quoteIndexLoaded = 0;

	if (_options.reset) {
		alertDialogWindow && alertDialogWindow.hide();
		_.each(quotesControllers, function (_quoteRow) {
			_quoteRow.cleanUp();
		});

		quotesControllers = {};
	}

	var selectedQuote = salesRep.getSelectedQuote();
	if (selectedQuote && selectedQuote.hasChanged('submitStatus')) {
		var _isSubmitted = selectedQuote.isSubmitted() ? 1 : 0;
		if (_isSubmitted !== $.optionsSelector.getIndex()) {
			$.optionsSelector.setIndex(_isSubmitted);
		}
	}

	quotesToShow = quotes.filter(function (_quote) {
		if (_quote.get('deleted')) {
			return false;
		} else {
			return (isSubmittedList() === _quote.isSubmitted());
		}
	});

	if (quotesToShow.length === 0) {
		$.quoteListSection.items = [];
	} else {
		loadNextBatch(Alloy.Globals.quoteList.initialCount, true);
	}
};

/**
 * @method selectQuote
 * Select an active quote or submitted quote of a list
 * @param {Models.Quote} _quote Quote model used to find a quote controller of a selected row
 * @return {void}
 */
$.selectQuote = function (_quote) {
	doLog && console.log(LOG_TAG, '- selectQuote');

	if (quoteControllerSelected && quoteControllerSelected.getQuote() === _quote) {
		return false;
	}

	var _isSubmitted = _quote.isSubmitted() ? 1 : 0;
	var _items = [];
	var _viewIndex = -1;

	if (_isSubmitted !== $.optionsSelector.getIndex()) {
		$.optionsSelector.setIndex(_isSubmitted);
		_.defer(function () {
			$.refreshUI();
		});
	}

	quoteControllerSelected && quoteControllerSelected.setSelected(false);

	quoteControllerSelected = findQuoteController(_quote);
	quoteControllerSelected && quoteControllerSelected.setSelected(true);

	quoteControllerSelected && scrollToSelectedQuote();
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

	if (quoteEditable) {
		quoteEditable.setEditable(false);
		quoteEditable = null;
	}

	quoteEditable = findQuoteController(_quote);
	quoteEditable.setEditable(_editable);

	if (!_editable) {
		quoteEditable = null;
	}
};

/**
 * @method updateQuoteName
 * Asks the user for a custom quote name and saves it on the quote model
 * @param {Models.quote} _quote Quote to update its quote name
 * @return {void}
 */
$.updateQuoteName = function (_quote) {
	doLog && console.log(LOG_TAG, '- updateQuoteName');
	isQuoteNameEditing = true;
	var customQuoteName = _quote.get('customQuoteName') || '';
	var alertDialogParams = {
		title: L('update_quote_name'),
		text: customQuoteName || _quote.getQuoteName(),
		okCallback: function (_text) {
			var customQuoteName = (_text || '').trim();

			if (customQuoteName === '') {
				isQuoteNameEditing = false;
				return false;
			}

			_quote.set({
				customQuoteName: customQuoteName
			});

			if (!_quote.getQuoteName()) {
				var customer = _quote.get('customer');
				customer.set({
					name: customQuoteName || null
				});
			}
			_quote.save();

			isQuoteNameEditing = false;
		},
		cancelCallback: function () {
			isQuoteNameEditing = false;
		}
	};

	alertDialogWindow = Alloy.createController('common/alertDialogWindow', alertDialogParams);
	alertDialogWindow.show();
	alertDialogWindow.focus();

};

/**
 * @method createAndInitQuoteRowController
 * @private
 * Creates or reuses a controller for a giving quote, initializing its state
 * @param {Object} _quote quote to create a controller for
 * @return {Alloy.Controller}
 */
function createAndInitQuoteRowController(_quote) {
	doLog && console.log(LOG_TAG, '- createAndInitQuoteRowController');

	var quoteController = quotesControllers[_quote.id];
	if (!quoteController) {
		quoteController = createQuoteRow(_quote);
		quoteController.updateListItem();

		quotesControllers[_quote.id] = quoteController;
	}
	quoteController.toggleExpanded(false);

	return quoteController;
}

/**
 * @method refreshQuoteRow
 * @private
 * Refresh the information for the quote rows
 * @param {Object} _params Parameter with details about the refresh quote row
 * @param {Controllers.QuoteRow} _params.source Quote row that launched the event
 * @return {void}
 */
function refreshQuoteRow(_params) {
	doLog && console.log(LOG_TAG, '- refreshQuoteRow');

	_params = _params || {};
	var _quoteRow = _params.source;
	var _quoteView = _quoteRow.getView();
	var _items = $.quoteListSection.items;

	if (!_quoteRow.getQuote()) {
		return false;
	}

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
	doLog && console.log(LOG_TAG, '- findQuoteController');

	doLog && console.log('_quote.id: ' + JSON.stringify(_quote.id));

	return _.find(quotesControllers, function (_quoteController) {
		var controllerQuote = _quoteController.getQuote();

		doLog && console.log('controllerQuote.id: ' + JSON.stringify(controllerQuote.id));

		return controllerQuote === _quote;
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
	doLog && console.log(LOG_TAG, '- showSaveQuoteAlert');
	appNavigation.showAlert({
		title: L('add_customer_name'),
		hasTextInput: true,
		buttonNames: [L('cancel'), L('save')],
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
						_lastName = _lastName + _names[i] + ' ';
					}
					_lastName = _lastName.trim();
				}

				_customer && _customer.set({
					name: _strName || null,
					// firstName : _firstName,
					// lastName : _lastName
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
	doLog && console.log(LOG_TAG, '- checkUnsavedQuote');
	if (_quote && _quote.isNew()) {

		appNavigation.showAlert({
			title: L('save_current_quote'),
			cancel: 2,
			buttonNames: [L('save'), L('delete'), L('cancel')],
			onClick: function (_evt) {
				switch (_evt.index) {
				case 0:
					showSaveQuoteAlert(_quote, _callback);
					break;
				case 1:
					salesRep.removeQuote(_quote);
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
	doLog && console.log(LOG_TAG, '- createQuoteRow');
	if (_quote && quotesControllers[_quote.id]) {
		return quotesControllers[_quote.id];
	} else {
		return configsManager.getController('quoteList/quoteRow', {
			quote: _quote,
			refreshCallback: refreshQuoteRow
		});
	}
};

/**
 * @method loadNextBatch
 * @private
 * Loads the next batch of quotes for lazy loading
 * @param {Number} _count Amount of quotes to load
 * @param {Boolean} _resetList Empty the list section before adding the new items or not
 * @param {Boolean} _scrollToSelected Force scrolling the list to the selected quote
 * @return {void}
 */
function loadNextBatch(_count, _resetList, _scrollToSelected) {
	var initial = quoteIndexLoaded;
	var final = Math.min(quoteIndexLoaded + _count, quotesToShow.length);
	var quotesToLoad = quotesToShow.slice(quoteIndexLoaded, final);
	var selectedQuote = salesRep.getSelectedQuote();
	var listItems = [];

	if (initial >= final) {
		doLog && console.log(LOG_TAG, '- no more items to load');
		return false;
	}

	doLog && console.log(LOG_TAG, '- loadNextBatch - final: ' + final);

	_.each(quotesToLoad, function (_quote) {
		if (_quote && _quote.id) {
			var quoteController = createAndInitQuoteRowController(_quote);
			listItems.push(quoteController.getView());
		}
	});

	quoteIndexLoaded = final;

	if (_resetList) {
		$.quoteListSection.items = [];
	}
	$.quoteListSection.appendItems(listItems);

	updateMarker();

	if (selectedQuote) {
		quoteControllerSelected = findQuoteController(selectedQuote);
		quoteControllerSelected && quoteControllerSelected.setSelected(true);

		if (!quoteControllerSelected) {
			loadNextBatch(Alloy.Globals.quoteList.scrollCount, false, true);
		} else if (_scrollToSelected) {
			scrollToSelectedQuote();
		}
	}
}

/**
 * @method scrollToSelectedQuote
 * @private
 * Scrolls the list to the selected quote
 * @return {void}
 */
function scrollToSelectedQuote() {
	var items = $.quoteListSection.items;
	var viewIndex = _.indexOf(items, _.find(items, function (_itemData) {
		return _itemData.properties.itemId === quoteControllerSelected.getQuote().id;
	}));
	if (viewIndex != -1) {
		$.quoteList.scrollToItem(0, viewIndex);
	}
}

/**
 * @method updateMarker
 * @private
 * Updates the quotes ListView marker to continue the lazy loading
 * @return {void}
 */
function updateMarker() {
	doLog && console.log(LOG_TAG, '- updateMarker');

	var items = $.quoteListSection.items || [];
	var itemsCount = items.length || 0;
	var newMarker = itemsCount - Alloy.Globals.quoteList.preloadCount;
	var minMarker = Alloy.Globals.quoteList.initialCount - Alloy.Globals.quoteList.preloadCount;

	newMarker = Math.max(minMarker, newMarker);

	$.quoteList.setMarker({
		sectionIndex: 0,
		itemIndex: newMarker
	});
}

/**
 * @method findItemIndexForQuote
 * @private
 * Looks for a listItemItem in the quote list from a given quote
 * @param {Object} _quote Quote to search
 * @return {Ti.UI.ListItem}
 */
function findItemIndexForQuote(_quote) {
	doLog && console.log(LOG_TAG, '- findItemIndexForQuote');

	var index = -1;
	var items = $.quoteListSection.items || [];

	var item = _.find(items, function (_item, _index) {
		index = _index;
		return _item.properties.itemId === _quote.id;
	});

	return index;
}

/**
 * @method findLastFavoriteQuoteIndex
 * @private
 * Looks through all showing quote to check which one is the latest favorite index
 * @return {Number} `0` if not favorites are present
 */
function findLastFavoriteQuoteIndex() {
	doLog && console.log(LOG_TAG, '- findLastFavoriteQuoteIndex');

	var index = -1;

	_.each(quotesToShow, function (_quote, _index) {
		if (!!_quote.get('isFavorited')) {
			index = _index;
		}
	});

	return index;
}

/**
 * @method validateIndexShown
 * @private
 * Determines if a given index is already showing in the list (because lazy load). If it's showing it will return the same given index, otherwise, it will return `-1`
 * @param {Number} _index Index to validate
 * @return {Number} index validate
 */
function validateIndexShown(_index) {
	doLog && console.log(LOG_TAG, '- validateIndexShown');

	if (_index > quoteIndexLoaded) {
		return -1;
	}

	return _index;
}

/**
 * @method isSubmittedList
 * @private
 * Determines if the selected quote list is the submitted list
 * @return {Boolean} is the submitted list selected
 */
function isSubmittedList() {
	return !!($.optionsSelector.getIndex() || 0);
}

/**
 * @method handleQuoteAdded
 * @private
 * Handler function for adding a single quote from the list
 * @param {Object} _quote Quote added or deleted
 * @return {void}
 */
function handleQuoteAdded(_quote, _quotes, _options) {
	doLog && console.log(LOG_TAG, '- handleQuoteAdded');

	var quoteController = createAndInitQuoteRowController(_quote);
	var quoteIndex = validateIndexShown(findLastFavoriteQuoteIndex() + 1);

	$.quoteListSection.insertItemsAt(quoteIndex, [quoteController.getView()]);

	quotesToShow.splice(quoteIndex, 0, _quote);

	updateMarker();
}

/**
 * @method handleQuoteRemoved
 * @private
 * Handler function for removing a single quote from the list
 * @param {Object} _quote Quote added or deleted
 * @return {void}
 */
function handleQuoteRemoved(_quote, _quotes, _options) {
	doLog && console.log(LOG_TAG, '- handleQuoteRemoved');

	var quoteController = findQuoteController(_quote);
	var listItemIndex = findItemIndexForQuote(_quote);
	var indexQuoteToShow = _.indexOf(quotesToShow, _.findWhere({
		id: _quote.id
	}));

	if (!quoteController || listItemIndex < 0) {
		doLog && console.warn(LOG_TAG, '- handleQuoteRemoved - controller not found: ' + _quote.id);
		return false;
	}

	$.quoteListSection.deleteItemsAt(listItemIndex, 1);

	quotesToShow.splice(indexQuoteToShow, 1);

	updateMarker();
}

/**
 * @method handleNewQuoteClick
 * @private
 * Handle the click event of the new quote container view to start a new quote
 * @param {Object} _evt Parameter for the event click to be use it on the newQuoteContainer
 * @return {void}
 */
function handleNewQuoteClick(_evt) {
	doLog && console.log(LOG_TAG, '- handleNewQuoteClick');
	analytics.captureTiAnalytics('QuoteList.CreateNewQuote');

	var _quote = quoteControllerSelected && quoteControllerSelected.getQuote();
	var selectedQuote = salesRep.getSelectedQuote();

	if (_quote && _quote !== selectedQuote) {
		quoteControllerSelected = findQuoteController(_quote);
		quoteControllerSelected && quoteControllerSelected.setSelected(false);
	}

	checkUnsavedQuote(_quote, function () {
		appNavigation.handleNavLeftButton();
		appNavigation.closeCustomerWindow();
		salesRep.addQuote();
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
	doLog && console.log(LOG_TAG, '- handleQuoteListClick');
	var _quoteID = _evt.itemId;
	var _quoteController = quotesControllers[_quoteID];
	var _quote = _quoteController.getQuote();
	var _sourceID = _evt.bindId;
	var _selectedQuote = salesRep.getSelectedQuote();

	if (!_sourceID) {
		return false;
	}

	if (isQuoteNameEditing) {
		return false;
	}

	switch (_sourceID) {
	case 'favoriteButton':
		analytics.captureEvent('[quoteListWindow] - Set favorite to quote');
		_quote.set({
			'isFavorited': +!_quote.get('isFavorited')
		}).save();

		if (_quoteController.expanded) {
			_quoteController.toggle();
		}

		quotes.sort();

		break;
	case 'selectButton':
		if (!_selectedQuote) {
			appNavigation.handleNavLeftButton();
			_.defer(function () {
				salesRep.set('quoteSelected', _quote.id).save();
			});
		} else if (_selectedQuote.id !== _quote.id) {
			checkUnsavedQuote(_selectedQuote, function () {
				appNavigation.handleNavLeftButton();
				_.defer(function () {
					salesRep.set('quoteSelected', _quote.id).save();
				});
			});
		} else {
			appNavigation.handleNavLeftButton();
		}
		break;
	case 'deleteButton':
		analytics.captureEvent('[quoteListWindow] - Click on delete quote');
		appNavigation.showAlert({
			title: L('please_confirm'),
			message: L('do_you_want_to_delete_the_quote'),
			buttonNames: [L('no'), L('yes')],
			cancel: 0,
			onClick: function (_evt) {
				if (_evt.index === 1) {
					appNavigation.handleNavLeftButton();
					salesRep.removeQuoteAndValidate(_quote);
					appNavigation.showAlertMessage(L('the_quote_has_been_deleted'));
				}
			}
		});
		break;
	case 'cloneButton':
		analytics.captureEvent('[quoteListWindow] - cloneButton click');
		appNavigation.showAlert({
			title: L('please_confirm'),
			message: L('do_you_want_to_copy_the_quote'),
			buttonNames: [L('yes'), L('no')],
			cancel: 0,
			onClick: function (_evt) {
				if (_evt.index === 0) {
					appNavigation.handleNavLeftButton();
					var _newQuote = salesRep.copyQuote(_quote);
					appNavigation.showAlertMessage(L('the_quote_has_been_copied_sucessfully'));

					setTimeout(function () {
						$.quoteList.scrollToItem(0, 0, {
							animated: false
						});
					}, 0);

				}
			}
		});
		break;
	default:
		_quoteController.toggle();
		break;
	}
};

/**
 * @method handleOptionsSelectorClick
 * @private
 * Handle the click event of the optionsSelector view to refresh the UI
 * @param {Object} _evt Parameter for the event click to be used it with the optionsSelector
 * @return {void}
 */
function handleOptionsSelectorClick(_evt) {
	doLog && console.log(LOG_TAG, '- handleOptionsSelectorClick');
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
	doLog && console.log(LOG_TAG, '- handleSettingsClick');
	appNavigation.openSettingsWindow();
};

/**
 * @method handleQuoteListMarker
 * @private
 * Event handler for the `marker`  event of the quoteListView
 * @param {Object} _evt marker event
 * @return {void}
 */
function handleQuoteListMarker(_evt) {
	doLog && console.log(LOG_TAG, '- handleQuoteListMarker');

	loadNextBatch(Alloy.Globals.quoteList.scrollCount);
}

$.newQuoteContainer.addEventListener('click', handleNewQuoteClick);
$.quoteList.addEventListener('itemclick', handleQuoteListClick);
$.optionsSelector.addEventListener('click', handleOptionsSelectorClick);
$.settingsContainer.addEventListener('click', handleSettingsClick);
$.quoteList.addEventListener('marker', handleQuoteListMarker);

init();
