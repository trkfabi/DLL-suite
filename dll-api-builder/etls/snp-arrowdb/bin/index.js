#!/usr/bin/env

/*eslint no-console: 0*/
const process = require('process');
const minimist = require('minimist');
const moment = require('moment');
const env = require('node-env-file');

const Migrator = require('../lib/migrator');
const Helpers = require('../lib/reusable/helpers');
const pkg = require('../package.json');
const title = `S&P Migrator v${pkg.version}`;
console.log(title);

const argv = minimist(process.argv.slice(2));

const verbose = Helpers.presetVar('verbose', 'v', false, argv);
const help = Helpers.presetVar('help', 'h', false, argv);
const file = Helpers.presetVar('file', 'f', null, argv);
const sheet = Helpers.presetVar('sheet', 's', undefined, argv);
const logFile = Helpers.presetVar('log-file', 'lf', undefined, argv);
const responseFile = Helpers.presetVar('response-file', 'rf', undefined, argv);
const compareDatabase = Helpers.presetVar('compareDatabase', 'c', false, argv);
const save = Helpers.presetVar('save', 'sd', false, argv);
const preventSnp = Helpers.presetVar('preventSnp', 'snp', false, argv);
const noFile = Helpers.presetVar('noFile', 'nof', false, argv);

global.doLog = !!verbose;

const cwd = process.cwd();
env(`${cwd}/vars.env`);

/**
 * @method start
 * @private
 * Starts the script
 * @return {void}
 */
async function start() {
	if (help) {
		showHelp();
		return;
	}

	try {
		const migrator = new Migrator({
			file,
			sheet,
			logFile,
			responseFile,
			compareDatabase,
			save,
			preventSnp,
			noFile
		});

		const results = await migrator.start();
		const {
			total = [],
			successWithId = [],
			failedWithId = [],
			successWithNoId = [],
			failedWithNoId = [],
			startTime = 'N/A',
			finishTime = 'N/A',
			numberofSnpExceptions = 0
		} = results;

		const duration = moment.duration(finishTime.diff(startTime));

		console.log(
			[
				`Results:`,
				`Total: ${total.length}`,
				`[Arrow] Completed with ID: ${successWithId.length}`,
				`[Arrow] Errors with ID: ${failedWithId.length}`,
				`[Arrow] Completed with no ID: ${successWithNoId.length}`,
				`[Arrow] Errors with no ID: ${failedWithNoId.length}`,
				`[Arrow] Number of S&P exceptions found: ${numberofSnpExceptions}`,
				`Completed ${duration.humanize(true)}`
			].join('\n')
		);
		process.exit(0);
	} catch (error) {
		console.error(
			`An error occured: ${error.message}\n${error.stack}\n${JSON.stringify(
				error
			)}`
		);
		process.exit(1);
	}
}

function showHelp() {
	console.log(`
Migrates Credit Ratings from S&P into ArrowDB and creates a CSV file with the Ratings table 

usage:
$ node bin/index.js [options]

options:

--verbose | -v. Shows logs.

--help | -h. Shows this help in the cli.

--file <path-to-xls> | -f. Specifies the XLS file to load for the migration.

--sheet <sheet-name> | -s. Specifies the name of the sheet to load from the XLS file.

--log-file <file-name> | -lf. Specifies the name of the LOG file.

--response-file <file-name> | -lf. Specifies the name of the RESPONSE file.

--compareDatabase | -c. Generates a file comparing the old database with the new information from the file.

--save | - sd. Flag to save to database.

--preventSnp | - snp. Flag to skip the update data from S&P api.

--noFile | - nof. Flag to not use a file in the process.
	`);
}

start();
