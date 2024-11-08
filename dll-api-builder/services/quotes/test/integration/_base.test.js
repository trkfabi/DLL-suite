const Base = require('../lib/reusable/base');

before(() => {
	return Base.start({
		hostEnv: 'QUOTES_HOST',
		apiKeyEnv: 'QUOTES_APIKEY'
	});
});

after(() => {
	return Base.stop();
});
