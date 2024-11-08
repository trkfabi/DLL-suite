/**
 * @class Controllers.settings.settingsWindow
 * Settings screen of the app
 * @uses appNavigation
 * @uses Libs.analytics
 * @uses Libs.sessionManager
 * @uses application
 */

var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var analytics = require('/utils/analytics');
var appNavigation = require('/appNavigation');
var sessionManager = require('/utils/sessionManager');
var configsManager = require('/utils/configsManager');
var application = require('/application');

var sectionControllers = [];

/**
 * @method init
 * @private
 * Initialize values for the settings window
 * return {void}
 */
function init() {
	analytics.captureEvent('[settingsWindow] - init()');

	var sections = configsManager.getConfig('settings.sections') || [];

	$.versionLabel.text = L('version') + ' ' + Ti.App.version;

	if (doLog) {
		$.exportRateCards.addEventListener('click', handleExportRateCards);
		$.crash.addEventListener('click', handleCrash);
	} else {
		$.headerContainer.remove($.exportRateCards);
		$.headerContainer.remove($.crash);
	}

	_.each(sections, function (_section) {
		var sectionController = Alloy.createController(_section.controller, args);

		$.wrapperView.add(sectionController.getView());
		sectionControllers.push(sectionController);
	});
};

/**
 * @method handleLogOutClick
 * @private
 * Handle the click event of the log out button 
 * @param {Object} _evt Click Event of the logOutButton
 * @return {void}
 */
function handleLogOutClick(_evt) {
	application.logout();
	_.defer(appNavigation.closeSettingsWindow);

	_.each(sectionControllers, function (_sectionController) {
		_sectionController.handleLogout && _sectionController.handleLogout();
	});
};

/**
 * @method handleDoneClick
 * @private
 * Handle the click event of the done button
 * @param {Object} _evt Click event of the doneButton
 * @return {void}
 */
function handleDoneClick(_evt) {
	_.defer(appNavigation.closeSettingsWindow);
	_.each(sectionControllers, function (_sectionController) {
		_sectionController.handleDone && _sectionController.handleDone();
	});

};

/**
 * @method animateOpen
 * @private
 * Handle the animation to open the window
 * @return {void}
 */
function animateOpen() {
	var _animation = Ti.UI.createAnimation({
		top: $.containerView.visibleTop,
		duration: 500
	});
	$.containerView.animate(_animation);
}

/**
 * @method closeWindow
 * Handle the animation to close the window
 * @return {void}
 */
$.closeWindow = function () {
	if (OS_IOS) {
		var _animation = Ti.UI.createAnimation({
			top: $.containerView.hiddenTop,
			duration: 500
		});
		$.containerView.animate(_animation, function () {
			$.window.close();
		});
	} else {
		$.window.close();
	}
};

function handleExportRateCards(_evt) {
	var rateCards = configsManager.getLib('rateCards');
	var salesRep = sessionManager.getSalesRep();
	var rates = rateCards.getAllRateCards();
	var product = Alloy.createCollection('product');
	var category = Alloy.createCollection('category');
	var username = salesRep.get('username') || '';
	var rateCardsFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'rateCards_' + username + '.csv');
	var categoriesFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'categories_' + username + '.csv');
	var productsFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'products_' + username + '.csv');

	product.fetch();
	category.fetch();

	rateCardsFile.write(rates.asCsv());
	categoriesFile.write(category.asCsv());
	productsFile.write(product.asCsv());

	appNavigation.openEmailDialog({
		subject: 'Rate Card Files for ' + username,
		toRecipients: [salesRep.get('email') || ''],
		messageBody: L('thank_you') + '.',
		attachments: [{
			fileName: rateCardsFile.name
		}, {
			fileName: categoriesFile.name
		}, {
			fileName: productsFile.name
		}]
	});
};

/**
 * @method handleCrash
 * @private
 * Throws an error for test
 * @return {void}
 */
function handleCrash(_param) {
	throw Error('C R A S H');
}

// Event Handlers
$.logOutButton.addEventListener('click', handleLogOutClick);
$.doneButton.addEventListener('click', handleDoneClick);
OS_IOS && $.window.addEventListener('postlayout', animateOpen);
OS_ANDROID && $.window.addEventListener('androidback', appNavigation.closeSettingsWindow);

init();
