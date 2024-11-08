/**
 * # Residual Row
 * @class Controllers.authorization.dobWindow
 * @uses Alloy.moment
 * @uses Utils.analytics
 * @uses appNavigation
 * @uses customizations
 * @uses Utils.sessionManager
 */

var args = arguments[0] || {};
var analytics = require('/utils/analytics');
var appNavigation = require('/appNavigation');
var customizations = require('/customizations');
var sessionManager = require('/utils/sessionManager');
var logo = customizations.getFile('logo');
var countryData = sessionManager.getCountryData();
var authorizations = countryData.summary.authorizations;

/**
 * @method init
 * @private
 * Initialize values for the current View
 * @return {void}
 */
function init() {
	analytics.captureTiAnalytics('DOB.Open');
	logo && logo.exists() && ($.brandLogo.image = logo.read());

	if (OS_IOS) {
		var ssnTitle = _.find(authorizations, function (_authorization) {
			return _authorization.type === 'ssn';
		});

		$.window.backButtonTitle = L(ssnTitle.summaryTitleid);
		$.backTitle.text = L(ssnTitle.summaryTitleid);
	}

	var hintDate = L('format_date_localized').split(L('date_separator'));

	$.section1TextField.hintText = hintDate[0];
	$.section2TextField.hintText = hintDate[1];
	$.section3TextField.hintText = hintDate[2];
};

/**
 * @method handleSection1TextChange
 * @private
 * Handles the event change for handleSection1TextChange and selects section2TextField if length >= 2
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleSection1TextChange(_evt) {
	if (_evt.value.length >= 2) {
		$.section2TextField.focus();
	}
};

/**
 * @method handleSection2TextChange
 * @private
 * Handles the event change for handleSection2TextChange and selects section3TextField if length >= 2 or returns focus to section1TextField when length gets to 0
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleSection2TextChange(_evt) {
	if (_evt.value.length >= 2) {
		$.section3TextField.focus();
	} else if (_evt.value.length == 0) {
		$.section1TextField.focus();
	}
};

/**
 * @method handleSection3TextChange
 * @private
 * Handles the event change for section3TextField and selects section2TextField when length gets to 0
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleSection3TextChange(_evt) {
	if (_evt.value.length == 0) {
		$.section2TextField.focus();
	}
};

/**
 * @method handleWindowOpen
 * @private
 * Handles the event open of the window, it selects the section1TextField after window opened
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleWindowOpen(_evt) {
	setTimeout(function () {
		$.section1TextField.focus();
	}, 750);
};

/**
 * @method handleWindowOpen
 * @private
 * Handles the event click of backButton, it closes the current window
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleBackButtonClick(_evt) {
	analytics.captureTiAnalytics('DOB.Back.Click');
	$.window.close();
};

/**
 * @method handleNextButtonClick
 * @private
 * Handles the event click of nextButton, sends to dobCallback the DOB string formated
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleNextButtonClick(_evt) {
	analytics.captureTiAnalytics('DOB.Next.Click');
	if ($.section1TextField.value != "" && $.section2TextField.value != "" && $.section3TextField.value) {
		$.section3TextField.blur();
		var dobString = String.format('%s/%s/%s',
			$.section1TextField.value,
			$.section2TextField.value,
			$.section3TextField.value);
		var dob = new moment(dobString, L('format_date'));

		args.dobCallback && args.dobCallback({
			dob: dob
		});
	}
	if (Ti.Media.hasCameraPermissions()) {
		appNavigation.openDriverLicenseWindow(args);
	} else {
		Ti.Media.requestCameraPermissions(function (e) {
			appNavigation.openDriverLicenseWindow(args);
		});
	}
};

$.section1TextField.addEventListener("change", handleSection1TextChange);
$.section2TextField.addEventListener("change", handleSection2TextChange);
$.section3TextField.addEventListener("change", handleSection3TextChange);
$.backButton.addEventListener('click', handleBackButtonClick);
$.nextButton.addEventListener("click", handleNextButtonClick);

$.window.addEventListener("open", handleWindowOpen);
if (OS_IOS) {
	$.window.leftNavButton = $.backButton;
	$.window.rightNavButton = $.nextButton;
}

init();
