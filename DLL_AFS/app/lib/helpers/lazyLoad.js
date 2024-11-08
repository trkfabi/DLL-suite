/**
 * Helper for intializing lazy loading in some views
 * @class Helpers.lazyLoad
 * @singleton
 */

var doLog = Alloy.Globals.doLog;
const LOG_TAG = '\x1b[35m' + '[helpers/lazyLoad]' + '\x1b[39;49m ';

/**
 * @constructor
 * Initialices a new "scrollable" view (ScrollView, TableView, ListView) for lazyLoading
 * @param {Object} _options Options for initialing the scrollable view
 * @param {Ti.UI.ScrollView, Ti.UI.TableView, Ti.UI.ListView} _options.view View to initialice for lazy loading
 * @param {Number} _options.initial Number of items to load the first time if data is too big
 * @param {Number} _options.next Number of items to load once the user reaches the bottom of the view if data is too big
 * @param {Function} _options.onUpdate Function called everytime a new chunk of data needds to be added 
 * @return {void}
 */
var LazyLoad = function (_options) {
	// +-------------------
	// | Private members.
	// +-------------------
	var options = _options || {};
	var view = _options.view;
	var initial = _options.initial;
	var next = _options.next;
	var onUpdate = _options.onUpdate;
	var data = null;
	var current = 0;
	var marker = {};

	if (!view) {
		throw new Error('_options.view is not defined.');
	}

	if (!onUpdate || !_.isFunction(onUpdate)) {
		throw new Error('_options.onUpdate is not defined or is not a Function.');
	}

	addScrollListener();

	/**
	 * @method addScrollListener
	 * @private
	 * Adds a scroll event listener for the view, depending on its api
	 * @return {void}
	 */
	function addScrollListener() {
		doLog && console.log(LOG_TAG, '- addScrollListener');

		switch (view.apiName) {
		case 'Ti.UI.ListView':
			view.addEventListener('marker', handleListViewMarker);
			break;
		case 'Ti.UI.ScrollView':
			view.addEventListener('scroll', handleScrollViewScroll);
			break;
		case 'Ti.UI.TableView':
			view.addEventListener('scroll', handleTableViewScroll);
			break;
		default:
			throw new Error('_options.view is not a valid UI proxy: ' + view.apiName);
		}
	}

	/**
	 * @method sliceNextItems
	 * @private
	 * Loads the next chunk of items
	 * @param {Number} _next Number of items to load
	 * @return {void}
	 */
	function sliceNextItems(_next) {
		doLog && console.log(LOG_TAG, '- sliceNextItems - ' + _next);
		var end = current + _next;
		var nextItems = data.slice(current, end);

		current = end;

		return nextItems;
	}

	/**
	 * @method loadNextItems
	 * @private
	 * Loads the next chunk of items, notifying onUpdate
	 * @param {Number} _count How many items to load
	 * @return {void}
	 */
	function loadNextItems(_count) {
		doLog && console.log(LOG_TAG, '- loadNextItems');
		var nextItems = [];
		if (initial && next) {
			nextItems = sliceNextItems(_count);
			onUpdate(nextItems);
		} else if (data && data.length > 0) {
			nextItems = onUpdate(data);
			data = nextItems;
		}

		if (view.apiName === 'Ti.UI.ListView') {
			updateMarker();
		}
	}

	/**
	 * @method updateMarker
	 * @private
	 * Updates the position of the marker in a ListView, based on the position of the next chunk to cut
	 * @return {void}
	 */
	function updateMarker() {
		doLog && console.log(LOG_TAG, '- updateMarker');

		var sections = view.sections;
		var sumItems = 0;
		var totalItems = _.reduce(sections, function (_memo, _section) {
			return _memo += _section.items.length;
		}, 0);
		var nextItem = totalItems - 2;

		_.every(sections, function (_section, _sectionIndex) {
			var itemIndex = -1;
			var sectionLength = _section.items.length;

			if (sumItems + sectionLength > nextItem) {
				itemIndex = nextItem - sumItems - 1;

				if (marker.sectionIndex !== _sectionIndex || marker.itemIndex !== itemIndex) {
					marker = {
						sectionIndex: _sectionIndex,
						itemIndex: itemIndex
					};
					view.setMarker(marker);

					return false;
				}
			} else {
				sumItems += sectionLength;
			}

			return true;
		});
	}

	/**
	 * @method handleListViewMarker
	 * @private
	 * Handler for the marker event on a ListView
	 * @param {Object} _evt marker event
	 * @return {void}
	 */
	function handleListViewMarker(_evt) {
		doLog && console.log(LOG_TAG, '- handleListViewMarker');

		_.defer(function () {
			loadNextItems(next);
		});
	}

	/**
	 * @method handleScrollViewScroll
	 * @private
	 * Handler for the scroll event in a scrollView
	 * @param {Object} _evt scroll event
	 * @return {void}
	 */
	function handleScrollViewScroll(_evt) {
		doLog && console.log(LOG_TAG, '- handleScrollViewScroll');

	}

	/**
	 * @method handleTableViewScroll
	 * @private
	 * Handler for the scroll event in a tableView
	 * @param {Object} _evt scroll event
	 * @return {void}
	 */
	function handleTableViewScroll(_evt) {
		doLog && console.log(LOG_TAG, '- handleTableViewScroll');

	}

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method restart
	 * Resets the `data` option and calls again a new initial chink of items
	 * @param {Object} _data New data to load for lazy loading
	 * @return {void}
	 */
	function restart(_data) {
		doLog && console.log(LOG_TAG, '- restart');

		data = _data || [];
		current = 0;

		loadNextItems(initial);
	}

	return {
		restart: restart
	};
};

module.exports = LazyLoad;
