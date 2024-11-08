/**
 * Authorization for all calls, using DLL custom login
 * @class lib.auth
 * @singleton
 */
const Crypto = require('./crypto');
const RequestError = require('./reusable/errors/requestError');

const LOG_TAG = '\x1b[32m' + '[lib/auth]' + '\x1b[39;49m ';

const Auth = function () {
	// +-------------------
	// | Private members.
	// +-------------------

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method matchUrl
	 * Determines if the URL should be authenticated by the plugin. Return true if the plugin should handle the validation else return false.	 * @param {object} req Request object containing the url, requestor and other infos
	 * @return {boolean}
	 */
	const matchUrl = () => {
		return true;
	};

	/**
	 * @method validateRequest
	 * Performs the actual validation for authenticating the user
	 * @param {object} req Request object
	 * @param {function} callback Function called once the validation completed, for async calls
	 * @return {Promise}
	 */
	const validateRequest = (req) => {
		log(LOG_TAG, 'validateRequest', {
			req
		});

		const authHeader = req.get('Authorization') || '';

		if (!authHeader) {
			throw RequestError('Missing Authorization Header.', 401);
		}

		const [, token] = authHeader.match(/^Bearer (.+)$/) || [];

		if (!token) {
			throw RequestError('Missing Authorization Token.', 401);
		}

		const tokenPayload = Crypto.validateToken(token);
		const {
			userId,
			error: {
				message = 'Unknown Error.'
			} = {}
		} = (tokenPayload || {});

		if (!userId) {
			throw RequestError(`Invalid Authorization Token: ${message}`, 401);
		}

		req.tokenPayload = tokenPayload;

		return true;
	};

	/**
	 * @method applyCredentialsForTest
	 * Internally used for default calls from within the auto-generated docs
	 * @param {object} options same options as passed to the req object 
	 * @return {void}
	 */
	const applyCredentialsForTest = () => {
		//Do Something
	};

	/**
	 * @method applyRequestsForTest
	 * Used by the API Doc tab in the API Builder Console to allow the plugin to modify the authentication response headers, body, etc.
	 * @param {object} res response opbject
	 * @param {object} body parameters sent in POST calls 
	 * @return {void}
	 */
	const applyRequestsForTest = () => {
		//Do Something
	};

	/**
	 * @method getSwaggerSecurity
	 * Used by Swagger generation to describe the Swagger Definitions Object and the Swagger Requirement Object authentication mechanism.
	 * @param {type} _param param_description
	 * @return {void}
	 */
	const getSwaggerSecurity = () => {
		//Do Something
	};

	return {
		matchUrl,
		validateRequest,
		applyCredentialsForTest,
		applyRequestsForTest,
		getSwaggerSecurity,
	};
};

module.exports = Auth;
