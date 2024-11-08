/**
 * @class Helpers.permissionHelpers
 * @version 1.0.1
 * @singleton
 * @uses Helpers.alertDialogHelper
 *
 * Description :
 *
 * 	This helpers is useful to determine and request app permissions to the user while the app is running in Android and iOS.
 *
 * Sample usage:
 *
 * 	Using in 3 steps
 *	1 - Copy permissions.js file in lib or ask project architect
 *	2- In the controller you are going to use require it :
 *		var permissionHelper = require("permissionHelpers");
 *	3- Using it in your controller :
 *
 * permissionHelpers.requestPermissions({
 *	type : 'camera',
 *	successCallback : yourOpenCameraMethodSuccess,
 *	failCallback : optionalAlert
 *});
 *
 *
 * Important notes :
 *	1- If the user has selected previously do not give app permissions, the request x permission won't be displayed.
 *
 *	2- Be advice for media persmissions in android 6 it requires 2 permissions: storage and camera.
 */

var alertDialogHelper = require('/helpers/alertHelper');

var permissionHelpers = (function () {

	const ANDROID_PERMISSION_CALL = 'android.permission.CALL_PHONE';

	/**
	 * @method requestPermissions
	 * Addresses permissions request
	 * @param {Object} _params contains information needed to request permissions
	 * @param {String} _params.type holds type of request permission such as: camera, location, calendar, contacts and storage, one type should be provided
	 * @param {Function} _params.successCallback executes this function if permission is granted
	 * @param {Function} [_params.failCallback] executes this function if permission is refusal
	 * @param {Object} _params.authorizationType=Ti.Geolocation.AUTHORIZATION_WHEN_IN_USE Holds authorization type when requesting location permission
	 * @param {Object} _params.activity=Ti.Android.currentActivity current activity needed to open app settings, android only
	 * @param {Boolean} _params.showNoPermissionsAlert=false display an alertDialog if permission is denied
	 * @return {void}
	 */
	function requestPermissions(_params) {
		_params = _params || {};

		var type = _params.type;
		var successCallback = _params.successCallback;
		var failCallback = _params.failCallback;
		var authorizationType = _params.authorizationType || Ti.Geolocation.AUTHORIZATION_WHEN_IN_USE;
		var showNoPermissionsAlert = _params.showNoPermissionsAlert || false;

		if (OS_ANDROID) {
			var currentActivity = _params.activity || Ti.Android.currentActivity;
		}

		if (hasPermissions(type)) {
			successCallback && successCallback();
		} else {
			switch (type) {
			case 'camera':
				Ti.Media.requestCameraPermissions(handlePermissionRequest);
				break;

			case 'location':
				Ti.Geolocation.requestLocationPermissions(authorizationType, handlePermissionRequest);
				break;

			case 'calendar':
				Ti.Calendar.requestCalendarPermissions(handlePermissionRequest);
				break;

			case 'contacts':
				Ti.Contacts.requestContactsPermissions(handlePermissionRequest);
				break;

			case 'call':
				if (OS_ANDROID) {
					Ti.Android.requestPermissions([ANDROID_PERMISSION_CALL], handlePermissionRequest);
				}
				break;

			case 'storage':
				if (OS_IOS) {
					successCallback && successCallback();
				}

				if (OS_ANDROID) {
					Ti.Filesystem.requestStoragePermissions(handlePermissionRequest);
				}
				break;
			case 'imageGallery':
				if (OS_IOS) {
					Ti.Media.requestPhotoGalleryPermissions(handlePermissionRequest);
				}

				if (OS_ANDROID) {
					Ti.Filesystem.requestStoragePermissions(handlePermissionRequest);
				}
				break;
			}
		}

		/**
		 * @method handlePermissionRequest
		 * @private
		 * Handles permission requests
		 * @param {Object} _evt holds permission request data
		 * @return {void}
		 */
		function handlePermissionRequest(_evt) {
			if (_evt.success) {
				successCallback && successCallback(_evt);
			} else {
				if (showNoPermissionsAlert) {

					if (OS_IOS) {
						showNoPermissionsAlertDialog({
							type: type,
							clickCallback: failCallback
						});
					}

					if (OS_ANDROID) {
						showNoPermissionsAlertDialog({
							type: type,
							activity: currentActivity,
							clickCallback: failCallback
						});
					}

				} else {
					failCallback && failCallback(_evt);
				}

			}
		};

	};

	/**
	 * @method openAppSettings
	 * Open app settings
	 * @param {Ti.Android.Activity} _currentActivity where intent is going to open settings
	 * @return {void}
	 */
	function openAppSettings(_currentActivity) {

		if (OS_IOS) {
			Ti.Platform.openURL(Ti.App.iOS.applicationOpenSettingsURL);
		}

		if (OS_ANDROID) {
			var currentActivity = _currentActivity || Ti.Android.currentActivity;

			var intent = Ti.Android.createIntent({
				action: 'android.settings.APPLICATION_SETTINGS',
			});
			intent.addFlags(Ti.Android.FLAG_ACTIVITY_NEW_TASK);
			if (currentActivity) {
				currentActivity.startActivity(intent);
			}
		}
	};

	/**
	 * @method hasPermissions
	 * Determines if the app contains permissions like media, geolocation, calendar or contacts
	 * @param {String} _typeOfPermission permission to verify can be camera, location, calendar or contacts
	 * @return {Boolean} Determines if has permission or not
	 */
	function hasPermissions(_typeOfPermission) {

		//Permission type
		var result = false;

		switch (_typeOfPermission) {
		case 'camera':
			result = Ti.Media.hasCameraPermissions();
			break;

		case 'location':
			result = Ti.Geolocation.hasLocationPermissions(Ti.Geolocation.AUTHORIZATION_WHEN_IN_USE);
			break;

		case 'calendar':
			result = Ti.Calendar.hasCalendarPermissions();
			break;

		case 'contacts':
			result = Ti.Contacts.hasContactsPermissions();
			break;

		case 'call':
			if (OS_ANDROID) {
				result = Ti.Android.hasPermission(ANDROID_PERMISSION_CALL);
			}
			if (OS_IOS) {
				result = true;
			}
			break;

		case 'storage':
			if (OS_IOS) {
				result = true;
			}

			if (OS_ANDROID) {
				result = Ti.Filesystem.hasStoragePermissions();
			}
			break;
		case 'imageGallery':
			if (OS_IOS) {
				result = Ti.Media.hasPhotoGalleryPermissions();
			}

			if (OS_ANDROID) {
				result = Ti.Filesystem.hasStoragePermissions();
			}
		}

		return result;
	};

	/**
	 * @method showNoPermissionsAlertDialog
	 * @private
	 * When permissions is not granted we can display alert to user that allows to open settings
	 * @param {Object} _params holds type of permission, clickCallback, and activity
	 * @param {String} _params.type type of permission to display in alert dialog
	 * @param {String} _params.alertTitle='Alert' text to display as title of the alert dialog
	 * @param {Function} _params.clickCallback function to open settings
	 * @param {Ti.Android.Activity} _params.activity=Ti.Android.currentActivity current activity where settings could be open
	 * @return {void}
	 */
	function showNoPermissionsAlertDialog(_params) {
		var params = _params || {};

		var type = params.type;
		var message = 'The app does not have permissions to use the ' + type;
		var clickCallback = params.clickCallback;
		var alertTitle = params.alertTitle || 'Alert';

		alertDialogHelper.createAlertDialog({
			title: alertTitle,
			message: message,
			buttonNames: ['Cancel', 'Go to Settings'],
			clickCallback: function (_evt) {
				if (_evt.index === 1) {
					if (OS_IOS) {
						openAppSettings();
					}
					if (OS_ANDROID) {
						var currentActivity = params.activity || Ti.Android.currentActivity;
						openAppSettings(currentActivity);
					}
				}

				clickCallback && clickCallback(_evt);
			},
			cancel: 0
		}).show();

	};

	//Public api
	return {
		openAppSettings: openAppSettings,
		hasPermissions: hasPermissions,
		requestPermissions: requestPermissions
	};

})();

module.exports = permissionHelpers;
