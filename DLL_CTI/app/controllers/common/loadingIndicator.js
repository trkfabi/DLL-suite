/**
 * @class Controllers.common.loadingIndicator
 * Loading indicator
 */
var args = arguments[0] || {};
var appNavigation = require('/appNavigation');
var container;

/**
 * @method init
 * @private
 * Show the activity indicator
 * @return {void}
 */
function init() {
	if (args.autoShow) {
		$.activityIndicator.show();
	}

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

/**
 * @method open
 * Adding background to the container
 * @return {void}
 */
$.open = function () {
	if (args.container) {
		container = args.container;
		container.add($.backgroundMask);
	} else {
		container = $.UI.create('Window', {
			'id': 'window'
		});
		container.add($.backgroundMask);
		container.open();
	}
};

/**
 * @method close
 * Removing background to the container
 * @return {void}
 */
$.close = function () {
	if (args.container) {
		container.remove($.backgroundMask);
	} else {
		container.close();
	}
};

/**
 * @method show
 * Show the activity indicator from the view
 * @return {void}
 */
$.show = function () {
	$.backgroundMask.show();
	_.defer(function () {
		$.activityIndicator && $.activityIndicator.show();
	});
};

/**
 * @method hide
 * Hide the activity indicator from the view
 * @return {void}
 */
$.hide = function () {
	$.backgroundMask.hide();
	_.defer(function () {
		$.activityIndicator && $.activityIndicator.hide();
	});
};

/**
 * @method removeActivityIndicator
 * Remove the activity indicator
 * @return {void}
 */
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
	if (args.autoShow) {
		appNavigation.hideLoadingIndicator();
	} else {
		$.hide();
	}
};

init();

$.cancelButton.addEventListener('click', handleCancelClick);
