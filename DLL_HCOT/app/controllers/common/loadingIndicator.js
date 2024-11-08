/**
 * @class Controllers.common.loadingIndicator
 * Loading indicator
 * @uses appNavigation
 */
var args = arguments[0] || {};

/**
 * @method init
 * @private
 * Show the activity indicator
 * @return {void}
 */
function init() {
	if (args.message) {
		$.messageLabel.text = args.message;
	} else {
		$.box.remove($.messageLabel);
		$.box.remove($.separator);
	}

	if (!args.cancelCallback) {
		$.box.remove($.separator);
		$.box.remove($.cancelButton);
	}

};

$.show = function () {
	$.backgroundMask.show();
	_.defer(function () {
		$.activityIndicator && $.activityIndicator.show();
	});
};

$.hide = function () {
	$.backgroundMask.hide();
	_.defer(function () {
		$.activityIndicator && $.activityIndicator.hide();
	});
};

$.removeActivityIndicator = function () {
	$.box.remove($.activityIndicator);
	$.defaultMesssage.top = 24;
};

/**
 * @method handleCancelClick
 * @private
 * Handle the click event of the cancelButton control
 * @param {Object} Click event
 * @return {void}
 */
function handleCancelClick(_evt) {
	args.cancelCallback && args.cancelCallback();
	$.hide();
};

init();

$.cancelButton.addEventListener('click', handleCancelClick);
