/**
 * @class Helpers.alertHelper
 * Utility function to display alertDialogs with parametrized data
 * ##version 1.0.0
 * @singleton
 */

var alertDialog = (function () {

	/**
	 * @property {Ti.UI.AlertDialog} alertDialogElement holds alert dialog element that is displayed on click event 
	 */
	var alertDialogElement;

	/**
	 * @property {Ti.UI.TextField} textField holds TextField element that is added to the view
	 */
	var textField;

	/**
	 * @property {Boolean} hasTextInput
	 */
	var hasTextInput;

	/**
	 * @property {Function} onClickListener
	 */
	var onClickListener;

	/**
	 * @method init
	 * @private
	 * Initialize values for the current View
	 * @return {void}
	 */
	var showAlert = function (_args) {

		var alertParams = {
			title: _args.title || 'Alert',
			buttonNames: _args.buttonNames || [L('ok')],
			cancel: _args.cancel || 0,
			ok: _args.ok || 0,
			persistent: _args.persistent || false,
			canceledOnTouchOutside: false
		};

		if (_args.hasTextInput) {
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
			alertParams.message = _args.message || '';
		}

		alertDialogElement = Ti.UI.createAlertDialog(alertParams);
		_args.onClick && alertDialogElement.addEventListener('click', handleAlertClick);

		if (_args.onClick) {
			onClickListener = _args.onClick;
		}

		if (_args.hasTextInput) {
			hasTextInput = _args.hasTextInput;
		}

		alertDialogElement.show();
	};

	/**
	 * @method handleAlertClick
	 * @private
	 * Handles the event click for alert dialog displayed
	 * @param {Object} _evt Blur event
	 * @return {void}
	 */
	function handleAlertClick(_evt) {
		if (hasTextInput) {
			_evt.text = (OS_IOS ? _evt.text : textField.value);
		}
		onClickListener(_evt);
	};

	return {
		showAlertDialog: showAlert
	};

})();

module.exports = alertDialog;
