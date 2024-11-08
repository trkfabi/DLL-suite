/**
 * Controller with new options for the quote setup in the sumary screen
 * @class Controllers.apple.summary.quoteOptionsView
 * @uses Utils.uiHelpers
 * @uses appNavigation
 */
var doLog = Alloy.Globals.doLog;

var args = arguments[0] || {};

const LOG_TAG = '\x1b[31m' + '[controllers/apple/summary/quoteOptionsView]' + '\x1b[39;49m ';

var uiHelpers = require('/helpers/uiHelpers');
var appNavigation = require('/appNavigation');
var analytics = require('/utils/analytics');

var quote = args.quote;

/**
 * @method init
 * @private
 * Initializes the controller
 * @return {void}
 */
function init() {
	doLog && console.log(LOG_TAG, '- init');

	uiHelpers.initAlphanumericFormatHandler($.pdfFilenameField);
	$.sectionHeader.setTitle(L(args.titleid));

	$.refreshUI();
}

// +-------------------
// | Public members.
// +-------------------

/**
 * @method refreshUI
 * Updates the UI components showing the latest data from the models
 * @return {void}
 */
$.refreshUI = function () {
	doLog && console.log(LOG_TAG, '- refreshUI');
	var expirationDate = new moment(quote.get('expirationDate'));

	$.pdfFilenameField.value = quote.get('pdfFileName') || 'Quote';
	$.quoteDisplayPaybackSwitch.value = quote.getDisplayPaybackPercentage();
	$.quoteValidUntilField.value = expirationDate.format('MMMM DD, YYYY');
};

// +-------------------
// | Event Handlers declaration.
// +-------------------

/**
 * @method handleSectionHeaderClick
 * @private
 * Handles the section header click event
 * @return {void}
 */
function handleSectionHeaderClick() {
	uiHelpers.expandCollapse({
		container: $.quoteOptionsView,
		button: $.sectionHeader.expandColapseButton
	});
}

/**
 * @method handleQuoteValidUntilClick
 * @private
 * Handler for the click of the whole "quote valid until" view
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleQuoteValidUntilClick(_evt) {
	doLog && console.log(LOG_TAG, '- handleQuoteValidUntilClick');
	var today = new moment();
	var maxDate = today.clone().add(30, 'days');
	var value = new moment(quote.get('expirationDate'));

	Alloy.createController('common/datePicker', {
		minDate: today.toDate(),
		maxDate: maxDate.toDate(),
		value: value.toDate(),
		onDone: handleDatePickerDone,
		onCancel: handleDonePickerCancel
	}).show();
}

/**
 * @method handleDatePickerDone
 * @private
 * Handler for the done event in the date picker
 * @param {Object} _evt Done event
 * @return {void}
 */
function handleDatePickerDone(_evt) {
	doLog && console.log(LOG_TAG, '- handleDatePickerDone');

	var expirationDate = new moment(_evt.value);

	quote.addAnalyticsCounter('quoteValid', expirationDate.format());
	quote.set('expirationDate', expirationDate.format()).save();

	$.refreshUI();
}

/**
 * @method handleDisplayPaybackSwitchChange
 * @private
 * Handler for the change event in the display payback % switch
 * @param {Object} _evt Change event
 * @return {void}
 */
function handleDisplayPaybackSwitchChange(_evt) {
	doLog && console.log(LOG_TAG, '- handleDisplayPaybackSwitchChange');

	var quotePaybackSwitchValue = _evt.value ? Alloy.Globals.displayPaybackPercentage.on : Alloy.Globals.displayPaybackPercentage
		.off;
	if (_evt.value) {
		quote.addAnalyticsCounter('displayPaybackOn');
	} else {
		quote.addAnalyticsCounter('displayPaybackOff');
	}
	quote.set('displayPaybackPercentage', quotePaybackSwitchValue).save();

	var analyticsEvent = _evt.value ? 'AFS-Payback-Option-On' : 'AFS-Payback-Option-Off';
	analytics.captureTiAnalytics(analyticsEvent);
}

/**
 * @method handleDonePickerCancel
 * @private
 * Handler for the cancel event in the date picker
 * @param {Object} _evt Cancel object
 * @return {void}
 */
function handleDonePickerCancel(_evt) {
	doLog && console.log(LOG_TAG, '- handleDonePickerCancel');

}

/**
 * @method handleShareButtonClick
 * @private
 * Handles the share button click event 
 * @param {Object} _evt click parameter event
 * @return {void}
 */
function handleShareButtonClick(_evt) {
	doLog && console.log(LOG_TAG, '- handleShareButtonClick');
	var _customer = quote.get('customer');

	appNavigation.openGenerateWindow({
		quote: quote,
		recipient: 'share',
		pdfFileName: $.pdfFilenameField.value,
		doneCallback: function (_data) {
			appNavigation.openEmailDialog({
				subject: ' ',
				toRecipients: [_customer.get('email') || ''],
				messageBody: L('thank_you') + '.',
				attachments: _data.attachments
			});
		}
	});
}

/**
 * @method handlePdfFilenameFieldChange
 * @private
 * Handler for the change event of the text field
 * @param {type} _value text to save
 * @return {void}
 */
function handlePdfFilenameFieldChange(_value) {
	doLog && console.log(LOG_TAG, '- handlePdfFilenameFieldChange');
	doLog && console.log(LOG_TAG, '_value: ' + JSON.stringify(_value, null, '	'));
}

/**
 * @method handlePdfFilenameFieldBlur
 * @private
 * Handler for the blur event on the text file
 * @param {Object} _evt 
 * @return {void}
 */
function handlePdfFilenameFieldBlur(_evt) {
	doLog && console.log(LOG_TAG, '- handlePdfFilenameFieldBlur');
	$.pdfFilenameField.value = $.pdfFilenameField.value.trim();
	quote.addAnalyticsCounter('fileName', $.pdfFilenameField.value);
	quote.set('pdfFileName', $.pdfFilenameField.value).save();
}

$.pdfFilenameIcon.addEventListener('click', handleShareButtonClick);
$.pdfFilenameField.addEventListener('blur', handlePdfFilenameFieldBlur);
$.sectionHeader.addEventListener('click', handleSectionHeaderClick);
$.quoteValidUntilView.addEventListener('click', handleQuoteValidUntilClick);
$.quoteDisplayPaybackSwitch.addEventListener('change', handleDisplayPaybackSwitchChange);

init();
