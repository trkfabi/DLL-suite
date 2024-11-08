/**
 * # Drivers License Window
 * @class Controllers.authorization.driversLicenseWindow
 * @uses appNavigation
 * @uses Libs.analytics
 * @uses customizations
 */
var args = arguments[0] || {};
var appNavigation = require('/appNavigation');
var analytics = require('/utils/analytics');
var customizations = require('/customizations');
var uiHelpers = require('/helpers/uiHelpers');

var takingPic = false;
var licenseImage = null;
var myAuthorization = null;
var myIndex = 3;

// Private functions-------
/**
 * @method init
 * @private
 * Initialize values for the current Window
 * @return {void}
 */
function init() {
	analytics.captureTiAnalytics('DriversLicense.Open');

	// args.index = args.index || 0;
	myAuthorization = args.authorizations[myIndex];
	args.authorizationsData = args.authorizationsData || [];
	var logo = customizations.getFile('logo');

	logo && logo.exists() && ($.brandLogo.image = logo.read());
	if (!Ti.Media.hasCameraPermissions()) {
		toggleNoPermissions(true);
	} else {
		toggleCamera(true);
	}
};

/**
 * @method saveAuthorizationData
 * @private
 * Saves the ID photo info into the authorizations array, if any
 * @return {void}
 */
function saveAuthorizationData() {
	var hasData = (licenseImage != null);
	var tempFile = null;

	Ti.Media.hideCamera();

	if (hasData) {
		tempFile = Ti.Filesystem.createTempFile();
		tempFile.write(licenseImage);
	}

	args.authorizationsData[myIndex] = {
		id: myAuthorization.id,
		property: myAuthorization.property,
		hasData: hasData,
		file: tempFile
	};
};

/**
 * @method toggleCamera
 * @private
 * Shows or Hides the respective views for preview
 * @param {Boolean} _state `true` if the camera should be shown, `false` otherwise
 * @return {void}
 */
function toggleCamera(_state) {
	doLog && console.log('[driversLicenseWindow] - toggleCamera() - ' + _state);
	if (_state) {
		$.preview.visible = false;
		$.retakeButton.visible = false;
		// $.instructionsView.visible = true;
		$.shooterButton.visible = true;
		$.overlay.backgroundColor = $.overlay.backgroundColorInactive;
	} else {
		$.preview.visible = true;
		$.retakeButton.visible = true;
		// $.instructionsView.visible = false;
		$.shooterButton.visible = false;
		$.overlay.backgroundColor = $.overlay.backgroundColorActive;
	}
};

/**
 * @method showCamera
 * @private
 * Shows the camera component
 * @return {void}
 */
function showCamera() {
	doLog && console.log('[driversLicenseWindow] - showCamera()');
	Ti.Media.showCamera({
		animated: false,
		autohide: false,
		allowEditing: false,
		showControls: false,
		overlay: $.overlay,
		saveToPhotoGallery: false,
		success: handleTakePhotoSuccess,
		error: handleTakePhotoError,
		cancel: handleBackButton,
		mediaTypes: [Ti.Media.MEDIA_TYPE_PHOTO]
	});
};

/**
 * @method toggleNoPermissions
 * @private
 * Shows or hides in the main window the message about not having enough permissions to take a picture
 * @param {Bool} _show shows or hides the not permission screen
 * @return {void}
 */
function toggleNoPermissions(_show) {
	doLog && console.log('[controllers/authorization/driversLicenseWindow] - toggleNoPermissions - ', _show);

	if (_show) {
		$.permissionView.show();
		$.optionsContainer.hide();
		$.window.add($.overlay);
	} else {
		$.permissionView.hide();
		$.optionsContainer.show();
		$.window.remove($.overlay);
	}
};

/**
 * @method cleanUp
 * Frees memory before removing this controller
 * @return {void}
 */
$.cleanUp = function () {

};

/**
 * @method handleTakePhotoSuccess
 * @private
 * Handles the success callback on take photo camera
 * @param {Object} _evt Success event
 * @return {void}
 */
function handleTakePhotoSuccess(_evt) {
	if (takingPic) {
		return;
	}

	var imageWidth = null;
	var imageHeight = null;

	takingPic = true;
	licenseImage = _evt.media;

	if (licenseImage.width > 800) {
		imageWidth = 800;
		imageHeight = (800 * licenseImage.height) / licenseImage.width;

		$.preview.image = licenseImage.imageAsResized(imageWidth, imageHeight);
	}

	if (licenseImage.width > 300) {
		imageWidth = 300;
		imageHeight = (300 * licenseImage.height) / licenseImage.width;

		licenseImage = licenseImage.imageAsResized(imageWidth, imageHeight);
	}

	// licenseImage = imageHelpers.obtainImageData({
	// 	blob : _evt.media,
	// 	width : 300,
	// 	height : 300
	// }).image;

	// $.preview.image = imageHelpers.resizeImage({
	// 	blob : _evt.media,
	// 	width : 800,
	// 	height : 800
	// });

	toggleCamera(false);
	uiHelpers.setElementEnabled($.nextButton, true);
};

