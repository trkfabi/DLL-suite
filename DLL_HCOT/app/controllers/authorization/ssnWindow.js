/**
 * # Signature Window
 * @class Controllers.authorization.ssnWindow
 * @uses appNavigation
 * @uses Libs.analytics
 * @uses customizations
 * @uses Libs.sessionManager
 */

var args = arguments[0] || {};
var appNavigation = require('/appNavigation');
var analytics = require('/utils/analytics');
var customizations = require('/customizations');

var myIndex = 1;
var myAuthorization = null;
/**
 * @method init
 * @private
 * Initialize values for the current Window
 * @return {void}
 */
function init() {
	analytics.captureTiAnalytics('SSN.Open');

	// args.index = args.index || 0;
	myAuthorization = args.authorizations[myIndex];
	args.authorizationsData = args.authorizationsData || [];
	var logo = customizations.getFile('logo');
	var fieldsLength = myAuthorization.format.split('-');
	var myAuthorizationData = args.authorizationsData[myIndex];
	var totalLength = 0;
	var fieldWidth = (OS_ANDROID) ? 23 : 20;

	logo && logo.exists() && ($.brandLogo.image = logo.read());
	$.authorizationTitleLabel.text = L(myAuthorization.detailTitleid);

	// TODO: Clean this
	for (var i = 0; i < 3; i++) {
		var fieldLength = fieldsLength[i];
		$['section' + (i + 1) + 'TextField'].maxLength = fieldLength;
		$['section' + (i + 1) + 'Container'].width = fieldLength * fieldWidth;

		if (myAuthorizationData && myAuthorizationData.hasData) {
			$['section' + (i + 1) + 'TextField'].value = myAuthorizationData.ssn.substr(totalLength, fieldLength);
			totalLength += parseInt(fieldLength, 10);
		}
	}
};

/**
 * @method saveAuthorizationData
 * @private
 * Saves the SSN info into the authorizations array, if any
 * @return {void}
 */
function saveAuthorizationData() {
	var ssn = '' + $.section1TextField.value + $.section2TextField.value + $.section3TextField.value;
	var hasData = (ssn.trim().length === 9);

	if (!hasData) {
		ssn = null;
	}

	args.authorizationsData[myIndex] = {
		id: myAuthorization.id,
		property: myAuthorization.property,
		hasData: hasData,
		ssn: ssn
	};
};

/**
 * @method handleSection1TextChange
 * @private
 * Handles the event change for handleSection1TextChange and selects section2TextField if text.maxLength >= source.maxLength
 * @param {Object} _evt Text change event
 * @return {void}
 */
function section1TextChange(_evt) {
	if (_evt.value.length >= _evt.source.maxLength) {
		$.section2TextField.focus();
	}
};

/**
 * @method handleSection2TextChange
 * @private
 * Handles the event change for handleSection2TextChange and selects section3TextField if length >= source.maxLength or returns focus to section1TextField when length gets to 0
 * @param {Object} _evt Text change event
 * @return {void}
 */
function section2TextChange(_evt) {
	if (_evt.value.length >= _evt.source.maxLength) {
		$.section3TextField.focus();
	} else if (_evt.value.length == 0) {
		$.section1TextField.focus();
	}
};

/**
 * @method handleSection3TextChange
 * @private
 * Handles the event change for section3TextField and selects section2TextField when length gets to 0
 * @param {Object} _evt Text change event
 * @return {void}
 */
function section3TextChange(_evt) {
	if (_evt.value.length == 0) {
		$.section2TextField.focus();
	}
};

/**
 * @method handleWindowOpen
 * @private
 * Handles the open event from the window
 * @param {Object} _evt Text change event
 * @return {void}
 */
function handleWindowOpen(_evt) {
	setTimeout(function () {
		$.section1TextField.focus();
	}, 700);
};

/**
 * @method handleNextButton
 * @private
 * Handles the event click of nextButton, sends to dobCallback the DOB string formated
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleNextButton(_evt) {
	analytics.captureTiAnalytics('SSN.Next.Click');

	saveAuthorizationData();

	// appNavigation.handleNextAuthorization(args);
	appNavigation.openDOBWindow(args);
};

/**
 * @method handleBackButton
 * @private
 * Handles the event click of back button, Opens signature window
 * @return {void}
 */
function handleBackButton() {
	analytics.captureTiAnalytics('SSN.Back.Click');

	saveAuthorizationData();

	// appNavigation.handlePreviousAuthorization(args);
	appNavigation.closeSSNWindow();
};

// Public functions-------

OS_ANDROID && $.window.addEventListener('androidback', handleBackButton);
$.backButton.addEventListener('click', handleBackButton);
$.nextButton.addEventListener('click', handleNextButton);
$.window.addEventListener('open', handleWindowOpen);
$.section1TextField.addEventListener('change', section1TextChange);
$.section2TextField.addEventListener('change', section2TextChange);
$.section3TextField.addEventListener('change', section3TextChange);

init();
