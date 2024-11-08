// Global variables
global.moment = require('alloy/moment');

(function () {
	Alloy.Globals = {
		/**
		 * @constant Alloy.Globals.appID
		 * @public
		 * Manual App Identifier
		 */
		app_id: 'AFS',

		appId: Ti.App.id,

		/**
		 * @constant Alloy.Globals.privacyStatementUrl
		 * @public
		 * Url of Privacy Statement
		 */
		privacyStatementUrl: 'https://www.lesseedirect.com/usprivacy',

		/**
		 * @constant Alloy.Globals.policyVersion
		 * @public
		 * Ts & Cs version of the login screen
		 */
		policyVersion: '1.0',

		/**
		 * @constant Alloy.Globals.submitStatus
		 * @public
		 * Statuses for quotes submissions
		 */
		submitStatus: {
			unsubmitted: 0,
			sent: 1,
			submitted: 2,
			pending: 3
		},

		/**
		 * @constant Alloy.Globals.displayPaybackPercentage
		 * @public
		 * Statuses for Quotes.displayPaybackPercentage
		 * Values "init" and "on" should return true and "off" and "offAlternative" should return false
		 */
		displayPaybackPercentage: {
			init: null,
			offAlternative: 0,
			on: 1,
			off: 2
		},

		rateType: {
			itad: 'ITAD'
		},

		/**
		 * @constant Alloy.Globals.submitDocs
		 * @public
		 * Documents used by the quote for the submission (quote's property on DB)
		 */
		submitDocs: [
			'leaseFileName'
		],

		/**
		 * @variable Alloy.Globals.updateDialogIsVisible
		 * @public
		 * TRUE if the update alert dialog is already visible, FALSE otherwise
		 */
		updateDialogIsVisible: false,

		/**
		 * @variable Alloy.Globals.updateRequestLoading
		 * @public
		 * TRUE when a request is made and until it returns
		 */
		updateRequestLoading: false,

		/**
		 * @constant Alloy.Globals.updateUrl
		 * @public
		 * Endpoint to check if app is up to date
		 */
		updateUrl: getUpdateUrl(),

		/**
		 * @constant Alloy.Globals.shortenerWSUrl
		 * @public
		 * Service to extend shortened urls (for version update)
		 */
		shortenerWSUrl: 'https://is.gd/forward.php',

		/**
		 * @constant Alloy.Globals.updateUrlDomainWhitelist
		 * @public
		 * Version update domain whitelist
		 */
		updateUrlDomainWhitelist: [
			'play.google.com',
			'itunes.apple.com',
			'appsto.re',
			'itms-services://?action=download-manifest&url=https://na01ws.apperian.',
			'com/downloads/install/applications/66764/no_auth/?capp%',
			'https://na01ws.apperian.com/downloads/install/applications/40329/no_auth/?capp=s'
		],

		environment: getEnvironmentVariable(),

		useLocalCustomizations: false,

		useDynamicPDF: false,

		forceUpdate: true,

		doLog: getDoLogVariable(),

		isDemo: getDemoFlag(),

		currentLocale: Ti.Locale.currentLocale,

		currentLanguage: Ti.Locale.currentLanguage.split('-')[0],

		OSVersion: Ti.Platform.version,

		OSMajorVersion: parseInt(Ti.Platform.version.split('.')[0], 10),

		appName: Ti.App.name,

		osName: Ti.Platform.osname,

		model: Ti.Platform.model,

		platformID: Ti.Platform.id,

		manufacturer: Ti.Platform.manufacturer,

		appVersion: Ti.App.version,

		width: Ti.Platform.displayCaps.platformWidth,

		height: Ti.Platform.displayCaps.platformHeight,

		density: Ti.Platform.displayCaps.density,

		dpi: Ti.Platform.displayCaps.dpi,

		logicalDensityFactor: Ti.Platform.displayCaps.logicalDensityFactor,

		paymentRowHeight: OS_IOS ? 73 : 79,

		headerHeight: OS_IOS ? 65 : 60,

		decimalSeparator: currentDecimalSeparator(),

		displayAndroidHeight: (Ti.Platform.displayCaps.platformHeight / Ti.Platform.displayCaps.logicalDensityFactor) - ((
			Alloy.isTablet) ? 27 : 25),

		loginAndroidHeight: (Ti.Platform.displayCaps.platformHeight / Ti.Platform.displayCaps.logicalDensityFactor) - ((
			Alloy.isTablet) ? 300 : 160),

		iPhoneTall: (OS_IOS && Ti.Platform.displayCaps.platformHeight > 480),

		iPhoneX: (OS_IOS && Ti.Platform.displayCaps.platformHeight === 812),

		settingsURL: (OS_IOS ? Ti.App.iOS.applicationOpenSettingsURL : null),

		solveForDrawerWidth: OS_IOS ? (Ti.Platform.displayCaps.platformHeight * 0.3) : (Ti.Platform.displayCaps.platformHeight /
			Ti.Platform.displayCaps.logicalDensityFactor * 0.3),

		amountFinancedLimits: {
			min: 0,
			max: 250000
		},

		versionCheckSoftAlertDismissTimeProperty: 'version_control_due_softalert',

		/**
		 * @constant Alloy.Globals.formats
		 * @public
		 * Possible formats for dates, will come from the current country loaded
		 */
		formats: {},

		logoImage: 'AFS_logo_pdf.jpg',

		colors: {
			abbey: '#454749',
			alabaster: '#F7F7F7',
			alto: '#DCDCDC',
			azureRadiance: '#0099FF',
			barleyCorn: '#9B844F',
			black: '#000',
			blue: '#0000FF',
			blackHalfTransparent: '#88000000',
			bonJour: '#F0ECEE',
			contessa: '#C67272',
			crimson: '#C41230',
			dustyGray: '#B3A1AA',
			emperor: '#555555',
			falcon: '#816474',
			gallery: '#EBEBEB',
			galleryApprox: '#EDEDED',
			geyser: '#DDE2E5',
			ghost: '#BFC5CF',
			gray: '#7F7F7F',
			grayApprox: '#8D8D8D',
			laser: '#C4AA71',
			lochmara: '#0081BF',
			mantis: '#60C750',
			mercury: '#E4E4E4',
			mineShaft: '#353535',
			mineShaftApprox: '#282828',
			mountbattenPink: '#947987',
			muddyWaters: '#B69A5E',
			nevada: '#6A6D6E',
			nobel: '#B5B5B5',
			pesto: '#88713E',
			pictonBlue: '#31B6E7',
			prim: '#F7F3F7',
			regentStBlue: '#99BBDD',
			scorpion: '#575757',
			seashell: '#F1F1F1',
			shark: '#191C1E',
			shiraz: '#A90D2E',
			shuttleGray: '#576067',
			silver: '#C2C2C2',
			swirl: '#D1CBC7',
			tamarillo: '#9A151C',
			thunder: '#231F20',
			transparent: 'transparent',
			tundora: '#454545',
			white: '#FFFFFF',
			tropicalBlue: '#C7E5F9',
			cornflowerBlue: '#007AFF'
		},

		fonts: {},

		/**
		 * @constant Alloy.Globals.aes
		 * @public
		 * Properties for the AES login
		 */
		aes: {
			iv: '0000000000000000',
			key: 'C82B1F7EF4AA7D530E29D7C93DBF256641DBE090DDFDABFB42F33741D5FF9B16'
		},

		/**
		 * @constant Alloy.Globals.baseWSUrl
		 * @public
		 * Base URL for the webservices calls
		 */
		baseWSUrl: getBaseWSUrlVariable(),

		/**
		 * @constant Alloy.Globals.baseWSUrlApiBuilder
		 * @public
		 * Base URL for the API Builder webservices calls
		 */
		baseWSUrlApiBuilder: getBaseWSUrlApiBuilder(),

		/**
		 * @constant Alloy.Globals.baseWSApiKeyApiBuilder
		 * @public
		 * API Key to authenticate API Builder calls
		 */
		baseWSApiKeyApiBuilder: getBaseWSApiKeyApiBuilder(),

		/**
		 * @constant Alloy.Globals.validUserGroups
		 * User groups to validate on login
		 */
		validUserGroups: ['APL'],

		opacityDisabled: 0.45,

		privacyPolicyURL: 'http://dll-privacy.propelics.com/expressfinance_terms.html',

		/**
		 * @constant Alloy.Globals.tabbedBar
		 * @public
		 * Possible styles for TabbedBar on Android
		 */
		tabbedBar: {
			STYLE_HEADER: 0,
			STYLE_TABBED_BAR: 1
		},

		quoteAnalytics: {
			quoteName: 'analytics'
		},

		quoteList: {
			initialCount: 20,
			scrollCount: 20,
			preloadCount: 2
		},
		/**
		 * @method Alloy.Globals.generateGUID
		 * ##Public
		 * Generates a GUID value
		 */
		generateGUID: function () {
			return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
		},
		/**
		 * @constant Alloy.Globals.quoteLimit
		 * @public
		 * Total number of quotes available to fetch
		 */
		quoteLimit: 1000
	};

	if (OS_IOS) {
		Alloy.Globals.fonts = {
			primary: {
				regular: 'HelveticaNeue',
				medium: 'HelveticaNeue-Medium',
				bold: 'HelveticaNeue-Bold',
				light: 'HelveticaNeue-Light'
			},
			myriadSetPro: {
				regular: 'MyriadSetPro-Text',
				medium: 'MyriadSetPro-Medium',
				semiBold: 'MyriadSetPro-Semibold',
				bold: 'MyriadSetPro-Bold',
				light: 'MyriadSetPro-Thin',
				ultraLight: 'MyriadSetPro-Ultralight'
			}
		};
	} else if (OS_ANDROID) {
		Alloy.Globals.fonts = {
			primary: {
				regular: 'Roboto',
				medium: 'Roboto-Medium',
				bold: 'Roboto-Bold',
				light: 'Roboto-Light'
			}
		};
	}

	// Add and initialize the Analytics functionality.
	try {
		Alloy.Globals.analytics = require('com.appcelerator.aca');
	} catch (e) {
		Alloy.Globals.analytics = {
			leaveBreadcrumb() {},
			setUsername() {},
			logHandledException() {},
			setMetadata() {}
		};
		Alloy.Globals.doLog && console.error('com.appcelerator.aca module is not available');
	}

	/**
	 * @method
	 * ##Private
	 * used for generating guid values
	 */
	function S4() {
		return (65536 * (1 + Math.random()) | 0).toString(16).substring(1);
	};

	/**
	 * @method
	 * ##Private
	 * Gets the current decimal char separator based on current locale
	 */
	function currentDecimalSeparator() {
		var n = 1.1;
		n = String.formatDecimal(n, Alloy.Globals.currentLocale, '0.00').substring(1, 2);
		return n;
	};

	/**
	 * @method getEnvironmentVariable
	 * @private
	 * Gets doLog value depending on the appid
	 * @return {void}
	 */
	function getDoLogVariable() {
		var appId = Ti.App.id;
		var doLog = false;

		switch (appId) {
		case 'com.dll.expressfinance.acc':
		case 'com.dll.expressfinance.sit.acc':
		case 'com.dll.expressfinance.upgrade.acc':
		case 'com.dll.expressfinance.stage':
		case 'com.dllstore.expressfinance.prod':
		case 'com.dll.expressfinance.demo':
			doLog = false;
			break;

		case 'com.dll.expressfinance.dev':
		case 'com.dll.expressfinance.test':
		case 'com.dll.expressfinance.sit.tst':
		case 'com.dll.expressfinance.upgrade.tst':
			/* falls through */
		default:
			doLog = true;
		}

		return doLog;
	}

	/**
	 * @method getEnvironmentVariable
	 * @private
	 * Gets base WSUrl value depending on the appid
	 * @return {void}
	 */
	function getBaseWSUrlVariable() {
		var appId = Ti.App.id;
		var baseWSUrl = null;

		switch (appId) {

		case 'com.dll.expressfinance.acc':
		case 'com.dll.expressfinance.sit.acc':
		case 'com.dll.expressfinance.upgrade.acc':
			baseWSUrl = 'https://servicesracc.delagelanden.com';
			break;

		case 'com.dll.expressfinance.stage':
		case 'com.dllstore.expressfinance.prod':
			baseWSUrl = 'https://servicesr.delagelanden.com';
			break;

		case 'com.dll.expressfinance.demo':
			baseWSUrl = 'https://servicesr.delagelanden.com';
			break;

		case 'com.dll.expressfinance.dev':
		case 'com.dll.expressfinance.test':
		case 'com.dll.expressfinance.sit.tst':
		case 'com.dll.expressfinance.upgrade.tst':
			/* falls through */
		default:
			baseWSUrl = 'https://servicesrtst.delagelanden.com';
		}

		return baseWSUrl;
	}

	function getDemoFlag() {
		var appId = Ti.App.id;

		switch (appId) {

		case 'com.dll.expressfinance.dev':
			return true;

		default:
			return false;
		}
	}

	/**
	 * @method getEnvironmentVariable
	 * @private
	 * Gets environment value depending on the appid
	 * @return {void}
	 */
	function getEnvironmentVariable() {
		var appId = Ti.App.id;
		var environment = null;

		switch (appId) {

		case 'com.dll.expressfinance.acc':
		case 'com.dll.expressfinance.sit.acc':
		case 'com.dll.expressfinance.upgrade.acc':
			environment = 'acc';
			break;

		case 'com.dll.expressfinance.stage':
		case 'com.dllstore.expressfinance.prod':
			environment = 'prod';
			break;

		case 'com.dll.expressfinance.demo':
			environment = 'demo';
			break;

		case 'com.dll.expressfinance.dev':
		case 'com.dll.expressfinance.test':
		case 'com.dll.expressfinance.sit.tst':
		case 'com.dll.expressfinance.upgrade.tst':
			/* falls through */
		default:
			environment = 'tst';

			return environment;
		}
	}

	/**
	 * @method getBaseWSUrlApiBuilder
	 * @private
	 * Gets baseWSUrlApiBuilder value depending on the appid
	 * @return {void}
	 */
	function getBaseWSUrlApiBuilder() {
		var appId = Ti.App.id;
		var baseWSUrlApiBuilder = null;

		switch (appId) {

		case 'com.dll.expressfinance.acc':
		case 'com.dll.expressfinance.sit.acc':
		case 'com.dll.expressfinance.upgrade.acc':
			baseWSUrlApiBuilder = 'https://292e118500b1df107a4990cba5086a0b4beb23a2.cloudapp-enterprise.appcelerator.com';
			break;

		case 'com.dll.expressfinance.stage':
		case 'com.dllstore.expressfinance.prod':
			baseWSUrlApiBuilder = 'https://598ebaaa1f531f57d60185cf4301d04389179222.cloudapp-enterprise.appcelerator.com';
			break;

		case 'com.dll.expressfinance.demo':
			baseWSUrlApiBuilder = 'https://598ebaaa1f531f57d60185cf4301d04389179222.cloudapp-enterprise.appcelerator.com';
			break;

		case 'com.dll.expressfinance.dev':
		case 'com.dll.expressfinance.test':
		case 'com.dll.expressfinance.sit.tst':
		case 'com.dll.expressfinance.upgrade.tst':
			/* falls through */
		default:
			//baseWSUrlApiBuilder = 'http://localhost:8080';
			baseWSUrlApiBuilder = 'https://dcdfc73aa11d4164990a21bbc323ac4cfdb10859.cloudapp-enterprise.appcelerator.com';
		}

		return baseWSUrlApiBuilder;
	}

	/**
	 * @method getBaseWSApiKeyApiBuilder
	 * @private
	 * Gets baseWSApiKeyApiBuilder value depending on the appid
	 * @return {void}
	 */
	function getBaseWSApiKeyApiBuilder() {
		var appId = Ti.App.id;
		var baseWSApiKeyApiBuilder = null;

		switch (appId) {

		case 'com.dll.expressfinance.acc':
		case 'com.dll.expressfinance.sit.acc':
		case 'com.dll.expressfinance.upgrade.acc':
			baseWSApiKeyApiBuilder = 'U82HF896qhbRPpbym8k97fNz8+GXjiYYrTGt4WZP';
			break;

		case 'com.dll.expressfinance.stage':
		case 'com.dllstore.expressfinance.prod':
			baseWSApiKeyApiBuilder = 'Mm=@PUdqFP>P233Ao=gDhwm6M34udW';
			break;

		case 'com.dll.expressfinance.demo':
			baseWSApiKeyApiBuilder = 'Mm=@PUdqFP>P233Ao=gDhwm6M34udW';
			break;

		case 'com.dll.expressfinance.dev':
		case 'com.dll.expressfinance.test':
		case 'com.dll.expressfinance.sit.tst':
		case 'com.dll.expressfinance.upgrade.tst':
			/* falls through */
		default:
			//baseWSApiKeyApiBuilder = 'ALVS0Ap8ZAcjMvezb60rGgeQmwJbue9g'; // localhost
			baseWSApiKeyApiBuilder = '4P5OtStt0g0xhRMhdwg5Ze1EhXAtm4Ud'; // tst
		}

		return baseWSApiKeyApiBuilder;
	}

	/**
	 * @method getUpdateUrl
	 * @private
	 * Gets updateUrl value depending on the appid
	 * @return {void}
	 */
	function getUpdateUrl() {
		var appId = Ti.App.id;
		var updateUrl = null;

		switch (appId) {

		case 'com.dll.expressfinance.acc':
		case 'com.dll.expressfinance.sit.acc':
		case 'com.dll.expressfinance.upgrade.acc':
			updateUrl = 'https://is.gd/ND8vw3';
			break;

		case 'com.dll.expressfinance.stage':
		case 'com.dllstore.expressfinance.prod':
			updateUrl = 'https://itunes.apple.com/us/app/express-finance/id1073673467';
			break;

		case 'com.dll.expressfinance.demo':
			updateUrl = 'https://is.gd/XhEYe3';
			break;

		case 'com.dll.expressfinance.dev':
		case 'com.dll.expressfinance.test':
		case 'com.dll.expressfinance.sit.tst':
		case 'com.dll.expressfinance.upgrade.tst':
			/* falls through */
		default:
			updateUrl = 'https://is.gd/F3lgfv';
		}

		return updateUrl;
	}
})();
