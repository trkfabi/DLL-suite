#!/usr/bin/env

// Automated Tests
/*eslint no-console: 0*/
const process = require('process');
const fs = require('fs');
const assert = require('assert');
const minimist = require('minimist');
const env = require('node-env-file');
const _ = require('lodash');
const async = require('async');
const cwd = process.cwd();

const pkg = require('../package.json');
const SQLiteConnector = require('../lib/sqliteConnector');
const ArrowDBConnector = require('../lib/reusable/arrowDBConnector');
const Parser = require('../lib/parser');

console.log(`DLL Migrator v${pkg.version} - TESTS`);

const argv = minimist(process.argv.slice(2));

const verbose = presetVar('verbose', 'v', false);
const logFile = presetVar('log-file', 'f', 'logs.txt');
const errorFile = presetVar('error-file', 'x', 'errors.txt');
const environment = presetVar('environment', 'e', 'local');

const logPath = `${cwd}/test-results/${logFile}`;
const errorPath = `${cwd}/test-results/${errorFile}`;

prepareFile(logPath);
prepareFile(errorPath);

global.doLog = !!verbose;

log(`Connecting to environment: ${environment}`);
env(`${cwd}/vars.env`);

const SKIP_PROPS = ['requests'];
const FETCH_CHUNK = 10;

/**
 * @method start
 * @private
 * Starts the script
 * @return {void}
 */
async function start() {
	const arrowDB = new ArrowDBConnector({
		key: process.env.ARROWDB_KEY,
		username: process.env.ARROWDB_USER,
		password: process.env.ARROWDB_PASS
	});

	const localDB = new SQLiteConnector(process.env.SQLITE_DB_NAME);

	const [, syncQuotes] = await Promise.all([
		arrowDB.login(),
		localDB.query({
			from: 'sync'
		})
	]);

	log(`Quotes synced in cache: ${syncQuotes.length}`);

	const { quotes, analytics, errors } = Parser.parseQuotes(syncQuotes);

	log(`Parsing quotes synced from cache.`);
	log(`${quotes.length} parsed succesfully.`);
	log(`${errors.length} could not be parsed.`);

	it('Checking there is at least 1 QUOTEBLOB synced', () => {
		assert.ok(syncQuotes.length > 0);
	});

	it('Checking all the QUOTEBLOBs could be parsed', () => {
		assert.ok(errors.length === 0);
	});

	it('Checking parsed JSON for quotes + anaylitics match the amount of QUOTEBLOBs synced', () => {
		assert.strictEqual(syncQuotes.length, quotes.length + analytics.length);
	});

	const items = [...quotes, ...analytics];

	async.eachLimit(items, FETCH_CHUNK, async (quote, done) => {
		let id = null;
		let salesRepID = null;
		let type = quote.isAnalytics ? 'Analytics' : 'Quote';

		if (quote.alloy_id) {
			id = quote.alloy_id;
		} else if (quote.id) {
			id = quote.id;
		} else {
			id = 'no-id';
		}
		log(`${type} - ${id} as QUOTEBLOB: ${JSON.stringify(quote, null, '  ')}`);

		it(`Checking ${type} - ${id} - [alloy_id]`, () => {
			assert.ok(!!quote.alloy_id, '[alloy_id] is empty');
			assert.ok(_.isString(quote.alloy_id), 'quote.alloy_id is not string');
		});

		it(`Checking ${type} - ${id} - [salesRepID]`, () => {
			assert.ok(!!quote.salesRepID, '[salesRepID] is empty');
			assert.ok(_.isString(quote.salesRepID), '[salesRepID] is not string');
			salesRepID = quote.salesRepID;
			log(`${type} ${id} [salesRepID =  ${salesRepID}]`);
		});

		let response = null;
		try {
			if (quote.isAnalytics) {
				response = await arrowDB.query('event', {
					where: {
						alloy_id: quote.alloy_id
					}
				});
			} else {
				response = await arrowDB.query('quote', {
					where: {
						alloy_id: quote.alloy_id
					}
				});
			}
		} catch (err) {
			error(`Error grabbing item ${id} from arrowdb: ${err.message}`);
			response = [];
		}

		const [arrowDBQuote] = response;

		it(`Checking ${type} - ${id} exists in arrowDB`, () => {
			assert.ok(_.size(arrowDBQuote) > 0, 'Item is empty in arrowDB.');
		});

		if (!arrowDBQuote) {
			done();
			return;
		}

		log(
			`${type} - ${id} in ARROWDB: ${JSON.stringify(arrowDBQuote, null, '  ')}`
		);

		_.each(quote, (value, key) => {
			log(`Checking property: ${key}`);

			if (value == null) {
				log(`null value, skipping`);
				return;
			}

			if (_.isFunction(value)) {
				log(`function, skipping`);
				return;
			}

			if (SKIP_PROPS.includes(key)) {
				log(`skippable property, skipping`);
				return;
			}

			return it(`Checking ${type} - ${id} - [${key}]`, () => {
				assert.deepStrictEqual(arrowDBQuote[key], value);
			});
		});

		done();
	});
}

function log(str) {
	doLog && console.debug(str);

	fs.appendFileSync(logPath, `${str}\n`);
}

function error(str) {
	console.error(str);

	fs.appendFileSync(logPath, `${str}\n`);
	fs.appendFileSync(errorPath, `${str}\n`);
}

function it(str, fn) {
	try {
		fn();
		log(`${str} - ✅`);
	} catch (err) {
		error(`${str} - ❌ ${err.toString()}`);
	}
}

function prepareFile(path) {
	try {
		if (!fs.existsSync('test-results')) {
			fs.mkdirSync('test-results');
		}

		if (fs.existsSync(path)) {
			fs.unlinkSync(path);
		}
	} catch (err) {
		console.error(`${err.message}`);
	}
}

/**
 * @method presetVar
 * @private
 * checks for a flag in `argv` and returns its value or a default
 * @param {string} flagName Name of the flag to look for
 * @param {string} flagShort Shorthand of the flag, if any
 * @param {*} defaultValue value to use if the value is not declared in flags
 * @return {*}
 */
function presetVar(flagName, flagShort, defaultValue) {
	let result = argv[flagName];

	if (result != null) {
		return result;
	}

	result = argv[flagShort];

	if (result != null) {
		return result;
	}

	return defaultValue;
}

start().catch(error => {
	console.error(
		`An error occured running the tests: ${error.message}\n${error.stack}`
	);
});
