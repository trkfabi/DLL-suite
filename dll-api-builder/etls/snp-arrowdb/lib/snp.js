/**
 * Manager for the SnP API calls
 * @class Lib.snp
 * @singleton
 */

const LOG_TAG = '\x1b[35m' + '[lib/snp]' + '\x1b[39;49m ';

var _ = require('lodash');
var request = require('request');
var async = require('async');

const FileWriter = require('./fileWriter');

var SnpConnector = function(options = {}) {
	// +-------------------
	// | Private members.
	// +-------------------
	const { url, username, password, logFile, responseFile, noFile } = options;

	const SNP_FUNCTION = 'GDSP';
	const LONG_TERM_TAG = 'ICR_LC_LONG_TERM_RATING';
	const SHORT_TERM_TAG = 'ICR_LC_SHORT_TERM_RATING';
	const GLOB_ULTIMATE_PARENT_NAME = 'IQ_ULT_PARENT';
	const EMPTY_FIELD = 'Data Unavailable';
	const CHUNK_SIZE = 100;

	let objectResponse = {};
	let exceptions = 0;

	FileWriter.checkFileExists(logFile);
	if (!noFile) {
		FileWriter.checkFileExists(responseFile);
	}

	const rowNames =
		'S&P Entity ID,Entity Name,Parent Name,Long Term Rating,Short Term Rating,Messages/Errors';
	FileWriter.appendFile(logFile, rowNames + '\r\n');

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method compare
	 * Used with array.sort to sort the array by an object key
	 * @return {Number}
	 */

	function compare(a, b) {
		if (a.entity_rxid < b.entity_rxid) return -1;
		if (a.entity_rxid > b.entity_rxid) return 1;
		return 0;
	}

	/**
	 * @method getUpdatedList
	 * Given a list of entities, returns the updated list of them
	 * @param {Object[]} _entities List of entities to update
	 * @return {void}
	 */
	function getUpdatedList(_entities) {
		doLog && console.log(LOG_TAG, '- getUpdatedList');
		var entities = JSON.parse(JSON.stringify(_entities || []));
		entities.sort(compare);
		var uniqueEntities = _.uniqBy(entities, 'entity_rxid');
		let progress = 0;
		return new Promise((resolve, reject) => {
			async.eachLimit(
				_.chunk(uniqueEntities, CHUNK_SIZE),
				1,
				(chunk, done) => {
					progress += CHUNK_SIZE;
					let progressPercentage = (progress / entities.length) * 100;
					process.stdout.write(
						` ${(progressPercentage > 100 ? 100 : progressPercentage).toFixed(
							0
						)}%\r`
					);
					const body = {
						inputRequests: formatEntitiesRequest(chunk)
					};
					request(
						{
							url,
							method: 'POST',
							headers: {
								'content-type': 'application/json',
								'Accept-Encoding': 'gzip,deflate'
							},
							auth: {
								user: username,
								pass: password,
								sendImmediately: true
							},
							body: JSON.stringify(body)
						},
						(error, response, raw) => {
							if (error) {
								return done(error);
							}

							const snpResponse = JSON.parse(raw);
							const { GDSSDKResponse } = snpResponse;

							if (!GDSSDKResponse) {
								doLog &&
									console.debug(
										`${LOG_TAG} - request - no S&P response: ${JSON.stringify(
											error
										)}`
									);

								return done();
							}

							processResponse(GDSSDKResponse);
							done();
						}
					);
				},
				error => {
					if (error) {
						return reject(error);
					}

					updateEntities();

					resolve({ entities, exceptions });
				}
			);
		});

		/**
		 * @method formatEntitiesRequest
		 * @private
		 * Prepares the request to be sent to the api
		 * @param {Object} _entities Entitiy list
		 * @return {String} Encoded entity list
		 */
		function formatEntitiesRequest(_entities) {
			doLog && console.log(LOG_TAG, '- formatEntitiesRequest');
			_entities = _entities || {};
			var inputRequests = [];
			_.each(_entities, function(_entity) {
				inputRequests.push({
					function: SNP_FUNCTION,
					identifier: _entity.entity_rxid,
					mnemonic: LONG_TERM_TAG
				});
				inputRequests.push({
					function: SNP_FUNCTION,
					identifier: _entity.entity_rxid,
					mnemonic: SHORT_TERM_TAG
				});
				inputRequests.push({
					function: SNP_FUNCTION,
					identifier: _entity.entity_rxid,
					mnemonic: GLOB_ULTIMATE_PARENT_NAME
				});
			});

			return inputRequests;
		}

		/**
		 * @method processResponse
		 * @private
		 * Format and upload the entities ratings
		 * @param {Object[]} _snpResponse Response from SnP API to update from
		 * @return {void}
		 */

		function processResponse(_snpResponse) {
			doLog && console.log(LOG_TAG, '- processResponse');

			const snpResponse = _snpResponse || [];

			let message = '';
			_.each(snpResponse, response => {
				if (!response.Identifier) {
					message = 'S&P Error: no Identifier';
					FileWriter.writeEntityToFile(logFile, null);
					FileWriter.appendFile(logFile, `${message}\r\n`);
					throw Error(message);
				}

				if (!objectResponse[response.Identifier]) {
					objectResponse[response.Identifier] = {};
				}

				objectResponse[response.Identifier].err_msg = null;
				if (response.ErrMsg.length > 0) {
					objectResponse[response.Identifier].err_msg = response.ErrMsg;
				}

				const row =
					(response.Rows && response.Rows[0] && response.Rows[0].Row[0]) ||
					EMPTY_FIELD;
				const rowValue = formatResult(row);
				switch (response.Mnemonic) {
					case SHORT_TERM_TAG:
						objectResponse[response.Identifier].st_rating = formatResult(
							rowValue
						);
						break;
					case LONG_TERM_TAG:
						objectResponse[response.Identifier].lt_rating = formatResult(
							rowValue
						);
						break;
					case GLOB_ULTIMATE_PARENT_NAME:
						objectResponse[response.Identifier].entity_parent = formatResult(
							rowValue
						);
						break;
					default:
						console.log('Invalid response.Mnemonic: ' + response.Mnemonic);
				}
			});
		}

		function updateEntities() {
			doLog && console.log(LOG_TAG, '- updateEntities');

			if (!noFile) {
				FileWriter.appendFile(responseFile, JSON.stringify(objectResponse));
			}

			_.each(entities, entity => {
				const responseEntity = objectResponse[entity.entity_rxid];

				let message = '';
				if (isEmptyEntity(responseEntity)) {
					message += `RXID does not exist in S&P || `;
					if (responseEntity.err_msg) {
						message += `Error message: ${responseEntity.err_msg} || `;
					}
					FileWriter.writeEntityToFile(logFile, entity);
					FileWriter.appendFileSync(logFile, `${message}\r\n`);
				} else {
					if (!responseEntity.entity_parent) {
						message += `No Parent name found in S&P || `;
						exceptions++;
					} else if (responseEntity.entity_parent !== entity.entity_parent) {
						if (!noFile) {
							message += `"Parent name has changed in S&P OLD: ${
								entity.entity_parent
							} NEW: ${responseEntity.entity_parent} || "`;
						}
						entity.entity_parent = responseEntity.entity_parent;
					}
					if (!responseEntity.lt_rating) {
						message += `No long term in S&P || `;
						exceptions++;
					} else {
						if (responseEntity.lt_rating !== entity.lt_rating) {
							if (!noFile) {
								message += `Long term rating changed in S&P OLD: ${
									entity.lt_rating
								} NEW: ${responseEntity.lt_rating} || `;
							}
						}
						entity.lt_rating = responseEntity.lt_rating;
					}
					if (!responseEntity.st_rating) {
						//message += `No short term in S&P || `;
					} else {
						entity.st_rating = responseEntity.st_rating;
					}
					if (message.length > 0) {
						FileWriter.writeEntityToFile(logFile, entity);
						FileWriter.appendFileSync(logFile, `${message}\r\n`);
					}
				}
			});
		}

		function isEmptyEntity(_responseEntity) {
			return (
				!_responseEntity ||
				(!_responseEntity.entity_parent &&
					!_responseEntity.lt_rating &&
					!_responseEntity.st_rating)
			);
		}
		/**
		 * @method formatResult
		 * @private
		 * Validates and format the result for the field
		 * @param {String} _param Field result
		 * @return {String} NULL if 'Data Unavailable', otherwise the same result
		 */
		function formatResult(_param) {
			if (_param === EMPTY_FIELD) {
				return null;
			}
			return _param;
		}
	}

	return {
		getUpdatedList: getUpdatedList
	};
};

module.exports = SnpConnector;
