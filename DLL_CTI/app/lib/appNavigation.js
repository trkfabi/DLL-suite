var doLog = Alloy.Globals.doLog;

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
		loadingIndicator: null,
		undoSolveForWindow: null,
		generateWindow: null,
		settingsController: null,
		webViewWindow: null
	};
	// Drawer for main window (it is only needed on iOS right now)
	var drawer;
	var quoteContainer;

	// For the flip screen currently loaded
	var currentViewName;

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
	function closeWindowInMainNav(_window) {
		if (OS_IOS) {
			drawer && drawer.centerWindow.closeWindow(_window);
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
			controllers.splashWindow.destroy && controllers.splashWindow.destroy();
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
			controllers.loginWindow.destroy && controllers.loginWindow.destroy();
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
			controllers.mainWindow = Alloy.createController('main/mainWindow', _params);
			drawer = controllers.mainWindow.drawer;
			drawer && drawer.open();

			quoteContainer = controllers.mainWindow.getQuoteContainer();

			_.delay(function () {
				openSubmitProgress();
			}, 1000);
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
			controllers.mainWindow.destroy && controllers.mainWindow.destroy();
			controllers.customerWindow && controllers.customerWindow.destroy();
		}
		quoteContainer = null;
		drawer = null;
		controllers.mainWindow = null;
		controllers.customerWindow = null;
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

		controllers.mainWindow && controllers.mainWindow.quoteView.blurFields();

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

		controllers.customerWindow && controllers.customerWindow.blurFields();

		flipMainView(_params);
	};

	/**
	 * @method handleFlipButton
	 * Handles the flip button on the main Window
	 * @param {Object} _params Details for the handle flip customer section 
	 * @return {void}
	 */
	function handleFlipButton(_params) {
		_params = _params || {};

		if (currentViewName === 'customerWindow') {
			closeCustomerWindow(_params);
		} else {
			openCustomerWindow(_params);
		}
	};

	/**
	 * @method openAmortizationWindow
	 * Function that opens the Amortization Window
	 * @param {Object} _params Details for the amortization window controller
	 * @return {void}
	 */
	function openAmortizationWindow(_params) {
		_params = _params || {};
		if (!controllers.amortizationWindow) {
			controllers.amortizationWindow = Alloy.createController('amortization/amortizationWindow', _params);
			controllers.amortizationWindow && openWindowInMainNav(controllers.amortizationWindow.window);
		}
	};

	/**
	 * @method closeAmortizationWindow
	 * Close amortization window
	 * @param {Object} _params Details for close amortization window
	 * @return {void}
	 */
	function closeAmortizationWindow(_params) {
		if (controllers.amortizationWindow) {
			controllers.amortizationWindow && closeWindowInMainNav(controllers.amortizationWindow.window);
			controllers.amortizationWindow.destroy && controllers.amortizationWindow.destroy();
		}
		controllers.amortizationWindow = null;
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
			controllers.searchCustomerWindow.destroy && controllers.searchCustomerWindow.destroy();
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
			controllers.solveForWindow.destroy && controllers.solveForWindow.destroy();
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
			controllers.summaryWindow = Alloy.createController('customer/summaryWindow', _params);
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
			controllers.summaryWindow.destroy && controllers.summaryWindow.destroy();
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
			controllers.loginPoliciesWindow.destroy && controllers.loginPoliciesWindow.destroy();
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
			controllers.summaryPolciesWindow && controllers.summaryPolciesWindow.window && controllers.summaryPolciesWindow.window
				.open();
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
			controllers.summaryPolciesWindow.window && controllers.summaryPolciesWindow.window.close();
			controllers.summaryPolciesWindow.destroy && controllers.summaryPolciesWindow.destroy();
		}
		controllers.summaryPolciesWindow = null;
	};

	/**
	 * @method openUndoGoalSeekerWindow
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
			controllers.undoSolveForWindow.destroy && controllers.undoSolveForWindow.destroy();
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
			controllers.generateWindow.destroy && controllers.generateWindow.destroy();
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
		_params = _params || {};
		hideKeyboard();
		drawer && drawer.toggleLeftWindow();
	};

	/**
	 * @method selectQuote
	 * Select a quote
	 * @param {Models.Quote} Models quote
	 * @return {void}
	 */
	function selectQuote(_quote) {
		if (_quote && controllers.mainWindow) {
			controllers.mainWindow.selectQuote(_quote);
		}
	};

	/**
	 * @method openSignatureWindow
	 * Function that opens the Signature Window
	 * @param {Object} Details for signature window controller
	 * @return {void}
	 */
	var openSignatureWindow = function (_params) {
		_params = _params || {};
		doLog && console.log('[appNavigation] - openSignatureWindow()');

		controllers.signatureController = Alloy.createController('authorization/signatureWindow', _params);
		controllers.signatureController && controllers.signatureController.window.open();
	};

	/**
	 * @method closeSignatureWindow
	 * Close signature window
	 * @param {Object} _params Details for close signature window
	 * @return {void}
	 */
	var closeSignatureWindow = function (_params) {
		// doLog && console.log('[appNavigation] - closeSignatureWindow()');

		controllers.signatureController && controllers.signatureController.window.close();
		controllers.signatureController = null;
	};

	/**
	 * @method openDriverLicenseWindow
	 * Open driver license window
	 * @param {Object} _params Details for driver license window controller
	 * @return {void}
	 */
	var openDriverLicenseWindow = function (_params) {
		_params = _params || {};
		doLog && console.log('[appNavigation] - openDriverLicenseWindow()');

		controllers.driverLicenseController = Alloy.createController('authorization/driversLicenseWindow', _params);
		if (OS_IOS) {
			navWindow && navWindow.openWindow(controllers.driverLicenseController.window);
		} else {
			controllers.driverLicenseController.open();
		}
	};

	/**
	 * @method closeDriverLicenseWindow
	 * Close driver license window
	 * @param {Object} _params Details for driverLicenseController window
	 * @return {void}
	 */
	var closeDriverLicenseWindow = function (_params) {
		if (OS_IOS) {
			controllers.driverLicenseController && controllers.driverLicenseController.window.close();
		} else {
			controllers.driverLicenseController && controllers.driverLicenseController.close();
		}
		controllers.driverLicenseController = null;
	};

	/**
	 * @method openSsnWindow
	 * Function that opens the social security number window
	 * @param {Object} _params Details for the controller of the social secuirty number window
	 * @return {void}
	 */
	var openSsnWindow = function (_params) {
		_params = _params || {};
		doLog && console.log('[appNavigation] - openSsnWindow()');

		controllers.ssnController = Alloy.createController('authorization/ssnWindow', _params);

		if (OS_IOS) {
			navWindow = Ti.UI.iOS.createNavigationWindow();
			navWindow.window = controllers.ssnController.window;
			navWindow.open();
		} else {
			controllers.ssnController.window.open();
		}
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
	 * @method closeSsnWindow
	 * Closes the social security number window.
	 * @param {Object} params Details for the close social security number window
	 * @param {Function} params.callback Function to be called when social security number window is closed
	 * @return {void}
	 */
	var closeSsnWindow = function (_params) {
		// doLog && console.log('[appNavigation] - closeSsnWindow()');
		closeNavigation();
		controllers.ssnController = null;
	};

	/**
	 * @method openDobWindow
	 * Open the date of birthday window
	 * @param {Object} _params Details for the controller of the dob (date of birthday) window
	 * @return {void}
	 */
	var openDobWindow = function (_params) {
		_params = _params || {};
		doLog && console.log('[appNavigation] - openDobWindow()');

		_params.name = 'dob/dobWindow';
		controllers.dobController = Alloy.createController('authorization/dobWindow', _params);
		if (OS_IOS) {
			navWindow && navWindow.openWindow(controllers.dobController.window);
		} else {
			controllers.dobController.window.open();
		}
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
			if (OS_IOS) {
				controllers.settingsController.navWindow = Ti.UI.iOS.createNavigationWindow({
					modal: false,
					window: controllers.settingsController.window
				});

				controllers.settingsController.navWindow.open();
			} else {
				controllers.settingsController.window && controllers.settingsController.window.open({
					modal: false
				});
			}
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
			if (OS_IOS) {
				controllers.settingsController.navWindow && controllers.settingsController.navWindow.close();
			} else {
				controllers.settingsController.window && controllers.settingsController.window.close();
			}

			controllers.settingsController.destroy && controllers.settingsController.destroy();
			controllers.settingsController = null;
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
			controllers.driverLicenseController && controllers.driverLicenseController.close();
		}
		controllers.ssnController = null;
		controllers.dobController = null;
		controllers.driverLicenseController = null;
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

	/**
	 * @method showActivityIndicator
	 * Function that opens the activity indicator window.
	 * @param {String} _params.message String to be displayed in the activity indicator
	 * @param {Function} _params.callback Function to be executed when an action occurs in the Activity Indicator window
	 * @param {Function} _params.callbackLoaded Function to be executed when the window has been loaded
	 * @param {Props} _params.windowStyle A dictionary of style properties to apply to the window.
	 * @return {void}
	 */
	function showLoadingIndicator(_params) {
		_params = _params || {};
		if (controllers.loadingIndicator) {
			hideLoadingIndicator();
		}

		controllers.loadingIndicator = Alloy.createController('common/loadingIndicator', _params);
		controllers.loadingIndicator.open && controllers.loadingIndicator.open();
	};

	/**
	 * @method hideActivityIndicator
	 * Hides the Activity Indicator Window
	 * @param {Object} _params Details for the hide loading indicator
	 * @return {void}
	 */
	function hideLoadingIndicator(_params) {
		_params = _params || {};

		if (controllers.loadingIndicator) {
			controllers.loadingIndicator.close && controllers.loadingIndicator.close();
			controllers.loadingIndicator.destroy && controllers.loadingIndicator.destroy();
			controllers.loadingIndicator = null;
		}
	};

	/**
	 * @method openPickerWindow
	 * Function that opens the Picker Window 
	 * @param {Object} _params Details for the  picker container controller
	 * @return {void}
	 */
	function openPickerWindow(_params) {
		_params = _params || {};
		if (!controllers.pickerWindow) {
			controllers.pickerWindow = Alloy.createController('picker/pickerContainer', _params);
			controllers.pickerWindow && controllers.pickerWindow.show && controllers.pickerWindow.show();
		}
	};

	/**
	 * @method closePickerWindow
	 * Function that closes the Picker Window 
	 * @param {Object} _params Details for close picker window
	 * @return {void}
	 */
	function closePickerWindow(_params) {
		if (controllers.pickerWindow) {
			controllers.pickerWindow.window && controllers.pickerWindow.window.close();
			controllers.pickerWindow.destroy && controllers.pickerWindow.destroy();
		}
		controllers.pickerWindow = null;
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
			controllers.submitProgress.destroy && controllers.submitProgress.destroy();
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
		Alloy.createController('common/alert', _params).show();
	};

	/**
	 * @method showAlertMessage
	 * Shows a message within an alert dialog, smilar to alert()
	 * @param {String} _message Message for the alert
	 * @return {void}
	 */
	function showAlertMessage(_message) {
		showAlert({
			message: _message,
			title: L('alert')
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

			controllers.submitProgress.addQuoteToSubmit(_params.quote);
		}
	};

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
		openAmortizationWindow: openAmortizationWindow,
		closeAmortizationWindow: closeAmortizationWindow,
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
		handleNavLeftButton: handleNavLeftButton,
		openSettingsWindow: openSettingsWindow,
		closeSettingsWindow: closeSettingsWindow,
		openUndoSolveForWindow: openUndoSolveForWindow,
		closeUndoSolveForWindow: closeUndoSolveForWindow,
		openGenerateWindow: openGenerateWindow,
		closeGenerateWindow: closeGenerateWindow,

		// Sign window
		openSignatureWindow: openSignatureWindow,
		closeSignatureWindow: closeSignatureWindow,
		openSsnWindow: openSsnWindow,
		closeSsnWindow: closeSsnWindow,
		openDobWindow: openDobWindow,
		openDriverLicenseWindow: openDriverLicenseWindow,
		closeDriverLicenseWindow: closeDriverLicenseWindow,
		closeNavigation: closeNavigation,

		// Utility screens
		openEmailDialog: openEmailDialog,
		showLoadingIndicator: showLoadingIndicator,
		hideLoadingIndicator: hideLoadingIndicator,
		openPickerWindow: openPickerWindow,
		closePickerWindow: closePickerWindow,
		openSubmitProgress: openSubmitProgress,
		closeSubmitProgress: closeSubmitProgress,
		openWebViewWindow: openWebViewWindow,
		closeWebViewWindow: closeWebViewWindow,
		hideKeyboard: hideKeyboard,

		// Alerts
		showAlert: showAlert,
		showAlertMessage: showAlertMessage,

		// events
		handleFlipButton: handleFlipButton,
		// TODO: change name
		selectQuote: selectQuote,
		handleQuoteSubmit: handleQuoteSubmit
	};
})();

module.exports = appNavigation;
