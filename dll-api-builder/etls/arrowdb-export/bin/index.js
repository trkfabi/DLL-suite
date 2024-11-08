#!/usr/bin/env

/*eslint no-console: 0*/
const process = require('process');
const minimist = require('minimist');

const Exporter = require('../lib/exporter');
const Helpers = require('../lib/reusable/helpers');
const pkg = require('../package.json');
const title = `ArrowDB Export v${pkg.version}`;
console.log(title);

const argv = minimist(process.argv.slice(2));

const verbose = Helpers.presetVar('verbose', 'v', false, argv);
const help = Helpers.presetVar('help', 'h', false, argv);
const tables = Helpers.presetVar('tables', 't', '', argv);
const format = Helpers.presetVar('file-format', 'f', undefined, argv);
const key = Helpers.presetVar('key', 'k', '', argv);
const username = Helpers.presetVar('username', 'u', '', argv);
const password = Helpers.presetVar('password', 'p', '', argv);
const order = Helpers.presetVar('order', 'o', '', argv);

global.doLog = !!verbose;
/**
 * @method start
 * @private
 * Starts the script
 * @return {void}
 */
function start() {
	if (help) {
		showHelp();
		return;
	}

	if (!key) {
		console.error('Missing App key for ArrowDB');
		process.exit(1);
		return;
	}

	if (!username) {
		console.error('Missing Username for ArrowDB');
		process.exit(1);
		return;
	}

	if (!password) {
		console.error('Missing Password for ArrowDB');
		process.exit(1);
		return;
	}

	if (tables.length === 0) {
		console.log('No tables to export.');
		process.exit(1);
		return;
	}

	const exporter = new Exporter({
		key,
		username,
		password,
		format,
		tables: tables.split(','),
		order
	});

	exporter
		.start()
		.then(files => {
			console.log(`Files exported: \n${files.join('\n')}`);
			process.exit(0);
		})
		.catch(error => {
			console.error(
				`An error occured: ${error.message}\n${error.stack}\n${JSON.stringify(
					error
				)}`
			);
			process.exit(1);
		});
}

function showHelp() {
	console.log(`
Migrates quotes from Glassfish into ArrowDB.

usage:
$ node bin/index.js [options]

options:

--verbose | -v.                         Shows logs.
--help | -h.                            Shows this help.
--key <arrowdb-app-key> | -k.           APP Key for ArrowDB
--username <arrowdb-username> | -u.     ArrowDB Username for login
--password <arrowdb-password> | -p.     ArrowDB Password for login
--tables <t1,t2,...> | -t.              List of tables to export, separated by commas
--order <t1,t2,...> | -o.               List of table attributes to sort the results
--file-format <format> | -f.            Format of the file to generate, per table. Flags supported:
                                        * $table Name of the table
                                        * $date Date as YYYYMMDD
                                        * $time  Time as HHmmss
                                        - Defaults: $table-$date-$time
	`);
}

start();
