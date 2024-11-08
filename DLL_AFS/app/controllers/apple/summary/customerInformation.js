/**
 * @class Controllers.apple.main.customerInformation
 * Main view to load customerInformation info in the summary window
 * @uses Helpers.uiHelpers
 * @uses Helpers.stringFormatter
 */
var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var uiHelpers = require('/helpers/uiHelpers');
var stringFormatter = require('/helpers/stringFormatter');
var analytics = require('/utils/analytics');

/**
 * @property {Models.quote} quote
 * @private
 * holds the received quote model
 */
var quote = args.quote;

/**
 * @property {Models.customer} customer
 * @private
 * holds the customer of the quote
 */
var customer = quote.get('customer');

/**
 * @method init
 * @private
 * Initializes the Customer Information Controller
 * @return {void}
 */
function init() {
	analytics.captureTiAnalytics('AFS-Summary-CustomerPreviewOpened');

	$.refreshUI();
};

/**
 * @method refreshUI
 * @private
 * Refresh information for the customer
 * @return {void}
 */
$.refreshUI = function () {
	var customerInformation = {};
	var hasLabel = false;
	var hasTop = false;

	$.sectionHeader.setTitle(L(args.titleid));

	customerInformation.name = customer.get('name') || '';
	customerInformation.address = customer.get('physicalAddress') || '';
	customerInformation.address2 = stringFormatter.formatList([customer.get('physicalCity'), stringFormatter.formatList([
		customer.get('physicalState'), customer.get('physicalZip')
	], ' ')]);
	customerInformation.phone = customer.get('phone') || '';
	customerInformation.email = customer.get('email') || '';

	_.each(customerInformation, function (_value, _key) {
		if (_value.trim()) {
			var styleClasses;
			hasLabel = true;

			if (_key === 'name') {
				styleClasses = ['summaryLabel', 'summaryLabelBold'];
			} else {
				styleClasses = ['summaryLabel'];
			}

			var informationLabel = $.UI.create('Label', {
				classes: styleClasses,
				text: _value
			});

			//Adds top margin
			if (!hasTop) {
				var spacer = createSpacer();
				hasTop = true;
				$.container.add(spacerView);
			}

			$.container.add(informationLabel);
		}
	});

	// Adds a bottom margin
	if (hasLabel) {
		var spacerView = createSpacer();
		$.container.add(spacerView);
	}

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

/**
 * @method createSpacer
 * @private
 * Creates and return a view with certain height that works as margin spacer
 * @return {Ti.UI.View}
 */
function createSpacer() {
	return $.UI.create('View', {
		classes: ['spacer']
	});
};

$.sectionHeader.addEventListener('click', handleSectionHeaderClick);

init();
