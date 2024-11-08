const _ = require('lodash');
const ArrowDB = require('./reusable/arrowDBConnector');
const Queue = require('./queue');

/**
 * Manages the cache for faster accessing the data
 * @class Utils.cacheManager
 * @singleton
 */

const LOG_TAG = '\x1b[35m' + '[utils/cacheManager]' + '\x1b[39;49m ';

const Cache = function (params = {}) {
	// +-------------------
	// | Private members.
	// +-------------------

	const {
		key,
		username,
		password
	} = params;

	const arrowDB = new ArrowDB({
		username,
		password,
		key
	});

	let queue = new Queue();

	/**
	 * @method waitForQueue
	 * @private
	 * Waits for the queue object to be empty
	 * @return {void}
	 */
	const waitForQueue = () => {
		return new Promise((resolve) => {
			let checkInterval = setInterval(() => {
				log(LOG_TAG, 'waitForQueue')

				if (queue.isEmpty()) {
					clearInterval(checkInterval);
					checkInterval = null;

					return resolve();
				}
			}, 1000);
		});
	};

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method start
	 * Connects the remote and local dbs
	 * @return {Promise}
	 */
	const start = async () => {
		return await Promise.all([
			arrowDB.login()
		]);
	};

	/**
	 * @method stop
	 * Clean up memory and releases resources
	 * @return {void}
	 */
	const stop = async () => {
		await waitForQueue();

		arrowDB.stop();

		log(LOG_TAG, 'stop');
	};

	/**
	 * @method get
	 * Obtains the items for the given table
	 * trigger a syncTable with memory
	 * @param {string} table Name of the table to obtain
	 * @param {Function} filter function to filter the results
	 * @return {Promise<object[]>}
	 */
	const get = async (_table, _query = {}) => {
		log(LOG_TAG, 'get', {
			_table,
			_query
		});

		// yolo
		if (_table !== 'rate_factor') {
			_query = _.merge({
				where: {
					deleted: false
				}
			}, _query);
		}

		return await arrowDB.query(_table, _query);
	};

	/**
	 * @method save
	 * saves the items in memory and remote
	 * @param {string} table Name of the table to obtain
	 * @param {Function} filter function to filter the results
	 * @return {Promise}
	 */
	const save = async (_table, _items, _memo = []) => {
		log(LOG_TAG, 'save', _table);

		const index = queue.add(_items);

		const results = await arrowDB.upsertItems(_table, _items);
		const [success, fails] = results;

		_memo.push(...success);

		if (fails.length > 0) {
			return await save(_table, fails, _memo);
		}

		queue.remove(index);

		return _memo;
	};

	/**
	 * @method remove
	 * Removes the given items from cache AND Arrowdb
	 * @param {string} _table Table to remove from
	 * @param {object[]} _items=[] Items to delete
	 * @return {Promise}
	 */
	const remove = async (_table, _where = {}) => {
		log(LOG_TAG, 'remove', {
			_table,
			_where
		});

		return await arrowDB.removeItems(_table, _where);
	};

	/**
	 * @method get
	 * Count of a table
	 * @param {string} table Name of the table to obtain
	 * @return {Promise<object[]>}
	 */
	const count = async (_table) => {
		log(LOG_TAG, 'count', _table);

		return await arrowDB.count(_table);
	};

	return {
		get,
		remove,
		save,
		start,
		stop,
		count
	};
};

module.exports = Cache;
