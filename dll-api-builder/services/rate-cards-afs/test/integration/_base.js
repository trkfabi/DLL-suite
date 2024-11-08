const Base = require('../lib/reusable/base');

before(async () => {
	return await Base.start({
		hostEnv: 'RATE_CARDS_AFS_HOST',
		apiKeyEnv: 'RATE_CARDS_AFS_APIKEY'
	});
});

after(() => {
	return Base.stop();
});
