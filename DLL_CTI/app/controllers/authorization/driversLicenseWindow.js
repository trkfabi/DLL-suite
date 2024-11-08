/**
 * # Drivers License Window
 * @class Controllers.authorization.driversLicenseWindow
 * @uses appNavigation
 * @uses Utils.analytics
 * @uses customizations
 */

var args = arguments[0] || {};
var appNavigation = require('/appNavigation');
var analytics = require('/utils/analytics');
var customizations = require('/customizations');
var logo = customizations.getFile('logo');

analytics.captureTiAnalytics('DriversLicense.Open');

if (OS_IOS) {
	// IOS
	var licenseFile;
	var Camera = require("com.mfogg.squarecamera");

	logo && logo.exists() && ($.brandLogo.image = logo.read());

	var cameraView = Camera.createView({
		width: Ti.UI.FILL,
		height: Ti.UI.FILL,
		backgroundColor: '#FFF',
	});

	var imageView = Ti.UI.createImageView({
		width: Ti.UI.FILL,
		height: Ti.UI.FILL,
		backgroundColor: '#FFF',
	});

	$.window.leftNavButton = $.backButton;
	$.window.rightNavButton = $.nextButton;

	$.cameraContainer.add(cameraView);

	$.shooterButton.addEventListener("click", function (e) {
		analytics.captureTiAnalytics('DriversLicense.ShooterButton.Click');
		cameraView.takePhoto();
	});

	cameraView.addEventListener("success", function (e) {
		var licenseImage = e.media;
		imageView.image = licenseImage;
		$.cameraContainer.remove(cameraView);
		$.cameraContainer.add(imageView);

		var animation = Ti.UI.createAnimation({
			bottom: Alloy.Globals.hasNotch ? 40 : 10,
			duration: 300
		});

		$.retakeButton.animate(animation);

		licenseImage = licenseImage.imageAsResized(licenseImage.width / 2, licenseImage.height / 2);

		var fileName = '' + Date.now() + args.customer.id + '_license.png';
		licenseFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, fileName);
		licenseFile.write(licenseImage);
	});

	if (!Ti.Media.hasCameraPermissions()) {
		$.permissionLabel.text = L("access_to_camera_not_enabled");

		var settingsURL = Ti.App.iOS.applicationOpenSettingsURL;
		var version = Titanium.Platform.version.split(".");
		var major = parseInt(version[0], 10);
		if (major >= 8 && settingsURL) {
			var settingsButton = Ti.UI.createButton({
				top: 270,
				tintColor: Alloy.Globals.colors.lochmara,
				color: Alloy.Globals.colors.lochmara,
				title: L("open_settings"),
				font: {
					fontFamily: "HelveticaNeue-Bold",
					fontSize: 20,
					fontWeight: "bold"
				},
				zIndex: 999
			});

			$.window.add(settingsButton);

			settingsButton.addEventListener('click', function (e) {
				if (Ti.Platform.canOpenURL(settingsURL)) {
					Ti.Platform.openURL(settingsURL);
				}
			});
		}
	}

	$.retakeButton.addEventListener("click", function (e) {
		analytics.captureTiAnalytics('DriversLicense.RetakeButton.Click');
		$.cameraContainer.remove(imageView);
		$.cameraContainer.add(cameraView);

		licenseFile && licenseFile.deleteFile();
		licenseFile = null;

		var animation = Ti.UI.createAnimation({
			bottom: -50,
			duration: 300
		});

		$.retakeButton.animate(animation);
		// $.doneButton.animate(animation);
	});

	$.backButton.addEventListener('click', function (e) {
		analytics.captureTiAnalytics('DriversLicense.Back.Click');
		Camera = null;
		$.window.close();
	});

	$.nextButton.addEventListener("click", function (e) {
		analytics.captureTiAnalytics('DriversLicense.Next.Click');

		args.licenseCallback && args.licenseCallback({
			hasLicense: licenseFile != null,
			license: licenseFile
		});

		Camera = null;

		appNavigation.closeSignatureWindow();

		_.delay(function () {
			appNavigation.closeNavigation();
			args.finishCallback && args.finishCallback(args);
		}, 1000);

	});

} else {
	// ANDROID
	var licenseFile;
	var photoTaken;
	var takingPic = false;

	if (logo && logo.exists()) {
		$.brandLogoWindow.image = logo.read();
		$.brandLogoCamera.image = logo.read();
	}

	$.shooterButton.addEventListener("click", function (e) {
		Ti.Media.takePicture();
	});

	$.window.addEventListener('androidback', backEvent);
	$.backButtonWindow.addEventListener('click', backEvent);
	$.backButtonCamera.addEventListener('click', backEvent);
	$.nextButtonWindow.addEventListener("click", nextEvent);
	$.nextButtonCamera.addEventListener("click", nextEvent);

	$.retakeButton.addEventListener("click", function (e) {
		takingPic = false;
		showCamera();
		licenseFile && licenseFile.deleteFile();
		licenseFile = null;
		analytics.captureTiAnalytics('DriversLicense.RetakeButton.Click');
		photoTaken && $.window.remove(photoTaken);
		photoTaken = null;
	});

	$.open = function () {
		$.window.open();
		showCamera();
	};
	$.close = function () {
		$.window.close();
		Ti.Media.hideCamera();
	};

	/**
	 * @method showCamera
	 * @private
	 * Shows the camera inside the $.container control
	 * @return {void}
	 */
	var showCamera = function () {
		Ti.Media.showCamera({
			autohide: true,
			overlay: $.container,
			saveToPhotoGallery: false,
			success: takePhotoEvt,
			error: errorPhotoEvt,
			cancel: backEvent
		});
	};

	/**
	 * @method backEvent
	 * @private
	 * Handles the cancel event from camera
	 * @return {void}
	 */
	var backEvent = function () {
		analytics.captureTiAnalytics('DriversLicense.Back.Click');
		appNavigation.closeDriverLicenseWindow();
	};

	/**
	 * @method nextEvent
	 * @private
	 * Handles click event for next button
	 * @return {void}
	 */
	var nextEvent = function () {
		analytics.captureTiAnalytics('DriversLicense.Next.Click');

		args.licenseCallback && args.licenseCallback({
			hasLicense: licenseFile != null,
			license: licenseFile
		});

		appNavigation.closeSignatureWindow();

		_.delay(function () {
			appNavigation.closeNavigation();
			args.finishCallback && args.finishCallback(args);
		}, 1000);

	};

	/**
	 * @method takePhotoEvt
	 * @private
	 * Handles the success callback on take photo camera
	 * @param {Object} _evt Success event
	 * @return {void}
	 */
	var takePhotoEvt = function (_evt) {
		if (takingPic) {
			return;
		}
		takingPic = true;
		var licenseImage = _evt.media;

		if (parseInt(licenseImage.width) > 800) { // If the image width is bigger than 800 adjust the image to be 800
			var imageWidth = 800;
			var imageHeight = (800 * parseInt(licenseImage.height)) / parseInt(licenseImage.width);
			licenseImage = licenseImage.imageAsResized(imageWidth, imageHeight);
		}

		photoTaken = Ti.UI.createImageView();
		$.addClass(photoTaken, 'photoTaken', {
			image: licenseImage
		});
		$.window.add(photoTaken);

		var fileName = '' + Date.now() + args.customer.id + '_license.png';
		licenseFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, fileName);
		licenseFile.write(licenseImage);
	};

	/**
	 * @method errorPhotoEvt
	 * @private
	 * Handles the error callback on take photo camera
	 * @param {Object} _evt Error event
	 * @return {void}
	 */
	var errorPhotoEvt = function (_evt) {
		console.error("photo error!");
		console.error("_evt: " + JSON.stringify(_evt, null, '\t'));
	};
}
