/**
 * # Signature Window
 * @class Controllers.authorization.ssnWindow
 * @uses appNavigation
 * @uses utils.analytics
 * @uses customizations
 * @uses utils.sessionManager
 */

const LOG_TAG = '[controllers/authorization/ssnWindow]';

var args = arguments[0] || {};
var appNavigation = require('/appNavigation');
var analytics = require('/utils/analytics');
var customizations = require('/customizations');
var session = require('/utils/sessionManager');
var countryData = session.getCountryData();
var authorizations = countryData.summary.authorizations;
var ssnAuthorization;
var logo;

/**
 * @method init
 * @private
 * Initialize values for the current Window
 * @return {void}
 */
function init() {
	analytics.captureTiAnalytics('SSN.Open');

	logo = customizations.getFile('logo');

	if (OS_IOS) {
		$.window.leftNavButton = $.backButton;
		$.window.rightNavButton = $.nextButton;
	}

	ssnAuthorization = _.find(authorizations, function (_authorization) {
		return _authorization.type === 'ssn';
	});

	$.titleLabel.text = L(ssnAuthorization.detailTitleid);

	var fieldsLength = ssnAuthorization.format.split('-');

	$.section1TextField.maxLength = fieldsLength[0];
	$.section1Container.width = getTextWidth(fieldsLength[0]);

	$.section2TextField.maxLength = fieldsLength[1];
	$.section2Container.width = getTextWidth(fieldsLength[1]);

	$.section3TextField.maxLength = fieldsLength[2];
	$.section3Container.width = getTextWidth(fieldsLength[2]);

	logo && logo.exists() && ($.brandLogo.image = logo.read());
};

/**
 * @method blurFields
 * Forces the keyboard to hide
 * @return {void}
 */
$.blurFields = function () {
	doLog && console.log(LOG_TAG, '- blurFields');

	$.section1TextField.blur();
	$.section2TextField.blur();
	$.section3TextField.blur();
};

/**
 * @method getTextWidth
 * @private
 * Gets the text width based on max length
 * @param {Object} _fieldMaxLength Max length of a text field
 * @return {Number} Width of the field text
 */
function getTextWidth(_fieldMaxLength) {
	switch (_fieldMaxLength) {
	case '2':
		return 40;
	case '3':
		return 60;
	case '4':
		return 70;
	}
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
 * @method windowOpen
 * @private
 * Handles the open event from the window
 * @param {Object} _evt Text change event
 * @return {void}
 */
function windowOpen(_evt) {
	setTimeout(function () {
		$.section1TextField.focus();
	}, 700);
};

/**
 * @method nextClick
 * @private
 * Handles the event click of nextButton, sends to dobCallback the DOB string formated
 * @param {Object} _evt Click event
 * @return {void}
 */
function nextClick(_evt) {
	analytics.captureTiAnalytics('SSN.Next.Click');
	$.blurFields();
	if ($.section1TextField.value != "" && $.section2TextField.value != "" && $.section3TextField.value) {
		var ssn = $.section1TextField.value + $.section2TextField.value + $.section3TextField.value;
		$.section3TextField.blur();
		args.ssnCallback && args.ssnCallback({
			ssn: ssn
		});
	}
	appNavigation.openDobWindow(args);
};

/**
 * @method backEvent
 * @private
 * Handles the event click of back button, Opens signature window
 * @return {void}
 */
function backEvent() {
	analytics.captureTiAnalytics('SSN.Back.Click');

	appNavigation.closeSsnWindow();
};

// Public functions-------

OS_ANDROID && $.window.addEventListener('androidback', backEvent);
$.backButton.addEventListener("click", backEvent);
$.nextButton.addEventListener("click", nextClick);
$.window.addEventListener("open", windowOpen);
$.section1TextField.addEventListener("change", section1TextChange);
$.section2TextField.addEventListener("change", section2TextChange);
$.section3TextField.addEventListener("change", section3TextChange);

init();
