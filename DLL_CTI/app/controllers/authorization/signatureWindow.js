/**
 * # Signature Window
 * @class Controllers.authorization.signatureWindow
 * @uses ti.imagefactory (if Android)
 * @uses ti.paint
 * @uses appNavigation
 * @uses utils.analytics
 * @uses customizations
 */

var params = arguments[0] || {};
var appNavigation = require('/appNavigation');
var analytics = require('/utils/analytics');
var customizations = require('/customizations');
var imageHelpers = require('/helpers/imageHelpers');
var logo = customizations.getFile('logo');
var isNext = false;
var firstData;

// Private functions-------
/**
 * @method init
 * @private
 * Initialize values for the current Window
 * @return {void}
 */
function init() {
	analytics.captureTiAnalytics('Signature.Open');
	// $.signatureContainer.add(paintView);
	logo && logo.exists() && ($.logoImageView.image = logo.read());
	$.window.applyProperties({
		orientationModes: [Ti.UI.LANDSCAPE_LEFT, Ti.UI.LANDSCAPE_RIGHT]
	});
};

/**
 * @method obtainImageData
 * @private
 * Gets the image info from the view
 * @params {Object} tiView View containing the signature
 * @return {Object} Image and image parsed encoded on  base 64
 */
function obtainImageData(tiView) {

	var image = null;

	tiView.backgroundColor = Alloy.Globals.colors.white;

	if (OS_IOS) {
		image = tiView.toImage(null, true);
	} else {
		image = tiView.toImage();
	}

	tiView.backgroundColor = Alloy.Globals.colors.transparent;

	return imageHelpers.obtainImageData({
		blob: image,
		width: 300,
		height: 300
	});
};

/**
 * @method openWindowEvt
 * @private
 * Handles the open event of the window
 * @return {Void}
 */
function openWindowEvt() {
	doLog && console.log("[signatureWindow] - openWindowEvt");
	$.window.removeEventListener("open", openWindowEvt);

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
 * @method focusWindowEvt
 * @private
 * Handles the Focus event of the window
 * @return {Void}
 */
function focusWindowEvt() {
	doLog && console.log("[signatureWindow] - focusWindowEvt");
	$.window.removeEventListener("focus", focusWindowEvt);

	OS_ANDROID && appNavigation.showLoadingIndicator({
		autoShow: true,
		container: $.window
	});

	setTimeout(function () {
		firstData = obtainImageData($.paintView);
		//appNavigation.hideActivityIndicator();

		OS_ANDROID && appNavigation.hideLoadingIndicator();
	}, (OS_IOS) ? 0 : 1000);
};

/**
 * @method handleNextClick
 * @private
 * Handles click event on next button
 * @param {Object} _evt Click event
 * @return {Void}
 */
function handleNextClick(_evt) {
	analytics.captureTiAnalytics('Signature.Next.Click');
	isNext = true;
	var secondData = obtainImageData($.paintView);
	var signatureFile;
	// var hasSignature = (firstData.string !== secondData.string);
	var hasSignature = (firstData && (firstData.base64String !== secondData.base64String));

	if (hasSignature) {
		var fileName = '' + Date.now() + params.customer.id + '_signature.png';
		signatureFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, fileName);
		signatureFile.write(secondData.image);
	}

	secondData = null;
	paintView = null;

	params.signatureCallback && params.signatureCallback({
		signature: signatureFile,
		hasSignature: hasSignature
	});

	image = null;

	appNavigation.openSsnWindow(params);

};

/**
 * @method handleClearFieldClick
 * @private
 * Handles click event on Clear Field Button
 * @param {Object} _evt Click event
 * @return {Void}
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
 * @return {Void}
 */
function handleCancelClick(_evt) {
	analytics.captureTiAnalytics('Signature.Cancel.Click');
	$.window.close();
};

/**
 * @method handleWindowClose
 * @private
 * Handles close event of the window
 * @param {Object} _evt Click event
 * @return {Void}
 */
function handleWindowClose(_evt) {
	if (isNext) {
		appNavigation.openSsnWindow(params);
	}
};

// Public functions-------
$.window.addEventListener("open", openWindowEvt);
$.window.addEventListener("focus", focusWindowEvt);
$.nextButton.addEventListener("click", handleNextClick);
$.clearFieldButton.addEventListener("click", handleClearFieldClick);
$.cancelButton.addEventListener("click", handleCancelClick);

init();
