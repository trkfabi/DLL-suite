/**
 * @class Controllers.apple.creditRatingSearch.creditRatingSearchWindow
 * Credit Rating Search
 * @uses appNavigation
 * @uses Libs.analytics
 * @uses Libs.entityRatings
 */
var doLog = Alloy.Globals.doLog;
const LOG_TAG = '\x1b[31m' + '[apple/creditRatingSearch/creditRatingSearchWindow]' + '\x1b[39;49m ';
const CUSTOMER_FOUND_TAG = L('customer_found') + ' (%d)';

var args = arguments[0] || {};
var appNavigation = require('/appNavigation');
var analytics = require('/utils/analytics');
var entityRatings = require('/entityRatings');
var LazyLoad = require('/helpers/lazyLoad');

/**
 * @property {Array} creditRatingData Holds searched credit rating data
 * @private
 */
var creditRatingData = args.creditRatingData || [];

/**
 * @property {Object} searchResult Holds searched result
 * @private
 */
var searchedResult = args.searchedResult || {};

/**
 * @property {String} searchTerm='' Holds searched text
 * @private
 */
var searchTerm = args.searchTerm || '';

/**
 * @property {Function} callback Function to call when selecting an entity
 * @private
 */
var callback = args.callback || null;

/**
 * @property {Models.quote} quote
 * @private
 * Quote containing the Payment Option to show
 */
var quote = args.quote;

var lazyLoad = null;

var throttledSearch = _.throttle(searchEntityRatings, 500);

var searchCount = 0;

var page = 0;

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	doLog && console.log(LOG_TAG, '- init');

	lazyLoad = new LazyLoad({
		view: $.creditRatingList,
		onUpdate: handleLazyLoad
	});
}

/**
 * @method refreshUI
 * @private
 * Defines the listItems UI and loads them into its respective sections
 * @return {void}
 */
function refreshUI() {
	var notFoundResult = searchedResult || {};

	$.foundSection.items = [];

	// default search result
	var searchResultItem = Alloy.createController('apple/creditRatingSearch/creditRatingListItem', {
		creditRatingData: notFoundResult,
		isSearchResult: true
	});

	$.notFoundSection.items = [searchResultItem.getListItem()];
	$.headerTitle.text = String.format(CUSTOMER_FOUND_TAG, searchCount);

	lazyLoad.restart(creditRatingData);

	$.creditRatingList.show();
	$.loadingView.hide();
}

/**
 * @method handleCancelButtonClick
 * @private
 * Handle the click event of the titleLabel, and backButton controls
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleCancelButtonClick(_evt) {
	analytics.captureTiAnalytics('AFS-Credit-Rating-Search-Cancel');
	quote.addAnalyticsCounter('customerRecordCancel');
	appNavigation.closeCreditRatingSearchWindow();
}

/**
 * @method searchEntityRatings
 * @private
 * Perform the search
 * @return {void}
 */
function searchEntityRatings() {
	doLog && console.log(LOG_TAG, '- searchEntityRatings');

	page = 0;

	$.creditRatingList.hide();
	$.loadingView.show();

	creditRatingData = entityRatings.searchEntityRatings(searchTerm, page);
	searchCount = entityRatings.countSearchItems(searchTerm);
	searchedResult = {
		accountName: searchTerm,
		parentName: L('customer_not_found')
	};
	refreshUI();
}

/**
 * @method handleCreditRatingListClick
 * @private
 * Handles clicks event on the creditRatingList
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleCreditRatingListClick(_evt) {
	doLog && console.log(LOG_TAG, ' handleCreditRatingListClick');
	var selection = _evt.section.id;
	var result = {
		selectedSection: selection
	};
	if (selection == 'foundSection') {
		analytics.captureTiAnalytics('AFS-CreditRatingResults-SelectCompanyFound');
		result['entitySelected'] = creditRatingData[_evt.itemIndex];
		quote.addAnalyticsCounter('customerRecord');
	} else {
		analytics.captureTiAnalytics('AFS-CreditRatingResults-SelectCompanyEntered');
		result['entitySelected'] = searchedResult;
	}
	appNavigation.closeCreditRatingSearchWindow();
	callback && callback(result);
}

/**
 * @method handleSearchBarChange
 * @private
 * Handle the search text change event
 * @param {Object} _evt Change event
 * @return {void}
 */
function handleSearchBarChange(_evt) {
	doLog && console.log(LOG_TAG, '- handleSearchBarChange');
	searchTerm = _evt.value;

	throttledSearch();
}

/**
 * @method handleSearchBarReturn
 * @private
 * Handle the search bar return event
 * @param {Object} _evt Return event
 * @return {void}
 */
function handleSearchBarReturn(_evt) {
	doLog && console.log(LOG_TAG, '- handleSearchBarReturn');
	$.searchBar.blur();
}

/**
 * @method handleCreditRatingListScroll
 * @private
 * Function handler for the scroll of the credit list
 * @param {Object} _evt scroll event
 * @return {void}
 */
function handleCreditRatingListScroll(_evt) {
	doLog && console.log(LOG_TAG, '- handleCreditRatingListScroll');

	$.searchBar.blur();
}

/**
 * @method handleWindowOpen
 * @private
 * Handler for the open event of the window
 * @param {Object} _evt open event
 * @return {void}
 */
function handleWindowOpen(_evt) {
	doLog && console.log(LOG_TAG, '- handleWindowOpen');

	var entitiesCount = entityRatings.getEntityRatingsCount();
	if (entitiesCount === 0) {
		var dialog = Ti.UI.createAlertDialog({
			title: L('entities_not_found'),
			message: L('entities_not_found_message'),
			ok: L('ok')
		});
		dialog.addEventListener('click', function (_evt) {
			appNavigation.closeCreditRatingSearchWindow();
		});
		dialog.show();

		return false;
	}

	if (searchTerm) {
		$.searchBar.value = searchTerm;
		searchEntityRatings();
	}
}

/**
 * @method handleLazyLoad
 * @private
 * Handles the initial loading of a lazy loading
 * @param {Object[]} _data First data of items to load
 * @return {void}
 */
function handleLazyLoad(_data) {
	doLog && console.log(LOG_TAG, '- handleLazyLoad');

	var foundItems = [];

	_.each(_data, function (_creditRating) {
		foundItems.push({
			template: 'foundTemplate',
			accountName: {
				text: _creditRating.accountName
			},
			parentName: {
				text: _creditRating.parentName
			},
			rating: {
				text: _creditRating.rating || L('snp_rating_not_found')
			}
		});
	});

	$.foundSection.appendItems(foundItems);

	var nextItems = entityRatings.searchEntityRatings(searchTerm, ++page);

	if (nextItems.length > 0) {
		creditRatingData = creditRatingData.concat(nextItems);
	}

	return nextItems;
}

$.window.addEventListener('open', handleWindowOpen);
$.cancelButton.addEventListener('click', handleCancelButtonClick);
$.creditRatingList.addEventListener('itemclick', handleCreditRatingListClick);
$.searchBar.addEventListener('change', handleSearchBarChange);
$.searchBar.addEventListener('return', handleSearchBarReturn);
$.creditRatingList.addEventListener('scrollstart', handleCreditRatingListScroll);

init();
