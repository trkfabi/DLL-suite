const should = require('should');
const request = require('request-promise-native');

describe('services/dll-services', () => {
	describe('integration/customizations', () => {
		const api = '/api/dll/customizations';
		it('Should return customizations for mobileuser1', () => {
			return request({
					url: `${HOST}${api}`,
					method: 'GET',
					headers: {
						'x-userId': 'MOBILEUser1@webssodev.user',
						'x-group': 'OT'
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
								Status: {
									Code,
								},
								Brand: {
									BrandID
								},
								Artifact: {
									Artifact: [{
										Type,
										Class,
										Description,
										ExpirationDate,
										LastModifiedDate,
										ContentType,
										ContentEncoding,
										Content
									}]
								}
							}
						}
					} = response;

					statusCode.should.equal(200);
					success.should.equal(true);

					Code.should.equal('S');

					BrandID.should.not.be.empty();
					BrandID.should.be.String();

					Type.should.not.be.empty();
					Type.should.be.String();

					Class.should.not.be.empty();
					Class.should.be.String();

					Description.should.not.be.empty();
					Description.should.be.String();

					ExpirationDate.should.not.be.empty();
					ExpirationDate.should.be.String();

					LastModifiedDate.should.not.be.empty();
					LastModifiedDate.should.be.String();

					ContentType.should.not.be.empty();
					ContentType.should.be.String();

					ContentEncoding.should.not.be.empty();
					ContentEncoding.should.be.String();

					Content.should.not.be.empty();
					Content.should.be.String();
				});

		});
	});

});
