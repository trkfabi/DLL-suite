// Global variables
global.moment = require('alloy/moment');
global.doLog = false;
// This modifies the Backbone.Model and Backbone.Collection namespaces across the whole app
var backboneNested = require('external/backbone-nested-models');

(function () {
	var isSimulator = (Ti.Platform.model === 'Simulator');
	var deviceWidth = Ti.Platform.displayCaps.platformWidth;
	var deviceHeight = Ti.Platform.displayCaps.platformHeight;
	var logicalDensityFactor = Ti.Platform.displayCaps.logicalDensityFactor;
	var OSVersion = Ti.Platform.version;
	var appId = Ti.App.id;
	var baseWSUrl = null;
	var environment = null;
	var isDemo = false;

	switch (appId) {

	case 'com.othc.expressfinance.acc':
	case 'com.othc.expressfinance.sit.acc':
		environment = 'acc';
		baseWSUrl = 'https://servicesracc.delagelanden.com';
		doLog = false;
		break;

	case 'com.othc.expressfinance.demo':
		isDemo = true;
		/* falls through */
	case 'com.othc.expressfinance.stage':
	case 'com.othcstore.expressfinance.prod':
		environment = 'prod';
		baseWSUrl = 'https://servicesr.delagelanden.com';
		doLog = false;
		break;

	case 'com.othc.expressfinance.dev':
	case 'com.othc.expressfinance.test':
	case 'com.othc.expressfinance.sit.tst':
		/* falls through */
	default:
		environment = 'tst';
		baseWSUrl = 'https://servicesrtst.delagelanden.com';
		doLog = true;
	}

	doLog && console.log('[alloy.js] environment: ' + environment);

	// TODO: All this constants should be documented
	Alloy.Globals = {
		/**
		 * @constant Alloy.Globals.appID
		 * @public
		 * Manual App Identifier
		 */
		appID: 'OTHC',

		/**
		 * @constant Alloy.Globals.policyVersion
		 * @public
		 * Ts & Cs version of the login screen
		 */
		policyVersion: '1.0',

		/**
		 * @constant Alloy.Globals.privacyStatementUrl
		 * @public
		 * Url of Privacy Statement
		 */
		privacyStatementUrl: 'https://www.lesseedirect.com/usprivacy',

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
		 * @constant Alloy.Globals.submitDocs
		 * @public
		 * Documents used by the quote for the submission (quote's property on DB)
		 */
		submitDocs: [
			'leaseFileName'
		],

		/**
		 * @constant Alloy.Globals.sessionStatus
		 * @public
		 * Statuses for the user session
		 */
		sessionStatus: {
			inactive: 0,
			active: 1,
			rcmRequired: 2
		},

		useLocalCustomizations: false,

		isDemo: isDemo,

		doLog: doLog,

		environment: environment,

		currentLocale: Ti.Locale.currentLocale,

		currentLanguage: Ti.Locale.currentLanguage.split('-')[0],

		OSVersion: OSVersion,

		OSMajorVersion: parseInt(OSVersion.split('.')[0], 10),

		osName: Ti.Platform.osname,

		model: Ti.Platform.model,

		platformID: Ti.Platform.id,

		manufacturer: Ti.Platform.manufacturer,

		appVersion: Ti.App.version,

		width: deviceWidth,

		height: deviceHeight,

		density: Ti.Platform.displayCaps.density,

		dpi: Ti.Platform.displayCaps.dpi,

		logicalDensityFactor: logicalDensityFactor,

		paymentRowHeight: OS_IOS ? 73 : 79,

		headerHeight: OS_IOS ? 65 : 60,

		decimalSeparator: currentDecimalSeparator(),

		displayAndroidHeight: (deviceHeight / logicalDensityFactor) - ((Alloy.isTablet) ? 27 : 25),

		loginAndroidHeight: (deviceHeight / logicalDensityFactor) - ((Alloy.isTablet) ? 300 : 160),

		iPhoneTall: (OS_IOS && deviceHeight > 480),

		hasNotch: (OS_IOS && deviceHeight >= 812),

		hasNotchLarge: (OS_IOS && deviceHeight >= 896),

		settingsURL: (OS_IOS ? Ti.App.iOS.applicationOpenSettingsURL : null),

		solveForDrawerWidth: OS_IOS ? (deviceHeight * 0.3) : (deviceHeight / logicalDensityFactor * 0.3),

		amountFinancedLimits: {
			min: 0,
			max: 250000
		},

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
		baseWSUrl: baseWSUrl,

		privacyPolicyURL: 'http://dll-privacy.propelics.com/expressfinance_terms.html',

		opacityDisabled: 0.45,

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
		 * @variable Alloy.Globals.updateRequestLoading
		 * @public
		 * TRUE when a request is made and until it returns
		 */
		updateRequestLoading: false,

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

		versionCheckSoftAlertDismissTimeProperty: 'version_control_due_softalert',

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

		forceUpdate: true,

		/**
		 * @constant Alloy.Globals.shortenerWSUrl
		 * @public
		 * Service to extend shortened urls (for version update)
		 */
		shortenerWSUrl: 'https://is.gd/forward.php'
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
	 * @method getBaseWSUrlApiBuilder
	 * @private
	 * Gets baseWSUrlApiBuilder value depending on the appid
	 * @return {void}
	 */
	function getBaseWSUrlApiBuilder() {
		var appId = Ti.App.id;
		var baseWSUrlApiBuilder = null;

		switch (appId) {

		case 'com.othc.expressfinance.acc':
		case 'com.othc.expressfinance.sit.acc':
		case 'com.othc.expressfinance.upgrade.acc':
			baseWSUrlApiBuilder = 'https://292e118500b1df107a4990cba5086a0b4beb23a2.cloudapp-enterprise.appcelerator.com';
			break;

		case 'com.othc.expressfinance.stage':
		case 'com.othcstore.expressfinance.prod':
		case 'com.othc.expressfinance.demo':
			baseWSUrlApiBuilder = 'https://598ebaaa1f531f57d60185cf4301d04389179222.cloudapp-enterprise.appcelerator.com';
			break;

		case 'com.othc.expressfinance.dev':
		case 'com.othc.expressfinance.test':
		case 'com.othc.expressfinance.sit.tst':
		case 'com.othc.expressfinance.upgrade.tst':
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

		case 'com.othc.expressfinance.acc':
		case 'com.othc.expressfinance.sit.acc':
		case 'com.othc.expressfinance.upgrade.acc':
			baseWSApiKeyApiBuilder = 'U82HF896qhbRPpbym8k97fNz8+GXjiYYrTGt4WZP';
			break;

		case 'com.othc.expressfinance.stage':
		case 'com.othcstore.expressfinance.prod':
		case 'com.othc.expressfinance.demo':
			baseWSApiKeyApiBuilder = 'Mm=@PUdqFP>P233Ao=gDhwm6M34udW';
			break;

		case 'com.othc.expressfinance.dev':
		case 'com.othc.expressfinance.test':
		case 'com.othc.expressfinance.sit.tst':
		case 'com.othc.expressfinance.upgrade.tst':
			/* falls through */
		default:
			//baseWSApiKeyApiBuilder = 'ALVS0Ap8ZAcjMvezb60rGgeQmwJbue9g'; // localhost
			baseWSApiKeyApiBuilder = '4P5OtStt0g0xhRMhdwg5Ze1EhXAtm4Ud'; // tst
		}

		return baseWSApiKeyApiBuilder;
	}

})();
