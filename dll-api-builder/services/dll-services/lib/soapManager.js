/**
 * Manager for creating clients to manage soap requests
 * @class Utils.soapManager
 * @singleton
 */

const soap = require('soap');

const LOG_TAG = '\x1b[35m' + '[utils/soapManager]' + '\x1b[39;49m ';

const SoapManager = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	let locations = {};

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method init
	 * Initialices the singleton with configurations from arrow
	 * @param {object} server arrowdb instance
	 * @return {void}
	 */
	const init = (server) => {
		doLog && console.log(`${LOG_TAG} - init`);

		const {
			config: {
				locations: _locations = {}
			} = {}
		} = server;

		locations = _locations;
	};

	/**
	 * @method createClient
	 * Creates a new soap client based on the given wsdl name, should be in assets
	 * @param {string} wsdl Name of the wsdl file to load
	 * @return {Promise}
	 */
	const createClient = (wsdl) => {
		doLog && console.log(LOG_TAG, '- createClient');

		let endpoint = locations[wsdl];

		if (!endpoint) {
			throw Error(`wsdl not supported: ${wsdl}`);
		}

		return soap
			.createClientAsync(`assets/soap/${wsdl}.wsdl`, {
				endpoint
			})
			.then(client => {
				client.setSecurity(new soap.ClientSSLSecurity(
					'assets/security/dllgroup.key',
					'assets/security/dllgroup.crt',
					'assets/security/digicert_high_assurance_ev_root_ca.cer'
				));

				return client;
			});
	};

	return {
		init,
		createClient
	};
})();

module.exports = SoapManager;
