/**
 * Instance for migrating data from MySQL to ArrowDB
 * @class lib.migrator
 * @singleton
 */
const LOG_TAG = '\x1b[32m' + '[lib/migrator]' + '\x1b[39;49m ';

const process = require('process');

const moment = require('moment');
const _ = require('lodash');
const xls = require('xls-to-json');
const { v4: uuid } = require('uuid');

const ArrowDBConnector = require('./reusable/arrowDBConnector');
const SnpConnector = require('./snp');
const FileWriter = require('./fileWriter');
const Helpers = require('./reusable/helpers');

const TABLE_ARROW_RATING = 'rating';

const NO_FILE_DEFAULT_FOLDER = 'Database/';
const NO_FILE_LOG_DATABASE = NO_FILE_DEFAULT_FOLDER + 'CreditRatingUpdates.csv';
const NO_FILE_LOG_SNP = NO_FILE_DEFAULT_FOLDER + 'CreditRatingExceptions.csv';

function Migrator(params = {}) {
	// +-------------------
	// | Private members.
	// +-------------------
	const today = moment();
	const date = today.format('YYYYMMDD');
	const time = today.format('HHmmss');
	const {
		file,
		sheet = 'Sheet1',
		logFile = `S&P/S&P_ETL_log-${date}-${time}.csv`,
		responseFile = `S&P/S&P_ETL_Response-${date}-${time}.json`,
		preUpdateDatabase = `Database/preUpdate-${
			process.env.ENV_NAME
		}-${date}-${time}.csv`,
		compareDatabase = false,
		save = false,
		preventSnp = false,
		noFile = false
	} = params;

	const arrowDB = new ArrowDBConnector({
		key: process.env.ARROWDB_KEY,
		username: process.env.ARROWDB_USER,
		password: process.env.ARROWDB_PASS
	});

	const snp = new SnpConnector({
		logFile: noFile ? NO_FILE_LOG_SNP : logFile,
		responseFile,
		url: process.env.SNP_URL,
		username: process.env.SNP_USER,
		password: process.env.SNP_PASS,
		noFile
	});

	let logFileDatabase = noFile
		? NO_FILE_LOG_DATABASE
		: `Database/Database_Comparison-${date}-${time}.csv`;

	if (noFile) {
		logFileDatabase = NO_FILE_LOG_DATABASE;
	}

	FileWriter.checkFileExists(logFileDatabase);
	const rowNames =
		'OLD S&P Entity ID,OLD Entity Name,OLD Parent Name,OLD Long Term Rating,OLD Short Term Rating,NEW S&P Entity ID,NEW Entity Name,NEW Parent Name,NEW Long Term Rating,NEW Short Term Rating,Messages/Errors';
	FileWriter.appendFile(logFileDatabase, rowNames + '\r\n');

	const convertXlsToJSON = _file => {
		return new Promise((resolve, reject) => {
			xls(
				{
					input: _file, // input xls
					output: 'output.json', // output json
					sheet // specific sheetname
				},
				(error, response) => {
					if (error) {
						return reject(error);
					}

					return resolve(response);
				}
			);
		});
	};

	/**
	 * @method runETL
	 * @private
	 * Performs the ETL process
	 * @return {Promise}
	 */
	const runETL = async () => {
		doLog && console.log(LOG_TAG, '- runETL');
		const startTime = moment();
		let entities;
		if (!noFile) {
			entities = await getEntitiesByFile(startTime);
			const result = await arrowDB.query(TABLE_ARROW_RATING, {});
			generatePreUpdateDatabaseFile(result);
		} else {
			entities = await getEntitiesByDatabase();
		}

		const total = entities;
		let entitiesWithId = [];
		let entitiesWithNoId = [];
		let successWithId = [];
		let failedWithId = [];
		let successWithNoId = [];
		let failedWithNoId = [];
		let numberofSnpExceptions = 0;

		entities.forEach(entity => {
			if (entity.entity_rxid) {
				entitiesWithId.push(entity);
			} else {
				entitiesWithNoId.push(entity);
			}
		});

		if (!preventSnp && entitiesWithId.length > 0) {
			doLog && console.debug(`${LOG_TAG} - Updating from S&P`);
			const { entities, exceptions } = await snp.getUpdatedList(entitiesWithId);
			entitiesWithId = entities;
			numberofSnpExceptions = exceptions;
		}

		if (compareDatabase) {
			await compareDatabaseChanges([...entitiesWithId, ...entitiesWithNoId]);
		}

		if (save) {
			// Removing id to avoid issues with saving
			entitiesWithId = entitiesWithId.map(_result => {
				return _.omit(_result, 'id');
			});
			entitiesWithNoId = entitiesWithNoId.map(_result => {
				return _.omit(_result, 'id');
			});

			doLog && console.debug(`${LOG_TAG} - reset table ${TABLE_ARROW_RATING}`);
			await arrowDB.reset(TABLE_ARROW_RATING);

			doLog && console.debug(`${LOG_TAG} - saving to Arrow...`);
			const arrowResults = await Promise.all([
				arrowDB.saveItems(TABLE_ARROW_RATING, entitiesWithId),
				arrowDB.saveItems(TABLE_ARROW_RATING, entitiesWithNoId)
			]);
			[
				[successWithId, failedWithId],
				[successWithNoId, failedWithNoId]
			] = arrowResults;
		}

		if (noFile && save) {
			// TODO: Check if its better to upload this to a table instead
			await arrowDB.saveFile({
				name: preUpdateDatabase.substring(preUpdateDatabase.indexOf('/') + 1),
				file: preUpdateDatabase,
				meta: {
					pid: uuid(),
					dateUploaded: moment().toISOString()
				}
			});
			if (!preventSnp) {
				await arrowDB.saveFile({
					name: logFile.substring(logFile.indexOf('/') + 1),
					file: logFile,
					meta: {
						pid: uuid(),
						dateUploaded: moment().toISOString()
					}
				});
			}
		}

		const finishTime = moment();

		return {
			startTime,
			finishTime,
			total,
			successWithId,
			failedWithId,
			successWithNoId,
			failedWithNoId,
			numberofSnpExceptions
		};
	};

	/**
	 * @method getEntitiesByFile
	 * @private
	 * Get the entity list from the provided excel file
	 * @param {object} _startTime Datetime of the moment the process starts
	 * @return {Array} entity list taken from the file
	 */
	const getEntitiesByFile = async _startTime => {
		const fileName = _.last(file.split('/'));
		const fileExtension = _.last(fileName.split('.'));

		if (!['xls', 'xlsx'].includes(fileExtension)) {
			throw Error(
				'File not supported: ' + fileExtension + '. Must be a xls or xlsx file'
			);
		}

		const json = await convertXlsToJSON(file);
		const entities = _.chain(json)
			.filter(item => {
				if (
					!item['Entity Name'] &&
					!item['S&P Entity ID'] &&
					!item['entity_rxid'] &&
					!item['entity_name']
				) {
					return false;
				}

				_.each(item, function(_value, _key) {
					if (!_key) {
						delete item[_key];
					}
				});

				return true;
			})
			.map(item => {
				return {
					id: item['id'] || '',
					entity_rxid: item['S&P Entity ID'] || item['entity_rxid'] || '',
					entity_name: item['Entity Name'] || item['entity_name'] || '',
					entity_parent: item['Parent Name'] || item['entity_parent'] || '',
					st_rating: item['Short Term Rating'] || item['st_rating'] || '',
					lt_rating: item['Long Term Rating'] || item['lt_rating'] || '',
					last_update: _startTime.format()
				};
			})
			.value();

		return entities;
	};

	/**
	 * @method getEntitiesByDatabase
	 * @private
	 * Get the entity list from the database
	 * @return {Array} entity list
	 */
	const getEntitiesByDatabase = async () => {
		const result = await arrowDB.query(TABLE_ARROW_RATING, {});
		// TODO: Remove this if it is really not needed
		// generatePreUpdateDatabaseFile(result);

		return result;
	};

	/**
	 * @method generatePreUpdateDatabaseFile
	 * @private
	 * Save the entity list to a file
	 * @param {object} _items Entity list
	 * @return {void}
	 */
	const generatePreUpdateDatabaseFile = _items => {
		FileWriter.checkFileExists(preUpdateDatabase);
		const csvTable = Helpers.toCsv(_items);
		FileWriter.appendFileSync(preUpdateDatabase, csvTable);
	};

	/**
	 * @method compareDatabaseChanges
	 * @private
	 * Compares the current database againsat the new data and creates a file
	 * @param {Object[]} _newEntities List of the new entities
	 * @return {void}
	 */
	const compareDatabaseChanges = async _newEntities => {
		doLog && console.log(LOG_TAG, '- compareDatabaseChanges');
		let entity;
		let entitiesFound = [];
		let entitiesDeleted;

		const oldEntities = await arrowDB.query(TABLE_ARROW_RATING, {});

		_.each(_newEntities, _newEntity => {
			let message = '';
			if (_newEntity.id) {
				entity = _.find(oldEntities, function(_entity) {
					return _entity.id === _newEntity.id;
				});
				// Check if the _newEntity exists by name + parent name
				if (!entity) {
					entity = _.find(oldEntities, function(_entity) {
						const compiledOldName =
							_entity.entity_name.trim() + _entity.entity_parent.trim();
						const compiledName =
							_newEntity.entity_name.trim() + _newEntity.entity_parent.trim();
						return compiledOldName === compiledName;
					});
				}
			} else {
				message += `New Entity does not exist in Old database`;
				FileWriter.writeEntityToFile(logFileDatabase, null);
				FileWriter.writeEntityToFile(logFileDatabase, _newEntity);
				FileWriter.appendFileSync(logFileDatabase, `${message}\r\n`);
				return;
			}

			if (!entity) {
				message += `New Entity does not exist in Old database`;
				FileWriter.writeEntityToFile(logFileDatabase, entity);
				FileWriter.writeEntityToFile(logFileDatabase, _newEntity);
				FileWriter.appendFileSync(logFileDatabase, `${message}\r\n`);
			} else {
				entitiesFound.push(entity);
				if (entity.entity_rxid !== _newEntity.entity_rxid) {
					message += `"RXID has changed NEW: ${_newEntity.entity_rxid} OLD: ${
						entity.entity_rxid
					} || "`;
				}
				if (entity.entity_name !== _newEntity.entity_name) {
					message += `"Name has changed NEW: ${_newEntity.entity_name} OLD: ${
						entity.entity_name
					} || "`;
				}
				if (entity.entity_parent !== _newEntity.entity_parent) {
					message += `"Parent name has changed NEW: ${
						_newEntity.entity_parent
					} OLD: ${entity.entity_parent} || "`;
				}
				if (entity.lt_rating !== _newEntity.lt_rating) {
					message += `Long term rating changed NEW: ${
						_newEntity.lt_rating
					} OLD: ${entity.lt_rating} || `;
				}
				if (message.length <= 0) {
					message = 'No changes';
				}

				FileWriter.writeEntityToFile(logFileDatabase, entity);
				FileWriter.writeEntityToFile(logFileDatabase, _newEntity);
				FileWriter.appendFileSync(logFileDatabase, `${message}\r\n`);
			}
		});

		entitiesDeleted = _.difference(oldEntities, entitiesFound);
		doLog &&
			console.log(
				LOG_TAG,
				'entitiesDeleted.length: ' +
					JSON.stringify(entitiesDeleted.length, null, '	')
			);
		_.each(entitiesDeleted, _deleted => {
			let message = 'Old Entity does not exist in New database';
			FileWriter.writeEntityToFile(logFileDatabase, _deleted);
			FileWriter.writeEntityToFile(logFileDatabase, null);
			FileWriter.appendFileSync(logFileDatabase, `${message}\r\n`);
		});

		if (noFile && save) {
			// TODO: Check if its better to upload this to a table instead
			await arrowDB.saveFile({
				name: logFileDatabase.substring(logFileDatabase.indexOf('/') + 1),
				file: logFileDatabase,
				meta: {
					pid: uuid(),
					dateUploaded: moment().toISOString()
				}
			});
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
		doLog && console.debug(`${LOG_TAG} - login complete`);
		return await runETL();
	};

	return {
		start
	};
}

module.exports = Migrator;
