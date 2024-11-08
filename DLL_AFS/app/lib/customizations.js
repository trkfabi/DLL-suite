/**
 * @class customizations
 * Singleton to handle the customizations files
 * @uses Utils.webservices
 */

var doLog = Alloy.Globals.doLog;
var webservices = require('/utils/webservices');

/**
 * Manages the customizations for the current user, such as:
 * Update
 * Obtain
 * online/offline requests
 * @class Lib.customizations
 * @singleton
 */
var customizations = (function () {
	// +-------------------
	// | Private members.
	// +-------------------
	var MAX_FETCH_ATTEMPTS = 3;

	var customizationCollection = Alloy.createCollection('customizations');
	var analytics = require('/utils/analytics');
	var salesRep = null;

	var now = new moment();

	var container;
	var webView;
	var salesRepName;
	var countryData;
	var customizationsData;
	var fetchAttempts = 0;

	var MIME_TYPES = {
		'default': 'html',
		'image/png': 'png',
		'image/jpeg': 'jpg',
		'image/gif': 'gif',
		'text/html': 'html',
		'test/html': 'html'
	};

	Ti.App.addEventListener('app:leaseLoaded', saveTermsAndConditions);

	/**
	 * @method saveArtifact
	 * @private
	 * Saves a single customization (artifact) file, and its reference on the local DB
	 * @param {Object} _artifact Artifact definition
	 * @param {String} _artifact.Type Artifact Type
	 * @param {String} _artifact.Class Artifact Class
	 * @param {String} _artifact.ContentType Artifact content-type for its file
	 * @param {String} _artifact.Content Base64 encoded Artifact content for save on a file
	 * @return {void}
	 */
	function saveArtifact(_artifact) {
		if (!salesRep) {
			return;
		}

		_artifact = _artifact || {};
		var _fileName = String.format('%s_%s.%s',
			_artifact.Type.trim().replace(/\s+/g, '_'),
			_artifact.Class.trim().replace(/\s+/g, '_'),
			(MIME_TYPES[_artifact.ContentType] || MIME_TYPES['default']));
		analytics.captureEvent('[customizations] - saveArtifact() - ' + _fileName);

		var _file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, salesRepName + '/' + _fileName);
		var _artifactModel = null;

		_file.write(Ti.Utils.base64decode(_artifact.Content || ''));
		_file = null;

		_artifactModel = customizationCollection.where({
			salesRepID: salesRep.id,
			type: _artifact.Type,
			className: _artifact.Class
		})[0];

		if (!_artifactModel) {
			_artifactModel = Alloy.createModel('customizations');
		}

		_artifactModel.set({
			salesRepID: salesRep.id,
			fileName: _fileName,
			description: _artifact.Description,
			contentType: _artifact.ContentType,
			expirationDate: _artifact.ExpirationDate,
			type: _artifact.Type,
			className: _artifact.Class
		}).save();

		customizationCollection.add(_artifactModel);

		doLog && console.log('[customizations] - saveArtifact - saved file: ' + _fileName);
	};

	/**
	 * @method removeExpiredArtifacts
	 * @private
	 * Removes all the expired artifacts (files and referenced on the DB) currenlty saved
	 * @return {void}
	 */
	function removeExpiredArtifacts() {
		doLog && console.log('[customizations] - removeExpiredArtifacts()');

		var _now = new moment();

		var _expiredCustomizations = customizationCollection.filter(function (customizationModel) {
			return (new moment(customizationModel.get('expirationDate')) < _now);
		});

		_.each(_expiredCustomizations, function (_expiredCustomization) {
			analytics.captureEvent('[customizations] - removeExpiredArtifacts() - delete: ' + _expiredCustomization.get(
				'description'));

			var _expiredFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, salesRepName + '/' +
				expiredCustomization.get('fileName'));
			_expiredFile.deleteFile();

			customizationCollection.remove(_expiredCustomization);
			_expiredCustomization.destroy();
		});
	};

	/**
	 * @method loadTermsAndConditions
	 * @private
	 * Loads the terms and conditions text based on the HTML file that may contains them
	 * @return {void}
	 */
	function loadTermsAndConditions() {
		analytics.captureEvent('[customizations] - loadTermsAndConditions()');
		var _artifactName = null;
		var _artifactFile = null;

		// TODO: remove this hardcoded thing
		_artifactName = 'credit';
		// _artifactName = _.findKey(customizationsData, {
		// 	hasTerms : true
		// });

		if (_artifactName) {
			_artifactFile = getFile(_artifactName);
		}

		if (_artifactFile) {
			webView = Ti.UI.createWebView({
				// html 	: _artifactFile.read().text,
				// url : '/agco_credit.html', //TEST purposes only
				visible: false
			});
			webView.addEventListener('load', sendUpdateTermsEvent);
			container && container.add(webView);

			webView.html = _artifactFile.read().text;
		}
	};

	/**
	 * @method sendUpdateTermsEvent
	 * @private
	 * Fires an app-level event for the terms and conditions to be loaded
	 * @return {void}
	 */
	function sendUpdateTermsEvent() {
		analytics.captureEvent('[customizations] - sendUpdateTermsEvent()');
		webView && webView.removeEventListener('load', sendUpdateTermsEvent);
		Ti.App.fireEvent('app:updateTerms', {});
	};

	/**
	 * @method saveTermsAndConditions
	 * @private
	 * Once the Terms and conditions have been loaded, this function saves them on a DB register
	 * @param {Object} _evt Event object from the HTML with the Ts & Cs
	 * @return {void}
	 */
	function saveTermsAndConditions(_evt) {
		analytics.captureEvent('[customizations] - saveTermsAndConditions()');
		if (!salesRep) {
			return;
		}
		var _artifactModel = null;
		var _artifactInfo = customizationsData.terms;

		container && webView && container.remove(webView);

		if (_evt && _evt.terms) {
			_artifactModel = customizationCollection.where({
				salesRepID: salesRep.id,
				type: _artifactInfo.type,
				className: _artifactInfo.className
			})[0];

			if (!_artifactModel) {
				_artifactModel = Alloy.createModel('customizations');
			}

			_artifactModel.set({
				salesRepID: salesRep.id,
				type: _artifactInfo.type,
				className: _artifactInfo.className,
				content: _evt.terms
			}).save();

			customizationCollection.add(_artifactModel);
		}

		// TODO: This is a workaround for the server, DO NOT clear
		// if (downloadedAnything && validateCustomizations(true).valid){
		// 	doLog && console.log('[customizations] - lastCustomizationsUpdate: ' + now);
		// 	salesRep.set({ lastCustomizationsUpdate : now }).save();
		// 	downloadedAnything = false;
		// }
	};

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method fetchCustomizations
	 * Forces an update requests for the custonizations with the webservices, 
	 * adding new ones and removing the expired ones
	 * @param {Object} _params Parameters object
	 * @param {Ti.View} _params.container View to load the webview into, should be an active (opened) View. Will not show any view to the user
	 * @param {Function} _params.successCallback Callback function to be called when new customizations were added
	 * @param {Function} _params.failureCallback Callback function to be called when there are no updates on the customizations
	 * @return {void}
	 */
	function fetchCustomizations(_params) {
		_params = _params || {};
		analytics.captureEvent('[customizations] - fetchCustomizations()');

		if (!salesRep) {
			return;
		}

		countryData = _params.countryData || {};

		customizationsData = countryData.customizations[salesRep.get('language')];

		doLog && console.log('customizationsData: ' + JSON.stringify(customizationsData, null, '\t'));

		var _lastUpdate = new moment(salesRep.get('lastCustomizationsUpdate') || 0);
		var _successCallback = _params.successCallback;
		var _failureCallback = _params.failureCallback;
		var _folderPath = null;
		container = _params.container;

		salesRepName = salesRep.id;

		//Fix to prevent missing customizations for those salesReps that use a previous folder path
		_folderPath = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, salesRepName);

		if (!_folderPath.exists() && salesRepName !== '') {
			_folderPath.createDirectory();
			_lastUpdate = new moment(0);
		}
		// --------------------------------------------------------------

		customizationCollection.fetch({
			reset: true,
			query: "SELECT *\
					FROM customizations\
					WHERE salesRepID = '" + salesRep.id + "'"
		});

		if (!_lastUpdate.isValid()) {
			_lastUpdate = new moment(0);
		}

		webservices.customizations({
			lastRefreshDate: _lastUpdate.format('YYYY-MM-DD'),
			successCallback: function (_response) {
				_response = _response.result || {};
				var _status = _response.Status || {};
				var _message = _status.Message;
				var _artifactInfo = _response.Artifact || {};
				var _artifacts = _artifactInfo.Artifact || [];
				var today = new moment().startOf('day').format();

				// TODO: Dont check the message, check the array or any other thing instead
				if (_status.Code === 'S' && _artifacts.length > 0) {
					fetchAttempts = 0;

					_.each(_artifacts, saveArtifact);

					removeExpiredArtifacts();
					loadTermsAndConditions();

					salesRep.set('lastCustomizationsUpdate', today).save();

					_successCallback && _successCallback();
				} else {
					doLog && console.log("[customizations] - fetchCustomizations() - no artifacts");

					removeExpiredArtifacts();
					loadTermsAndConditions();

					_failureCallback && _failureCallback({
						message: L('error_downloading_terms_and_conditions')
					});
				}
			},
			failCallback: function (_response) {
				_response = _response || {};
				doLog && console.log("[customizations] - fetchCustomizations() - failure()");

				_.defer(removeExpiredArtifacts);
				_.defer(loadTermsAndConditions);

				fetchAttempts++;
				if (fetchAttempts > MAX_FETCH_ATTEMPTS) {
					_response.message = L('error_downloading_terms_and_conditions');
				}

				if (_response.message) {
					_response.message = L('downloading_terms_and_conditions');
				}

				_failureCallback && _failureCallback(_response);
			}
		});
	};

	/**
	 * @method validateCustomizations
	 * Validates if the customizatios loaded for the user are complete
	 * @param {Boolean} _valideAll True if it should ask for all the possible customizations for the user, false if it should ask only for those marked as `required`
	 * @return {Object} Dictionary with the information about the validation.
	 */
	function validateCustomizations(_valideAll) {
		analytics.captureEvent('[customizations] - validateCustomizations()');
		var _custToCheck = customizationsData;
		var _missingFiles = [];
		var _valid = false;

		_valid = _.every(_custToCheck, function (_customizationInfo, _artifactName) {
			var _isValid = false;
			if (_artifactName === 'terms') {
				_isValid = !!getTerms();
			} else {
				_isValid = !!getFile(_artifactName);
			}

			// Workaround to allow optionalcustomizations
			// TODO: improve this
			if (!_valideAll && !_customizationInfo.isRequired) {
				_isValid = true;
			}

			!_isValid && _missingFiles.push(L(_customizationInfo.messageid));
			!_isValid && console.error('Missing Cust: ' + _artifactName);

			return _isValid;
		});

		return {
			valid: _valid,
			missingFiles: _missingFiles
		};
	};

	/**
	 * @method getFile
	 * Obtains an artifact file for the user
	 * @param {String} _fileCode name of the artifact to obtain, such as `'credit'`, `'logo'`, etc
	 * @return {Ti.Filesystem.File} Artifact file if found and loaded, `null` otherwise
	 */
	function getFile(_fileCode) {
		analytics.captureEvent('[customizations] - getFile() - ' + _fileCode);
		if (!salesRep) {
			return;
		}

		var _artifactInfo = customizationsData[_fileCode];
		var _file = null;
		var _customizationModel = null;

		if (Alloy.Globals.useLocalCustomizations) {
			_file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, _artifactInfo.localFile);
			if (_file && _file.exists()) {
				return _file;
			} else {
				return null;
			}
		} else {
			if (_artifactInfo) {
				_customizationModel = customizationCollection.where({
					salesRepID: salesRep.id,
					type: _artifactInfo.type,
					className: _artifactInfo.className
				})[0];

				if (_customizationModel) {
					_file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, salesRepName + '/' + _customizationModel.get(
						'fileName'));
					if (_file && _file.exists()) {
						return _file;
					} else {
						return null;
					}
				}
			}
		}

		return null;
	};

	/**
	 * @method getTerms
	 * Obtain the terms and conditions text for the current user
	 * @return {String} Terms and conditions text, `null` if they were not found
	 */
	function getTerms() {
		analytics.captureEvent('[customizations] - getTerms()');
		if (!salesRep) {
			return;
		}
		var _termsInfo = customizationsData.terms;
		var _termsModel = null;
		var _terms = null;

		if (_termsInfo) {
			_termsModel = customizationCollection.where({
				salesRepID: salesRep.id,
				type: _termsInfo.type,
				className: _termsInfo.className
			})[0];
		}

		if (_termsModel) {
			_terms = _termsModel.get('content') || '';

			if (_terms.trim() === '') {
				_terms = null;
			}
		}

		return _terms;
	};

	/**
	 * @method updateCustomizationsLanguage
	 * Updates the language for the customizations to load
	 * @param {String} _lang Language code to load, such as `en`, `fr`, etc
	 * @return {void}
	 */
	function updateCustomizationsLanguage(_lang) {
		analytics.captureEvent('[customizations] - updateCustomizationsLanguage() - ' + _lang);
		customizationsData = countryData.customizations[_lang];
		loadTermsAndConditions();
	};

	/**
	 * @method updateSalesRep
	 * Updates the Sales Rep model to use for handle its customizations
	 * @return {void}
	 */
	function updateSalesRep(_salesRep) {
		salesRep = _salesRep;
	};

	return {
		fetchCustomizations: fetchCustomizations,
		validateCustomizations: validateCustomizations,
		getFile: getFile,
		getTerms: getTerms,
		updateCustomizationsLanguage: updateCustomizationsLanguage,
		updateSalesRep: updateSalesRep
	};
})();

module.exports = customizations;
