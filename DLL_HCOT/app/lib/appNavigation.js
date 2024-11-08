var LOG_TAG = '[appNavigation] ';

/**
 * # Animator Module
 * Singleton mediator for handling app navigation.
 * @class Lib.AppNavigation
 * @singleton
 */
var appNavigation = (function () {
	// +-------------------
	// | Private members.
	// +-------------------
	var controllers = {
		// Windows.
		splashWindow: null,
		loginWindow: null,
		mainWindow: null,
		customerWindow: null,
		amortizationWindow: null,
		searchCustomerWindow: null,
		summaryWindow: null,
		loginPoliciesWindow: null,
		summaryPolciesWindow: null,
		signatureController: null,
		ssnController: null,
		dobController: null,
		driverLicenseController: null,
		termsController: null,
		submitProgress: null,
		undoSolveForWindow: null,
		generateWindow: null,
		settingsController: null,
		tradeUpSearchWindow: null,

		authorizationWindows: [],

		// Apple
		equipmentWindow: null,
		webViewWindow: null
	};
	// Drawer for main window (it is only needed on iOS right now)
	var drawer;
	var quoteContainer;

	// For the flip screen currently loaded
	var currentViewName;
	var isMainWindowLocked = false;
	var alertHelper = require('/helpers/alertHelper');
	var shareHelper = require('/helpers/shareHelper');
	// Navigation Window for Authorizations
	var navWindow;

	/**
	 * @method flipMainView
	 * @private
	 * Tries to flip to another view inside the Main Window
	 * @param {Object} _params Details for the flip main view
	 * @param {Ti.UI.View} _params.view View to replace with
	 * @param {String} _params.name Name of the view for identify it
	 * @param {Boolean} _params.isReload True if it should force the view to load, even if it is the view currently loaded
	 * @return {void}
	 */
	function flipMainView(_params) {
		_params = _params || {};
		if (controllers.mainWindow && _params.view) {
			if (_params.name !== currentViewName || _params.isReload) {
				currentViewName = _params.name;
				controllers.mainWindow.flipCenterView(_params);

			}
		}
	};

	/**
	 * @method openWindowInMainNav
	 * @private
	 * Opens a window inside the current main navigation
	 * @param {Ti.UI.Window} _window to be opened 
	 * @return {void}
	 */
	function openWindowInMainNav(_window) {
		if (OS_IOS) {
			drawer && drawer.centerWindow.openWindow(_window);
		} else {
			_window.open();
		}
	};

	/**
	 * @method closeWindowInMainNav
	 * @private
	 * Closes a window from the current main navigation
	 * @param {Ti.UI.Window} _window to be closed
	 * @return {void}
	 */
	function closeWindowInMainNav(_window, _options) {
		if (OS_IOS) {
			drawer && drawer.centerWindow.closeWindow(_window, _options);
		} else {
			_window.close();
		}
	};

	/**
	 * @method openSplashWindow
	 * Open the splash window
	 * @param {Object} _params Details for the splash window controller 
	 * @return {void}
	 */
	function openSplashWindow(_params) {
		_params = _params || {};
		if (!controllers.splashWindow) {
			controllers.splashWindow = Alloy.createController('splash/splashWindow', _params);
			controllers.splashWindow && controllers.splashWindow.window && controllers.splashWindow.window.open();
		}
	};

	/**
	 * @method closeSplashWindow
	 * Close the splash window
	 * @param {Object} _params Details for the close splash window
	 * @return {void}
	 */
	function closeSplashWindow(_params) {
		if (controllers.splashWindow) {
			controllers.splashWindow.window && controllers.splashWindow.window.close();
			controllers.splashWindow.cleanUp && controllers.splashWindow.cleanUp();
		}
		controllers.splashWindow = null;
	};

	/**
	 * @method openLoginWindow
	 * Function to open the log in window, also opens Policy Window there's a change on the Policy Version.
	 * @param {Object} _params Details for the login window controller
	 * @return {void}
	 */
	function openLoginWindow(_params) {
		_params = _params || {};
		if (!controllers.loginWindow) {
			controllers.loginWindow = Alloy.createController('login/loginWindow', _params);
			controllers.loginWindow && controllers.loginWindow.window && controllers.loginWindow.window.open();
		}
	};

	/**
	 * @method closeLoginWindow
	 * Closes the Login Window
	 * @param {Object} _params Details for the close login window
	 * @return {void}
	 */
	function closeLoginWindow(_params) {
		if (controllers.loginWindow) {
			controllers.loginWindow.window && controllers.loginWindow.window.close();
			controllers.loginWindow.cleanUp && controllers.loginWindow.cleanUp();
		}
		controllers.loginWindow = null;
	};

	/**
	 * @method openMainWindow
	 * Opens the Windows being controlled by the NavDrawer, if they're not already open.
	 * @param {Object} _params Details for the main window controller
	 * @return {void}
	 */
	function openMainWindow(_params) {
		_params = _params || {};
		if (!controllers.mainWindow) {
			_params.paymentLoadedCallback = function () {
				_.defer(openSubmitProgress);
			};

			controllers.mainWindow = Alloy.createController('main/mainWindow', _params);
			drawer = controllers.mainWindow.drawer;
			drawer && drawer.open();
			quoteContainer = controllers.mainWindow.getQuoteContainer();

		}
	};

	/**
	 * @method closeMainWindow
	 * Close main window
	 * @param {Object} _params Details for the close main window
	 * @return {void}
	 */
	function closeMainWindow(_params) {
		if (controllers.mainWindow) {
			drawer && drawer.close();
			_.defer(function () {
				controllers.mainWindow.cleanUp && controllers.mainWindow.cleanUp();
				controllers.mainWindow = null;
			});
			_.defer(function () {
				controllers.customerWindow && controllers.customerWindow.cleanUp();
				controllers.customerWindow = null;
			});
		}
		quoteContainer = null;
		drawer = null;
	};

	/**
	 * @method openCustomerWindow
	 * Open customer window
	 * @param {Object} _params Details for the customer window controller
	 * @param {Boolean} _params.forceClose Indicates if the customer window should be closed wether it's visible or not 
	 * @return {void}
	 */
	function openCustomerWindow(_params) {
		_params = _params || {};

		if (!controllers.customerWindow) {
			controllers.customerWindow = Alloy.createController('customer/customerWindow', _params);
		} else {
			controllers.customerWindow.initKeyboardToolbar();
		}
		_params.name = 'customerWindow';
		_params.view = controllers.customerWindow.getView();
		controllers.customerWindow.refreshUI();
		flipMainView(_params);
	};

	/**
	 * @method closeCustomerWindow
	 * Close customer window
	 * @param {Object} _params Details for the close customer window
	 * @return {void}
	 */
	function closeCustomerWindow(_params) {
		_params = _params || {};
		_params.name = 'quoteContainer';
		_params.view = quoteContainer;

		if (currentViewName === 'customerWindow') {
			flipMainView(_params);
		}

	};

	/**
	 * @method handleFlipButton
	 * Handles the flip button on the main Window
	 * @param {Object} _params Details for the handle flip customer section 
	 * @return {void}
	 */
	function handleFlipButton(_params) {
		if (isMainWindowLocked) {
			return false;
		}

		_params = _params || {};
		isMainWindowLocked = true;

		_params.flipCompleteCallback = function () {
			isMainWindowLocked = false;
			_params.flipAdditionalCallback && _params.flipAdditionalCallback(_params);

		};

		if (currentViewName === 'customerWindow') {
			closeCustomerWindow(_params);
		} else {
			openCustomerWindow(_params);
		}
	};

	/**
	 * @method openSearchCustomerWindow
	 * Function that opens the Customer Search Window
	 * @param {Object} Details for customerSearch controller
	 * @return {void}
	 */
	function openSearchCustomerWindow(_params) {
		_params = _params || {};
		if (!controllers.searchCustomerWindow) {
			controllers.searchCustomerWindow = Alloy.createController('customer/customerSearch', _params);
			controllers.searchCustomerWindow && openWindowInMainNav(controllers.searchCustomerWindow.window);
		}
	};

	/**
	 * @method closeSearchCustomerWindow
	 * Close search customer window
	 * @param {Object} Details for the close search customer window
	 * @return {void}
	 */
	function closeSearchCustomerWindow(_params) {
		if (controllers.searchCustomerWindow) {
			controllers.searchCustomerWindow && closeWindowInMainNav(controllers.searchCustomerWindow.window);
			controllers.searchCustomerWindow.cleanUp && controllers.searchCustomerWindow.cleanUp();
		}
		controllers.searchCustomerWindow = null;
	};

	/**
	 * @method openSolveForWindow
	 * Function that opens the Solve For Window.
	 * @param {Object} _params Details for the Solve For Window
	 * @return {void}
	 */
	function openSolveForWindow(_params) {
		_params = _params || {};
		if (!controllers.solveForWindow) {
			controllers.solveForWindow = Alloy.createController('solveFor/solveForWindow', _params);
			controllers.solveForWindow && controllers.solveForWindow.window && controllers.solveForWindow.window.open();
		}
	};

	/**
	 * @method closeSolveForWindow
	 * Closes the Solve For window.
	 * @param {Object} _params Details for the close solve for window
	 * @return {void}
	 */
	function closeSolveForWindow(_params) {
		if (controllers.solveForWindow) {
			controllers.solveForWindow.window && controllers.solveForWindow.closeWindow();
			controllers.solveForWindow.cleanUp && controllers.solveForWindow.cleanUp();
		}
		controllers.solveForWindow = null;
	};

	/**
	 * @method openSummaryWindow
	 * Open summary window
	 * @param {Object} _params Details for the summary window controller
	 * @return {void}
	 */
	function openSummaryWindow(_params) {
		_params = _params || {};
		if (!controllers.summaryWindow) {
			controllers.summaryWindow = Alloy.createController('summary/summaryWindow', _params);
			controllers.summaryWindow && openWindowInMainNav(controllers.summaryWindow.window);
		}
	};

	/**
	 * @method closeSummaryWindow
	 * Closes the summary window 
	 * @param {Object} _params Details for the close summary window
	 * @return {void}
	 */
	function closeSummaryWindow(_params) {
		if (controllers.summaryWindow) {
			controllers.summaryWindow && closeWindowInMainNav(controllers.summaryWindow.window);
			controllers.summaryWindow.cleanUp && controllers.summaryWindow.cleanUp();
		}
		controllers.summaryWindow = null;
	};

	/**
	 * @method openPrivacyStatementWindow
	 * Function that opens the Privacy Statement in a browser
	 * @return {void}
	 */
	function openPrivacyStatementWindow() {
		if (!Ti.Platform.canOpenURL(Alloy.Globals.privacyStatementUrl)) {
			showAlert('error_safari_missing');
			return;
		}
		Ti.Platform.openURL(
			Alloy.Globals.privacyStatementUrl, {},
			function (e) {
				doLog && console.log('[appNavigation] - openPrivacyStatementWindow() URL open result: ' + JSON.stringify(e));
				if (!e.success) {
					showAlert('error_safari_open');
				}
			}
		);
	};

	/**
	 * @method openLoginPoliciesWindow
	 * Function that opens the Login Policy Window
	 * @param {Object} _params Details for terms login controller
	 * @return {void}
	 */
	function openLoginPoliciesWindow(_params) {
		_params = _params || {};
		if (controllers.loginPoliciesWindow === null) {
			controllers.loginPoliciesWindow = Alloy.createController('terms/termsLogin', _params);
			controllers.loginPoliciesWindow && controllers.loginPoliciesWindow.window && controllers.loginPoliciesWindow.window
				.open({
					modal: true,
					forceModal: true
				});
		}
	};

	/**
	 * @method closeLoginPoliciesWindow
	 * Close the login policies window
	 * @param {Object} _params Details for close login policies window
	 * @return {void}
	 */
	function closeLoginPoliciesWindow(_params) {
		if (controllers.loginPoliciesWindow) {
			controllers.loginPoliciesWindow.window && controllers.loginPoliciesWindow.window.close();
			controllers.loginPoliciesWindow.cleanUp && controllers.loginPoliciesWindow.cleanUp();
		}
		controllers.loginPoliciesWindow = null;
	};

	/**
	 * @method openSummaryPoliciesWindow
	 * Open summary policies window
	 * @param {Object} _params Details for the terms pop up controller
	 * @return {void}
	 */
	function openSummaryPoliciesWindow(_params) {
		_params = _params || {};
		if (!controllers.summaryPolciesWindow) {
			controllers.summaryPolciesWindow = Alloy.createController('terms/termsPopup', _params);
			controllers.summaryPolciesWindow.open && controllers.summaryPolciesWindow.open();
		}
	};

	/**
	 * @method closeSummaryPoliciesWindow
	 * Close summary policies window
	 * @param {Object} _params Details for the close summary policies window
	 * @return {void}
	 */
	function closeSummaryPoliciesWindow(_params) {
		if (controllers.summaryPolciesWindow) {
			controllers.summaryPolciesWindow.close && controllers.summaryPolciesWindow.close();
			controllers.summaryPolciesWindow.cleanUp && controllers.summaryPolciesWindow.cleanUp();
		}
		controllers.summaryPolciesWindow = null;
	};

	/**
	 * @method openUndoSolveForWindow
	 * Function that opens the Goal Seeker ("solve for") Window.
	 * @param {Object} _params Details for undo solve for window controller
	 * @return {void}
	 */
	function openUndoSolveForWindow(_params) {
		_params = _params || {};
		if (!controllers.undoSolveForWindow) {
			controllers.undoSolveForWindow = Alloy.createController('solveFor/undoSolveForWindow', _params);
			controllers.undoSolveForWindow && controllers.undoSolveForWindow.window && controllers.undoSolveForWindow.window.open();
		}
	};

	/**
	 * @method closeUndoSolveForWindow
	 * Close undo solve for window
	 * @param {Object} _params Details for the close undo solve for window
	 * @return {void}
	 */
	function closeUndoSolveForWindow(_params) {
		if (controllers.undoSolveForWindow) {
			controllers.undoSolveForWindow.window && controllers.undoSolveForWindow.window.close();
			controllers.undoSolveForWindow.cleanUp && controllers.undoSolveForWindow.cleanUp();
		}
		controllers.undoSolveForWindow = null;
	};

	/**
	 * @method openGenerateWindow
	 * Open generate window
	 * @param {Object} _params Details for the open generate window controller
	 * @return {void}
	 */
	function openGenerateWindow(_params) {
		_params = _params || {};
		if (!controllers.generateWindow) {
			controllers.generateWindow = Alloy.createController('upload/generateWindow', _params);
			controllers.generateWindow && controllers.generateWindow.window && controllers.generateWindow.window.open();
			controllers.startProgress && controllers.startProgress();
		}
	};

	/**
	 * @method closeGenerateWindow
	 * Close generate window
	 * @param {Object} _params Details for the close generate window
	 * @return {void}
	 */
	function closeGenerateWindow(_params) {
		if (controllers.generateWindow) {
			controllers.generateWindow.window && controllers.generateWindow.window.close();
			controllers.generateWindow.cleanUp && controllers.generateWindow.cleanUp();
		}
		controllers.generateWindow = null;
	};

	/**
	 * @method handleNavLeftButton
	 * Toggles the drawer when there's a click on the Left Navigation Button
	 * @param {Object} _params Details for the handle nav left button
	 * @return {void}
	 */
	function handleNavLeftButton(_params) {
		if (isMainWindowLocked) {
			return false;
		}
		isMainWindowLocked = true;

		_params = _params || {};
		if (controllers.mainWindow) {
			controllers.mainWindow.quoteView.blurFields();
			controllers.customerWindow && controllers.customerWindow.blurFields();
		}
		drawer && drawer.toggleLeftWindow();

		isMainWindowLocked = false;
	};

	/**
	 * @method handleQuoteNameEditableChange
	 * Function handler for making the quote name editable in the quoteList
	 * @param {Object} _params Options to make the field editable
	 * @return {void}
	 */
	function handleQuoteNameEditableChange(_params) {
		doLog && console.log('[appNavigation] - handleQuoteNameEditableChange()');

		_params = _params || {};
		var quote = _params.quote;
		var editable = !!_params.editable;

		if (controllers.mainWindow && quote) {
			controllers.mainWindow.setQuoteNameEditable(quote, editable);
		}
	}

	/**
	 * @method handleQuoteListWindowRefresh
	 * Handles functions for the quoteListWindow pull down to refresh event
	 * @param {Object} _params Refresh event
	 * @return {void}
	 */
	function handleQuoteListWindowRefresh(_params) {
		doLog && console.log('[appNavigation] - handleQuoteListWindowRefresh()');

		_params = _params || {};

		if (controllers.mainWindow) {
			controllers.mainWindow.refreshQuotes();
		}
	}

	/**
	 * @method handleQuoteNameLongpress
	 * Goobal function handler for updating the quote name
	 * @param {Object} _params Data for editing the quote
	 * @return {void}
	 */
	function handleQuoteNameLongpress(_params) {
		doLog && console.log('[appNavigation] - handleQuoteNameLongpress()');

		_params = _params || {};
		var quote = _params.quote;

		if (controllers.mainWindow && quote) {
			controllers.mainWindow.updateQuoteName(quote);
		}
	}

	/**
	 * @method handleQuotesRefresh
	 * Global handler to update the active window with the latest quote syncedq
	 * @param {type} _params Options to refresh the windows
	 * @param {Models.quote} _params.quote Quote now selected
	 * @return {void}
	 */
	function handleQuotesRefresh(_params) {
		doLog && console.log('[appNavigation] - handleQuotesRefresh()');

		_params = _params || {};
		var quote = _params.quote;

		if (controllers.equipmentWindow) {
			controllers.equipmentWindow.updateQuote(quote);
		}

		if (controllers.customerWindow) {
			controllers.customerWindow.updateQuote && controllers.customerWindow.updateQuote(quote);
		}

		if (controllers.summaryWindow) {
			controllers.summaryWindow.updateQuote(quote);
		}
	}

	function openAuthorizationWindow(_params) {
		_params = _params || {};
		doLog && console.log('[appNavigation] - openAuthorizationWindow()');

		var authorizationWindow = Alloy.createController(_params.controller, _params);
		if (authorizationWindow && authorizationWindow.window) {
			if (_params.isModal) {
				authorizationWindow.window.open({
					modal: true,
					forceModal: true
				});
			} else {
				openWindowInMainNav(authorizationWindow.window);
			}

			controllers.authorizationWindows.push(authorizationWindow);
		}
	};

	function closeAuthorizationWindow(_params) {
		_params = _params || {};
		doLog && console.log('[appNavigation] - closeAuthorizationWindow()');

		var authorizationWindow = controllers.authorizationWindows.pop();

		if (authorizationWindow && authorizationWindow.window) {
			if (_params.isModal) {
				authorizationWindow.window.close();
			} else {
				closeWindowInMainNav(authorizationWindow.window);
			}
			authorizationWindow.cleanUp && authorizationWindow.cleanUp();
			authorizationWindow = null;
		}

	};

	function closeAllAuthorizationWindows(_params) {
		_params = _params || {};
		doLog && console.log('[appNavigation] - closeAllAuthorizationWindows()');

		_.each(controllers.authorizationWindows, function (authorizationWindow, i) {
			authorizationWindow.window && closeWindowInMainNav(authorizationWindow.window);
			authorizationWindow.cleanUp && authorizationWindow.cleanUp();
		});

		controllers.authorizationWindows = [];
	};

	function handleFirstAuthorization(_params) {
		_params = _params || {};
		doLog && console.log('[appNavigation] - handleFirstAuthorization()');

		_params.index = -1;
		_params.authorizationsData = [];
		controllers.authorizationWindows = [];

		handleNextAuthorization(_params);
	};

	function handleNextAuthorization(_params) {
		_params = _params || {};
		doLog && console.log('[appNavigation] - handleNextAuthorization()');

		var authorizations = _params.authorizations;
		var currentAuthorization = authorizations[_params.index];
		var handleAuthorizarionWindowClose = null;

		_params.index++;

		if (_params.index < authorizations.length) {
			var nextAuthorization = authorizations[_params.index];
			_params.controller = nextAuthorization.controller;
			_params.isModal = nextAuthorization.isModal;

			if (currentAuthorization && currentAuthorization.isModal) {
				var authorizationWindow = controllers.authorizationWindows.pop();

				handleAuthorizarionWindowClose = function (_evt) {
					authorizationWindow.window.removeEventListener('close', handleAuthorizarionWindowClose);

					openAuthorizationWindow(_params);
					authorizationWindow.cleanUp && authorizationWindow.cleanUp();

					handleAuthorizarionWindowClose = null;
				};

				authorizationWindow.window.addEventListener('close', handleAuthorizarionWindowClose);

				authorizationWindow.window && authorizationWindow.window.close();
			} else {
				openAuthorizationWindow(_params);
			}

		} else {
			_.defer(function () {
				closeSummaryPoliciesWindow();
				closeAllAuthorizationWindows(_params);
			});
			_.defer(function () {
				_params.isDone = true;
				_params.doneCallback && _params.doneCallback(_params);
			});
		}
	};

	function handlePreviousAuthorization(_params) {
		_params = _params || {};
		doLog && console.log('[appNavigation] - handlePreviousAuthorization()');

		var authorizations = _params.authorizations;
		var currentAuthorization = authorizations[_params.index];
		_params.index--;

		closeAuthorizationWindow(_params);

		var nextAuthorization = authorizations[_params.index];
		if (nextAuthorization && nextAuthorization.isModal) {
			_params.controller = nextAuthorization.controller;
			_params.isModal = nextAuthorization.isModal;

			openAuthorizationWindow(_params);
		}
	};

	/**
	 * @method closeNavigation
	 * Close navigation
	 * @param {Object} _params Details for the close navigation
	 * @return {void}
	 */
	var closeNavigation = function (_params) {
		doLog && console.log('[appNavigation] - closeNavigation()');
		if (OS_IOS) {
			navWindow && navWindow.close();
			navWindow = null;
		} else {
			controllers.ssnController && controllers.ssnController.window.close();
			controllers.dobController && controllers.dobController.window.close();
			controllers.driversLicenseController && controllers.driversLicenseController.window.close();
		}
		controllers.ssnController = null;
		controllers.dobController = null;
		controllers.driversLicenseController = null;
	};

	function openSignatureWindow(_params) {
		doLog && console.log('[appNavigation] - openSignatureWindow()');
		_params = _params || {};

		controllers.signatureController = Alloy.createController('authorization/signatureWindow', _params);
		controllers.signatureController && controllers.signatureController.window.open();
	};

	function closeSignatureWindow(_params) {
		doLog && console.log('[appNavigation] - closeSignatureWindow()');
		_params = _params || {};

		controllers.signatureController && controllers.signatureController.window.close();
		controllers.signatureController = null;
	};

	function openSSNWindow(_params) {
		doLog && console.log('[appNavigation] - openSSNWindow()');
		_params = _params || {};

		controllers.ssnController = Alloy.createController('authorization/ssnWindow', _params);
		if (OS_IOS) {
			navWindow = Ti.UI.iOS.createNavigationWindow();
			navWindow.window = controllers.ssnController.window;
			navWindow.open();
		} else {
			controllers.ssnController.window.open();
		}
	};

	function closeSSNWindow(_params) {
		doLog && console.log('[appNavigation] - closeSSNWindow()');
		_params = _params || {};

		closeNavigation();
		controllers.ssnController = null;
	};

	function openDOBWindow(_params) {
		doLog && console.log('[appNavigation] - openDOBWindow()');
		_params = _params || {};

		controllers.dobController = Alloy.createController('authorization/dobWindow', _params);
		if (OS_IOS) {
			navWindow && navWindow.openWindow(controllers.dobController.window);
		} else {
			controllers.dobController.window.open();
		}
	};

	function closeDOBWindow(_params) {
		doLog && console.log('[appNavigation] - closeDOBWindow()');
		_params = _params || {};

		controllers.dobController && controllers.dobController.window.close();
		controllers.dobController = null;
	};

	function openDriversLicenseWindow(_params) {
		doLog && console.log('[appNavigation] - openDriversLicenseWindow()');
		_params = _params || {};

		controllers.driversLicenseController = Alloy.createController('authorization/driversLicenseWindow', _params);
		if (OS_IOS) {
			navWindow && navWindow.openWindow(controllers.driversLicenseController.window);
		} else {
			controllers.driversLicenseController.window.open();
		}
	};

	function closeDriversLicenseWindow(_params) {
		doLog && console.log('[appNavigation] - closeDriversLicenseWindow()');
		_params = _params || {};

		controllers.driversLicenseController && controllers.driversLicenseController.window.close();
		controllers.driversLicenseController = null;
	};

	/**
	 * @method closeTermsWindow
	 * @private
	 * Close terms window
	 * @param {Object} _params Details for close terms window
	 * @return {void}
	 */
	var closeTermsWindow = function (_params) {
		_params = _params || {};
		doLog && console.log('[appNavigation] - closeTermsWindow()');

		termsController && termsController.close();
		termsController = null;
	};

	/**
	 * @method openSettingsWindow
	 * Open settins window
	 * @param {Object} _params Details for the controller of the settings window
	 * @return {void}
	 */
	var openSettingsWindow = function (_params) {
		_params = _params || {};
		doLog && console.log('[appNavigation] - openSettingWindow()');

		if (!controllers.settingsController) {
			controllers.settingsController = Alloy.createController('settings/settingsWindow', _params);
			controllers.settingsController.window && controllers.settingsController.window.open();
		}
	};

	/**
	 * @method closeSettingsWindow
	 * Close settings window
	 * @param {Object} _params Details for the close settings window
	 * @return {void}
	 */
	var closeSettingsWindow = function (_params) {
		if (controllers.settingsController) {
			controllers.settingsController.closeWindow && controllers.settingsController.closeWindow();
			controllers.settingsController.cleanUp && controllers.settingsController.cleanUp();
			controllers.settingsController = null;
		}
	};

	/**
	 * @method openTradeUpSearchWindow
	 * Opens the Trade Up Search Window
	 * @param {Object} _params Options for opening the window
	 * @param {Function} _params.doneCallback Callback function to be called once the Done button is pressed
	 * @return {void}
	 */
	function openTradeUpSearchWindow(_params) {
		_params = _params || {};
		if (!controllers.tradeUpSearchWindow) {
			controllers.tradeUpSearchWindow = Alloy.createController('additionalCosts/tradeUpSearchWindow', _params);
			controllers.tradeUpSearchWindow && controllers.tradeUpSearchWindow.window && controllers.tradeUpSearchWindow.window
				.open();
		}
	};

	/**
	 * @method closeTradeUpSearchWindow
	 * Close Trade Up Search Window
	 * @param {Object} _params Details for the close generate window
	 * @return {void}
	 */
	function closeTradeUpSearchWindow(_params) {
		if (controllers.tradeUpSearchWindow) {
			controllers.tradeUpSearchWindow.window && controllers.tradeUpSearchWindow.closeWindow();
			controllers.tradeUpSearchWindow.cleanUp && controllers.tradeUpSearchWindow.cleanUp();
		}
		controllers.tradeUpSearchWindow = null;
	};

	/**
	 * @method openApplicationEmailWindow
	 * Function to open the native eMail dialog Window
	 * @param {Object} _params
	 * @param {String} _params.subject Subject to display in the eMail
	 * @param {String} [_params.toRecipients] Array of recipients to be sent
	 * @param {String} [_params.ccRecipients] Array of CC's to be sent
	 * @param {String} _params.messageBody Message body of the eMail
	 * @param {String} _params.filePath
	 * @param {String} _params.fileName
	 * @param {[String]} _params.attachments Array of files to be attached
	 * @param {Function} _params.complete Callback function used to add a complete event to the dialog
	 * @return {void}
	 */
	function openEmailDialog(_params) {
		_params = _params || {};
		var subject = _params.subject || "Your confirmation";
		var toRecipients = _params.toRecipients || [];
		var ccRecipients = _params.ccRecipients || [];
		var messageBody = _params.messageBody || "Thank you";
		var filePath = _params.filePath || "";
		var fileName = _params.fileName || "";
		var attachments = _params.attachments || [];
		var retryOnMissingAttachments = _params.retryOnMissingAttachments || null;

		var dialog = Ti.UI.createEmailDialog({
			subject: subject,
			toRecipients: toRecipients,
			ccRecipients: ccRecipients,
			messageBody: messageBody
		});

		if (_params.complete) {
			dialog.addEventListener('complete', _params.complete);
		}

		for (var i = 0; i < attachments.length; i++) {
			var attachment = attachments[i];
			var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, attachment.fileName);
			if (file.exists()) {
				dialog.addAttachment(file);
			} else {
				if (retryOnMissingAttachments) {
					retryOnMissingAttachments();
				}
				return;
			}
			file = null;
		}

		dialog.open();
	};
	/** 
	 * @method sharePDF
	 * Share PDF files with others apps
	 * @param {Object} _params 
	 * @return {void}
	 */
	function sharePDF(_params) {
		doLog && console.log(LOG_TAG, '- sharePDF');

		shareHelper.pdf(_params);
	}
	/**
	 * @method openWebViewWindow
	 * Creates a new window with a Safari dialog (iOS) or a webView (android)
	 * @param {Object} _params Options to load the webViewWindow with
	 * @return {void}
	 */
	function openWebViewWindow(_params) {
		doLog && console.log(LOG_TAG, '- openWebViewWindow');

		var params = _params || {};

		if (!controllers.webViewWindow) {
			controllers.webViewWindow = Alloy.createController('common/webViewWindow', _params);
			if (OS_IOS) {
				controllers.webViewWindow.open();
			} else {
				openWindowInMainNav(controllers.webViewWindow.window);
			}
		}
	}

	/**
	 * @method closeWebViewWindow
	 * Closes the given webViewWindow from th navigation and memory
	 * @param {Object} _params Options to close the window
	 * @return {void}
	 */
	function closeWebViewWindow(_params) {
		doLog && console.log(LOG_TAG, '- closeWebViewWindow');

		var params = _params || {};

		if (controllers.webViewWindow) {
			if (OS_IOS) {
				controllers.webViewWindow.close();
			} else {
				closeWindowInMainNav(controllers.webViewWindow.window);
			}
			controllers.webViewWindow.destroy && controllers.webViewWindow.destroy();

			controllers.webViewWindow = null;
		}
	}

	/**
	 * @method openPickerWindow
	 * Function that opens the Picker Window 
	 * @param {Object} _params Details for the  picker container controller
	 * @return {void}
	 */
	function openPickerWindow(_params) {
		_params = _params || {};
		// if (!controllers.pickerWindow) {
		if (!_params.container && controllers.mainWindow) {
			_params.container = controllers.mainWindow.quoteView.getView();
		}

		controllers.pickerWindow = Alloy.createController('picker/pickerContainer', _params);
		controllers.pickerWindow.open && controllers.pickerWindow.open();
		// }
	};

	/**
	 * @method closePickerWindow
	 * Function that closes the Picker Window 
	 * @param {Object} _params Details for close picker window
	 * @return {void}
	 */
	function closePickerWindow(_params) {
		// if (controllers.pickerWindow) {
		controllers.pickerWindow.close && controllers.pickerWindow.close();
		controllers.pickerWindow.cleanUp && controllers.pickerWindow.cleanUp();
		// }
		// controllers.pickerWindow = null;
	};

	/**
	 * @method openSubmitProgress
	 * Shows the submit progress bar screen.
	 * @param {Object} _params Details for the submit progress controller
	 * @return {void}
	 */
	function openSubmitProgress(_params) {
		_params = _params || {};

		if (!controllers.submitProgress) {
			controllers.submitProgress = Alloy.createController('upload/submitProgress', _params);
		}
	};

	/**
	 * @method closeSubmitProgress
	 * Closes the submitProgress Screen.
	 * @param {Object} _params Close submit progress details
	 * @return {void}
	 */
	function closeSubmitProgress(_params) {
		doLog && console.log('[appNavigation] - closeSubmitProgress()');
		if (controllers.submitProgress) {
			controllers.submitProgress.hide && controllers.submitProgress.hide();
			controllers.submitProgress.cleanUp && controllers.submitProgress.cleanUp();
		}

		controllers.submitProgress = null;
	};

	/**
	 * @method showAlert
	 * Show an alert with the text received
	 * @param {Object} _params Data to initialize the alert dialog, receives the same parameters as Ti.UI.AlertDialog
	 * @return {void}
	 */
	function showAlert(_params) {
		_params = _params || {};

		alertHelper.showAlertDialog(_params);
	};

	/**
	 * @method showAlertMessage
	 * Shows a message within an alert dialog, smilar to alert()
	 * @param {String} _message Message for the alert
	 * @return {void}
	 */
	function showAlertMessage(_message) {
		showAlert({
			message: _message
		});
	};

	/**
	 * @method handleQuoteSubmit
	 * Handles and addition or remove from a quote to being submitted
	 * @param {Object} _params Parameters dictionary
	 * @param {Models.Quote} _params.quote Quote model to submit
	 * @return {void}
	 */
	function handleQuoteSubmit(_params) {
		_params = _params || {};

		if (_params.quote) {
			if (!controllers.submitProgress) {
				openSubmitProgress();
			}

			controllers.submitProgress.addQuoteToSubmit(_params);
		}
	};

	function handleCustomerAddressChange(_evt) {
		if (controllers.customerWindow) {
			controllers.customerWindow.setCopyAddressStatus(false);
		}
	};

	// Apple specific
	/**
	 * @method openEquipmentWindow
	 * Opens the Equipment Window (Apple)
	 * @param {Object} _params Details for the equipment window controller
	 * @return {void}
	 */
	function openEquipmentWindow(_params) {
		_params = _params || {};
		if (!controllers.equipmentWindow) {
			controllers.equipmentWindow = Alloy.createController('apple/equipment/equipmentWindow', _params);
			controllers.equipmentWindow && openWindowInMainNav(controllers.equipmentWindow.window);
		}
	};

	/**
	 * @method closeEquipmentWindow
	 * Closes the equipment window 
	 * @param {Object} _params Details for the close equipment window
	 * @return {void}
	 */
	function closeEquipmentWindow(_params) {
		if (controllers.equipmentWindow) {
			controllers.equipmentWindow && closeWindowInMainNav(controllers.equipmentWindow.window);
			controllers.equipmentWindow.cleanUp && controllers.equipmentWindow.cleanUp();
		}
		controllers.equipmentWindow = null;
	};

	/**
	 * @method openOptionsWindow
	 * Opens the options Window (Apple)
	 * @param {Object} _params Details for the options window controller
	 * @return {void}
	 */
	function openOptionsWindow(_params) {
		_params = _params || {};
		if (!controllers.optionsWindow) {
			controllers.optionsWindow = Alloy.createController('apple/common/optionsWindow', _params);
			controllers.optionsWindow && controllers.optionsWindow.window && controllers.optionsWindow.window.open({
				modal: true
			});
		}
	};

	/**
	 * @method closeOptionsWindow
	 * Closes the options window 
	 * @param {Object} _params Details for the close options window
	 * @return {void}
	 */
	function closeOptionsWindow(_params) {
		if (controllers.optionsWindow) {
			controllers.optionsWindow.window && controllers.optionsWindow.window.close();
			controllers.optionsWindow.cleanUp && controllers.optionsWindow.cleanUp();
		}
		controllers.optionsWindow = null;
	};

	/**
	 * @method openCustomerDetailsWindow
	 * Function that opens the Customer details Window
	 * @param {Object} Details for customer controller
	 * @return {void}
	 */
	function openCustomerDetailsWindow(_params) {
		_params = _params || {};
		if (!controllers.customerWindow) {
			controllers.customerWindow = Alloy.createController('apple/customer/customerWindow', _params);
			controllers.customerWindow && openWindowInMainNav(controllers.customerWindow.window);
		}
	};

	/**
	 * @method closeCustomerDetailsWindow
	 * Close customer detail window
	 * @param {Object} Details for the close customer detail window
	 * @return {void}
	 */
	function closeCustomerDetailsWindow(_params) {
		if (controllers.customerWindow) {
			controllers.customerWindow && closeWindowInMainNav(controllers.customerWindow.window);
			controllers.customerWindow.cleanUp && controllers.customerWindow.cleanUp();
		}
		controllers.customerWindow = null;
	};

	/**
	 * @method hideKeyboard
	 * Forces all opened controllers to call `blurFields()` so the keyboard is dismissed
	 * @return {void}
	 */
	function hideKeyboard() {
		doLog && console.log(LOG_TAG, '- hideKeyboard');

		_.each(controllers, function (_controller) {
			_controller && _controller.blurFields && _controller.blurFields();
		});
	}

	// Public API.
	return {
		// Main structural windows.
		openSplashWindow: openSplashWindow,
		closeSplashWindow: closeSplashWindow,
		openLoginWindow: openLoginWindow,
		closeLoginWindow: closeLoginWindow,
		openMainWindow: openMainWindow,
		closeMainWindow: closeMainWindow,
		openCustomerWindow: openCustomerWindow,
		closeCustomerWindow: closeCustomerWindow,
		openSearchCustomerWindow: openSearchCustomerWindow,
		closeSearchCustomerWindow: closeSearchCustomerWindow,
		openSolveForWindow: openSolveForWindow,
		closeSolveForWindow: closeSolveForWindow,
		openSummaryWindow: openSummaryWindow,
		closeSummaryWindow: closeSummaryWindow,
		openPrivacyStatementWindow: openPrivacyStatementWindow,
		openLoginPoliciesWindow: openLoginPoliciesWindow,
		closeLoginPoliciesWindow: closeLoginPoliciesWindow,
		openSummaryPoliciesWindow: openSummaryPoliciesWindow,
		closeSummaryPoliciesWindow: closeSummaryPoliciesWindow,
		openSettingsWindow: openSettingsWindow,
		closeSettingsWindow: closeSettingsWindow,
		openUndoSolveForWindow: openUndoSolveForWindow,
		closeUndoSolveForWindow: closeUndoSolveForWindow,
		openGenerateWindow: openGenerateWindow,
		closeGenerateWindow: closeGenerateWindow,
		openTradeUpSearchWindow: openTradeUpSearchWindow,
		closeTradeUpSearchWindow: closeTradeUpSearchWindow,

		// Authorization windows
		openAuthorizationWindow: openAuthorizationWindow,
		closeAuthorizationWindow: closeAuthorizationWindow,
		handleFirstAuthorization: handleFirstAuthorization,
		handleNextAuthorization: handleNextAuthorization,
		handlePreviousAuthorization: handlePreviousAuthorization,

		openSignatureWindow: openSignatureWindow,
		closeSignatureWindow: closeSignatureWindow,
		openSSNWindow: openSSNWindow,
		closeSSNWindow: closeSSNWindow,
		openDOBWindow: openDOBWindow,
		closeDOBWindow: closeDOBWindow,
		openDriversLicenseWindow: openDriversLicenseWindow,
		closeDriversLicenseWindow: closeDriversLicenseWindow,
		closeNavigation: closeNavigation,

		// Utility screens
		openEmailDialog: openEmailDialog,
		openPickerWindow: openPickerWindow,
		closePickerWindow: closePickerWindow,
		openSubmitProgress: openSubmitProgress,
		closeSubmitProgress: closeSubmitProgress,
		openWebViewWindow: openWebViewWindow,
		closeWebViewWindow: closeWebViewWindow,
		hideKeyboard: hideKeyboard,
		sharePDF: sharePDF,

		// Alerts
		showAlert: showAlert,
		showAlertMessage: showAlertMessage,

		// events
		handleFlipButton: handleFlipButton,
		handleNavLeftButton: handleNavLeftButton,
		handleQuoteNameEditableChange: handleQuoteNameEditableChange,
		handleQuoteNameLongpress: handleQuoteNameLongpress,
		handleQuoteListWindowRefresh: handleQuoteListWindowRefresh,
		handleQuotesRefresh: handleQuotesRefresh,

		handleQuoteSubmit: handleQuoteSubmit,
		handleCustomerAddressChange: handleCustomerAddressChange,

		// Apple
		openEquipmentWindow: openEquipmentWindow,
		closeEquipmentWindow: closeEquipmentWindow,
		openOptionsWindow: openOptionsWindow,
		closeOptionsWindow: closeOptionsWindow,
		openCustomerDetailsWindow: openCustomerDetailsWindow,
		closeCustomerDetailsWindow: closeCustomerDetailsWindow
	};
})();

module.exports = appNavigation;
