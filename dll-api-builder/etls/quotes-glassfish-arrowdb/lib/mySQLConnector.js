/**
 * Manages the connections with MySQL
 * @class lib.mySQLConnector
 * @singleton
 */

const LOG_TAG = '\x1b[34m' + '[lib/mySQLConnector]' + '\x1b[39;49m ';

const mysql = require('mysql');
const _ = require('lodash');
const moment = require('moment');

const MySQLConnector = function(param = {}) {
	// +-------------------
	// | Private members.
	// +-------------------
	let { host, user, password, database } = param;

	const transformSelect = select => {
		let queryParts = ['SELECT'];
		let queryValues = [];

		if (select.columns) {
			queryParts.push(select.columns);
		} else {
			queryParts.push('*');
		}

		if (select.from) {
			queryParts.push(`FROM ${select.from}`);
		}

		if (select.where) {
			queryParts.push(`WHERE`);
			queryParts.push(_.keys(select.where).join(' AND '));
			queryValues.push(_.values(select.where));
		}

		if (select.orderBy) {
			queryParts.push(`ORDER BY ${select.orderBy}`);
		}

		if (select.limit) {
			queryParts.push(`LIMIT ?`);
			queryValues.push(select.limit);
		}

		return {
			queryParts,
			queryValues: _.flatten(queryValues)
		};
	};

	/**
	 * @method connect
	 * @private
	 * Attempts to connect with the MySQL database
	 * @return {Promise}
	 */
	const connect = () => {
		doLog && console.debug(LOG_TAG, '- connect');

		const connection = mysql.createConnection({
			host,
			user,
			password,
			database,
			insecureAuth: true
		});

		connection.connect();

		return connection;
	};

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method getQuotes
	 * Queries the `quoteblob` table and returns the quotes entered
	 * @return {Promise}
	 */
	const getQuotes = ({ since, limit = -1 } = {}) => {
		doLog && console.debug(LOG_TAG, '- getQuotes');

		let select = {
			from: 'quoteblob',
			orderBy: 'LASTSAVED'
		};
		let where = {};

		if (since) {
			since = Number(since) || since || 0;

			const lastSaved = moment(since);

			if (lastSaved.isValid()) {
				where['LASTSAVED > ?'] = lastSaved.toISOString();
			}
		}

		if (limit >= 0) {
			select.limit = limit;
		}

		if (_.size(where) > 0) {
			select.where = where;
		}

		const selectParts = transformSelect(select);

		return new Promise((resolve, reject) => {
			const connection = connect();

			connection.query(
				selectParts.queryParts.join(' '),
				selectParts.queryValues,
				(error, results, fields) => {
					if (error) {
						return reject(error);
					}

					connection.end(function(err) {
						if (err) {
							return reject(err);
						}

						resolve(results, fields);
					});
				}
			);
		});
	};

	return {
		getQuotes
	};
};

module.exports = MySQLConnector;
