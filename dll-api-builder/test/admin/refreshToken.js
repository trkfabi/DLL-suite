const should = require('should');
const request = require('request-promise-native');

const api = '/api/gateway/refreshToken';

describe(api, () => {
	it('Should update authToken, refreshToken', () => {
		return request({
			url: `${HOST}${api}`,
			method: 'POST',
			body: {
				authToken: AUTH_TOKEN,
				refreshToken: REFRESH_TOKEN
			},
			json: true,
			auth: {
				username: API_KEY,
				password: ''
			}
		}).then(response => {
			const {
				success,
				result: {
					authToken,
					refreshToken
				}
			} = response;

			should(success).equal(true);

			should(authToken).not.be.empty();
			should(authToken).be.a.String();
			should(authToken).not.be.equal(AUTH_TOKEN);

			should(refreshToken).not.be.empty();
			should(refreshToken).be.a.String();
			should(refreshToken).not.be.equal(REFRESH_TOKEN);

			AUTH_TOKEN = authToken;
			REFRESH_TOKEN = refreshToken;
		});
	});

	it('Should return error (401) with wrong token, authToken', () => {
		return request({
				url: `${HOST}${api}`,
				method: 'POST',
				body: {
					authToken: 'some token',
					refreshToken: null
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
