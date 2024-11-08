/**
 * @class Controllers.apple.main.paymentInfoView
 * Main view to load payment info in the summary window
 * @uses Helpers.uiHelpers
 * @uses Helpers.stringFormatter
 */
var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');

/**
 * @property {Models.quote} quote
 * @private
 * holds the received quote model
 */
var quote = args.quote;

/**
 * @property {Models.paymentOption} paymentOption
 * @private
 * holds the paymentOption of the quote
 */
var paymentOption = quote.getSelectedPaymentOption();

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	$.refreshUI();
};

/**
 * @method refreshUI
 * @private
 * Refresh information for the payment
 * @return {void}
 */
$.refreshUI = function () {
	var totalPaymentAmount = paymentOption.get('payment');

	$.sectionHeader.setTitle(L(args.titleid));

	switch (paymentOption.get('paymentFrequency')) {
	case L('monthly_acronym'):
		$.paymentFrequencyValue.text = L('monthly');
		break;
	case L('quarterly_acronym'):
		$.paymentFrequencyValue.text = L('quarterly');
		break;
	case L('semiannually_acronym'):
		$.paymentFrequencyValue.text = L('semiannually');
		break;
	case L('annualy_acronym'):
		$.paymentFrequencyValue.text = L('annually');
		break;
	default:
		$.paymentFrequencyValue.text = L('monthly');
		break;
	}

	$.termValue.text = paymentOption.get('term');
	$.paymentValue.text = stringFormatter.formatDecimal(totalPaymentAmount, '$ 0.00', '\'$\' #,##0.00');
	$.rateFactorValue.text = stringFormatter.formatDecimal(paymentOption.get('rateFactor'), '0.00', '#.000000');
};

/**
 * @method handleSectionHeaderClick
 * @private
 * Handles the section header click event
 * @return {void}
 */
function handleSectionHeaderClick() {
	uiHelpers.expandCollapse({
		container: $.paymentInfoView,
		button: $.sectionHeader.expandColapseButton
	});
}

$.sectionHeader.addEventListener('click', handleSectionHeaderClick);

init();
