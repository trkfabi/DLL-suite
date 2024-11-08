/**
 * @class Helpers.emailHelper
 * Utility function to validate email addresses
 * ##version 1.0.0
 * @singleton
 */
var emailValidation = (function () {

	/**
	 * @method validate
	 * Validates an email address and calls onError callback if it is not valid
	 * @param {Object} _args
	 * @param {String} _args.email The email to be validated
	 * @param {Function} _args.onError The function to be called when the email is not valid
	 * @return {void}
	 */
	var validate = function (_args) {
		var emailText = _args.email.trim();

		if (emailText.length > 0) {
			var emailRegEx = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,63})$/;

			if (!emailRegEx.test(emailText)) {
				_args.onError && _args.onError();
			}
		}
	};

	return {
		validate: validate
	};

})();

module.exports = emailValidation;
