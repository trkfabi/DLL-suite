/**
 * Instance for exporting data from ArrowDB
 * @class lib.exporter
 * @singleton
 */
const LOG_TAG = '\x1b[32m' + '[lib/exporter]' + '\x1b[39;49m ';

const fs = require('fs');
const util = require('util');

const moment = require('moment');

const ArrowDBConnector = require('./reusable/arrowDBConnector');
const Helpers = require('./reusable/helpers');
const writeFile = util.promisify(fs.writeFile);

function Migrator(params = {}) {
	// +-------------------
	// | Private members.
	// +-------------------
	const {
		tables,
		format = '$table-$date-$time',
		key,
		username,
		password,
		order
	} = params;

	const arrowDB = new ArrowDBConnector({
		key,
		username,
		password
	});

	const today = moment();

	const prepareFileName = (format, { table, date, time } = {}) => {
		return format.replace(/\$([\w]+)/g, (match, group) => {
			switch (group) {
				case 'table':
					return table;

				case 'date':
					return date;

				case 'time':
					return time;

				default:
					return match;
			}
		});
	};

	const exportTable = async (
		table,
		{ type = 'csv', format: fileFormat = '' } = {}
	) => {
		doLog && console.debug(`${LOG_TAG} - exportTable - ${table}`);

		const items = await arrowDB.query(table, { order: order });

		if (items.length === 0) {
			console.log(`Could not export table ${table} - no items found.`);
			return;
		}

		if (!fileFormat) {
			fileFormat = format;
		}

		const fileName = prepareFileName(format, {
			table,
			date: today.format('YYYYMMDD'),
			time: today.format('HHmmss')
		});

		switch (type) {
			case 'csv': {
				const file = `${fileName}.csv`;
				await writeFile(file, Helpers.toCsv(items));

				return file;
			}
			default:
				console.log(`Export - Type not supported: ${type}.`);
				return '';
		}
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

		await arrowDB.login();

		const requests = tables.map(table => {
			return exportTable(table, {
				format,
				type: 'csv'
			});
		});

		return await Promise.all(requests);
	};

	return {
		start
	};
}

module.exports = Migrator;
