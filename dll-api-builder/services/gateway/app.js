global.doLog = true;
global.log = require('./lib/reusable/helpers').log;

const Arrow = require('@axway/api-builder-runtime');
const env = require('node-env-file');

const WildcardAPI = require('./lib/apis/wildcard');
const ServiceManager = require('./lib/serviceManager');
const EnvManager = require('./lib/envManager');
const Crypto = require('./lib/crypto');


env(`${__dirname}/vars.env`);

const server = new Arrow();

// lifecycle examples
server.on('starting', function () {
	server.logger.debug('server is starting!');

	server.app.use((req, res, next) => {
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
		next();
	});
});

server.on('started', function () {
	server.logger.debug('server started!');

	log('server.config', server.config);

	Crypto.init(server);
	ServiceManager.init(server);
	EnvManager.init(server);
	WildcardAPI.init(server.app);
});

// start the server
server.start();

module.exports = server;
