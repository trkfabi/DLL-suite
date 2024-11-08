/**
 * # Signature Window
 * @class Controllers.authorization.signatureWindow
 * @uses appNavigation
 * @uses Libs.analytics
 * @uses customizations
 * @uses Helpers.imageHelpers
 */

var args = arguments[0] || {};
var appNavigation = require('/appNavigation');
var analytics = require('/utils/analytics');
var customizations = require('/customizations');
var imageHelpers = require('/helpers/imageHelpers');

var isNext = false;
var myAuthorization = null;
var blankData;
var myIndex = 0;

// Private functions-------
/**
 * @method init
 * @private
 * Initialize values for the current Window
 * @return {void}
 */
function init() {
	analytics.captureTiAnalytics('Signature.Open');

	var logo = customizations.getFile('logo');
	// args.index = args.index || 0;
	myAuthorization = args.authorizations[myIndex];
	args.authorizationsData = args.authorizationsData || [];

	logo && logo.exists() && ($.logoImageView.image = logo.read());
};

$.cleanUp = function () {
	blankData = null;
};

/**
 * @method obtainImageData
 * @private
 * Gets the image info from the view
 * @param {Object} tiView View containing the signature
 * @return {Object} Image and image parsed encoded on  base 64
 */
function obtainImageData(tiView) {
	var image = null;

	OS_ANDROID && (tiView.backgroundColor = Alloy.Globals.colors.white);

	if (OS_IOS) {
		image = tiView.toImage(null, true);
	} else {
		image = tiView.toImage();
	}

	OS_ANDROID && (tiView.backgroundColor = Alloy.Globals.colors.transparent);

	// image = imageHelpers.resizeImage({
	// 	blob: image,
	// 	width: 300,
	// 	height: 300
	// });

	return imageHelpers.obtainImageData({
		blob: image
	});
};

/**
 * @method handleWindowFocus
 * @private
 * Handles the Focus event of the window
 * @return {void}
 */
function handleWindowFocus() {
	doLog && console.log('[signatureWindow] - handleWindowFocus');
	$.window.removeEventListener('focus', handleWindowFocus);
	OS_ANDROID && $.loadingIndicator.show();

	setTimeout(function () {
		blankData = obtainImageData($.paintView);
		OS_ANDROID && $.loadingIndicator.hide();
	}, OS_ANDROID ? 1000 : 0);

};

/**
 * @method handleWindowOpen
 * @private
 * Handles the open event of the window
 * @return {Void}
 */
function handleWindowOpen() {
	doLog && console.log("[signatureWindow] - handleWindowOpen");
	$.window.removeEventListener("open", handleWindowOpen);

	if (OS_IOS) {
		$.container.animate({
			top: 0,
			duration: 400
		}, function () {
			appNavigation.closeSummaryPoliciesWindow();
		});
	} else {
		appNavigation.closeSummaryPoliciesWindow();
	}
}

/**
 * @method handleNextClick
 * @private
 * Handles click event on next button
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleNextClick(_evt) {
	analytics.captureTiAnalytics('Signature.Next.Click');
	isNext = true;
	var signatureData = obtainImageData($.paintView);
	var hasData = (blankData && (blankData.base64String !== signatureData.base64String));
	var tempFile = null;

	if (hasData) {
		tempFile = Ti.Filesystem.createTempFile();
		tempFile.write(signatureData.image);
	}

	signatureData = null;

	args.authorizationsData[myIndex] = {
		id: myAuthorization.id,
		property: myAuthorization.property,
		hasData: hasData,
		file: tempFile
	};

	// myIndex++;

	// appNavigation.handleNextAuthorization(args);
	appNavigation.openSSNWindow(args);
};

/**
 * @method handleClearFieldClick
 * @private
 * Handles click event on Clear Field Button
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleClearFieldClick(_evt) {
	analytics.captureTiAnalytics('Signature.Clear.Click');
	$.paintView.clear();
};

/**
 * @method handleCancelClick
 * @private
 * Handles click event on Cancel Button
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleCancelClick(_evt) {
	analytics.captureTiAnalytics('Signature.Cancel.Click');
	// appNavigation.handlePreviousAuthorization(args);
	isNext = false;
	appNavigation.closeSignatureWindow();
};

// Public functions-------

$.window.addEventListener("open", handleWindowOpen);
$.window.addEventListener('focus', handleWindowFocus);
$.window.addEventListener('androidback', handleCancelClick);
$.cancelButton.addEventListener('click', handleCancelClick);
$.nextButton.addEventListener('click', handleNextClick);
$.clearFieldButton.addEventListener('click', handleClearFieldClick);

init();
