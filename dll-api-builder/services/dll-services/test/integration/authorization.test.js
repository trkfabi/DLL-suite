const should = require('should');
const request = require('request-promise-native');

describe('services/dll-services', () => {
	describe(`ingration/authorization`, () => {
		const api = '/api/dll/authorization';

		it('Login with mobileuser1', () => {
			return request({
					url: `${HOST}${api}`,
					method: 'POST',
					body: {
						username: 'mobileuser1',
						password: 'A0545747B07DBCB8B316992896C50D08'
					},
					auth: {
						username: API_KEY,
						password: ''
					},
					json: true,
					resolveWithFullResponse: true
				})
				.then(response => {
					const {
						statusCode,
						body: {
							success,
							result: {
								AuthenticateResult: {
									AuthorizationToken,
									UserIdentity,
									Status: {
										Code,
									},
									Data: {
										APIList: {
											APIType: {
												Href
											}
										}
									}
								}

							}
						}
					} = response;

					statusCode.should.equal(200);
					success.should.equal(true);

					AuthorizationToken.should.not.be.empty();
					AuthorizationToken.should.be.String();

					UserIdentity.should.not.be.empty();
					UserIdentity.should.be.String();

					Code.should.not.be.empty();
					Code.should.be.String();

					Href.should.not.be.empty();
					Href.should.be.String();
				});
		});

		it('Login with wrong user', () => {
			return request({
					url: `${HOST}${api}`,
					method: 'POST',
					body: {
						username: 'mobile',
						password: '14Characterpw!'
					},
					auth: {
						username: API_KEY,
						password: ''
					},
					json: true,
					resolveWithFullResponse: true
				})
				.then(response => {
					const {
						statusCode,
						body: {
							success,
							result: {
								AuthenticateResult: {
									Status: {
										Code,
										Message
									}
								}
							}
						}
					} = response;

					statusCode.should.equal(200);
					success.should.equal(true);
					Code.should.equal('F');

					Message.should.not.be.empty();
					Message.should.be.a.String();
				});
		});
	});
});
