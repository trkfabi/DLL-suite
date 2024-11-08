const process = require('process');

/**
 * this is your configuration file defaults.
 *
 * You can create additional configuration files to that the server will load based on your
 * environment.  For example, if you want to have specific settings for production which are different
 * than your local development environment, you can create a production.js and a local.js.  Any changes
 * in those files will overwrite changes to this file (a object merge is performed). By default, your
 * local.js file will not be commited to git or the registry.
 *
 * This is a JavaScript file (instead of JSON) so you can also perform logic in this file if needed.
 */
module.exports = {
	// these are your generated API keys.  They were generated uniquely when you created this project.
	// DO NOT SHARE these keys with other projects and be careful with these keys since they control
	// access to your API using the default configuration.  if you don't want two different keys for
	// production and test (not recommended), use the key 'apikey'.  To simulate running in production,
	// set the environment variable NODE_ENV to production before running such as:
	//
	// NODE_ENV=production appc run
	//
	// production key, this is the key that will be required when you are running in production
	apikey: process.env.GATEWAY_APIKEY,

	envName: process.env.ENV_NAME,

	baseurl: 'http://localhost',

	// by default the authentication strategy is 'basic' which will use HTTP Basic Authorization where the
	// usename is the key and the password is blank.  the other option is 'apikey' where the value of the
	// APIKey header is the value of the key.  you can also set this to 'plugin' and define the key 'APIKeyAuthPlugin'
	// which points to a file or a module that implements the authentication strategy

	accessControl: {
		apiPrefixSecurity: 'basic',
		// public: []
		public: ['/api/afs_rate_cards', '/api/rate_cards', '/api/gateway', '/api/dll', '/api/mobile', '/api/quotes']
	},

	authKey: process.env.AUTH_KEY,
	authIV: process.env.AUTH_IV,
	authTokenExpiration: process.env.AUTHTOKEN_EXPIRATION,
	refreshTokenExpiration: process.env.REFRESHTOKEN_EXPIRATION,

	// The number of milliseconds before timing out a request to the server.
	timeout: 120000,

	// logging configuration
	logLevel: 'debug', // Log level of the main logger.
	logging: {
		// location of the logs if enabled
		logdir: './logs',
		// turn on transaction logs
		transactionLogEnabled: true,
		// turn on adi logging of transaction logs
		adiLogging: false
	},

	// prefix to use for apis
	apiPrefix: '/api/gateway',

	// control the settings for the admin website
	admin: {
		// control whether the admin website is available
		enabled: true,
		// The hostnames or IPs from which connections to admin are allowed. Hostnames must be resolvable on the
		// server. IP ranges can also be specified. e.g. [ 'localhost', '192.168.1.0/24', '10.1.1.1' ]
		// An empty list [] will allow unrestricted access, though this is not recommended due to security concerns.
		allowedHosts: [
			'localhost', '::1'
		]
	},
	apidoc: {
		// the prefix for the API documentation
		prefix: '/apidoc',
		// if you set disable, in production your swagger API docs will not show up
		disable: false
	},
	// you can generally leave this as-is since it is generated for each new project you created.
	session: {
		encryptionAlgorithm: process.env.SESSION_ENCRYPTION_ALGORITHM,
		encryptionKey: process.env.SESSION_ENCRYPTION_KEY,
		signatureAlgorithm: process.env.SESSION_SIGNATURE_ALGORITHM,
		signatureKey: process.env.SESSION_SIGNATURE_KEY,
		secret: process.env.SESSION_SECRET,
		duration: process.env.SESSION_DURATION,
		activeDuration: process.env.SESSION_ACTIVEDURATION,
	},

	// if you want signed cookies, you can set this value. if you don't want signed cookies, remove or make null
	cookieSecret: 'giBw3XWeiBJZi5bw9Z1VZl8sFnzVqnCA',

	serialization: {
		// Here for backwards compatibility with older arrow apps. When you set this to
		// true, a model's primary key will always be exposed under 'id' instead of it's
		// actual name
		exposePrimaryKeyAsId: false
	},

	// your connector configuration goes here
	connectors: {},

	// the date and time format to be used for admin-ui. Default is 'yyyy:mm:dd, HH:MM:ss.l'
	// reference: https://github.com/felixge/node-dateformat
	dateTimeFormat: 'yyyy-mm-dd, HH:MM:ss.l',

	// cross-origin-resource-sharing settings
	cors: {
		// list of allowed origins (format: any, space separated string, array or regex)
		'Access-Control-Allow-Origin': '*' // or 'http://foo.com http://bar.com' or ['http://foo.com', 'http://bar.com'] or /foo\.com$/,

		// 'Access-Control-Allow-Credentials': true/false,

		// only these methods will be allowed out of all available methods for an endpoint. All available methods are allowed by default
		// (format: comma separated string or, an array)
		// 'Access-Control-Allow-Methods': 'GET' or 'GET, PUT' or ['GET', 'PUT'],

		// allowed request headers (format: comma separated string or, an array)
		// 'Access-Control-Allow-Headers': 'content-type, authorization' or ['content-type', 'authorization']

		// list of response headers exposed to the user. Always exposed headers: request-id, response-time and any headers defined in the endpoint
		// (format: comma separated string or, an array)
		// 'Access-Control-Expose-Headers': 'content-type, response-time' or ['content-type', 'response-time']
	},

	flags: {
		enableAliasesInCompositeOperators: true,
		enableNullModelFields: true,
		enableModelNameEncodingInSwagger: true,
		enableModelNameEncodingWithConnectorSlash: true,
		usePrimaryKeyType: true,
		enableModelNameEncoding: true,
		enableMemoryConnectorLike: true,
		exitOnPluginFailure: true,
		enableScopedConfig: true,
		enableModelsWithNoPrimaryKey: true
	},
	environments: {
		'dev': {
			apiKey: process.env.DEV_KEY,
			host: process.env.DEV_HOST,
		},
		'tst': {
			apiKey: process.env.TST_KEY,
			host: process.env.TST_HOST,
		},
		'acc': {
			apiKey: process.env.ACC_KEY,
			host: process.env.ACC_HOST,
		},
		'release': {
			apiKey: process.env.PROD_KEY,
			host: process.env.PROD_HOST,
		}
	},
	'service-paths': {
		'dll-services': [{
			'path': '/api/dll/(.*)',
			'requiresAuth': true
		}],
		'rate-cards': [{
			'path': '/api/rate_cards/(.*)',
			'requiresAuth': true
		}, {
			'path': '/api/afs_rate_cards/(.*)',
			'requiresAuth': true
		}],
		'quotes': [{
			'path': '/api/quotes/(.*)',
			'requiresAuth': true
		}],
		'mobile-services': [{
			'path': '/api/mobile/version/(.*)',
			'requiresAuth': false
		}, {
			'path': '/api/mobile/(.*)',
			'requiresAuth': true
		}]
	}
};
