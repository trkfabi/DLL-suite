/**
 * @class Controllers.apple.settings.settingsRepView
 * Updates the sales rep info in the model, used into settings window
 * @uses appNavigation
 * @uses Helpers.uiHelpers
 * @uses Helpers.stringFormatter
 * @uses Libs.sessionManager
 */
var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var analytics = require('/utils/analytics');
var uiHelpers = require('/helpers/uiHelpers');
var appNavigation = require('/appNavigation');
var stringFormatter = require('/helpers/stringFormatter');
var sessionManager = require('/utils/sessionManager');

// var userModel = Alloy.Globals.userModel;

/**
 * @property {Models.salesRep} salesRep 
 * @private
 * holds the user's data from the active session
 */
var salesRep = sessionManager.getSalesRep();

/**
 * @property {Object} textFields handles blur method and sets tags of Ti.UI.TextFields
 * @private
 */
var textFields = {};

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	analytics.captureEvent('[Apple/salesRepView] - init()');

	uiHelpers.addDoneButton($.phoneField, $.blurFields);

	$.nameField.value = salesRep.get('name');
	$.title.value = salesRep.get('title');
	$.emailField.value = salesRep.get('email');
	$.phoneField.value = salesRep.get('phone');

	_.each($, function (_object) {
		if (_.isObject(_object) && _object.apiName === 'Ti.UI.TextField' && _object.tag) {
			textFields[_object.tag] = _object;
		}
	});
};

/**
 * @method handleDone
 * Function called by the settings window after the user selects `Done` in the UI
 * @return {void}
 */
$.handleDone = function () {

};

/**
 * @method blurFields
 * Do blur to the TextField controls to hide the softkeyboard
 * @return {void}
 */
$.blurFields = function () {
	doLog && console.log('[customerWindow] - blurFields');
	_.each(textFields, function (_textField) {
		_textField.blur();
	});
};

/**
 * @method handleUIChange
 * @private
 * Handle the UI change event of TextField controls
 * @param {Object} _evt Change event
 * @return {void}
 */
function handleUIChange(_evt) {
	var optionsToSave = {};

	var key = _evt.source.tag;
	var value = _evt.source.value;

	if (salesRep && salesRep.get(key) != value) {
		optionsToSave[key] = value;
		salesRep.set(optionsToSave).save();
	}
};

/**
 * @method handleEmailBlur
 * @private
 * Handle the blur event of the emailTextField control
 * @param {Object} _evt Blur event
 * @return {void}
 */
/*
function handleEmailBlur (_evt) {
	emailHelper.validate({
 		email: $.emailField.value.trim(),
 		onError: function(){
			(salesRep) && (sessionManager.setSalesRep({"email" : '' }));
			var params = {
			    message : L('invalid_email'),
			    ok: L('ok'),
			    onClick : function () {
			        $.emailField.focus();    
			    }
			};

			appNavigation.showAlert(params);			
  		}
 	});
 };	

*/
/**
 * @method handleApplyPhoneFormatChange
 * @private
 * Handle the change event of the phoneTextField control
 * @param {Object} _evt Change event
 * @return {void}
 */
function handleApplyPhoneFormatChange(_evt) {
	stringFormatter.phoneNumberFormat(_evt.source);
};

// function handleUserInfoClick(_evt) {
// 	$.userInfoButton.isEditing = !$.userInfoButton.isEditing;

// 	$.nameField.editable = $.userInfoButton.isEditing;
// 	$.emailField.editable = $.userInfoButton.isEditing;
// 	$.phoneField.editable = $.userInfoButton.isEditing;

// 	if ($.userInfoButton.isEditing) {
// 		$.userInfoButton.title = 'SAVE INFO';
// 		$.userInfoButton.backgroundColor = Alloy.Globals.colors.mantis;
// 		$.userInfoView.backgroundImage = '/images/img_settings.png';
// 	} else {
// 		$.userInfoButton.title = 'EDIT INFO';
// 		$.userInfoButton.backgroundColor = Alloy.Globals.colors.azureRadiance;
// 		$.userInfoView.backgroundImage = null;

// 		userModel.info.name = $.nameField.value;
// 		userModel.info.email = $.emailField.value;
// 		userModel.info.phone = $.phoneField.value;
// 	}
// };
$.phoneField.addEventListener('change', handleApplyPhoneFormatChange);
//$.emailField.addEventListener('blur', handleEmailBlur);

$.nameField.addEventListener('change', handleUIChange);
$.title.addEventListener('change', handleUIChange);
$.emailField.addEventListener('change', handleUIChange);
$.phoneField.addEventListener('change', handleUIChange);
// $.userInfoButton.addEventListener('click', handleUserInfoClick);

init();
