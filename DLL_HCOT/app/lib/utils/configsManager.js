/**
 * @class Libs.configsManager
 * @singleton
 * Handles all the logic for loading different libs, controllers and constants based on the "country" loaded by the session.
 */
var configsManager = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	/**
	 * @property {Object} configLib library with set of configs loaded
	 * @private
	 */
	var configLib = null;

	/**
	 * @property {String} basePath starting path to search for libs and controllers
	 * @private
	 */
	var basePath = '';

	var models = [
		'Quote',
		'Equipment',
		'PaymentOption'
	];

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method useConfigs
	 * Updates the `configLib` to use and obtain all the configs from.
	 * @param {String} _path file to load as new config file
	 * @return {Object} Object loaded
	 */
	var useConfigs = function (_path) {
		doLog && console.log('[configsManager] - useConfigs() - ' + _path);

		if (_path) {
			configLib = JSON.parse(JSON.stringify(require(_path)));
			basePath = configLib.basePath || '';

			_.each(models, function (_modelName) {
				try {
					var originalModel = require('alloy/models/' + _modelName);

					var modelName = _modelName.charAt(0).toLowerCase() + _modelName.slice(1);
					var extendedModel = require(basePath + 'models/' + modelName);

					_.extend(originalModel.Model.prototype, extendedModel.Model);
					_.extend(originalModel.Collection.prototype, extendedModel.Collection);
				} catch (_error) {
					doLog && console.warn('[configsManager] - useConfigs() - model not extended: ' + _modelName);
				}

			});
		} else {
			configLib = {};
			basePath = '';
		}

		return configLib;
	};

	/**
	 * @method getLib
	 * Obtains a library via `require`, using the `basePath` (if any) from the config file.
	 * If the "custom" library is not defined, the path will be used without the `basePath`
	 * @param {String} _path File path of the library to load.
	 * @return {Object} Library loaded. `null` if it was not found.
	 */
	var getLib = function (_path) {
		var result = null;
		var libPath = basePath + _path;

		try {
			doLog && console.log('[configsManager] - getLib() - trying: ' + libPath);

			result = require(libPath);
		} catch (_libPathError) {
			doLog && console.error('_libPathError: ' + JSON.stringify(_libPathError, null, '\t'));

			try {
				doLog && console.log('[configsManager] - getLib() - trying: ' + _path);

				result = require(_path);
			} catch (_pathError) {
				doLog && console.error('_pathError: ' + JSON.stringify(_pathError, null, '\t'));
				doLog && console.error('[configsManager] - getLib() - ' + _path + ' not found');

				result = null;
			}
		}

		return result;
	};

	/**
	 * @method getController
	 * Obtains an Alloy controller, using the `basePath` (if any) from the config file. 
	 * If the "custom" controller is not defined, the path will be used without the `basePath`
	 * @param {String} _path File path of the controller to load.
	 * @param {Object} [_params] Params to create the controller with.
	 * @return {Alloy.Controller} Alloy controller loaded. `null` if it was not found.
	 */
	var getController = function (_path, _params) {
		var result = null;
		var controllerPath = basePath + _path;

		try {
			doLog && console.log('[configsManager] - getController() - trying: ' + controllerPath);

			result = Alloy.createController(controllerPath, _params);
		} catch (_controllerPathError) {
			try {
				doLog && console.log('[configsManager] - getController() - trying: ' + _path);

				result = Alloy.createController(_path, _params);
			} catch (_pathError) {
				result = null;
			}
		}

		return result;
	};

	/**
	 * @method getConfig
	 * Retrieves an specific config from the list of the previous loaded config file.
	 * @param {String} [_namespace] Namespace of the config to load. If `null`, will return the whole config data
	 * @return {*} Object found from the previously loaded coinfig file. `null` if not found.
	 */
	var getConfig = function (_namespace) {
		var result = null;

		if (_namespace) {
			var objects = _namespace.split('.');
			var currentObject = configLib;

			var isSuccess = _.every(objects, function (_key) {
				if (_.has(currentObject, _key)) {
					currentObject = currentObject[_key];

					return true;
				} else {
					return false;
				}
			});

			if (isSuccess) {
				result = currentObject;
			}
		} else {
			result = configLib;
		}

		return result;
	};

	return {
		useConfigs: useConfigs,
		getLib: getLib,
		getController: getController,
		getConfig: getConfig
	};
})();

module.exports = configsManager;
