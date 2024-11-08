/**
 * Manager for obtaining and saving all data between quotes:
 * Quote, PaymentOption, Customer, Equipment, etc
 * @class Utils.dataManager
 * @singleton
 */

var doLog = Alloy.Globals.doLog;
const LOG_TAG = '\x1b[35m' + '[apple/utils/dataManager]' + '\x1b[39;49m ';

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
		if (!salesRep) {
			_callback && _callback({
				success: false
			});
			return false;
		}

		var startSyncDate = moment().toISOString();
		var lastQuotesUpdateDate = new moment(salesRep.get('lastQuotesUpdate') || 0).toISOString();
		var localQuotes = Alloy.createCollection('quote');
		var remoteQuotes = [];
		var whereQuery = {
			updated_at: {
				'$gt': lastQuotesUpdateDate
			}
		};

		localQuotes.fetch({
			localOnly: true,
			salesRepID: salesRep.id
		});
		localQuotes = localQuotes.toJSON({
			parseNested: true
		});

		webservices.fetchQuotes({
			page: 1,
			size: Alloy.Globals.quoteLimit,
			where: whereQuery,
			successCallback: handleFetchQuotesSuccess,
			failCallback: handleFetchQuotesError
		});

		function updateQuotes() {
			doLog && console.log(LOG_TAG, '- syncQuotes - updateQuotes');

			var localsCache = Alloy.createCollection('quote');
			var pendingLocals = _.filter(localQuotes, function (quote) {
				var syncDate = moment(quote.syncDate || 0);
				var modifiedDate = moment(quote.modifiedDate || 0);

				return modifiedDate.isAfter(syncDate);
			});

			doLog && console.log('pendingLocals: ' + JSON.stringify(pendingLocals));

			var remoteIds = _.pluck(remoteQuotes, 'alloy_id');
			var localIds = _.pluck(pendingLocals, 'alloy_id');
			var allQuotes = [];
			var allIds = _.chain(localIds)
				.union(remoteIds)
				.compact()
				.uniq()
				.value();

			doLog && console.log('allIds: ' + JSON.stringify(allIds));

			_.each(allIds, function (_id) {
				var localQuote = _.findWhere(localQuotes, {
					'alloy_id': _id
				}) || {};

				var remoteQuote = _.findWhere(remoteQuotes, {
					'alloy_id': _id
				}) || {};

				var localModifiedDate = new moment(localQuote.modifiedDate || 0);
				var remoteModifiedDate = new moment(remoteQuote.modifiedDate || 0);

				if (localModifiedDate.isAfter(remoteModifiedDate) || !remoteQuote.alloy_id) {
					// Remote save
					doLog && console.log(LOG_TAG, '- updateQuotes - save in cloud: ' + _id);
					Alloy.createModel('quote', localQuote).save();
				} else {
					// local save
					doLog && console.log(LOG_TAG, '- updateQuotes - save in sqlite: ' + _id);
					remoteQuote.syncDate = moment().toISOString();
					localsCache.add(remoteQuote);
				}
			});

			localsCache.save({
				localOnly: true,
				reSave: true
			});

			_quotes.fetch({
				localOnly: true,
				salesRepID: salesRep.id,
				reset: true
			});
		}

		function handleFetchQuotesSuccess(_response) {
			doLog && console.log(LOG_TAG, '- syncQuotes - handleFetchQuotesSuccess');
			doLog && console.log(LOG_TAG, '- syncQuotes - _response: ' + JSON.stringify(_response));
			var result = _response.result || {};

			_.each(result, function (_quoteData) {
				var parsedQuote = _quoteData;

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

			salesRep.save({
				'lastQuotesUpdate': startSyncDate
			});

			updateQuotes();

			_callback && _callback({
				success: true
			});
		}

		function handleFetchQuotesError(_response) {
			doLog && console.log(LOG_TAG, '- syncQuotes - handleFetchQuotesError');

			_quotes.reset(localQuotes);

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
	function checkForUpdates(_callback, _callAfterDismiss) {
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
				_callAfterDismiss && _callAfterDismiss();
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
