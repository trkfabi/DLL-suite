const Base = require('../lib/reusable/base');

before(() => {
	return Base.start({
		hostEnv: 'MOBILE_SERVICES_HOST',
		apiKeyEnv: 'MOBILE_SERVICES_APIKEY'
	});
});

after(() => {
	return Base.stop();
});
