const {
	create,
	update,
	remove,
	request,
	testSchema,
} = require('../lib/test.helpers');
const should = require('should');
const _ = require('lodash');

describe('services/rate-cards-afs', () => {
	describe('integration/publish', () => {
		let rateCard = null;
		let version = null;

		before((done) => {
			setTimeout(() => {
				done();
			}, 5000);
		});

		it('Create a new rate card', async () => {
			rateCard = await create('rateCard');
			version = rateCard.versions[0];
		});

		it('Updates the version in progress', async () => {
			await update('version', {
				id: version.id
			});
		});

		const categories = 1;
		const products = 1;
		const vendors = 1;

		for (let i = 0; i < categories; i++) {
			let category = null;
			it(`Adds category ${i}`, async () => {
				category = await create('category', {
					versionId: version.id
				});
			});

			for (let j = 0; j < products; j++) {
				it(`Adds product ${i + j}`, async () => {
					await create('product', {
						versionId: version.id,
						categoryId: category.id
					});
				});
			}
		}

		for (let i = 0; i < vendors; i++) {
			it(`Adds vendor code ${i}`, async () => {
				await create('vendorCode', {
					rateCardId: rateCard.id
				});
			});
		}

		it('Recalculates the version', async () => {
			const response = await request(`version/recalculate/${version.id}?display=admin`);
			testSchema('rateFactors', response.result, {
				type: 'admin'
			});
		});

		it('Publish the version', async () => {
			const {
				result: publishedRateCard
			} = await request('rate_card/publish', 'POST', {
				id: rateCard.id
			});
			testSchema('rateCard', publishedRateCard);

			const {
				versions
			} = publishedRateCard;
			const versionPublishing = _.find(versions, {
				isPublishing: true
			});

			const rateFactors = versionPublishing.rateFactors;

			let updatedVersion = null;

			do {
				const update = await request(`version/${versionPublishing.id}`);
				updatedVersion = update.result;

				testSchema('version', updatedVersion);

				updatedVersion.should.have.property('isPublishing').be.Boolean();
				updatedVersion.should.have.property('canPublish').equal(false);
			} while (updatedVersion.isPublishing);

			const options = {
				includeRateFactors: true,
				baseOnly: false
			};

			const {
				result: {
					rateFactors: savedRateFactors
				}
			} = await request(`version/${versionPublishing.id}?options=${JSON.stringify(options)}`);

			rateFactors.length.should.equal(savedRateFactors.length);
			rateFactors.should.containDeep(savedRateFactors);
		});

		it('does not allow updates to the published version', async () => {
			try {
				const response = await update('version', {
					id: version.id
				});
				response.should.not.be.ok();
			} catch (error) {
				error.should.be.ok();
				error.should.have.property('statusCode').equal(400);
			}

			try {
				const response = await remove('version', version.id);
				response.should.not.be.ok();
			} catch (error) {
				error.should.have.property('statusCode').equal(400);
			}

			try {
				const response = await create('category', {
					versionId: version.id
				});
				response.should.not.be.ok();
			} catch (error) {
				error.should.be.ok();
				error.should.have.property('statusCode').equal(400);
			}

			try {
				const response = await create('vendorCode', {
					rateCardId: rateCard.id
				});
				response.should.not.be.ok();
			} catch (error) {
				error.should.be.ok();
				error.should.have.property('statusCode').equal(400);
			}
		});

		it('Remove the rate card', async () => {
			await remove('rateCard', rateCard.id);
		});

	});
});
