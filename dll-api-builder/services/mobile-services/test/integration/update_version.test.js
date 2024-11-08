const should = require('should');
const request = require('request-promise-native');

describe('services/mobile-services', () => {
	describe('integration/update_version', () => {
		const api = '/api/mobile/update_version';

		describe('Success calls', () => {
			const initialInput = {
				'app_id': 'com.propelics.dll.apptest.dev',
				'minimum_version': '1.0.0',
				'latest_version': '1.1.0',
				'duration': '00:01:00',
				'redirect_url': 'propelics.com'
			};
			let initialResponse = null;

			beforeEach(() => {
				return request({
						url: `${HOST}${api}`,
						method: 'POST',
						body: initialInput,
						auth: {
							username: API_KEY,
							password: ''
						},
						json: true,
						resolveWithFullResponse: true
					})
					.then(response => {
						initialResponse = response;
					});
			});

			it('Should work with all parameters (test beforeEach())', () => {
				const {
					statusCode,
					body: {
						success,
						version: {
							app_id,
							minimum_version,
							latest_version: {
								version,
							},
							meta: {
								duration,
								redirect_url
							}
						}
					}
				} = initialResponse;

				statusCode.should.equal(200);
				success.should.equal(true);

				app_id.should.equal(initialInput.app_id);
				minimum_version.should.equal(initialInput.minimum_version);
				version.should.equal(initialInput.latest_version);
				duration.should.equal(initialInput.duration);
				redirect_url.should.equal(initialInput.redirect_url);
			});

			it('Should update only minimum_version', () => {
				const body = {
					app_id: initialInput.app_id,
					minimum_version: '1.1.0'
				};

				return request({
						url: `${HOST}${api}`,
						method: 'POST',
						body,
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
								version: {
									app_id,
									minimum_version,
									latest_version: {
										version,
									},
									meta: {
										duration,
										redirect_url
									}
								}
							}
						} = response;

						statusCode.should.equal(200);
						success.should.equal(true);

						app_id.should.equal(body.app_id);
						minimum_version.should.equal(body.minimum_version);
						version.should.equal(initialInput.latest_version);
						duration.should.equal(initialInput.duration);
						redirect_url.should.equal(initialInput.redirect_url);
					});
			});

			it('Should update only latest_version', () => {
				const body = {
					app_id: initialInput.app_id,
					latest_version: '2.0.0'
				};

				return request({
						url: `${HOST}${api}`,
						method: 'POST',
						body,
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
								version: {
									app_id,
									minimum_version,
									latest_version: {
										version,
									},
									meta: {
										duration,
										redirect_url
									}
								}
							}
						} = response;

						statusCode.should.equal(200);
						success.should.equal(true);

						app_id.should.equal(body.app_id);
						minimum_version.should.equal(initialInput.minimum_version);
						version.should.equal(body.latest_version);
						duration.should.equal(initialInput.duration);
						redirect_url.should.equal(initialInput.redirect_url);
					});
			});
		});
	});

});
