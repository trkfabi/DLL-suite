/**
 * Manages the connections with SQLite
 * @class lib.SQLiteConnector
 * @singleton
 */
const process = require('process');
const fs = require('fs');
const util = require('util');
const _ = require('lodash');
const sqlite3 = require('sqlite3').verbose();

const LOG_TAG = '\x1b[36m' + '[lib/SQLiteConnector]' + '\x1b[39;49m ';

const SQLiteConnector = function(dbName) {
	// +-------------------
	// | Private members.
	// +-------------------

	let db = null;

	/**
	 * @method init
	 * @private
	 * initialices the object
	 * @return {void}
	 */
	const init = () => {
		doLog && console.log(LOG_TAG, '- init');

		db = connect();
	};

	/**
	 * @method stop
	 * Clean up memory and releases resources
	 * @return {void}
	 */
	const stop = () => {
		doLog && console.log(LOG_TAG, '- stop');

		db.close((error, result) => {
			if (error) {
				doLog && console.debug(`${LOG_TAG} - stop - error: ${error.message}`);
				return;
			}
			doLog &&
				console.debug(`${LOG_TAG} - stop - result: ${JSON.stringify(result)}`);
		});
	};

	/**
	 * @method connect
	 * Stablishes the connection with the local SQLite DB
	 * @return {Promise}
	 */
	const connect = () => {
		const newDB = new sqlite3.Database(dbName);

		if (doLog) {
			// newDB.on('trace', (evt) => {
			// 	doLog && console.debug(LOG_TAG, '- EVT TRACE:\n', JSON.stringify(evt));
			// });

			// newDB.on('profile', (evt) => {
			// 	doLog && console.debug(LOG_TAG, '- EVT PROFILE:\n', JSON.stringify(evt));
			// });

			// newDB.on('open', (evt) => {
			// 	doLog && console.debug(LOG_TAG, '- EVT OPEN:\n', JSON.stringify(evt));
			// });

			newDB.on('error', evt => {
				doLog && console.debug(LOG_TAG, '- EVT ERROR:', evt);
			});
		}

		return newDB;
	};

	const transformQuery = query => {
		let queryParts = [];
		let queryValues = [];

		if (query.remove) {
			queryParts.push('DELETE');
		} else {
			queryParts.push('SELECT', query.select || '*');
		}

		if (query.from) {
			queryParts.push(`FROM ${query.from}`);
		}

		if (query.where) {
			queryParts.push(`WHERE`);
			queryParts.push(_.keys(query.where).join(' AND '));
			queryValues.push(_.values(query.where));
		}

		if (query.orderBy) {
			queryParts.push(`ORDER BY ${query.orderBy}`);
		}

		if (query.limit) {
			queryParts.push(`LIMIT ?`);
			queryValues.push(query.limit);
		}

		return {
			statement: queryParts.join(' '),
			values: _.flatten(queryValues)
		};
	};

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method reset
	 * Removes all items and tables created, to ensure the file is brand new
	 * @return {Promise}
	 */
	const reset = async () => {
		doLog && console.debug(LOG_TAG, '- reset');

		const cwd = process.cwd();
		const unlink = util.promisify(fs.unlink);
		const filePath = `${cwd}/${dbName}`;

		try {
			if (dbName && fs.existsSync(filePath)) {
				await unlink(filePath);
			}

			db = connect();
		} catch (error) {
			doLog && console.debug(`${LOG_TAG} - reset - error: ${error.message}`);

			db = connect();
		}
	};

	/**
	 * @method query
	 * Runs a full SQL SELECT over 1 or more tables
	 * @param {object} query={} query to perform
	 * @return {Promise<object[]>}
	 */
	const query = (query = {}) => {
		doLog && console.debug(LOG_TAG, '- query', JSON.stringify(query));

		let items = [];

		const queryResults = transformQuery(query);

		return new Promise((resolve, reject) => {
			db.serialize(() => {
				db.each(
					queryResults.statement,
					queryResults.values,
					(error, row) => {
						items.push(row);
					},
					error => {
						if (error) {
							return reject(error);
						}
						resolve(items);
					}
				);
			});
		});
	};

	/**
	 * @method save
	 * Saves 1 or more entries in a table
	 * @return {Promise}
	 */
	const save = (
		tableName = '',
		items = [],
		schema = {},
		{ reset = false } = {}
	) => {
		doLog && console.debug(LOG_TAG, '- save');

		if (!_.isArray(items)) {
			items = [items];
		}
		items = _.compact(items);

		if (items.length === 0) {
			doLog && console.debug(LOG_TAG, '- save - no items - skipping.');
			return;
		}

		const keys = _.keys(schema);

		const dropTable = () => {
			const query = `DROP TABLE IF EXISTS ${tableName}`;
			db.run(query);
		};

		const insertOrReplace = _callback => {
			const questionMarks = _.range(keys.length).map(() => '?');

			const query = `INSERT OR REPLACE INTO "${tableName}" VALUES (${questionMarks.join(
				', '
			)})`;
			const statement = db.prepare(query);

			_.each(items, item => {
				const values = _.map(schema, (type, key) => {
					return item[key];
				});

				statement.run(values);
			});

			statement.finalize(_callback);
		};

		return new Promise((resolve, reject) => {
			db.serialize(() => {
				if (reset) {
					dropTable();
				}
				createTable(tableName, schema);
				insertOrReplace((error, response) => {
					if (error) {
						return reject(error);
					}

					resolve(response);
				});
			});
		});
	};

	/**
	 * @method createTable
	 * Creates a SQL table
	 * @param {string} tableName Table name to create
	 * @return {Promise}
	 */
	const createTable = (tableName, schema) => {
		const meta = _.map(schema, (value, key) => {
			return `${key} ${value}`;
		});

		const query = `CREATE TABLE IF NOT EXISTS "${tableName}" (${meta.join(
			', '
		)})`;

		return new Promise((resolve, reject) => {
			db.run(query, error => {
				if (error) {
					return reject(error);
				}

				resolve();
			});
		});
	};

	/**
	 * @method remove
	 * performs a DELETE clause in the given table
	 * @param {string} table Table to remove its data
	 * @param {object} where={} Where clause
	 * @return {void}
	 */
	const remove = (table, where = {}) => {
		doLog &&
			console.log(
				LOG_TAG,
				'- remove - ',
				table,
				' - where: ',
				JSON.stringify(where)
			);

		const query = {
			remove: true,
			from: table,
			where
		};

		const queryResults = transformQuery(query);

		doLog && console.debug(`${LOG_TAG} - queryResults`, queryResults);

		return new Promise((resolve, reject) => {
			db.serialize(() => {
				db.run(
					queryResults.statement,
					queryResults.values,
					(error, response) => {
						if (error) {
							return reject(error);
						}

						resolve(response);
					}
				);
			});
		});
	};

	init();

	return {
		createTable,
		save,
		reset,
		query,
		remove,
		stop
	};
};

module.exports = SQLiteConnector;
