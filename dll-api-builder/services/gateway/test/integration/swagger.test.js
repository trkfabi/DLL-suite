const should = require('should');
const request = require('request-promise-native');

describe('services/gateway', () => {
	describe('integration/swagger', () => {
		const api = '/api/gateway/swagger';
		it('returns a swagger json', () => {
			return request({
					url: `${global.HOST}${api}`,
					method: 'GET',
					auth: {
						username: global.API_KEY,
						password: ''
					},
					json: true,
					resolveWithFullResponse: true
				})
				.then(response => {
					if (Object.keys(response).length > 0) {
						const {
							statusCode,
							body: {
								swagger = '',
								info: {
									title = '',
									description = '',
									version = ''
								},
								host = '',
								basePath = '',
								schemes = [],
								consumes = [],
								produces = [],
								paths = {},
								securityDefinitions = {},
								security = []
							}
						} = response;

						statusCode.should.equal(200);

						swagger.should.not.be.empty();
						swagger.should.be.a.String();

						title.should.not.be.empty();
						title.should.be.a.String();

						description.should.not.be.empty();
						description.should.be.a.String();

						version.should.not.be.empty();
						version.should.be.a.String();

						host.should.not.be.empty();
						host.should.be.a.String();

						basePath.should.not.be.empty();
						basePath.should.be.a.String();

						schemes.should.not.be.empty();
						schemes.should.be.an.Array();

						consumes.should.not.be.empty();
						consumes.should.be.an.Array();

						produces.should.not.be.empty();
						produces.should.be.an.Array();

						paths.should.not.be.empty();
						paths.should.be.an.Object();

						securityDefinitions.should.be.an.Object();

						security.should.be.an.Array();
					}
				});
		});
	});

});
