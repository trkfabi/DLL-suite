/**
 * Manager for obtaining and saving all data between quotes:
 * Quote, PaymentOption, Customer, Equipment, etc
 * @class Utils.dataManager
 * @singleton
 */

const LOG_TAG = '\x1b[35m' + '[othc/utils/dataManager]' + '\x1b[39;49m ';

var webservices = require('/utils/webservices');
var sessionManager = require('/utils/sessionManager');
var updateHelper = require('/helpers/updateHelper');

var DataManager = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method syncQuotes
	 * Refreshes all the quotes between cloud and offline data to prevent data loss
	 * @param {Collections.quote} _quotes Quotes to sync
	 * @param {Function} _callback Function called once the sync has completed
	 * @return {void}
	 */
	function syncQuotes(_quotes, _callback) {
		doLog && console.log(LOG_TAG, '- syncQuotes');

		var salesRep = sessionManager.getSalesRep();
		var localQuotes = Alloy.createCollection('quote');
		var remoteQuotes = [];

		localQuotes.fetch({
			localOnly: true,
			salesRepID: salesRep.id
		});

		if (localQuotes.length > 0) {
			localQuotes = localQuotes.toJSON({
				parseNested: true
			});

			localQuotes = _.filter(localQuotes, function (_quote) {
				return !_quote.deleted;
			});

			_quotes.reset(localQuotes);

			_callback && _callback({
				success: true
			});

			return false;
		}

		webservices.fetchQuotes({
			// NOTE: this 10,000 is intentional so we won't have to retieve multiple pages at the same time
			page: 1,
			size: 10000,
			successCallback: handleFetchQuotesSuccess,
			failCallback: handleFetchQuotesError
		});

		function handleFetchQuotesSuccess(_response) {
			doLog && console.log(LOG_TAG, '- syncQuotes - handleFetchQuotesSuccess');

			var remoteQuotes = [];
			var cacheQuotes = Alloy.createCollection('quote');

			if (_response.length <= 0) {

				_callback && _callback({
					success: false
				});

				return false;
			}

			_.each(_response, function (_quoteData) {
				var parsedQuote = null;

				try {
					parsedQuote = JSON.parse(_quoteData.blob.replace(/\'/g, '\"'));
				} catch (_error) {

				}

				if (parsedQuote && parsedQuote.isAnalytics) {
					var analyticsModel = Alloy.createModel('analytics', parsedQuote);

					analyticsModel.save(null, {
						localOnly: true
					});

					return null;
				}

				if (parsedQuote) {
					remoteQuotes.push(parsedQuote);
				}
			});

			cacheQuotes.reset(remoteQuotes);
			cacheQuotes.save({
				localOnly: true
			});

			localQuotes = _.filter(remoteQuotes, function (_quote) {
				return !_quote.deleted && _quote.salesRepID === salesRep.id;
			});

			_quotes.reset(localQuotes);

			_callback && _callback({
				success: true
			});
		}

		function handleFetchQuotesError(_response) {
			doLog && console.log(LOG_TAG, '- syncQuotes - handleFetchQuotesError');

			_callback && _callback({
				success: false
			});
		}
	}

	/**
	 * @method checkForUpdates
	 * Validates the current version of the app against the server, then it notifies the callback method with a given alert data to show
	 * @param {Function} _callback Function called once the validation is complete
	 * @return {void}
	 */
	function checkForUpdates(_callback) {
		doLog && console.log(LOG_TAG, '- checkForUpdates');
		var environment = Alloy.Globals.environment;
		var appId = Alloy.Globals.appId || Ti.App.id;
		var appVersion = Alloy.Globals.appVersion || Ti.App.version;
		var osName = Alloy.Globals.osName || Ti.Platform.osname;
		var updateDialog = null;
		var updateUrl = null;
		var softAlertDuration = null;

		if (!Alloy.Globals.forceUpdate) {
			doLog && console.log(LOG_TAG, '- checkUpdates - forceUpdate not enabled');
			_callback();
			return false;
		}

		Alloy.Globals.updateRequestLoading = true;
		webservices.checkUpdates({
			appId: appId,
			osName: osName,
			successCallback: function (_response) {
				doLog && console.log(LOG_TAG, '- _response: ' + JSON.stringify(_response, null, '\t'));
				Alloy.Globals.updateRequestLoading = false;
				var versionInfo = _response.versions[0] || {};
				var minimumVersion = versionInfo.minimum_version || '';
				var latestVersionData = versionInfo.latest_version || {};
				var latestVersion = latestVersionData.version || '';
				var meta = versionInfo.meta || {};
				var versionCheckResult = updateHelper.checkAppVersion(appVersion, latestVersion, minimumVersion);
				updateUrl = meta.redirect_url || '';
				softAlertDuration = meta.duration || '00:10:00';

				// If current version is lower than latest but higher than minimum version
				if (versionCheckResult.isOutdated && versionCheckResult.alertType == 'SOFT') {
					// TO-DO: Find the way to detect if the user has disabled the cellular data for the AppStore application
					// Settings -> Cellular Data -> turn off switch
					var isAppleStoreWithCellDataReachable = true;
					var actualTimestamp = new moment();
					var dueAlertTimestamp = null;
					var hasAlertDurationProperty = Ti.App.Properties.hasProperty(Alloy.Globals.versionCheckSoftAlertDismissTimeProperty);

					if (hasAlertDurationProperty) {
						dueAlertTimestamp = new moment(Ti.App.Properties.getString(Alloy.Globals.versionCheckSoftAlertDismissTimeProperty));
						var duration = moment.duration({
							days: softAlertDuration.substr(0, 2),
							hours: softAlertDuration.substr(3, 2),
							minutes: softAlertDuration.substr(6, 2)
						});
						dueAlertTimestamp.add(duration);
					}

					if ((dueAlertTimestamp && dueAlertTimestamp.isValid() && dueAlertTimestamp.isBefore(actualTimestamp)) || !
						hasAlertDurationProperty) {
						doLog && console.log(LOG_TAG, '- Soft alert dismiss duration is ' + (!hasAlertDurationProperty ? 'not set.' :
							'due.'));

						if (OS_IOS && Ti.Network.networkType === Ti.Network.NETWORK_MOBILE && environment === 'prod' && !
							isAppleStoreWithCellDataReachable) {
							doLog && console.log(LOG_TAG, '- Apple Store is not reachable.');
							_callback();
							return;
						}

						// Don't return the alert dialog if there's an alert on screen already
						if (Alloy.Globals.updateDialogIsVisible) {
							doLog && console.log(LOG_TAG, '- There is an alert already.');
							_callback();
							return;
						}

						updateDialog = Ti.UI.createAlertDialog({
							title: L('update_available_title'),
							message: L('update_available_message'),
							buttonNames: [L('update_available_button_dismiss'), L('update_available_button_update')],
							cancel: 0,
							preferred: 1,
							customAlertType: versionCheckResult.alertType,
							persistent: true
						});
						updateDialog.addEventListener('click', handleUpdateAlertClick);
						_callback(null, updateDialog);
					} else {
						doLog && console.log(LOG_TAG, '- Soft alert dismiss duration is still valid');
						_callback();
					}
					return;
				}

				// If current version is lower than latest and minimum version
				if (versionCheckResult.isOutdated && versionCheckResult.alertType == 'HARD') {
					doLog && console.log(LOG_TAG, '- App version is lower than the minimum required verions.');

					// Don't return the alert dialog if there's an alert on screen already
					if (Alloy.Globals.updateDialogIsVisible) {
						doLog && console.log(LOG_TAG, '- There is an alert already.');
						_callback();
						return;
					}
					updateDialog = Ti.UI.createAlertDialog({
						title: L('update_available_mandatory_title'),
						message: L('update_available_mandatory_message'),
						buttonNames: [L('update_available_mandatory_button_update')],
						customAlertType: versionCheckResult.alertType,
						preferred: 0,
						persistent: true
					});
					updateDialog.addEventListener('click', handleUpdateAlertClick);
					_callback(null, updateDialog);
					return;
				}

				doLog && console.log(LOG_TAG, '- App version is up to date');
				_callback();
			},
			failCallback: function (_error) {
				doLog && console.log(LOG_TAG, '- _error: ' + JSON.stringify(_error, null, '\t'));
				Alloy.Globals.updateRequestLoading = false;
				_callback(_error);
			}
		});

		function handleUpdateAlertClick(_evt) {
			// Set the global variable that the alert was dismissed
			Alloy.Globals.updateDialogIsVisible = false;

			if (_evt.source.customAlertType == 'SOFT' && _evt.index == 0) {
				// Dismiss button click
				var time = new moment();
				if (time.isValid()) {
					Ti.App.Properties.setString(Alloy.Globals.versionCheckSoftAlertDismissTimeProperty, time.format());
				}
				return;
			}

			if ((_evt.source.customAlertType == 'SOFT' && _evt.index == 1) || (_evt.source.customAlertType == 'HARD' && _evt.index ==
					0)) {
				// Update button click
				updateHelper.isDomainInWhitelist(updateUrl, function (_error) {
					if (!_error) {
						Ti.Platform.openURL(updateUrl);
					}
				});
			}
		}
	}

	return {
		syncQuotes: syncQuotes,
		checkForUpdates: checkForUpdates
	};
})();

module.exports = DataManager;
