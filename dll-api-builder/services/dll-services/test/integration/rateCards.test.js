const should = require('should');
const request = require('request-promise-native');

describe('services/dll-services', () => {
	describe('integration/rateCards', () => {
		const api = '/api/dll/rateCards';
		it('Should return rateCards for mobileuser1', () => {
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
								RateCard: {
									LastModificationDate,
									EffectiveThrough,
									Rows: {
										Row: [{
											RP: rowRP,
											PO,
											PF,
											APC,
											APT,
											T,
											Min,
											Max,
											PL,
											NP,
											P,
											R,
										}]
									}
								},
								RateCardPromos: {
									RPD: [{
										RP: promoRP,
										Description
									}]
								}
							}
						}
					} = response;

					statusCode.should.equal(200);
					success.should.equal(true);
					Code.should.equal('S');

					LastModificationDate.should.be.String();
					LastModificationDate.should.not.be.empty();

					EffectiveThrough.should.be.String();
					EffectiveThrough.should.not.be.empty();

					rowRP.should.not.be.empty();
					rowRP.should.be.String();

					PO.should.not.be.empty();
					PO.should.be.String();

					PF.should.not.be.empty();
					PF.should.be.String();

					APC.should.not.be.empty();
					APC.should.be.String();

					APT.should.not.be.empty();
					APT.should.be.String();

					T.should.not.be.empty();
					T.should.be.String();

					Min.should.not.be.empty();
					Min.should.be.String();

					Max.should.not.be.empty();
					Max.should.be.String();

					PL.should.not.be.empty();
					PL.should.be.String();

					NP.should.not.be.empty();
					NP.should.be.String();

					P.should.not.be.empty();
					P.should.be.String();

					R.should.not.be.empty();
					R.should.be.String();

					promoRP.should.not.be.empty();
					promoRP.should.be.String();

					Description.should.not.be.empty();
					Description.should.be.String();

				});

		});
	});

});
