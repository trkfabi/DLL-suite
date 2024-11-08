/**
 * Base library for starting all the integrtion and e2e tests
 * @class Test.base
 * @singleton
 */

const process = require('process');

const env = require('node-env-file');

const LOG_TAG = '\x1b[36m' + '[test/lib/base]' + '\x1b[39;49m ';

const Base = (function () {
	// +-------------------
	// | Private members.
	// +-------------------
	global.doLog = false;
	global.TEST_IN_PROD = process.env.TEST_ENV === 'production';
	global.log = require('../../../lib/reusable/helpers').log;

	let server = null;
	// +-------------------
	// | Public members.
	// +-------------------

	const start = ({
		hostEnv,
		apiKeyEnv
	} = {}) => {
		return new Promise((resolve, reject) => {
			if (TEST_IN_PROD) {
				env(`${__dirname}/../../../vars.env`);

				global.HOST = process.env[hostEnv];
				global.API_KEY = process.env[apiKeyEnv];

				console.log(`${LOG_TAG} - Testing services in production`);
				return resolve();
			}

			server = require('../../../app');

			server.on('started', () => {
				global.HOST = process.env[`${hostEnv}`];
				global.API_KEY = process.env[`${apiKeyEnv}`];

				resolve();
			});
		});
	};

	const stop = () => {
		return new Promise((resolve, reject) => {
			if (TEST_IN_PROD) {
				return resolve();
			}

			server.on('stopped', () => {
				resolve();
			});

			server.stop();

			server = null;
		});
	};

	return {
		start,
		stop
	};
})();

module.exports = Base;