/**
 * @method handleTakePhotoError
 * @private
 * Handles the error callback on take photo camera
 * @param {Object} _evt Error event
 * @return {void}
 */
function handleTakePhotoError(_evt) {
	console.error('photo error!');
	console.error('_evt: ' + JSON.stringify(_evt, null, '\t'));
	uiHelpers.setElementEnabled($.nextButton, true);
	toggleNoPermissions(true);
};

/**
 * @method handleShooterClick
 * @private
 * Event handled for the shooter button
 * @param {Object} _evt Click Event object
 * @return {void}
 */
function handleShooterClick(_evt) {
	if (!takingPic) {
		uiHelpers.setElementEnabled($.shooterButton, false);
		uiHelpers.setElementEnabled($.nextButton, false);
		Ti.Media.takePicture();
	}
};

/**
 * @method handleRetakeClick
 * @private
 * Event handled for the retake button
 * @param {Object} _evt Click Event object
 * @return {void}
 */
function handleRetakeClick(_evt) {
	analytics.captureTiAnalytics('DriversLicense.RetakeButton.Click');

	uiHelpers.setElementEnabled($.shooterButton, true);
	takingPic = false;
	licenseImage = null;

	toggleCamera(true);
};

/**
 * @method handleNextButton
 * @private
 * Handles the event click of nextButton, sends to dobCallback the DOB string formated
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleNextButton(_evt) {
	analytics.captureTiAnalytics('DriversLicense.Next.Click');

	saveAuthorizationData();

	args.isDone = true;

	// appNavigation.handleNextAuthorization(args);
	appNavigation.closeSignatureWindow();

	_.defer(function () {
		appNavigation.closeNavigation();
		args.doneCallback && args.doneCallback(args);
	});
};

/**
 * @method handleBackButton
 * @private
 * Handles the event click of back button, Opens signature window
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleBackButton(_evt) {
	analytics.captureTiAnalytics('DriversLicense.Back.Click');

	saveAuthorizationData();

	// appNavigation.handlePreviousAuthorization(args);
	appNavigation.closeDriversLicenseWindow();
};

/**
 * @method handlePermissionsClick
 * @private
 * Event handler for the click on "No Permissions"  message
 * @param {Object} _evt Click event
 * @return {void}
 */
function handlePermissionsClick(_evt) {
	if (Alloy.Globals.OSMajorVersion >= 8 && Ti.Platform.canOpenURL(Alloy.Globals.settingsURL)) {
		Ti.Platform.openURL(Alloy.Globals.settingsURL);
	}
};

/**
 * @method handleWindowFocus
 * @private
 * Event handler for the focus of the main window
 * @param {Object} _evt Focus Event
 * @return {void}
 */
function handleWindowFocus(_evt) {
	if (!Ti.Media.hasCameraPermissions()) {
		if (Ti.Media.cameraAuthorization == Ti.Media.CAMERA_AUTHORIZATION_UNKNOWN) {
			toggleNoPermissions(false);
		}
		Ti.Media.requestCameraPermissions(function (_response) {
			if (_response.success) {
				prepareCamera();
			} else {
				toggleNoPermissions(true);
			}
		});
	} else {
		prepareCamera();
	}
};

/**
 * @method prepareCamera
 * @private
 * Show the camera view by OS
 * @return {void}
 */
function prepareCamera() {
	if (OS_IOS) {
		switch (Ti.Media.cameraAuthorization) {
		case Ti.Media.CAMERA_AUTHORIZATION_UNKNOWN:
		case Ti.Media.CAMERA_AUTHORIZATION_AUTHORIZED:
			toggleNoPermissions(false);
			showCamera();
			break;
		default:
			toggleNoPermissions(true);
		}
	} else if (OS_ANDROID) {
		doLog && console.log('[driversLicenseWindow] - handleWindowFocus()');
		toggleNoPermissions(false);
		showCamera();
	}
}

OS_ANDROID && $.window.addEventListener('androidback', handleBackButton);
OS_IOS && $.permissionView.addEventListener('click', handlePermissionsClick);

$.backButton.addEventListener('click', handleBackButton);
$.nextButton.addEventListener('click', handleNextButton);
$.shooterButton.addEventListener('click', handleShooterClick);
$.retakeButton.addEventListener('click', handleRetakeClick);
$.window.addEventListener('open', handleWindowFocus);

init();
