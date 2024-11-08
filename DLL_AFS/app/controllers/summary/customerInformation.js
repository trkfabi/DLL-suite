/**
 * @class Controllers.summary.customerInformation
 * Displays the customer information
 */

var args = arguments[0] || {};
var quote = args.quote;
var doLog = Alloy.Globals.doLog || false;
var customer = quote.get('customer');
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');
var analytics = require('/utils/analytics');

/**
 * @method init
 * @private
 * Initializes the Customer Information Controller
 * @return {void}
 */
function init() {
	analytics.captureTiAnalytics('Summary.Open');

	$.sectionHeader.setTitle(L(args.titleid));
	$.clientNameLabel.text = customer.get('name') || '';
	$.addressLabel.text = stringFormatter.formatList([customer.get('physicalAddress'), customer.get('physicalState'),
		customer.get('physicalZip')
	]);
	$.phoneLabel.text = customer.get('phone') || '';
	$.emailLabel.text = customer.get('email') || '';
};

/**
 * @method handleSectionHeaderClick
 * @private
 * Handles the section header click event
 * @return {void}
 */
function handleSectionHeaderClick() {
	uiHelpers.expandCollapse({
		container: $.customerInformation,
		button: $.sectionHeader.expandColapseButton
	});
};

$.sectionHeader.addEventListener('click', handleSectionHeaderClick);

init();
