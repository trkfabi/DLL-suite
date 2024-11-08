/**
 * Custom Sync adapter for using Joli ORM
 * ##version 1.0.0
 * @class Alloy.sync.joli
 * @singleton
 */
var doLog = Alloy.Globals.doLog;

var Joli = require('/external/joli');

var joliSync = (function () {
	// constants
	var ALLOY_DB_DEFAULT = '_alloy_';
	var ALLOY_ID_DEFAULT = 'alloy_id';

	// Private variables
	var cache = {
		configs: {},
		models: {}
	};

	var currentVersions = Ti.App.Properties.getObject('joli.tables.versions', {});

	/**
	 * @method
	 * ##Public
	 * Function to be called before each model creation. Usefull for initialize some configs on the model or the adapter
	 * @param {Object} _config The config dictionary from the model definition
	 * @param {String} _name The name of the Model to be created
	 */
	var beforeModelCreate = function (_config, _name) {
		if (cache.configs[_name]) {
			return cache.configs[_name];
		}

		_config = _config || {};

		doLog && console.debug('[joliSync] - beforeModelCreate() - ' + _name);

		var _joli = null;
		var _adapter = _config.adapter || {};
		var _dbName = _adapter.db_name || ALLOY_DB_DEFAULT;
		var _table = _adapter.collection_name;
		var _columns = _config.columns;
		var _latestVersion = _adapter.version;
		var _migrationCache = [];
		var _migrated = false;
		var _currentVersion = currentVersions[_table] || 0;
		var _freshVersion = _adapter.lastFreshMigration;

		if (_table && _columns) {
			doLog && console.debug('[joliSync] - beforeModelCreate() - ' + _name + ' has valid config.');

			_joli = Joli.connect(_dbName);

			if (!_adapter.idAttribute) {
				doLog && console.debug('[joliSync] - No config.adapter.idAttribute specified for table "' + _table + '"');
				doLog && console.debug('[joliSync] - Adding "' + ALLOY_ID_DEFAULT + '" to uniquely identify rows');
				_columns[ALLOY_ID_DEFAULT] = "TEXT UNIQUE";
				_adapter.idAttribute = ALLOY_ID_DEFAULT;
			}

			_config.joliModel = new _joli.model({
				table: _table,
				columns: _columns
			});

			if (_currentVersion < _latestVersion) {
				_joli.models.initialize();

				_migrationCache = new _joli.query()
					.select('*')
					.from(_table)
					.execute('array');

				_joli.connection.database.execute('DROP TABLE IF EXISTS ' + _table);

				doLog && console.warn('[joliSync] - migration for table: ' + _table + ', DROP TABLE');

				_migrated = true;
			}

			_joli.models.initialize();

			if (_migrated) {
				// TODO: document freshMigration
				// if true: the migration will only wipe the data from the table
				if (_freshVersion == null || _currentVersion >= _freshVersion) {
					_joli.connection.database.execute('BEGIN TRANSACTION');

					doLog && console.warn('[joliSync] - migration restore of: ' + _table);
					doLog && console.debug('[joliSync] - migration _migrationCache: ' + JSON.stringify(_migrationCache));

					_.each(_migrationCache, function (_oldRow) {

						_.each(_oldRow, function (_prop, _propName) {
							if (!_columns[_propName]) {
								delete _oldRow[_propName];
							}
						});

						new _joli.query()
							.insertReplace(_table)
							.values(_oldRow)
							.execute();

					});

					_joli.connection.database.execute('COMMIT TRANSACTION');
				}

				currentVersions[_table] = _latestVersion;

				Ti.App.Properties.setObject('joli.tables.versions', currentVersions);

				doLog && console.warn('[joliSync] - currentVersions - ' + JSON.stringify(currentVersions));
			}

			_joli.connection.disconnect();
		} else {
			doLog && console.warn('[joliSync] - beforeModelCreate() - ' + _name + ' has invalid config: ' + JSON.stringify(
				_config));
		}

		cache.configs[_name] = _config;

		_config.getJoli = getJoli;

		return _config;

	};

	/**
	 * @method
	 * ##Public
	 * Function called after the model has been created
	 * @param {Backbone.Model} _model The Model that was just created
	 * @param {String} _name The name of the Model created
	 */
	var afterModelCreate = function (_model, _name) {
		if (cache.models[_name]) {
			return cache.models[_name];
		}

		doLog && console.debug('[joliSync] - afterModelCreate() - ' + _name);

		_model.prototype.idAttribute = _model.prototype.config.adapter.idAttribute;

		cache.models[_name] = _model;

		return _model;
	};

	/**
	 * @method
	 * ##Public
	 * The function that Backbone calls every time it attempts to read or save a model or collection
	 * @param {String} _method the CRUD method (`create`, `read`, `update` or `delete`)
	 * @param {Backbone.Model/Backbone.Collection} _model the Model or Collection sync
	 * @param {Object} [_options] additional dictionary of options
	 */
	var sync = function (_method, _model, _options) {
		var _config = _model.config || {};
		var _isCollection = _model instanceof Backbone.Collection;
		var _adapter = _config.adapter || {};
		var _columns = _config.columns || {};
		var _dbName = _adapter.db_name || ALLOY_DB_DEFAULT;
		var _table = _adapter.collection_name;
		var _joli = Joli.connect(_dbName);

		doLog && console.debug('[joliSync] - sync() - ' + _table + ' - ' + _method);

		switch (_method) {
		case 'create':
		case 'update':
			_joli.connection.database.execute('BEGIN TRANSACTION');

			if (_isCollection) {
				_model.each(function (_realModel) {
					saveModel(_realModel, _joli);
				});
			} else {
				saveModel(_model, _joli);
			}

			_joli.connection.database.execute('COMMIT TRANSACTION');
			_joli.connection.disconnect();

			// _options.success && _options.success(_model.toJSON());

			break;

		case 'read':
			var _result = null;
			var _joliModel = _joli.models.get(_table);

			if (_options.query) {
				var _query;

				if (_options.query.select) {
					_query = new _joli.query()
						.select(_options.query.select)
						.from(_table);
				} else {
					_query = new _joli.query()
						.select()
						.from(_table);
				}

				if (_options.query.join) {
					_query.join(_options.query.join[0], _options.query.join[1], _options.query.join[2]);
				}

				if (_options.query.where) {
					_.each(_options.query.where, function (_value, _field) {
						_query.where(_field, _value);
					});
				}

				if (_options.query.order) {
					_query.order(_options.query.order);
				}

				if (_options.query.groupBy) {
					_query.groupBy(_options.query.groupBy);
				}

				if (_options.query.limit) {
					_query.limit(_options.query.limit);
				}

				doLog && console.debug('[joliSync] - _query.getQuery(): ' + _query.getQuery());

				_result = _query.execute('array');

				if (_result && _result.length === 1) {
					_result = _result[0];
				}
			} else {
				if (_isCollection) {
					// Collection fetch
					_result = new _joli.query()
						.select('*')
						.from(_table)
						.execute('array');

				} else if (_model.id || _options.id) {
					// Model fetch
					var _id = _model.id || _options.id;
					_result = new _joli.query()
						.select('*')
						.from(_table)
						.where(_model.idAttribute + ' = ?', _id)
						.execute('array');

					if (_result && _result.length > 0) {
						_result = _result[0];
					}
				}
			}

			_joli.connection.disconnect();

			if (_result) {
				_options.success && _options.success(_result);
			} else {
				_options.error && _options.error(_result);
			}

			break;

		case 'delete':
			if (!_isCollection && _model.id) {
				new _joli.query()
					.destroy()
					.from(_table)
					.where(_model.idAttribute + ' = ?', _model.id)
					.execute();

				_options.success && _options.success(_model.toJSON());
			} else {
				_options.error && _options.error();
			}
			break;
		}
	};

	/**
	 * @method
	 * ##Private
	 * Saves a single model as a row.
	 * @param {Backbone.Model} _model Model to save
	 * @param {Joli.connection} _joli Joli connection's instance to use to save the model
	 */
	function saveModel(_model, _joli) {
		var _config = _model.config || {};
		var _adapter = _config.adapter || {};
		var _columns = _config.columns || {};
		var _table = _adapter.collection_name;

		var _modelData = {};
		var _attrObj = {};
		var _valuesToSave = {};

		if (!_model.id) {
			_model.id = (_model.idAttribute === ALLOY_ID_DEFAULT) ? Alloy.Globals.generateGUID() : null;
			_attrObj[_model.idAttribute] = _model.id;
			_model.set(_attrObj, {
				silent: true
			});
		}

		_modelData = _model.toJSON();

		_.each(_columns, function (_type, _name) {
			_valuesToSave[_name] = _modelData[_name] || null;
		});

		new _joli.query()
			.insertReplace(_table)
			.values(_valuesToSave)
			.execute();
	};

	/**
	 * @method getJoli
	 * Obtains a new Joli connection for using custom queries
	 * **You should close the connection once you don't need it**
	 * @return {Object} Joli connection
	 */
	var getJoli = function () {
		var _model = this;
		var _config = _model.config || {};
		var _adapter = _config.adapter || {};
		var _dbName = _adapter.db_name || ALLOY_DB_DEFAULT;

		return Joli.connect(_dbName);
	};

	return {
		// Optional methods for the adapter
		beforeModelCreate: beforeModelCreate,
		afterModelCreate: afterModelCreate,

		// Required sync method
		sync: sync
	};
})();

module.exports = joliSync;
