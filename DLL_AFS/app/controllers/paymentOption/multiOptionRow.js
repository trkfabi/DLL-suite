/**
 * @class Controllers.paymentOption.multiOptionRow
 * Multi option Row
 * @uses Helpers.uiHelpers
 */
var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog || false;
var uiHelpers = require('/helpers/uiHelpers');

/**
 * @property {String} modelProperty The property changed inside the model
 * @private
 */
var modelProperty = args.property;

/**
 * @property {Object} paymentOption The model used in the controller
 * @private
 */
var paymentOption = args.paymentOption;

/**
 * @property {Function} calculationUpdateCallback Function called to update the calculation
 * @private
 */
var calculationUpdateCallback = args.calculationUpdateCallback;

/**
 * @property {Object} options The options used by the model in the controller
 * @private
 */
var options = args.options;

/**
 * @property {String} titleid the text to show on the top of the row
 * @private
 */
var titleid = args.titleid;

/**
 * @property {String} id Allows to know the instance that is created
 * @private
 */
var id = args.id;

/**
 * @property {Object} definitions Used to set the label values of the controller
 * @private
 */
var definitions = args.definitions;

/**
 * @property {Ti.UI.View} multiOptionBar The controller instance used in the row
 * @private
 */
var multiOptionBar;

/**
 * @property {Array} oldOptions Stores the old values for the options used by the model in the controller.
 * @private
 */
var oldOptions = [];

/**
 * @property {Function} setHeaderClickeable Allows to set if the header should be clickeable
 */
var setHeaderClickeable = args.setHeaderClickeable;

/**
 * @method init
 * @private
 * Initialize values for current controller
 * @return {void}
 */
function init() {
	$.titleLabel.text = L(titleid);

	var optionLabels = [];
	var tabbedBarOptions = {
		bottom: 5,
		index: 0,
		style: Alloy.Globals.tabbedBar.STYLE_TABBED_BAR,
		tintColor: Alloy.Globals.colors.abbey,
		backgroundColor: Alloy.Globals.colors.gallery,
		selectColor: Alloy.Globals.colors.white
	};

	if (definitions) {
		_.each(definitions, function (_definitionValue) {
			optionLabels.push(_definitionValue);
		});

		options = _.keys(definitions);
	}

	switch (id) {
	case 'purchaseOptions':
		tabbedBarOptions.buttonWidth = 85;
		tabbedBarOptions.labels = optionLabels;
		tabbedBarOptions.disableColor = Alloy.Globals.colors.nobel;
		break;
	case 'termOptions':
		$.multiOptionRow.height = 95;
		tabbedBarOptions.backgroundColor = Alloy.Globals.colors.mercury;
		tabbedBarOptions.borderColor = Alloy.Globals.colors.mountbattenPink;
		tabbedBarOptions.buttonWidth = 50;
		tabbedBarOptions.setHeaderClickeable = setHeaderClickeable;
		break;
	case 'paymentFrequency':
		tabbedBarOptions.buttonWidth = 60;
		tabbedBarOptions.labels = optionLabels;
		tabbedBarOptions.disableColor = Alloy.Globals.colors.nobel;
		break;
	}

	multiOptionBar = Alloy.createController('common/scrollableTabbedBar', tabbedBarOptions);

	multiOptionBar.addEventListener('click', handleMultiOptionBarClick);

	$.wrapper.add(multiOptionBar.getView());

	_.defer($.refreshUI);

	paymentOption.on('change:' + modelProperty, $.refreshUI);
};

/**
 * @method refreshUI
 * Refreshes the index of multi option bar
 * @return {void}
 */
$.refreshUI = function () {
	multiOptionBar.setIndex(translateOptionToIndex());
};

/**
 * @method setOptions
 * Sets the options for the controller
 * @param {Array} _options
 * @return {void}
 */
$.setOptions = function (_options) {
	var labels = [];
	options = _options || [];

	if (_.isEqual(options, oldOptions)) {
		multiOptionBar.updateScrollPosition();
	} else {
		multiOptionBar.setLabels(options, translateOptionToIndex());
		oldOptions = options;

		_.defer($.refreshUI);
	}

};

/**
 * @method disableUI
 * Sets enable = false for the view of the current controller
 * @return {void}
 */
$.disableUI = function () {
	uiHelpers.setElementEnabled($.wrapper, false);

	multiOptionBar.disableUI && multiOptionBar.disableUI();
};

/**
 * @method cleanUp
 * Remove the monitoring changes of the model
 * @return {void}
 */
$.cleanUp = function () {
	doLog && console.log('[multiOptionRow] - cleanUp - ' + modelProperty);

	paymentOption.off('change:' + modelProperty, $.refreshUI);
};

/**
 * @method translateOptionToIndex
 * @private
 * Gets the index of the selected option given by paymentOption[modelProperty]
 * @return {void}
 */
function translateOptionToIndex() {
	return _.indexOf(options, paymentOption.get(modelProperty));
};

/**
 * @method handleMultiOptionBarClick
 * @private
 * Handles the click event of multi option bar
 * @param {Object} _evt
 * @return {void}
 */
function handleMultiOptionBarClick(_evt) {
	// Avoid refreshing again the UI
	// paymentOption.off('change:' + modelProperty, $.refreshUI);
	var params = {};
	if (translateOptionToIndex() != _evt.index) {
		params[modelProperty] = options[_evt.index];
		calculationUpdateCallback(params);
	}
	// Continue monitoring changes on property
	// paymentOption.on('change:' + modelProperty, $.refreshUI);
};

init();
