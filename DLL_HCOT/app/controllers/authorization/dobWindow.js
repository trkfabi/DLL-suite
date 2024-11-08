/**
 * # Residual Row
 * @class Controllers.authorization.dobWindow
 * @uses Libs.analytics
 * @uses appNavigation
 * @uses customizations
 * @uses Libs.sessionManager
 */

var args = arguments[0] || {};
var analytics = require('/utils/analytics');
var appNavigation = require('/appNavigation');
var customizations = require('/customizations');

var logo = customizations.getFile('logo');
var myAuthorization = null;
var myIndex = 2;

/**
 * @method init
 * @private
 * Initialize values for the current View
 * @return {void}
 */
function init() {
	analytics.captureTiAnalytics('DOB.Open');
	// args.index = args.index || 0;
	myAuthorization = args.authorizations[myIndex];
	args.authorizationsData = args.authorizationsData || [];
	var logo = customizations.getFile('logo');
	var hintDate = L('format_date_localized').split(L('date_separator'));
	var myAuthorizationData = args.authorizationsData[myIndex];

	logo && logo.exists() && ($.brandLogo.image = logo.read());
	$.section1TextField.hintText = hintDate[0];
	$.section2TextField.hintText = hintDate[1];
	$.section3TextField.hintText = hintDate[2];

	if (myAuthorizationData && myAuthorizationData.hasData) {
		var dob = myAuthorizationData.dob;
		$.section1TextField.value = dob.format(hintDate[0]);
		$.section2TextField.value = dob.format(hintDate[1]);
		$.section3TextField.value = dob.format(hintDate[2]);
	}
};

/**
 * @method saveAuthorizationData
 * @private
 * Saves the DOB info into the authorizations array, if any
 * @return {void}
 */
function saveAuthorizationData() {
	var dob = '' + $.section1TextField.value + '/' + $.section2TextField.value + '/' + $.section3TextField.value;
	var hasData = false;

	dob = new moment(dob, L('format_date_validation'), true);
	hasData = dob.isValid();

	if (!hasData) {
		dob = null;
	}

	args.authorizationsData[myIndex] = {
		id: myAuthorization.id,
		property: myAuthorization.property,
		hasData: hasData,
		dob: dob
	};
}

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
 * @method handleBackButtonClick
 * @private
 * Handles the event click of backButton, it closes the current window
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleBackButtonClick(_evt) {
	analytics.captureTiAnalytics('DOB.Back.Click');

	saveAuthorizationData();

	// appNavigation.handlePreviousAuthorization(args);
	appNavigation.closeDOBWindow();
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

	saveAuthorizationData();

	// appNavigation.handleNextAuthorization(args);
	appNavigation.openDriversLicenseWindow(args);
};

$.section1TextField.addEventListener('change', handleSection1TextChange);
$.section2TextField.addEventListener('change', handleSection2TextChange);
$.section3TextField.addEventListener('change', handleSection3TextChange);
$.backButton.addEventListener('click', handleBackButtonClick);
$.nextButton.addEventListener('click', handleNextButtonClick);

$.window.addEventListener('open', handleWindowOpen);
OS_ANDROID && $.window.addEventListener('androidback', handleBackButtonClick);

init();
