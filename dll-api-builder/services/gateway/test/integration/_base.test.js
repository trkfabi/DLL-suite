const Base = require('../lib/reusable/base');

before(() => {
	return Base.start({
		hostEnv: 'GATEWAY_HOST',
		apiKeyEnv: 'GATEWAY_APIKEY'
	});
});

after(() => {
	return Base.stop();
});
