const util = require('util');
const Arrow = require('@axway/api-builder-runtime');

const SoapManager = require('../lib/soapManager');
const {
	handleError
} = require('../lib/reusable/helpers');

const LOG_TAG = '\x1b[31m' + '[apis/authenticateAPI]' + '\x1b[39;49m ';

const AuthenticateAPI = Arrow.API.extend({
	group: 'authorization',
	path: '/api/dll/authorization/',
	method: 'POST',
	description: 'Authenticate with DLL API example',
	parameters: {
		username: {
			description: 'User to authenticate',
			optional: true,
			type: 'body'
		},
		password: {
			description: 'Password of the user',
			optional: true,
			type: 'body'
		},
		refreshToken: {
			description: 'token to refresh',
			optional: true,
			type: 'body'
		}
	},
	action: function (req, res, next) {
		// invoke the model find method passing the id parameter
		// stream the result back as response
		// resp.stream(req.model.find, req.params.id, next);

		const {
			params: {
				username = '',
				password = '',
				refreshToken = ''
			}
		} = req;

		doLog && console.debug(`${LOG_TAG}`);

		if (!username && !password && !refreshToken) {
			next('Missing authorization data');
			return;
		}

		SoapManager
			.createClient('MobileClientAuthorization')
			.then((client) => {
				let authenticateMethod = null;
				let body = null;

				if (username && password) {
					authenticateMethod = util.promisify(client.MCAAuthenticate);
					body = {
						Credentials: {
							Realm: 'MobileSalesForce',
							UserIdentifier: username,
							Password: password
						}
					};
				} else if (refreshToken) {
					authenticateMethod = util.promisify(client.MCAValidateToken);
					body = {
						AuthorizationToken: refreshToken,
						API: null
					};
				}

				return authenticateMethod(body);
			})
			.then(response => {
				doLog && console.debug(`${LOG_TAG} - response: ${JSON.stringify(response)}`);
				next(null, response);
			})
			.catch(error => {
				handleError(error, req, res, next);
			});
	}
});

module.exports = AuthenticateAPI;
