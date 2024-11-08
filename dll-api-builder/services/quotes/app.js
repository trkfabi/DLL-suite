global.doLog = true;
global.log = require('./lib/reusable/helpers').log;

const Arrow = require('@axway/api-builder-runtime');
const env = require('node-env-file');
const GatewayConnector = require('./lib/reusable/gatewayConnector');

env(`${__dirname}/vars.env`);

const server = new Arrow();

// lifecycle examples
server.on('starting', function () {
	server.logger.debug('server is starting!');
});

server.on('started', function () {
	server.logger.debug('server started!');

	console.log(`server.config: ${JSON.stringify(server.config)}`);

	GatewayConnector.start(server);
});

server.on('stopped', () => {
	GatewayConnector.stop();
});

// start the server
server.start();

module.exports = server;
