/**
 * Manages the connections with ArrowDB
 * @class lib.arrowDBConnector
 * @version 1.1.1
 * @singleton
 */

const ArrowDB = require('arrowdb');
const _ = require('lodash');
const async = require('async');

const LOG_TAG = '\x1b[33m' + '[lib/arrowDBConnector]' + '\x1b[39;49m ';

const ArrowDBConnector = function (params = {}) {
	// +-------------------
	// | Private members.
	// +-------------------
	const {
		key,
		username,
		password
	} = params;

	let arrowDB = null;

	/**
	 * @method hasItems
	 * @private
	 * Checks the given query an validates if at least 1 item returns
	 * @param {object} options = {} Options to query
	 * @return {Promise<boolean>}
	 */
	const hasItems = async (options = {}) => {
		let pendingItems = -1;

		try {
			_.merge(options, {
				count: true,
				pretty_json: true
			});

			console.log(LOG_TAG, 'hasItems', options);

			const response = await customObjectsQuery(options);
			pendingItems = response.body.meta.count;

			console.log(LOG_TAG, 'hasItems - pendingItems', pendingItems);
		} catch (error) {
			console.log(LOG_TAG, 'hasItems - error', {
				message: error.message,
				stack: error.stack,
			});

			pendingItems = -1;
		}

		return pendingItems !== 0;
	};

	/**
	 * @method validateDelete
	 * @private
	 * Validates if all the required items where removed after a deletion
	 * @param {object} options={} query options of items to validate
	 * @return {Promise}
	 */
	const validateDelete = async (options = {}) => {
		let hasPendingItems = true;

		do {
			hasPendingItems = await hasItems(options);

			console.log(LOG_TAG, 'validateDelete', {
				hasPendingItems
			});
		} while (hasPendingItems);
	};

	// +-------------------
	// | Public members.
	// +-------------------

	// Lifecycle functions

	/**
	 * @method init
	 * initialices the connector
	 */
	const init = () => {
		arrowDB = new ArrowDB(key);

		login();
	};

	/**
	 * @method stop
	 * Clean up memory and releases resources
	 * @return {void}
	 */
	const stop = () => {
		doLog && console.log(LOG_TAG, '- stop');

		arrowDB = null;
	};

	// Promise containers

	/**
	 * @method customObjectsQuery
	 * Returns arrowdb.customObjectsQuery() as a promise
	 * @param {object} options={} Options for query
	 * @return {Promise}
	 */
	const customObjectsQuery = (options = {}) => {
		doLog && console.log(LOG_TAG, '- customObjectsQuery');

		return new Promise((resolve, reject) => {
			arrowDB.customObjectsQuery(options, (error, response) => {
				if (error) {
					return reject(error);
				}

				resolve(response);
			});
		});
	};

	/**
	 * @method customObjectsAdminDropCollection
	 * Returns arrowdb.customObjectsAdminDropCollection() as a promise
	 * @param {object} options={} Options for query
	 * @return {Promise}
	 */
	const customObjectsAdminDropCollection = (table) => {
		doLog && console.log(LOG_TAG, '- customObjectsAdminDropCollection');

		return new Promise((resolve, reject) => {
			arrowDB.customObjectsAdminDropCollection(table, (error, response) => {
				if (error) {
					return reject(error);
				}

				resolve(response);
			});
		});
	};

	/**
	 * @method customObjectsBatchDelete
	 * Returns arrowdb.customObjectsBatchDelete() as a promise
	 * @param {object} options={} Options for query
	 * @return {Promise}
	 */
	const customObjectsBatchDelete = (options = {}) => {
		doLog && console.log(LOG_TAG, '- customObjectsBatchDelete');

		return new Promise((resolve, reject) => {
			arrowDB.customObjectsBatchDelete(options, (error, response) => {
				if (error) {
					return reject(error);
				}

				resolve(response);
			});
		});
	};

	// Utility functions

	/**
	 * Logins with arrowdb
	 * @return {Promise} Promise calld once the login completes
	 */
	const login = () => {
		doLog && console.debug(LOG_TAG, '- login');

		return new Promise((resolve, reject) => {
			arrowDB.usersLogin({
					password,
					login: username
				},
				(error, result) => {
					if (error) {
						doLog && console.debug(`${LOG_TAG} - login - error`, error);
						return reject(error);
					}

					doLog && console.debug(`${LOG_TAG} - login - success`);

					const {
						body: {
							response: {
								users: [user]
							}
						}
					} = result;

					resolve(user);
				}
			);
		});
	};

	/**
	 * @method reset
	 * Removes all the data from a single table
	 * @param {string} table Name of the table to remove
	 * @return {Promise}
	 */
	const reset = async (table = '') => {
		doLog && console.debug(LOG_TAG, '- reset');

		if (!table) {
			doLog && console.debug(LOG_TAG, '- no table to drop.');
			return;
		}

		const options = {
			classname: table
		};

		const hasPendingItems = await hasItems(options);

		if (!hasPendingItems) {
			return;
		}

		await customObjectsAdminDropCollection(options);
		await validateDelete(options);
	};

	/**
	 * @method saveFile
	 * Saves a single file in arrowDB
	 * @param {object} fileInfo Item to save
	 * @return {Promise}
	 */
	const saveFile = fileInfo => {
		console.log(LOG_TAG, '- saveFile', JSON.stringify(fileInfo));

		const {
			name,
			file,
			url,
			meta: custom_fields
		} = fileInfo;

		if (!name) {
			throw Error('missing name');
		}

		if (!file && !url) {
			throw Error('missing file and url');
		}

		return new Promise((resolve, reject) => {
			arrowDB.filesCreate({
					name,
					file,
					url,
					custom_fields,
					s3_acl: 'private'
				},
				(error, result) => {
					if (error) {
						console.log(LOG_TAG, 'saveFile error', JSON.stringify(error));
						return reject(error);
					}

					console.log(LOG_TAG, 'saveFile', JSON.stringify(result));

					resolve(result.body.response.files[0]);
				}
			);
		});
	};

	/**
	 * @method saveItem
	 * Saves a single item in arrowDB
	 * @param {string} table Name of the table to save
	 * @param {object} item Item to save
	 * @return {Promise}
	 */
	const saveItem = (table, item) => {
		// doLog && console.debug(`${LOG_TAG} - saveItem`);

		if (!table) {
			throw Error('missing table');
		}

		if (!item) {
			doLog && console.error(`${LOG_TAG} - saveItem - no item to save`);
			return Promise.resolve();
		}

		return new Promise((resolve, reject) => {
			arrowDB.customObjectsCreate({
					classname: table,
					fields: item
				},
				(error, result) => {
					if (error) {
						doLog && console.error(`${LOG_TAG} - saveItem - error`, error);

						return reject(error, item);
					}

					const {
						body: {
							response
						}
					} = result;

					const [itemSaved] = response[table];

					resolve(itemSaved);
				}
			);
		});
	};

	const updateItem = (table, item) => {
		const fields = JSON.parse(JSON.stringify(item));
		delete fields._id;
		delete fields.id;
		delete fields.created_at;
		delete fields.updated_at;
		delete fields.user_id;

		return new Promise((resolve, reject) => {
			arrowDB.customObjectsUpdate({
					fields,
					classname: table,
					id: item.id
				},
				function (error, result) {
					if (error) {
						doLog &&
							console.error(
								`${LOG_TAG} - updateItem - error: ${error.message}, ${
								error.stack
								}`
							);
						reject(error);
					}

					const {
						body: {
							response: {
								[table]: [
									data
								]
							}
						}
					} = result;

					resolve(data);
				}
			);
		});

	};

	/**
	 * @method updateItems
	 * Updates items in arrowdb
	 * @param {string} _table Table to update into
	 * @param {object|object[]} _items objects to update
	 * @return {Promise}
	 */
	const updateItems = (_table, _items) => {
		doLog && console.log(LOG_TAG, '- updateItems');

		if (!_table) {
			throw Error('missing table');
		}

		const defaultState = [
			[],
			[]
		];

		if (!_items || _items.length === 0) {
			doLog && console.debug(`${LOG_TAG} - updateItems - no items to update`);
			return Promise.resolve(defaultState);
		}

		if (!_.isArray(_items)) {
			_items = [_items];
		}

		return new Promise((resolve, reject) => {
			async.reduce(
				_items,
				defaultState,

				(memo, item, callback) => {
					const [successes, errors] = memo;

					updateItem(_table, item)
						.then(() => {
							successes.push(item);
							return callback(null, memo);
						})
						.catch(() => {
							errors.push(item);
							return callback(null, memo);
						});
				},

				(error, result) => {
					if (error) {
						return reject(error);
					}

					return resolve(result);
				}
			);
		});
	};

	/**
	 * @method save
	 * Saves the entries in a given table
	 * @return {Promise}
	 */
	const saveItems = (_table, _items, _options = {}) => {
		if (!_table) {
			throw Error('missing table');
		}

		const {
			chunkSize = 100, useBatch = true
		} = _options;

		const memo = [
			[],
			[]
		];

		if (!_items || _items.length === 0) {
			doLog && console.debug(`${LOG_TAG} - saveItems - no items to save`);
			return Promise.resolve(memo);
		}

		if (!_.isArray(_items)) {
			_items = [_items];
		}

		doLog &&
			console.debug(
				`${LOG_TAG} - saveItems table ${_table} - items: ${_items.length}`
			);

		let [successes, errors] = memo;

		return new Promise((resolve, reject) => {
			async.eachLimit(
				useBatch ? _.chunk(_items, chunkSize) : _items,
				useBatch ? 1 : chunkSize,
				useBatch ? batchCreate : singleSave,
				error => {
					if (error) {
						return reject(error);
					}

					return resolve(memo);
				}
			);
		});

		function singleSave(item, callback) {
			saveItem(_table, item)
				.then(() => {
					successes.push(item);
					callback();
				})
				.catch(error => {
					doLog &&
						console.error(
							`${LOG_TAG} - error saving item in ArrowDB: ${error.message}`
						);
					errors.push(item);
					callback();
				});
		}

		function batchCreate(chunk, callback) {
			arrowDB.post(
				`/v1/objects/${_table}/batch_create.json`, {
					classname: _table,
					json_array: chunk
				},
				function (error, response) {
					if (error) {
						doLog &&
							console.error(
								`${LOG_TAG} - batchCreate - error: ${error.message}, ${
								error.stack
								}`
							);

						errors.push(...chunk);
						return callback();
					}

					successes.push(...chunk);

					doLog &&
						console.debug(
							`${LOG_TAG} - batchCreate - success: ${response.reason} - total: ${successes.length}`
						);
					return callback();
				}
			);
		}
	};

	const upsertItem = async (table, item) => {
		doLog && console.log(LOG_TAG, 'upsertItem - ', table);

		if (item.id) {
			return await updateItem(table, item);
		} else {
			return await saveItem(table, item);
		}
	};

	/**
	 * @method upsertItems
	 * updates or inserts items depending on their id exitence, can be mixed in the array
	 * @param {string} _table Table name to upsert
	 * @param {object|object[]} items items to upsert
	 * @return {object}
	 */
	const upsertItems = async (_table, _items, _options = {}) => {
		doLog &&
			console.log(
				LOG_TAG,
				'- upsertItems - table: ',
				_table,
				'_items: ' + JSON.stringify(_items)
			);

		if (!_table) {
			throw Error('missing table');
		}

		const defaultState = [
			[],
			[]
		];

		if (!_items || _items.length === 0) {
			doLog && console.debug(`${LOG_TAG} - upsertItems - no items to upsert`);
			return Promise.resolve(defaultState);
		}

		if (!_.isArray(_items)) {
			_items = [_items];
		}

		const itemsToSave = _.filter(_items, item => !item.id);
		const itemsToUpdate = _.filter(_items, item => !!item.id);

		const [savedSuccess, savedErrors] = await saveItems(_table, itemsToSave, _options);
		const [updateSuccess, updateErrors] = await updateItems(
			_table,
			itemsToUpdate
		);

		return [
			[...savedSuccess, ...updateSuccess],
			[...savedErrors, ...updateErrors]
		];
	};

	/**
	 * @method query
	 * Queris in arrowdb
	 * @param {string} table='' name of the object to query
	 * @param {object} [query] options to query, including where and limit. Defatuls limit = 1000, count = true, new_pagination = true
	 * @return {Promise} called once the query completes
	 */
	const query = (table, query = {}) => {
		const QUERY_RESULT_COUNT = 1000;

		doLog &&
			console.debug(`${LOG_TAG} - query - ${table} - ${JSON.stringify(query)}`);

		return new Promise((resolve, reject) => {
			if (!table) {
				throw Error('query - table name expected');
			}

			let nextPage = true;
			let totalItems = [];

			const {
				limit = QUERY_RESULT_COUNT,
					skip,
			} = query;

			const hasCustomLimit = (limit !== QUERY_RESULT_COUNT || !!skip);

			_.defaults(query, {
				limit,
				count: true,
				classname: table,
				order: '-id',
			});

			async.whilst(
				() => {
					return nextPage;
				},
				callback => {
					arrowDB.customObjectsQuery(query, (error, result) => {
						if (error) {
							doLog &&
								console.error(`${LOG_TAG} - error: ${JSON.stringify(error)}`);
							return callback(error);
						}

						let {
							body: {
								meta: {
									count
								},
								response: {
									[table]: items = []
								}
							}
						} = result;
						if (_.isString(count)) {
							count = count.replace(/[^\d.]/g, '').trim();
							count = Number(count);
						}

						if (items.length > 0) {
							totalItems = totalItems.concat(items);
							doLog &&
								console.debug(
									`${LOG_TAG} - query - loaded: ${totalItems.length} items`
								);
						}
						if (!hasCustomLimit && count > QUERY_RESULT_COUNT && items.length === QUERY_RESULT_COUNT) {
							doLog &&
								console.debug(`${LOG_TAG} - query - marked to load next page`);
							nextPage = true;

							const lastId = _.last(items).id;

							_.merge(query, {
								where: {
									_id: {
										$lt: lastId
									}
								}
							});
						} else {
							nextPage = false;
						}

						callback(null, totalItems);
					});
				},
				error => {
					if (error) {
						return reject(error);
					}

					resolve(totalItems);
				}
			);
		});
	};

	/**
	 * @method removeItems
	 * Removes multiple items using batch_delete
	 * @param {string} _table Table to remove form
	 * @param {object} _where Where clause
	 * @return {void}
	 */
	const removeItems = async (_table, _where) => {
		doLog && console.log(LOG_TAG, '- removeItems');

		if (!_table) {
			throw Error('missing table name');
		}

		if (!_where) {
			throw Error('missing where clause');
		}

		const options = {
			classname: _table,
			where: _where
		};

		const hasPendingItems = await hasItems(options);

		if (!hasPendingItems) {
			return;
		}

		await customObjectsBatchDelete(options);
		await validateDelete(options);
	};

	const removeIds = async (_table, _ids) => {
		let idsChunks = [];
		if (!_table) {
			throw Error('missing table name');
		}

		if (!_ids) {
			throw Error('missing ids');
		}

		doLog && console.log(LOG_TAG, ' - removeIds');

		if (_ids.length > 1000) {
			idsChunks = _.chunk(_ids, 1000);
		} else {
			idsChunks.push(_ids);
		}
		const chunkPromises = idsChunks.map(_idChunk => {
			return new Promise((resolve, reject) => {
				arrowDB.customObjectsDelete({
						classname: _table,
						ids: _idChunk.toString()
					},
					(_error, _response) => {
						if (_error) {
							return reject(_error);
						}
						resolve(_response);
					})
			});
		});
		return Promise.all(chunkPromises);
	};

	/**
	 * @method count
	 * Retrieves the total number of objects of the specified table.
	 * @param {string} _table Table to count from
	 * @return {void}
	 */
	const count = (_table) => {
		doLog && console.log(LOG_TAG, '- count');

		if (!_table) {
			throw Error('missing table name');
		}

		return new Promise((resolve, reject) => {
			arrowDB.customObjectsCount({
					classname: _table
				},
				(_error, _response) => {
					if (_error) {
						doLog &&
							console.debug(
								`${LOG_TAG} - count - error: ${_error.message}`
							);
						return reject(_error);
					}

					doLog &&
						console.debug(
							`${LOG_TAG} - count - success: ${_response.body.meta.count}`
						);

					return resolve(_response.body.meta.count);
				}
			);
		});
	};

	init();

	return {
		login,
		query,
		removeIds,
		removeItems,
		reset,
		saveFile,
		saveItem,
		saveItems,
		updateItem,
		updateItems,
		upsertItem,
		upsertItems,
		stop,
		count
	};
};

module.exports = ArrowDBConnector;
