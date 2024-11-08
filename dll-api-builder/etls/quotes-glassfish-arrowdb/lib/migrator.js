/**
 * Instance for migrating data from MySQL to ArrowDB
 * @class lib.migrator
 * @singleton
 */
const LOG_TAG = '\x1b[32m' + '[lib/migrator]' + '\x1b[39;49m ';

const process = require('process');

const moment = require('moment');
const _ = require('lodash');

const ArrowDBConnector = require('./reusable/arrowDBConnector');
const MySQLConnector = require('./mySQLConnector');
const SQLiteConnector = require('./sqliteConnector');
const Parser = require('./parser');

function Migrator(params = {}) {
	// +-------------------
	// | Private members.
	// +-------------------
	const TABLE_ARROW_QUOTE = 'quote';
	const TABLE_ARROW_ANALYTICS = 'event';

	const TABLE_LOCAL_SYNC = 'sync';
	const TABLE_LOCAL_BLOCKED = 'blocked';
	const TABLE_LOCAL_RETRY = 'retry';

	const {
		since,
		target = 'tst',
		deleteAll = true,
		maxRetries = -1,
		maxQuotes = -1
	} = params;

	const schema = {
		ID: 'TEXT PRIMARY KEY',
		value: 'TEXT',
		LASTSAVED: 'TEXT',
		REMOVED: 'NUMERIC',
		SALESREPID: 'TEXT'
	};

	const arrowSaveOptions = {
		useBatch: false,
		chunkSize: 50
	};

	doLog &&
		console.debug(
			[
				`target: ${target}`,
				`maxRetries: ${maxRetries}`,
				`deleteAll: ${deleteAll}`,
				`maxQuotes: ${maxQuotes}`,
				`since: ${since}`
			].join('\n')
		);

	const arrowDB = new ArrowDBConnector({
		key: process.env.ARROWDB_KEY,
		username: process.env.ARROWDB_USER,
		password: process.env.ARROWDB_PASS
	});

	const mySQL = new MySQLConnector({
		host: process.env.MYSQL_HOST,
		user: process.env.MYSQL_USER,
		password: process.env.MYSQL_PASS,
		database: process.env.MYSQL_DB
	});

	const localDB = new SQLiteConnector(process.env.SQLITE_DB_NAME);

	/**
	 * @method updateQuotes
	 * @private
	 * Uodates the given list of quotes to have the new properties
	 * @param {object[]} quotes Quotes to update
	 * @param {object} newParams Attributes to set in all the objects
	 * @return {object[]}
	 */
	const updateQuotes = (quotes = [], newParams = {}) => {
		doLog && console.debug(LOG_TAG, '- updateQuotes');

		quotes.forEach(quote => {
			_.extend(quote, newParams);
		});

		return quotes;
	};

	/**
	 * @method runETL
	 * @private
	 * Runs the whole ETL process
	 * @return {Promise}
	 */
	const runETL = async () => {
		doLog && console.debug(LOG_TAG, '- runETL');

		const startTime = moment();

		let allQuotes = [];

		let retries = -1;
		let quotesSucceded = [];
		let quotesRetry = [];
		let quotesBlocked = [];
		let newSince = since;

		await arrowDB.login();
		doLog && console.debug(`${LOG_TAG} - login complete`);

		if (deleteAll) {
			await Promise.all([
				localDB.reset(),
				arrowDB.reset(TABLE_ARROW_QUOTE),
				arrowDB.reset(TABLE_ARROW_ANALYTICS)
			]);
		}

		await Promise.all([
			localDB.createTable(TABLE_LOCAL_SYNC, schema),
			localDB.createTable(TABLE_LOCAL_BLOCKED, schema),
			localDB.createTable(TABLE_LOCAL_RETRY, schema)
		]);

		if (since == null) {
			try {
				const [lastSync] = await localDB.query({
					select: 'LASTSAVED',
					from: TABLE_LOCAL_SYNC,
					orderBy: 'LASTSAVED DESC',
					limit: 1
				});
				newSince = lastSync.LASTSAVED;
			} catch (error) {
				newSince = 0;
			}

			doLog && console.debug(`${LOG_TAG} - since updated: ${newSince}`);
		}

		const quoteBlobs = await Promise.all([
			mySQL.getQuotes({
				since: newSince,
				limit: maxQuotes
			}),
			localDB.query({
				from: TABLE_LOCAL_RETRY
			})
		]);

		allQuotes = _.chain(quoteBlobs)
			.flatten()
			.compact()
			.value();

		const { quotes = [], analytics = [], errors = [] } = Parser.parseQuotes(
			allQuotes
		);
		const syncTime = startTime.toISOString();

		quotesBlocked = errors;

		updateQuotes(quotes, {
			syncTime,
			modifiedDate: syncTime
		});

		const responses = await Promise.all([
			localDB.save(TABLE_LOCAL_BLOCKED, quotesBlocked, schema),
			saveInArrowDB({
				allQuotes,
				quotes,
				analytics
			})
		]);

		[
			,
			{ index: retries = 0, memo: [quotesSucceded, quotesRetry] = [] } = {}
		] = responses;

		const lastSync = findQuotesInAllQuotes(allQuotes, quotesSucceded);
		await localDB.save(TABLE_LOCAL_SYNC, lastSync, schema);
		await localDB.stop();

		const finishTime = moment();
		return {
			startTime,
			finishTime,
			retries,
			total: allQuotes,
			failed: quotesRetry,
			blocked: quotesBlocked,
			success: quotesSucceded
		};
	};

	/**
	 * @method saveInArrowDB
	 * @private
	 * Saves the given quotes in arrowdb, the errors are saved in sqlite as "retry", if the index is < maxRetries calls itself again
	 * @param {object[]} quotes Quotes to save
	 * @param {number} index Current attempt number
	 * @return {Promise}
	 */
	const saveInArrowDB = async ({
		allQuotes,
		quotes,
		analytics,
		index = 0,
		memo = [[], []]
	} = {}) => {
		doLog &&
			console.debug(
				`${LOG_TAG} - saveInArrowDB - quotes: ${
					quotes.length
				} - index: ${index}`
			);

		let [succeded, failed] = memo;

		const arrowDBResults = await Promise.all([
			arrowDB.saveItems(TABLE_ARROW_QUOTE, quotes, arrowSaveOptions),
			arrowDB.saveItems(TABLE_ARROW_ANALYTICS, analytics, arrowSaveOptions)
		]);
		const [quotesResults, analyticsResults] = arrowDBResults;

		const [quoteSaves, quoteErrors] = quotesResults;

		const [analyticsSaves, analyticsErrors] = analyticsResults;

		failed = [
			...findQuotesInAllQuotes(allQuotes, quoteErrors),
			...findQuotesInAllQuotes(allQuotes, analyticsErrors)
		];

		succeded = [...succeded, ...quoteSaves, ...analyticsSaves];

		memo = [succeded, failed];

		if (quoteErrors.length > 0 && (maxRetries === -1 || index < maxRetries)) {
			await Promise.all([
				localDB.save(TABLE_LOCAL_RETRY, failed, schema, { reset: true }),
				saveInArrowDB({
					allQuotes,
					quotes: quoteErrors,
					analytics: analyticsErrors,
					index: ++index,
					memo
				})
			]);
		} else {
			await localDB.save(TABLE_LOCAL_RETRY, failed, schema, { reset: true });
		}

		return { memo, index };
	};

	const findQuoteInAllQuotes = (allQuotes = [], quoteToFind = {}) => {
		return _.find(allQuotes, quote => {
			return quote.ID === quoteToFind.alloy_id || quote.ID === quoteToFind.id;
		});
	};

	const findQuotesInAllQuotes = (allQuotes = [], quotesToFind = []) => {
		return _.chain(quotesToFind)
			.map(quote => findQuoteInAllQuotes(allQuotes, quote))
			.compact()
			.value();
	};

	// +-------------------
	// | Public members.
	// +-------------------
	/**
	 * @method start
	 * Starts the ETL process based on the current parameters
	 * @return {Promise}
	 */
	const start = async () => {
		doLog && console.debug(LOG_TAG, '- start');

		return await runETL();
	};

	return {
		start
	};
}

module.exports = Migrator;
