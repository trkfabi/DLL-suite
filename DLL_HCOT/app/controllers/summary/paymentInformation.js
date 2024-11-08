/**
 * @class Controllers.summary.paymentInformation
 * Displays all the paymentInformation
 */

var args = arguments[0] || {};
var quote = args.quote;
var paymentOption = quote.getSelectedPaymentOption();
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');
var rateCards = require('/rateCards');
var calculator = require('/calculations/calculator');
var isPaySettingsShow = false;
var hideFields = {
	rateProgram: false,
	structure: false,
	paymentFreq: false
};

/**
 * @method init
 * @private
 * Initializes the Payment Information Controller
 * @return {void}
 */
function init() {

	var strPurchaseOption = '';
	var monthlyTerm = '' + rateCards.getRealTermForPaymentOption(paymentOption);
	var totalPaymentAmount = calculator.calculateTotalPaymentAmount(paymentOption);

	switch (paymentOption.get('purchaseOptions')) {
	case 'F':
		strPurchaseOption = 'FMV';
		break;
	case 'D':
		strPurchaseOption = '$1';
		break;
	case 'P':
		strPurchaseOption = 'FPO';
		break;
	default:
		strPurchaseOption = 'FMV';
	}

	$.paymentAmountLabel.text = stringFormatter.formatDecimal(totalPaymentAmount, '$0.00', '\'$\'#,##0.00');
	$.purchaseOptionLabel.text = strPurchaseOption;
	$.termLabel.text = String.format(L('term_months'), monthlyTerm);
	switch (paymentOption.get('paymentFrequency')) {
	case L('monthly_acronym'):
		$.paymentFrequencyLabel.text = L('monthly');
		break;
	case L('quarterly_acronym'):
		$.paymentFrequencyLabel.text = L('quarterly');
		break;
	case L('semiannually_acronym'):
		$.paymentFrequencyLabel.text = L('semiannually');
		break;
	case L('annualy_acronym'):
		$.paymentFrequencyLabel.text = L('annually');
		break;
	default:
		$.paymentFrequencyLabel.text = L('monthly');
		break;
	}

	$.structureLabel.text = rateCards.getAdvancePaymentTitle({
		advancePayment: paymentOption.get('advancePayment'),
		advancePaymentType: paymentOption.get('advancePaymentType')
	});
	$.rateProgramLabelValue.text = stringFormatter.removeDefaultTerm(paymentOption.get('promoName'));

	uiHelpers.expandCollapse({
		container: $.paymentInformation,
		button: $.paymentButton
	});

	$.paymentFreqSwitch.value = true;
	$.structureSwitch.value = true;
	$.rateProgramSwitch.value = true;

};

/**
 * @method togglePaymentSettings
 * @private
 * Toggle payment settings
 * @return {void}
 */
function togglePaymentSettings() {
	isPaySettingsShow = !isPaySettingsShow;
	$.paymentSettingsContainer.height = (isPaySettingsShow ? Ti.UI.SIZE : 0);
	$.settingsPointer.height = (isPaySettingsShow ? Ti.UI.SIZE : 0);
};

/**
 * @method getHideFields
 * Gets the values of hide fields to check if there are some hiden fields
 * @return {void} Hidden fields
 */
$.getHideFields = function () {
	return hideFields;
};

/**
 * @method handleSectionHeaderClick
 * @private
 * Handles the section header click event
 * @return {void}
 */
function handleSectionHeaderClick() {
	uiHelpers.expandCollapse({
		container: $.paymentInformation,
		button: $.paymentButton
	});
};

/**
 * @method handleRateProgramSwitchChange
 * @private
 * Handle the change event of the rateProgramSwitch control
 * @param {Object} _evt Change event 
 * @return {void}
 */
function handleRateProgramSwitchChange(_evt) {
	$.rateProgramRow.height = _evt.value ? Ti.UI.SIZE : 0;
	hideFields.rateProgram = !_evt.value;
};

/**
 * @method handleSructureSwitchChange
 * @private
 * Handle the change event of the structureSwitch control
 * @param {Object} _evt Change event 
 * @return {void}
 */
function handleSructureSwitchChange(_evt) {
	$.structureRow.height = _evt.value ? Ti.UI.SIZE : 0;
	hideFields.structure = !_evt.value;
};

/**
 * @method handlePaymentFreqSwitchChange
 * @private
 * Handle the change event of the paymentFreqSwitch control
 * @param {Object} _evt Change event 
 * @return {void}
 */
function handlePaymentFreqSwitchChange(_evt) {
	$.paymentFrequencyRow.height = _evt.value ? Ti.UI.SIZE : 0;
	hideFields.paymentFreq = !_evt.value;
};

$.paymentHeader.addEventListener('click', handleSectionHeaderClick);
$.paymentSettingsButton.addEventListener('click', togglePaymentSettings);
$.rateProgramSwitch.addEventListener('change', handleRateProgramSwitchChange);
$.structureSwitch.addEventListener('change', handleSructureSwitchChange);
$.paymentFreqSwitch.addEventListener('change', handlePaymentFreqSwitchChange);

init();
