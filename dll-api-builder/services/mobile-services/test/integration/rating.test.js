const should = require('should');
const request = require('request-promise-native');

describe('services/mobile-services', () => {
	describe('integration/rating', () => {
		const api = '/api/mobile/rating';
		it('Get all ratings in 1 call', () => {
			return request({
					url: `${HOST}${api}`,
					method: 'GET',
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
							result
						}
					} = response;

					statusCode.should.equal(200);
					success.should.equal(true);

					result.should.be.an.Array();
					result.should.not.be.empty();

					result.forEach(item => {
						const {
							created_at,
							updated_at,
							id
						} = item;

						created_at.should.not.be.empty();
						created_at.should.be.a.String();

						updated_at.should.not.be.empty();
						updated_at.should.be.a.String();

						id.should.not.be.empty();
						id.should.be.a.String();
					});

				});

		});
	});

});
