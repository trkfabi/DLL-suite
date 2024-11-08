/**
 * Manager for arrowdb methods not accessible by models
 * @class Lib.arrowdb
 * @singleton
 */
const process = require('process');

var ArrowDB = require('arrowdb');
var _ = require('underscore');

const LOG_TAG = '\x1b[35m' + '[lib/arrowdb]' + '\x1b[39;49m ';

var arrowdbManager = (function () {
	// +-------------------
	// | Private members.
	// +-------------------
	var arrowDBApp = new ArrowDB(process.env.ARROWDB_KEY);

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method login
	 * Attempts to login the admin user for arrowDB
	 * @param {Function} _callback Function called after the user logs in
	 * @return {void}
	 */
	function login(_callback) {
		doLog && console.log(LOG_TAG, '- login');

		arrowDBApp.usersLogin({
			login: process.env.ARROWDB_USER,
			password: process.env.ARROWDB_PASS
		}, _callback);
	}

	/**
	 * @method deleteAll
	 * callas the batch_delete method for the given custom model
	 * @param {String} _table Name of the table to remove
	 * @param {Function} _callback Function called once the table has been deleted
	 * @return {void}
	 */
	function deleteAll(_table, _callback) {
		doLog && console.log(LOG_TAG, '- deleteAll');

		arrowDBApp.customObjectsAdminDropCollection({
			classname: _table
		}, _callback);
	}

	/**
	 * @method create
	 * Creates new items in the given table
	 * @param {String} _table Table to create the entries in
	 * @param {Object[]} _items Items to add
	 * @param {Function} _callback Function called after the items were created
	 * @return {void}
	 */
	function create(_table, _items, _callback) {
		doLog && console.log(LOG_TAG, '- create');

		var currentItem = 0;
		var requestsPending = [];
		var limit = 100;
		var itemsLength = _items.length;

		var saveInterval = setInterval(saveChunk, 1000);

		function saveChunk() {
			doLog && console.log(LOG_TAG, '- saveChunk - ' + currentItem);
			var start = currentItem;
			var end = Math.min(currentItem + limit, itemsLength);
			var itemsToSave = _items.slice(start, end);

			if (requestsPending[currentItem]) {
				doLog && console.log(LOG_TAG, '- create - lastCurrentItem still pending');
				return false;
			}

			requestsPending[currentItem] = true;

			arrowDBApp.post('/v1/objects/rating/batch_create.json', {
				json_array: itemsToSave
			}, function (_error) {
				if (_error) {
					clearInterval(saveInterval);
					_callback(_error);
					saveInterval = null;

					return false;
				}

				requestsPending[currentItem] = false;
				currentItem = end;

				if (currentItem >= itemsLength) {
					clearInterval(saveInterval);
					_callback();
					saveInterval = null;

					return false;
				}
			});
		}
	}

	/**
	 * @method queryPaginated
	 * Performs a query for 5000+ items
	 * @param {String} _table Table to perform the query
	 * @param {Object} _where Where filter to apply
	 * @param {Function} _callback Function called once the query is complete
	 * @return {void}
	 */
	function queryPaginated(_table, _where, _callback) {
		doLog && console.log(LOG_TAG, '- queryPaginated');

		var items = [];

		queryNextPage();

		function queryNextPage(_id) {
			doLog && console.log(LOG_TAG, '- queryNextPage: ' + _id);

			var where = _where || {};
			var firstPage = true;

			if (_id) {
				where._id = {
					'$lt': _id
				};
				firstPage = false;
			}

			arrowDBApp.customObjectsQuery({
				classname: _table,
				where: where,
				count: true,
				new_pagination: firstPage,
				limit: 1000,
			}, handleQuery);
		}

		function handleQuery(_error, _result) {
			if (_error) {
				_callback(_error);
				return false;
			}

			var resultItems = _result.body.response[_table] || [];
			var lastItem = null;

			if (resultItems.length > 0) {
				lastItem = _.last(resultItems);
				items = items.concat(resultItems);
				queryNextPage(lastItem.id);
			} else {
				_callback(null, {
					items: items
				});
			}
		}

	}

	return {
		login: login,
		deleteAll: deleteAll,
		create: create,
		queryPaginated: queryPaginated
	};
})();

module.exports = arrowdbManager;
