#!/usr/bin/env

/*eslint no-console: 0*/
const process = require('process');
const minimist = require('minimist');
const moment = require('moment');
const env = require('node-env-file');

const Migrator = require('../lib/migrator');
const Helpers = require('../lib/reusable/helpers');
const pkg = require('../package.json');
const title = `DLL Migrator v${pkg.version}`;
console.log(title);

const argv = minimist(process.argv.slice(2));

const verbose = Helpers.presetVar('verbose', 'v', false, argv);
const help = Helpers.presetVar('help', 'h', false, argv);
const since = Helpers.presetVar('since', 's', null, argv);
const maxQuotes = Helpers.presetVar('max-quotes', 'q', -1, argv);
const maxRetries = Helpers.presetVar('max-retries', 'r', 1, argv);
const deleteAll = Helpers.presetVar('delete-all', 'd', false, argv);

global.doLog = !!verbose;

const cwd = process.cwd();
env(`${cwd}/vars.env`);

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

	const migrator = new Migrator({
		maxQuotes,
		maxRetries,
		deleteAll,
		since
	});

	migrator
		.start()
		.then(results => {
			const {
				total = [],
				success = [],
				failed = [],
				blocked = [],
				retries = 'N/A',
				startTime = 'N/A',
				finishTime = 'N/A'
			} = results;

			const duration = moment.duration(finishTime.diff(startTime));

			console.log(
				[
					`Results:`,
					`Total: ${total.length}`,
					`Completed: ${success.length}`,
					`Errors: ${failed.length}`,
					`Blocked: ${blocked.length}`,
					`Number of Retries: ${retries}`,
					`Completed ${duration.humanize(true)}`
				].join('\n')
			);

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

--verbose | -v                    Shows logs
--help | -h                       Shows this help
--delete-all | -d                 Removes the existing table of quotes and analytics events in ArrowDB before migrating the new quotes.
--since <"yyyy-mm-dd"> | -s       Migrates only quotes updated after the given date.
--max-quotes <-1> | -q            Migrates only the amount of quotes below to this number. Defaults to -1 (all quotes found)
--max-retries <1> | -r            Times to retry a new upload if ArrowDB returned an error. Defaults to 1.
	`);
}

start();
