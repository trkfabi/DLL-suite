module.exports = {
	connectors: {
		mbs: {
			connector: '@axway/api-builder-plugin-dc-mbs',
			baseurl: 'https://api.cloud.appcelerator.com',
			key: process.env.ARROWDB_KEY,
			username: process.env.ARROWDB_USER,
			password: process.env.ARROWDB_PASS,
			pingInterval: Number(process.env.MBS_PING_INTERVAL)
		}
	}
};
