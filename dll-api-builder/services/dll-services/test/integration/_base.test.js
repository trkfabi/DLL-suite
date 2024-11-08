const Base = require('../lib/reusable/base');

before(() => {
	return Base.start({
		hostEnv: 'DLL_SERVICES_HOST',
		apiKeyEnv: 'DLL_SERVICES_APIKEY'
	});
});

after(() => {
	return Base.stop();
});
