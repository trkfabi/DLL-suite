/**
 * # Alert Dialog
 * @class Controllers.common.alert
 */
var args = arguments[0] || {};
var alertDialog;
var textField;

/**
 * @method init
 * @private
 * Initialize values for the current View
 * @return {void}
 */
function init() {
	var alertParams = {
		title: args.title || 'Express Finance',
		buttonNames: args.buttonNames || [L('ok')],
		cancel: args.cancel || 0,
		ok: args.ok || 0,
		persistent: args.persistent || false
	};

	if (args.hasTextInput) {
		if (OS_IOS) {
			alertParams.style = Ti.UI.iOS.AlertDialogStyle.PLAIN_TEXT_INPUT;
		} else {
			// TODO: define style in TSS
			var _androidView = Ti.UI.createView({
				left: 20,
				right: 20,
				height: 50
			});
			textField = Ti.UI.createTextField({
				width: Ti.UI.FILL,
				height: Ti.UI.FILL,
				color: Alloy.Globals.colors.white
			});
			_androidView.add(textField);

			alertParams.androidView = _androidView;
		}
	} else {
		alertParams.message = args.message || '';
	}

	alertDialog = Ti.UI.createAlertDialog(alertParams);
	args.onClick && alertDialog.addEventListener('click', handleAlertClick);

};

/**
 * @method show
 * Shows the alert dialog
 * @return {void}
 */
$.show = function () {
	alertDialog.show();
};

/**
 * @method handleAlertClick
 * @private
 * Handles the event click for alert dialog displayed
 * @param {Object} _evt Blur event
 * @return {void}
 */
function handleAlertClick(_evt) {
	if (args.hasTextInput) {
		_evt.text = (OS_IOS ? _evt.text : textField.value);
	}
	args.onClick(_evt);
};

init();
