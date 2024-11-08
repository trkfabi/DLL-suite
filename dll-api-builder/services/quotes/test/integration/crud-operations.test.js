const request = require('request-promise-native');
const should = require('should');
const _ = require('lodash');
const mocks = require('../lib/mocks');

describe('services/quotes', () => {
	describe('integration/crud-operations', () => {
		const userId = 'MOBILEUser1@webssodev.user';
		const group = 'OT';
		let quote = null;

		before((done) => {
			setTimeout(() => {
				done();
			}, 5000);
		});

		describe('POST /api/quotes/quote', () => {

			it(`Should save a new quote with id: null`, async () => {

				let quoteMock = _.extend(mocks.quote(), {
					id: null,
					salesRepID: userId
				});
				const response = await request({
					url: `${HOST}/api/quotes/quote`,
					method: 'POST',
					json: true,
					body: quoteMock,
					headers: {
						'x-userId': userId,
						'x-group': group
					},
					auth: {
						username: API_KEY,
						password: ''
					}
				});

				response.should.have.property('quote').be.Object().not.empty();

				quote = response.quote;
				quote.should.have.property('id').be.String().not.empty();
				quote.should.have.property('alloy_id').equal(quoteMock.alloy_id);

				quote.should.have.property('amountFinanced').equal(quoteMock.amountFinanced);
				quote.should.have.property('contractDate').equal(quoteMock.contractDate);
				quote.should.have.property('creditRatingId').equal(quoteMock.creditRatingId);
				quote.should.have.property('creditRatingName').equal(quoteMock.creditRatingName);
				quote.should.have.property('customQuoteName').equal(quoteMock.customQuoteName);
				quote.should.have.property('customer').deepEqual(quoteMock.customer);
				quote.should.have.property('dateCreated').equal(quoteMock.dateCreated);
				quote.should.have.property('deleted').equal(quoteMock.deleted);
				quote.should.have.property('displayPaybackPercentage').equal(quoteMock.displayPaybackPercentage);
				quote.should.have.property('equipments').deepEqual(quoteMock.equipments);
				quote.should.have.property('expirationDate').equal(quoteMock.expirationDate);
				quote.should.have.property('isFavorited').equal(quoteMock.isFavorited);
				quote.should.have.property('modifiedDate').equal(quoteMock.modifiedDate);
				quote.should.have.property('name').equal(quoteMock.name);
				quote.should.have.property('paymentOptionOpened').equal(quoteMock.paymentOptionOpened);
				quote.should.have.property('paymentOptionSelected').equal(quoteMock.paymentOptionSelected);
				quote.should.have.property('paymentOptions').deepEqual(quoteMock.paymentOptions);
				quote.should.have.property('pdfFileName').equal(quoteMock.pdfFileName);
				quote.should.have.property('revision').equal(quoteMock.revision);
				quote.should.have.property('submitStatus').equal(quoteMock.submitStatus);
				quote.should.have.property('shareButtonTimesPressed').equal(quoteMock.shareButtonTimesPressed);
				quote.should.have.property('shareSummaryButtonTimesPressed').equal(quoteMock.shareSummaryButtonTimesPressed);
				quote.should.have.property('financedAmountTimesChanged').equal(quoteMock.financedAmountTimesChanged);
				quote.should.have.property('customerRecordTimesChanged').equal(quoteMock.customerRecordTimesChanged);
				quote.should.have.property('customerRecordCancelTimesChanged').equal(quoteMock.customerRecordCancelTimesChanged);
				quote.should.have.property('creditRatingTimesChanged').equal(quoteMock.creditRatingTimesChanged);
				quote.should.have.property('creditRatingCancelTimesChanged').equal(quoteMock.creditRatingCancelTimesChanged);
				quote.should.have.property('summaryQuoteValidTimesChanged').equal(quoteMock.summaryQuoteValidTimesChanged);
				quote.should.have.property('summaryFileNameTimesChanged').equal(quoteMock.summaryFileNameTimesChanged);
				quote.should.have.property('summaryDisplayPlaybackOnTimesChanged').equal(quoteMock.summaryDisplayPlaybackOnTimesChanged);
				quote.should.have.property('summaryDisplayPlaybackOffTimesChanged').equal(quoteMock.summaryDisplayPlaybackOffTimesChanged);

			});

			it('Should update a quote with id: not-null', async () => {
				const quoteMock = _.extend({}, mocks.quote(), {
					id: quote.id,
					salesRepID: userId,
					alloy_id: quote.alloy_id
				});

				const response = await request({
					url: `${HOST}/api/quotes/quote`,
					method: 'POST',
					json: true,
					body: quoteMock,
					headers: {
						'x-userId': userId,
						'x-group': group
					},
					auth: {
						username: API_KEY,
						password: ''
					}
				});

				response.should.have.property('quote').be.Object().not.empty();
				const newQuote = response.quote;

				newQuote.should.have.property('id').equal(quote.id);
				newQuote.should.have.property('alloy_id').equal(quote.alloy_id);

				quote = newQuote;

				quote.should.have.property('amountFinanced').equal(quoteMock.amountFinanced);
				quote.should.have.property('contractDate').equal(quoteMock.contractDate);
				quote.should.have.property('creditRatingId').equal(quoteMock.creditRatingId);
				quote.should.have.property('creditRatingName').equal(quoteMock.creditRatingName);
				quote.should.have.property('customQuoteName').equal(quoteMock.customQuoteName);
				quote.should.have.property('customer').deepEqual(quoteMock.customer);
				quote.should.have.property('dateCreated').equal(quoteMock.dateCreated);
				quote.should.have.property('deleted').equal(quoteMock.deleted);
				quote.should.have.property('displayPaybackPercentage').equal(quoteMock.displayPaybackPercentage);
				quote.should.have.property('equipments').deepEqual(quoteMock.equipments);
				quote.should.have.property('expirationDate').equal(quoteMock.expirationDate);
				quote.should.have.property('isFavorited').equal(quoteMock.isFavorited);
				quote.should.have.property('modifiedDate').equal(quoteMock.modifiedDate);
				quote.should.have.property('name').equal(quoteMock.name);
				quote.should.have.property('paymentOptionOpened').equal(quoteMock.paymentOptionOpened);
				quote.should.have.property('paymentOptionSelected').equal(quoteMock.paymentOptionSelected);
				quote.should.have.property('paymentOptions').deepEqual(quoteMock.paymentOptions);
				quote.should.have.property('pdfFileName').equal(quoteMock.pdfFileName);
				quote.should.have.property('revision').equal(quoteMock.revision);
				quote.should.have.property('submitStatus').equal(quoteMock.submitStatus);
				quote.should.have.property('shareButtonTimesPressed').equal(quoteMock.shareButtonTimesPressed);
				quote.should.have.property('shareSummaryButtonTimesPressed').equal(quoteMock.shareSummaryButtonTimesPressed);
				quote.should.have.property('financedAmountTimesChanged').equal(quoteMock.financedAmountTimesChanged);
				quote.should.have.property('customerRecordTimesChanged').equal(quoteMock.customerRecordTimesChanged);
				quote.should.have.property('customerRecordCancelTimesChanged').equal(quoteMock.customerRecordCancelTimesChanged);
				quote.should.have.property('creditRatingTimesChanged').equal(quoteMock.creditRatingTimesChanged);
				quote.should.have.property('creditRatingCancelTimesChanged').equal(quoteMock.creditRatingCancelTimesChanged);
				quote.should.have.property('summaryQuoteValidTimesChanged').equal(quoteMock.summaryQuoteValidTimesChanged);
				quote.should.have.property('summaryFileNameTimesChanged').equal(quoteMock.summaryFileNameTimesChanged);
				quote.should.have.property('summaryDisplayPlaybackOnTimesChanged').equal(quoteMock.summaryDisplayPlaybackOnTimesChanged);
				quote.should.have.property('summaryDisplayPlaybackOffTimesChanged').equal(quoteMock.summaryDisplayPlaybackOffTimesChanged);
			});
		});

		describe('GET /api/quotes/quotes', () => {
			it(`Should return quotes for user ${userId}`, async () => {
				const response = await request({
					url: `${HOST}/api/quotes/quotes`,
					method: 'GET',
					json: true,
					headers: {
						'x-userId': userId,
						'x-group': group
					},
					auth: {
						username: API_KEY,
						password: ''
					}
				});

				response.should.have.property('result').be.Array().not.empty();

				const result = response.result;

				result.forEach(quote => {
					const {
						id,
						salesRepID
					} = quote;

					id.should.not.be.empty();
					id.should.be.a.String();

					salesRepID.should.equal(userId, `quote [${id}] id from another user.`);
				});
			});

			it(`Should return an empty array for users with no quotes`, async () => {
				const response = await request({
					url: `${HOST}/api/quotes/quotes`,
					method: 'GET',
					json: true,
					headers: {
						'x-userId': 'no-user',
						'x-group': group
					},
					auth: {
						username: API_KEY,
						password: ''
					}
				});

				response.should.have.property('result').be.Array().be.empty();
			});

			it(`Should return a error 400 if header "x-userId" is missing`, async () => {
				try {
					const response = await request({
						url: `${HOST}/api/quotes/quotes`,
						method: 'GET',
						json: true,
						auth: {
							username: API_KEY,
							password: ''
						}
					});

					response.should.not.be.ok();
				} catch (error) {
					const {
						statusCode,
						response: {
							body: {
								success
							}
						}
					} = error;

					statusCode.should.equal(400);
					success.should.equal(false);
				}
			});
		});

		// describe('GET quote/:id');
		// describe('GET quotes/query');

		describe('DELETE /api/quotes/quote', () => {
			it('Should mark the quote as deleted', async () => {
				await request({
					url: `${HOST}/api/quotes/quote`,
					method: 'DELETE',
					json: true,
					body: {
						id: quote.id
					},
					headers: {
						'x-userId': userId,
						'x-group': group
					},
					auth: {
						username: API_KEY,
						password: ''
					}
				});

				const response = await request({
					url: `${HOST}/api/quotes/quote/${quote.id}`,
					method: 'GET',
					json: true,
					headers: {
						'x-userId': userId,
						'x-group': group
					},
					auth: {
						username: API_KEY,
						password: ''
					}
				});

				response.should.have.property('quote').be.Object().not.empty();
				const newQuote = response.quote;

				newQuote.should.have.property('id').equal(quote.id);
				newQuote.should.have.property('alloy_id').equal(quote.alloy_id);

				newQuote.should.have.property('amountFinanced').equal(quote.amountFinanced);
				newQuote.should.have.property('contractDate').equal(quote.contractDate);
				newQuote.should.have.property('creditRatingId').equal(quote.creditRatingId);
				newQuote.should.have.property('creditRatingName').equal(quote.creditRatingName);
				newQuote.should.have.property('customQuoteName').equal(quote.customQuoteName);
				newQuote.should.have.property('customer').deepEqual(quote.customer);
				newQuote.should.have.property('dateCreated').equal(quote.dateCreated);
				newQuote.should.have.property('deleted').equal(true);
				newQuote.should.have.property('displayPaybackPercentage').equal(quote.displayPaybackPercentage);
				newQuote.should.have.property('equipments').deepEqual(quote.equipments);
				newQuote.should.have.property('expirationDate').equal(quote.expirationDate);
				newQuote.should.have.property('isFavorited').equal(quote.isFavorited);
				newQuote.should.have.property('modifiedDate').equal(quote.modifiedDate);
				newQuote.should.have.property('name').equal(quote.name);
				newQuote.should.have.property('paymentOptionOpened').equal(quote.paymentOptionOpened);
				newQuote.should.have.property('paymentOptionSelected').equal(quote.paymentOptionSelected);
				newQuote.should.have.property('paymentOptions').deepEqual(quote.paymentOptions);
				newQuote.should.have.property('pdfFileName').equal(quote.pdfFileName);
				newQuote.should.have.property('revision').equal(quote.revision);
				newQuote.should.have.property('submitStatus').equal(quote.submitStatus);
				newQuote.should.have.property('shareButtonTimesPressed').equal(quote.shareButtonTimesPressed);
				newQuote.should.have.property('shareSummaryButtonTimesPressed').equal(quote.shareSummaryButtonTimesPressed);
				newQuote.should.have.property('financedAmountTimesChanged').equal(quote.financedAmountTimesChanged);
				newQuote.should.have.property('customerRecordTimesChanged').equal(quote.customerRecordTimesChanged);
				newQuote.should.have.property('customerRecordCancelTimesChanged').equal(quote.customerRecordCancelTimesChanged);
				newQuote.should.have.property('creditRatingTimesChanged').equal(quote.creditRatingTimesChanged);
				newQuote.should.have.property('creditRatingCancelTimesChanged').equal(quote.creditRatingCancelTimesChanged);
				newQuote.should.have.property('summaryQuoteValidTimesChanged').equal(quote.summaryQuoteValidTimesChanged);
				newQuote.should.have.property('summaryFileNameTimesChanged').equal(quote.summaryFileNameTimesChanged);
				newQuote.should.have.property('summaryDisplayPlaybackOnTimesChanged').equal(quote.summaryDisplayPlaybackOnTimesChanged);
				newQuote.should.have.property('summaryDisplayPlaybackOffTimesChanged').equal(quote.summaryDisplayPlaybackOffTimesChanged);
			});
		});
	});

});
