const should = require('should');
const request = require('request-promise-native');

const api = '/api/gateway/authenticate';

describe(api, () => {
	const webSSOUserId = 'MOBILEUser1@webssodev.user';

	it('Should work with a regular login', () => {
		return request({
				url: `${HOST}${api}`,
				method: 'POST',
				body: {
					username: 'mobileuser1',
					password: 'Welcome1'
				},
				json: true,
				auth: {
					username: API_KEY,
					password: ''
				}
			})
			.then(response => {
				const {
					success,
					result: {
						userId,
						authToken: _authToken,
						refreshToken: _refreshToken,
						apiType: {
							Href: href
						}
					}
				} = response;

				should(success).equal(true);

				should(userId).be.a.String();
				should(userId).not.be.empty();
				should(userId).equal(webSSOUserId);

				should(href).be.a.String();
				should(href).not.be.empty();

				should(_authToken).be.a.String();
				should(_authToken).not.be.empty();

				should(_refreshToken).be.a.String();
				should(_refreshToken).not.be.empty();
			});
	});

	it('Should work with query include=vendorCode', () => {
		return request({
				url: `${HOST}${api}`,
				qs: {
					include: 'vendorCode'
				},
				method: 'POST',
				body: {
					username: 'mobileuser1',
					password: '14Characterpw!'
				},
				json: true,
				auth: {
					username: API_KEY,
					password: ''
				}
			})
			.then(response => {
				const {
					success,
					result: {
						userId,
						vendorCode,
						authToken,
						refreshToken,
						apiType: {
							Href: href
						}
					}
				} = response;

				should(success).equal(true);

				should(userId).be.a.String();
				should(userId).not.be.empty();

				should(vendorCode).be.a.String();
				should(vendorCode).not.be.empty();

				should(href).be.a.String();
				should(href).not.be.empty();

				should(authToken).be.a.String();
				should(authToken).not.be.empty();

				should(refreshToken).be.a.String();
				should(refreshToken).not.be.empty();

				global.AUTH_TOKEN = authToken;
				global.REFRESH_TOKEN = refreshToken;
			});

	});

	it('Should fail with an incorrect user', () => {
		return request({
				url: `${HOST}${api}`,
				method: 'POST',
				body: {
					username: 'mobiluser1',
					password: '14Characterpw!'
				},
				json: true,
				auth: {
					username: API_KEY,
					password: ''
				}
			})
			.then(response => {
				should(response).be.empty();
			})
			.catch(error => {
				const {
					statusCode,
					error: {
						message,
						success
					}
				} = error;

				should(message).be.a.String();
				should(message).not.be.empty();

				should(statusCode).equal(401);

				should(success).equal(false);
			});
	});
});
