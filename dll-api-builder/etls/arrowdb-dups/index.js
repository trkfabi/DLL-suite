const ArrowDB = require('./lib/reusable/arrowDBConnector');
const QuoteUtils = require('./lib/quoteUtils');
const FileUtils = require('./lib/fileUtils');
const process = require('process');
const moment = require('moment');
const today = moment().format('YYYY-MM-DD-HH:mm:ss');

let verbose = false;
let createDups = false;
let deleteDups = false;
let runTests = false;
let saveLogs = false;
let fullCycle = false;
let noQuotes = false;
let noEvents = false;
let arrowDB;

const Index = (function () {
	async function start(options = {}) {
		const {
			key,
			username,
			password,
		} = options;

		({
			verbose = false,
			createDups = false,
			deleteDups = false,
			runTests = false,
			saveLogs = false,
			noQuotes = false,
			noEvents = false,
			fullCycle = false,
		} = options);

		arrowDB = new ArrowDB({
			key,
			username,
			password
		});

		await arrowDB.login();
		if (!noQuotes) {
			await removeDups('quote');
		}
		if (!noEvents) {
			await removeDups('event');
		}
	}

	async function removeDups(_table) {
		let quotes = await arrowDB.query(_table);

		if (fullCycle) {
			verbose = createDups = deleteDups = runTests = saveLogs = true;
		}

		FileUtils.createLogFile('./results/logs.txt', {
			verbose,
			saveLogs
		});

		FileUtils.add(`Quotes initially: ${quotes.length}`);

		if (createDups) {
			const newQuotes = QuoteUtils.createDuplicates(quotes);
			const newDups = QuoteUtils.findDuplicates([...quotes, ...newQuotes]);

			FileUtils.saveCSV(`./results/${_table}-dups-created-${process.env.ENV_NAME}-${today}.csv`, QuoteUtils.transformToCSV(newQuotes));
			FileUtils.add(`Adding ${newQuotes.length} ${_table}s for ${newDups.duplicatesOriginals} stand-alone ${_table}s`);

			await arrowDB.saveItems(_table, newQuotes);
			quotes = await arrowDB.query(_table);

			FileUtils.add(`Quotes after new duplicates: ${quotes.length}`);
		}

		const dups = QuoteUtils.findDuplicates(quotes);
		let { detail: quotesFound = [] } = dups;
		let { originalQuotes, duplicatedQuotes } = QuoteUtils.prepareDuplicatesForLogs(quotesFound);

		FileUtils.saveCSV(`./results/${_table}-originals-found-${process.env.ENV_NAME}-${today}.csv`, QuoteUtils.transformToCSV(originalQuotes));
		FileUtils.saveCSV(`./results/${_table}-dups-found-${process.env.ENV_NAME}-${today}.csv`, QuoteUtils.transformToCSV(duplicatedQuotes));
		FileUtils.saveCSV(`./results/${_table}-unique-found-${process.env.ENV_NAME}-${today}.csv`, QuoteUtils.transformToCSV(dups.uniques));
		FileUtils.add(`Unique ${_table} found: ${dups.uniques.length}`);
		FileUtils.add(`${_table} duplicates found: ${dups.duplicatesTotals} for ${dups.duplicatesOriginals} stand-alone ${_table}`);

		if (deleteDups) {
			try {
				FileUtils.add(`removing duplicated ${_table}s...`);
				const ids = QuoteUtils.searchIdsFromDuplicatesForArrow(dups);
				await arrowDB.removeIds('quote', ids);
				FileUtils.add(`duplicated ${_table}s removed.`);
				quotes = await arrowDB.query(_table);
				FileUtils.add(`${_table}s after duplicates removed: ${quotes.length}`);
			} catch (_error) {
				FileUtils.add('Failed to delete duplicates: ' + JSON.stringify(_error, null, '	'));
			}
		}
	}

	return {
		start
	};
})();

module.exports = Index;
