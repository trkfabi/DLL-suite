/**
 * @class Controllers.paymentOption.pointsRow
 * Points Row
 * @uses Helpers.uiHelpers
 * @uses rateCards
 */

var args = arguments[0] || {};
var modelProperty = args.property;
var paymentOption = args.paymentOption;
var calculationUpdateCallback = args.calculationUpdateCallback;
var titleid = args.titleid;
var uiHelpers = require('/helpers/uiHelpers');
var rateCards = require('/rateCards');

/**
 * @method init
 * @private
 * Initialize values for current controller
 * @return {void}
 */
function init() {
	$.titleLabel.text = L(titleid);
	paymentOption.on('change:' + modelProperty, $.refreshUI);
	paymentOption.on('change:useRateCard', $.refreshUI);
	$.refreshUI();
};

/**
 * @method refreshUI
 * Refreshes the rate type var of the controller based on paymentOptions.points
 * @return {void}
 */
$.refreshUI = function () {
	$.pointValue.title = '' + paymentOption.get(modelProperty);
	uiHelpers.setElementEnabled($.wrapper, !!paymentOption.get('useRateCard'));
};

/**
 * @method disableUI
 * Sets enable = false for the view of the current controller
 * @return {void}
 */
$.disableUI = function () {
	uiHelpers.setElementEnabled($.wrapper, false);
};

/**
 * @method enableUI
 * Sets enable = true for the view of the current controller
 * @return {void}
 */
$.enableUI = function () {
	uiHelpers.setElementEnabled($.wrapper, true);
};

/**
 * @method cleanUp
 * Remove the monitoring changes of the model
 * @return {void}
 */
$.cleanUp = function () {
	doLog && console.log('[pointsRow] - cleanUp');

	paymentOption.off('change:' + modelProperty, $.refreshUI);
	paymentOption.off('change:useRateCard', $.refreshUI);
};

/**
 * @method updatePointsAnalytics
 * @private
 * Adds a counter to the property counter
 * @param {Number} _newPoints New points counter
 * @return {void}
 */
function updatePointsAnalytics(_newPoints) {
	doLog && console.log('[pointsRow] - updatePointsAnalytics');
	paymentOption.addAnalyticsCounter('points', _newPoints);
}

/**
 * @method handleIntersetWaiverClick
 * Handle the click event for Points container
 * @param {Object} _evt Click event object
 * @return {void}
 */
function handleIntersetWaiverClick(_evt) {
	var buttonId = _evt.source.id;
	var newPoints = null;
	var params = {};

	switch (buttonId) {
	case 'pointMinOption':
	case 'pointMin':
		newPoints = rateCards.getLowestPoints(paymentOption);
		break;
	case 'pointLessOption':
	case 'pointLess':
		newPoints = rateCards.getLowerPoints(paymentOption);
		break;
	case 'pointMoreOption':
	case 'pointMore':
		newPoints = rateCards.getHigherPoints(paymentOption);
		break;
	case 'pointMaxOption':
	case 'pointMax':
		newPoints = rateCards.getHighestPoints(paymentOption);
		break;
	}

	if (newPoints !== null) {
		doLog && console.log('[pointsRow] - newPoints - ' + newPoints);

		params[modelProperty] = newPoints;
		updatePointsAnalytics(newPoints);
		calculationUpdateCallback(params);
	}

};

$.intersetWaiverContainer.addEventListener('click', handleIntersetWaiverClick);

init();
