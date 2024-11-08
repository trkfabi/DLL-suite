/**
 * credit rating items to be used in creditRatingSearchWindow.
 * @class Controllers.apple.creditRatingSearch.creditRatingListItem
 */
const LOG_TAG = '\x1b[31m' + '[apple/creditRatingSearch/creditRatingListItem]' + '\x1b[39;49m ';

var args = arguments[0] || {};

/**
 * @property {Object} listItem List Item definition to load in a ListSection
 * @property {String} listItem.template='foundTemplate' Default template to apply
 * @property {Object} accountName={} Holds and sets the accountName
 * @property {Object} parentName={} Holds and sets the parentName
 * @property {Object} rating={} Holds and sets the rating
 * @private
 */
var listItem;

/**
 * @property {Object} creditRating={} holds credit rating data
 * @private
 */
var creditRating;

/**
 * @property {Boolean} isSearchResult=false determines is the item should be header
 * @private
 */
var isSearchResult;

/**
 * @method init
 * @private
 * Initializes the controller
 * @return {void}
 */
function init() {
	isSearchResult = args.isSearchResult || false;
	creditRating = args.creditRatingData || {};

	listItem = {
		template: 'foundTemplate',
		accountName: {},
		parentName: {},
		rating: {}
	};

	loadItemsData();
}

/**
 * @method getListItem
 * Gets data item
 * @return {Object}
 */
$.getListItem = function () {
	return listItem;
};

/**
 * @method getSectionName
 * Obtains the section name to load this item
 * @return {String} section Name where it should be loaded
 */
$.getSectionName = function () {
	return sectionName;
};

/**
 * @method loadItemsData
 * @private
 * Loads the data definition into the listview items components
 * @return {void}
 */
function loadItemsData() {

	if (isSearchResult) {
		listItem.template = 'notFoundTemplate';
	}

	listItem.accountName.text = creditRating.accountName;
	listItem.parentName.text = creditRating.parentName;
	listItem.rating.text = creditRating.rating || L('snp_rating_not_found');
}

init();
