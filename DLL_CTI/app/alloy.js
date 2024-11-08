// Global variables
global.moment = require('alloy/moment');
global.doLog = false;
// This modifies the Backbone.Model and Backbone.Collection namespaces across the whole app
var backboneNested = require('/utils/backbone-nested-models');

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

	case 'com.cti.expressfinance.acc':
	case 'com.cti.expressfinance.sit.acc':
	case 'com.cti.expressfinance.upgrade.acc':
		environment = 'acc';
		baseWSUrl = 'https://servicesracc.delagelanden.com';
		doLog = false;
		break;

	case 'com.cti.expressfinance.demo':
		isDemo = true;
		/* falls through */
	case 'com.cti.expressfinance.stage':
	case 'com.dllstore.expressfinancecti.prod':
		environment = 'prod';
		baseWSUrl = 'https://servicesr.delagelanden.com';
		doLog = false;
		break;

	case 'com.cti.expressfinance.dev':
	case 'com.cti.expressfinance.test':
	case 'com.cti.expressfinance.sit.tst':
	case 'com.cti.expressfinance.upgrade.tst':
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
		appID: 'CTI',

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
		 * @constant Alloy.Globals.submitDocs
		 * @public
		 * Documents used by the quote for the submission (quote's property on DB)
		 */
		submitDocs: [
			'creditAppFileName',
			'leaseFileName'
		],

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

		solveForDrawerWidth: OS_IOS ? (deviceHeight * 0.3) : (deviceHeight / logicalDensityFactor * 0.3),

		/**
		 * @constant Alloy.Globals.formats
		 * @public
		 * Possible formats for dates, will come from the current country loaded
		 */
		formats: {},

		colors: {
			blackHalfTransparent: '#88000000',
			shiraz: '#A90D2E',
			emperor: '#555555',
			laser: '#C4AA71',
			scorpion: "#575757",
			nobel: "#B5B5B5",
			transparent: 'transparent',
			lochmara: '#0081bf',
			mantis: '#60c750',
			contessa: '#c67272',
			tamarillo: '#9A151C',
			black: '#000',
			mineShaft: '#353535',
			shuttleGray: '#576067',
			mercury: '#e4e4e4',
			alabasterSolid: '#fafafa',
			white: '#FFFFFF',
			nevada: "#6a6d6e",
			abbey: "#454749",
			azureRadiance: "#0099FF",
			regentStBlue: "#99bbdd",
			silver: "#c2c2c2",
			bonJour: "#f0ecee",
			mountbattenPink: "#947987",
			dustyGray: "#b3a1aa",
			swirl: "#d1cbc7",
			alto: "#d5d5d5",
			gray: "#7f7f7f",
			alabaster: "#F7F7F7",
			crimson: "#C41230",
			pesto: "#88713E",
			barleyCorn: '#9B844F',
			shark: "#191C1E",
			geyser: "#DDE2E5",
			falcon: '#816474',
			grayApprox: "#8D8D8D",
			gallery: '#EBEBEB',
			mineShaftApprox: "#282828",
			thunder: "#231f20",
			tundora: "#454545",
			muddyWaters: '#B69A5E',
			galleryApprox: '#EDEDED',
			seashell: '#F1F1F1'
		},

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
		/**
		 * @method Alloy.Globals.generateGUID
		 * ##Public
		 * Generates a GUID value
		 */
		generateGUID: function () {
			return S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4();
		}
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

	// Add and initialize the APM functionality.
	try {
		Alloy.Globals.analytics = require("com.appcelerator.aca");
	} catch (e) {
		console.error("com.appcelerator.aca module is not available");
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
})();
