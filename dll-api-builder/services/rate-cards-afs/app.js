global.doLog = true;
global.log = require('./lib/reusable/helpers').log;

const _ = require('lodash');

const Arrow = require('@axway/api-builder-runtime');
const env = require('node-env-file');
const GatewayConnector = require('./lib/reusable/gatewayConnector');
const DataManager = require('./lib/data-manager');


env(`${__dirname}/vars.env`);

const server = new Arrow();

// lifecycle examples
server.on('starting', function () {
	server.logger.debug('server is starting!');
});

server.on('started', function () {
	server.logger.debug('server started!');

	log('server.config', server.config);

	GatewayConnector.start(server);

	server.dataManager = new DataManager();
});

server.on('stopping', () => {
	server.dataManager.stop();
	GatewayConnector.stop();
});

// start the server
server.start();

module.exports = server;
