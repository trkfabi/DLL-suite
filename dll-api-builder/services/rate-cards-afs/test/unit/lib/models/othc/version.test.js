const _ = require('lodash');
const should = require('should');
const uuid = require('uuid/v4');

const Version = require('../../../../../lib/models/othc/version.model');
const Mocks = require('../../../../lib/othc/mocks');

const {
	testSchema
} = require('../../../../lib/othc/test.helpers');

const {
	id
} = require('../../../../lib/reusable/random');

const versionData = ({
	nVendors = 3,
	nRatePrograms = 3
} = {}) => {

	let ratePrograms = [];
	let vendorCodes = [];
	let vendorCodeNames = [];

	for (let i = 0; i < nVendors; i++) {
		let vendorCode = Mocks.vendorCode();
		vendorCodes.push(vendorCode);
		vendorCodeNames.push(vendorCode.name);
	}

	for (let i = 0; i < nRatePrograms; i++) {
		let rateProgram = Mocks.rateProgram();
		rateProgram.order = i + 1;
		ratePrograms.push(rateProgram);
	}

	return _.extend({}, Mocks.version(), {
		rateCardId: uuid(),
		vendorCodes,
		vendorCodeNames,
		ratePrograms
	});
};

describe('services/rate-cards', () => {
	describe('models/othc/version', () => {
		let version = null;
		const appName = 'othc';

		beforeEach(() => {
			// Creates a version with:
			// 3 rate programs
			version = Version.create(versionData()).init();
		});

		describe('#create', () => {
			it('Should create a new version with no parameters', () => {
				const version = Version.create();
				testSchema('version', version, {
					type: 'model',
					strict: false
				});
				version.app.should.equal(appName);
			});
			it('Should create a new version with the given parameters', () => {
				const input = Mocks.version();
				const version = Version.create(input);
				testSchema('version', version, {
					type: 'model',
					strict: false
				});
				version.should.containDeep(input);
				version.app.should.equal(appName);
			});
			it('Should parse ArrowDB nested models', () => {
				const createMultiple = (mock, count = 2) => {
					let result = [];
					for (let i = 0; i < count; i++) {
						result.push(mock());
					}

					return result;
				};
				const ratePrograms = createMultiple(Mocks.rateProgram, 2);

				const input = _.extend({}, Mocks.version(), {
					'[CUSTOM_rate_program]rate_program_ids': ratePrograms,
				});
				const version = Version.create(input);
				testSchema('version', version, {
					type: 'model',
					strict: false
				});
				version.should.containDeep({
					ratePrograms
				});
			});
			it('Should not parse ArrowDB ids-only', () => {
				const input = _.extend({}, Mocks.version(), {
					'[CUSTOM_rate_program]rate_program_ids': ['cbsalae12o1891m3', 'c4slp2e123891me',
						'cb5aoy423891me'
					],
				});
				const version = Version.create(input);
				testSchema('version', version, {
					type: 'model',
					strict: false
				});
				version.ratePrograms.should.be.Array().empty();
			});
		});

		describe('#init', () => {
			it('Should pass strict schemas', () => {
				testSchema('version', version, {
					type: 'model',
					strict: true
				});
			});

			it('Should assign versionId to all nested models', () => {
				const versionId = version.uid;

				version.ratePrograms.forEach(rateProgram => {
					rateProgram.versionId.should.equal(versionId);
				});
			});
		});

		describe('#duplicate', () => {
			it('Should return a copy of the version with all uids changed', () => {
				const duplicate = version.duplicate();

				testSchema('version', duplicate, {
					type: 'model',
					strict: true
				});

				duplicate.uid.should.not.equal(version.uid);

				duplicate.should.containDeep({
					cofs: version.cofs,
					terms: version.terms,
					canPublish: true,
					archived: false,
					published: false,
				});

				duplicate.ratePrograms.length.should.equal(version.ratePrograms.length);
			});
		});

		describe('#dependencies', () => {
			it('Should return only nested models with updates', () => {
				version.ratePrograms[0].update({
					name: 'My new rateProgram'
				});

				const dependencies = version.dependencies();
				dependencies.should.be.Array().have.length(1);

				dependencies.should.containDeep([
					version.ratePrograms[0]
				]);
			});

			it('Should return `[]` with no updates on nested models', () => {
				const dependencies = version.dependencies();
				dependencies.should.be.Array().empty();
			});
		});

		describe('#forArrow', () => {
			it('Should return the specific properties for arrowdb', () => {
				version.ratePrograms.forEach(rateProgram => {
					rateProgram.id = id();
				});

				const forArrow = version.forArrow();

				forArrow.should.containDeep({
					rateCardId: version.rateCardId,
					terms: version.terms,
					canPublish: version.canPublish,
					archived: version.archived,
					deleted: version.deleted,
					published: version.published,
					datePublished: version.datePublished,
					cofs: version.cofs,
				});

				forArrow.should.have.property('[CUSTOM_rate_program]rate_program_ids').be.Array().length(
					version.ratePrograms.length);

				forArrow['[CUSTOM_rate_program]rate_program_ids'].forEach(rateProgram => {
					rateProgram.should.be.String().not.empty();
				});

			});

			it('Should not return removed ratePrograms', () => {
				version.ratePrograms.forEach(rateProgram => {
					rateProgram.id = id();
				});

				const rateProgramRemoved = version.ratePrograms[0];

				version.removeRateProgram(rateProgramRemoved.uid);

				const forArrow = version.forArrow();

				forArrow.should.containDeep({
					rateCardId: version.rateCardId,
					terms: version.terms,
					canPublish: version.canPublish,
					archived: version.archived,
					deleted: version.deleted,
					published: version.published,
					datePublished: version.datePublished,
					cofs: version.cofs,
				});

				forArrow.should.have.property('[CUSTOM_rate_program]rate_program_ids').be.Array().length(
					version.ratePrograms.length - 1);

				forArrow['[CUSTOM_rate_program]rate_program_ids'].forEach(rateProgram => {
					rateProgram.should.be.String().not.empty();
				});

			});

			it('Should not return ratePrograms without id', () => {
				const forArrow = version.forArrow();

				forArrow.should.containDeep({
					rateCardId: version.rateCardId,
					terms: version.terms,
					canPublish: version.canPublish,
					archived: version.archived,
					deleted: version.deleted,
					published: version.published,
					datePublished: version.datePublished,
					cofs: version.cofs,
				});

				forArrow.should.have.property('[CUSTOM_rate_program]rate_program_ids').be.Array().empty();
			});
		});

		describe('#forAPI', () => {
			it('Should pass strict check for api', () => {
				const forAPI = version.forAPI();

				testSchema('version', forAPI, {
					type: 'api',
					strict: true
				});
			});

			it('Should return `[]` on empty arrays of models', () => {
				const version = Version.create(_.extend(Mocks.version(), {
					rateCardId: uuid()
				})).init();
				const forAPI = version.forAPI();

				testSchema('version', forAPI, {
					type: 'api',
					strict: true
				});

				forAPI.ratePrograms.should.be.Array().empty();
			});

			it('Should not return removed nested models', () => {
				const rateProgramRemoved = version.ratePrograms[0];
				version.removeRateProgram(rateProgramRemoved.uid);

				const forAPI = version.forAPI();
				testSchema('version', forAPI, {
					type: 'api',
					strict: true
				});

				forAPI.ratePrograms.should.not.containDeep([rateProgramRemoved]);
			});
		});

		describe('#remove', () => {
			it('Should mark deleted=true and all its nested models', () => {
				version.remove();

				version.deleted.should.equal(true);
				version._hasUpdates.should.equal(true);
				version.ratePrograms.should.not.be.empty();
				version.ratePrograms.forEach(rateProgram => {
					rateProgram.deleted.should.equal(true);
					rateProgram._hasUpdates.should.equal(true);
				});

				version.dependencies().should.not.be.empty();
			});
		});

		describe('#update', () => {
			it('Should not update the appName', () => {
				version.update({
					app: 'NewAPP'
				});

				testSchema('version', version, {
					type: 'model',
					strict: false
				});

				version.app.should.equal(appName);
			});
			it('Should update a valid list of terms', () => {
				const terms = Mocks.version().terms;
				version.update({
					terms
				});

				testSchema('version', version, {
					type: 'model',
					strict: false
				});

				version.terms.should.deepEqual(terms);
				version._hasUpdates.should.equal(true);
			});

			it('Should validate invalid terms and remove them', () => {
				const terms = ['1', 'a', 'b', '0010', null];
				const expected = ['1', '10'];

				version.update({
					terms
				});

				testSchema('version', version, {
					type: 'model',
					strict: false
				});

				version.terms.should.deepEqual(expected);
				version._hasUpdates.should.equal(true);
			});

			it('Should apply the same terms to existing cofs', () => {
				const terms = ['6', '24', '48', '120'];
				const cofs = Mocks.version().cofs;
				version.update({
					terms,
					cofs
				});

				testSchema('version', version, {
					type: 'model',
					strict: false
				});

				version._hasUpdates.should.equal(true);
				version.terms.should.deepEqual(terms);
				version.cofs.map(cof => cof.term).should.deepEqual(terms);

			});
			it('Should remove a removed version term from all rate programs and if added again it should not be added to rate programs', () => {
				//Version starts with the following terms loaded on beforeEach: ['12', '24', '36', '48', '72']
				//rate program starts with the following terms: ['12', '24', '36']
				const terms = ['12', '48'];
				version.update({
					terms
				});

				testSchema('version', version, {
					type: 'model',
					strict: false
				});

				version._hasUpdates.should.equal(true);
				version.ratePrograms.forEach(rateProgram => {
					version.terms.should.containDeep(rateProgram.terms);
				});

				const newTerms = ['12', '36', '48', '52'];
				const validTermsInRateprograms = ['12', '48'];
				version.update({
					terms: newTerms
				});
				version.ratePrograms.forEach(rateProgram => {
					validTermsInRateprograms.should.containDeep(rateProgram.terms);
				});

			});

			it('Should update the given cofs');
		});

		describe('#validateVersionIsInProgress', () => {
			it('Should throw an error if the current version is not in progress', () => {
				version.update({
					canPublish: true,
					published: true
				});
				should.throws(() => {
					version.validateVersionIsInProgress();
				});
			});
			it('Should not throw an error if the current version is in progress', () => {
				version.update({
					canPublish: true,
					published: false
				});
				should.doesNotThrow(() => {
					version.validateVersionIsInProgress();
				});
			});

		});
		describe('#checkVersionIsNotPublishing', () => {
			it('Should throw an error if the current version is publishing', () => {
				version.update({
					isPublishing: true
				});
				should.throws(() => {
					version.checkVersionIsNotPublishing();
				});
			});
			it('Should not throw an error if the current version is not publishing', () => {
				version.update({
					isPublishing: false
				});
				should.doesNotThrow(() => {
					version.checkVersionIsNotPublishing();
				});
			});

		});

		describe('#getNextOrder', () => {
			it('Should return 1 if the version does not have ratePrograms', () => {
				const version = Version.create(_.extend(Mocks.version(), {
					rateCardId: uuid()
				})).init();

				const newOrder = version.getNextOrder([]);
				const expected = 1;

				newOrder.should.equal(expected);

			});

			it('Should return largest order + 1 from all the rate programs', () => {
				version.ratePrograms[0].update({
					order: 100
				});

				const newRateProgramOrder = version.getNextOrder(version.ratePrograms);
				const expectedRateProgramOrder = 101;

				newRateProgramOrder.should.equal(expectedRateProgramOrder);
			});
		});

		describe('#findByUID', () => {
			it('Should return the rate program based on its uid', () => {
				const rateProgramUid = version.ratePrograms[0].uid;
				const rateProgram = version.findByUID(version.ratePrograms, rateProgramUid);

				rateProgram.should.deepEqual(version.ratePrograms[0]);

			});

			it('Should throw an error if the rateProgram is not found', () => {

				const nonExistentUid = 'XXXXXXXXX';

				should(() => {
					version.findByUID(version.ratePrograms, nonExistentUid);
				}).throw(`item.id not found with ID: ${nonExistentUid}`);

			});

			it('Should throw an error if the uid is not entered');
		});
		describe('#createVendorCode', () => {
			it('Should create a new vendorCode with default values', () => {
				const input = {
					name: 'New VendorCode'
				};

				const vendorCodesLength = version.vendorCodes.length;
				const newVendorCode = version.createVendorCode(input);

				testSchema('vendorCode', newVendorCode, {
					type: 'model',
					strict: false
				});

				newVendorCode.versionId.should.equal(version.uid);
				newVendorCode.rateCardId.should.equal(version.rateCardId);
				newVendorCode.name.should.equal(input.name);
				newVendorCode.deleted.should.equal(false);
				newVendorCode.points.should.equal(0);
				version.vendorCodes.length.should.equal(vendorCodesLength + 1);
				version._hasUpdates.should.equal(true);
				version.vendorCodes.should.containDeep([newVendorCode]);

			});
			it('Should create a new vendorCode with given values', () => {
				const input = {
					name: 'New VendorCode',
					points: 2.0
				};

				const vendorCodesLength = version.vendorCodes.length;
				const newVendorCode = version.createVendorCode(input);

				testSchema('vendorCode', newVendorCode, {
					type: 'model',
					strict: false
				});

				newVendorCode.versionId.should.equal(version.uid);
				newVendorCode.rateCardId.should.equal(version.rateCardId);
				newVendorCode.name.should.equal(input.name);
				newVendorCode.deleted.should.equal(false);
				newVendorCode.points.should.equal(input.points);
				version.vendorCodes.length.should.equal(vendorCodesLength + 1);
				version._hasUpdates.should.equal(true);
				version.vendorCodes.should.containDeep([newVendorCode]);

			});
			it('Should throw an error if the vendorCode name already exists', () => {
				const duplicatedName = version.vendorCodes[0].name;
				const input = {
					name: duplicatedName
				};

				should(() => {
					version.createVendorCode(input);
				}).throw(`There is a duplicated name with value ${duplicatedName.trim().toLowerCase()}`);

			});
			it('Should throw an error if the vendor name not sent', () => {

				should(() => {
					version.createVendorCode();
				}).throw(`There is a missing required parameter: name.`);

			});
		});

		describe('#updateVendorCode', () => {
			it('Should update a vendorCode', () => {
				const input = {
					uid: version.vendorCodes[0].uid,
					name: 'Changed VendorCode',
					points: 4.0
				};

				const vendorCodesLength = version.vendorCodes.length;
				const updatedVendorCode = version.updateVendorCode(input);

				testSchema('vendorCode', updatedVendorCode, {
					type: 'model',
					strict: false
				});

				updatedVendorCode.versionId.should.equal(version.uid);
				updatedVendorCode.rateCardId.should.equal(version.rateCardId);
				updatedVendorCode.name.should.equal(input.name);
				updatedVendorCode.points.should.equal(input.points);
				version.vendorCodes.length.should.equal(vendorCodesLength);
				version._hasUpdates.should.equal(true);
				version.vendorCodes.should.containDeep([input]);
			});
			it('Should throw an error if the vendorCode is not found', () => {
				const nonExistentUid = 'XXXXXXXXX';
				const input = {
					uid: nonExistentUid,
					name: 'New name'
				};

				should(() => {
					version.updateVendorCode(input);
				}).throw(`item.id not found with ID: ${nonExistentUid}`);

			});
			it('Should throw an error if the vendorCode name already exists', () => {
				const duplicatedName = version.vendorCodes[1].name;
				const input = {
					uid: version.vendorCodes[0].uid,
					name: duplicatedName
				};

				should(() => {
					version.updateVendorCode(input);
				}).throw(`There is a duplicated name with value ${duplicatedName.trim().toLowerCase()}`);

			});
		});

		describe('#removeVendorCode', () => {
			it('Should remove a vendorCode', () => {

				const vendorCodeUid = version.vendorCodes[0].uid;

				const removedVendorCode = version.removeVendorCode(vendorCodeUid);

				removedVendorCode.deleted.should.equal(true);
				version._hasUpdates.should.equal(true);
				version.vendorCodes.should.not.containDeep(removedVendorCode);
			});

			it('Should throw an error if the vendorCode is not found', () => {
				const nonExistentUid = 'XXXXXXXXX';

				should(() => {
					version.removeVendorCode(nonExistentUid);
				}).throw(`item.id not found with ID: ${nonExistentUid}`);

			});
		});

		describe('#createRateProgram', () => {
			// check version._hasUpdates = true
			// check version.dependencies() returns the new rate program
			// check rateProgram.order is correct
			// test schema for rateProgram
			// test version.ratePrograms.length
			it('Should create a new rate program with default values', () => {
				const input = {
					name: 'New RateProgram'
				};

				const rateProgramsLength = version.ratePrograms.length;
				const newRateProgram = version.createRateProgram(input);

				testSchema('rateProgram', newRateProgram, {
					type: 'model',
					strict: false
				});

				newRateProgram.deleted.should.equal(false);
				newRateProgram.promo.should.equal(false);
				newRateProgram.points.should.equal(0);
				newRateProgram.advancePayments.should.equal(0);
				newRateProgram.deferrals.should.equal(0);
				newRateProgram.terms.should.be.Array().empty();
				newRateProgram.defaults.term.should.be.empty();
				newRateProgram.residuals.should.be.Array().empty();
				newRateProgram.allInRates.should.be.Array().empty();
				newRateProgram.amountRanges.should.be.Array().empty();
				newRateProgram.purchaseOptions.should.be.Array().empty();
				newRateProgram.paymentFrequencies.should.be.Array().empty();
				version._hasUpdates.should.equal(true);
				version.dependencies().should.containDeep([newRateProgram]);
				version.ratePrograms.length.should.equal(rateProgramsLength + 1);

			});

			it('Should create a new rate program with the given values', () => {
				const input = {
					name: 'New RateProgram1',
					order: 100,
					points: 2,
					promo: true,
					advancePayments: 2,
					deferrals: 30
				};

				const rateProgramsLength = version.ratePrograms.length;
				const newRateProgram = version.createRateProgram(input);

				testSchema('rateProgram', newRateProgram, {
					type: 'model',
					strict: false
				});

				newRateProgram.versionId.should.equal(version.uid);
				newRateProgram.name.should.equal(input.name);
				newRateProgram.order.should.equal(input.order);
				newRateProgram.deleted.should.equal(false);
				newRateProgram.promo.should.equal(input.promo);
				newRateProgram.points.should.equal(input.points);
				newRateProgram.advancePayments.should.equal(input.advancePayments);
				newRateProgram.deferrals.should.equal(input.deferrals);
				newRateProgram.terms.should.be.Array().empty();
				newRateProgram.defaults.term.should.be.empty();
				newRateProgram.residuals.should.be.Array().empty();
				newRateProgram.allInRates.should.be.Array().empty();
				newRateProgram.amountRanges.should.be.Array().empty();
				newRateProgram.purchaseOptions.should.be.Array().empty();
				newRateProgram.paymentFrequencies.should.be.Array().empty();
				version._hasUpdates.should.equal(true);
				version.dependencies().should.containDeep([newRateProgram]);
				version.ratePrograms.length.should.equal(rateProgramsLength + 1);
			});

			it('Should throw an error if the rate program name already exists', () => {
				const duplicatedName = version.ratePrograms[0].name;
				const input = {
					name: duplicatedName
				};

				should(() => {
					version.createRateProgram(input);
				}).throw(
					`A Rate Program with the Description "${duplicatedName}" already exists. Please enter a different Description.`
				);

			});
			it('Should throw an error if the rate program name has more than 100 characters', () => {
				const longName =
					'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVW';
				const input = {
					name: longName
				};

				should.throws(() => {
					version.createRateProgram(input);
				});

			});

			it('Should throw an error if no parameters sent', () => {

				should(() => {
					version.createRateProgram();
				}).throw(`There is a missing required parameter: name.`);

			});

			it('Should validate invalid terms and remove them', () => {
				const terms = ['24', 'a', 'b', '0048', null];
				const expected = ['24', '48'];

				const newRateProgram = version.createRateProgram({
					name: 'new Rateprogram name',
					terms
				});

				newRateProgram.terms.should.deepEqual(expected);
				newRateProgram.defaults.term.should.equal(expected[0]);
				version._hasUpdates.should.equal(true);
			});

			it('Should throw an error if the rate program has a term that is not in the version', () => {
				const terms = ['24', '36', '48', '120'];
				should.throws(() => {
					version.createRateProgram(terms);
				});

			});
			it('Should throw an error if the rate program has amountRanges with gaps', () => {
				const amountRanges = [{
					'min': 10000,
					'max': 19999.99
				}, {
					'min': 20000,
					'max': 29999.99
				}, {
					'min': 31000,
					'max': 50000
				}];
				should.throws(() => {
					version.createRateProgram(amountRanges);
				});

			});
			it('Should throw an error if the rate program has amountRanges with min greater than max', () => {
				const amountRanges = [{
					'min': 10000,
					'max': 19999.99
				}, {
					'min': 20000,
					'max': 29999.99
				}, {
					'min': 31000,
					'max': 30999
				}];
				should.throws(() => {
					version.createRateProgram(amountRanges);
				});

			});
		});
		describe('#updateRateProgram', () => {
			// check version._hasUpdates = true
			// check version.dependencies() returns the rate programs
			it('Should update a rate program when found', () => {
				const input = {
					uid: version.ratePrograms[0].uid,
					name: 'Updated RateProgramName',
					order: 50
				};

				const rateProgramsLength = version.ratePrograms.length;
				const updatedRateProgram = version.updateRateProgram(input);

				testSchema('rateProgram', updatedRateProgram, {
					type: 'model',
					strict: false
				});

				updatedRateProgram.versionId.should.equal(version.uid);
				updatedRateProgram.name.should.equal(input.name);
				updatedRateProgram.order.should.equal(input.order);
				version._hasUpdates.should.equal(true);
				version.dependencies().should.containDeep([updatedRateProgram]);

				version.ratePrograms.length.should.equal(rateProgramsLength);
			});
			it('Should throw an error if the rate program is not found', () => {
				const nonExistentUid = 'XXXXXXXXX';
				const input = {
					uid: nonExistentUid,
					name: 'Updated RateProgramName'
				};

				should(() => {
					version.updateRateProgram(input);
				}).throw(`item.id not found with ID: ${nonExistentUid}`);

			});
			it('Should throw an error if the rate program name already exists', () => {
				const duplicatedName = version.ratePrograms[1].name;
				const input = {
					uid: version.ratePrograms[0].uid,
					name: duplicatedName
				};

				should(() => {
					version.updateRateProgram(input);
				}).throw(
					`A Rate Program with the Description "${duplicatedName}" already exists. Please enter a different Description.`
				);

			});

			it('Should throw an error if the rate program name has more than 100 characters', () => {
				const longName =
					'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVW';
				const input = {
					uid: version.ratePrograms[0].uid,
					name: longName
				};

				should.throws(() => {
					version.updateRateProgram(input);
				});

			});

			it('Should throw an error if the rate program has a term that is not in the version', () => {
				const terms = ['24', '36', '48', '120'];
				should.throws(() => {
					version.updateRateProgram(terms);
				});
			});
			it('Should throw an error if the default term is not in rate program terms', () => {
				const defaults = {
					term: '48'
				};
				should.throws(() => {
					version.updateRateProgram({
						defaults
					});
				});
			});
			it('Should change defaults.term to first term if the term=defaults.term is deleted from rate program',
				() => {
					const defaults = {
						term: '24'
					};
					let updatedRateprogram = version.updateRateProgram({
						uid: version.ratePrograms[0].uid,
						defaults
					});
					updatedRateprogram.defaults.term.should.equal(defaults.term);

					const terms = ['12', '36'];

					updatedRateprogram = version.updateRateProgram({
						uid: version.ratePrograms[0].uid,
						terms
					});

					updatedRateprogram.defaults.term.should.equal(terms[0]);

				});
			it('Should throw an error if the rate program has amountRanges with gaps', () => {
				const amountRanges = [{
					'min': 10000,
					'max': 19999.99
				}, {
					'min': 20000,
					'max': 29999.99
				}, {
					'min': 31000,
					'max': 50000
				}];
				should.throws(() => {
					version.updateRateProgram(amountRanges);
				});

			});
			it('Should throw an error if the rate program has amountRanges with min greater than max', () => {
				const amountRanges = [{
					'min': 10000,
					'max': 19999.99
				}, {
					'min': 20000,
					'max': 29999.99
				}, {
					'min': 31000,
					'max': 30999
				}];
				should.throws(() => {
					version.createRateProgram(amountRanges);
				});

			});
			it('Should throw an error if advancePayments and advanceSecurityPayments are not integers between 0 and 4',
				() => {
					const input = {
						'advancePayments': [0],
						'advanceSecurityPayments': 5
					};
					should.throws(() => {
						version.createRateProgram(input);
					});

				});
			it('Should throw an error if deferrals is not integer 0, 30,  60, 90, 120, 180 or 360', () => {
				const deferrals = 160;
				should.throws(() => {
					version.createRateProgram({
						deferrals
					});
				});

			});
			it('Should update spreads with provided amountRanges', () => {
				const amountRanges = [{
					'min': 10000.00,
					'max': 19999.99
				}, {
					'min': 20000,
					'max': 29999.99
				}];
				const updatedRateProgram = version.updateRateProgram({
					uid: version.ratePrograms[0].uid,
					amountRanges
				});

				testSchema('version', version, {
					type: 'model',
					strict: false
				});

				version._hasUpdates.should.equal(true);
				_.uniq(updatedRateProgram.spreads.map(spread => spread.amountRangeMin)).should.deepEqual(
					amountRanges.map(amountRange =>
						amountRange.min));
				_.uniq(updatedRateProgram.spreads.map(spread => spread.amountRangeMax)).should.deepEqual(
					amountRanges.map(amountRange =>
						amountRange.max));

			});

			it('Should remove items from residuals, spreads and allInRates that has a removed term', () => {

				const terms = ['12', '24'];
				const updatedRateProgram = version.updateRateProgram({
					uid: version.ratePrograms[0].uid,
					terms
				});

				testSchema('version', version, {
					type: 'model',
					strict: false
				});

				const residuals = _.filter(updatedRateProgram.residuals, {
					purchaseOption: 'F'
				});

				version._hasUpdates.should.equal(true);
				_.uniq(residuals.map(residual => residual.term)).should.deepEqual(terms);
				_.uniq(updatedRateProgram.spreads.map(spread => spread.term)).should.deepEqual(terms);
				_.uniq(updatedRateProgram.allInRates.map(allInRate => allInRate.term)).should.deepEqual(
					terms);
			});
			it('Purchase option out should not generate residuals', () => {

				const purchaseOptions = ['F', 'D'];
				const updatedRateProgram = version.updateRateProgram({
					uid: version.ratePrograms[0].uid,
					purchaseOptions
				});

				testSchema('version', version, {
					type: 'model',
					strict: false
				});

				version._hasUpdates.should.equal(true);
				_.filter(updatedRateProgram.residuals, {
					purchaseOption: 'D'
				}).should.be.Array().empty();
				_.filter(updatedRateProgram.residuals, {
					purchaseOption: 'F'
				}).should.be.Array().not.empty();
			});
			it('Should remove items from spreads and allInRates that has a removed amountRange', () => {
				const amountRanges = [{
					'min': 10000.00,
					'max': 19999.99
				}];
				const updatedRateProgram = version.updateRateProgram({
					uid: version.ratePrograms[0].uid,
					amountRanges
				});

				testSchema('version', version, {
					type: 'model',
					strict: false
				});

				version._hasUpdates.should.equal(true);
				_.uniq(updatedRateProgram.spreads.map(spread => spread.amountRangeMin)).should.deepEqual(
					amountRanges.map(amountRange =>
						amountRange.min));
				_.uniq(updatedRateProgram.spreads.map(spread => spread.amountRangeMax)).should.deepEqual(
					amountRanges.map(amountRange =>
						amountRange.max));
				_.uniq(updatedRateProgram.allInRates.map(allInRate => allInRate.amountRangeMin)).should
					.deepEqual(amountRanges.map(amountRange =>
						amountRange.min));
				_.uniq(updatedRateProgram.allInRates.map(allInRate => allInRate.amountRangeMax)).should
					.deepEqual(amountRanges.map(amountRange =>
						amountRange.max));

			});
			it('Should remove invalid purchase options', () => {

				const purchaseOptions = ['do', 'D', 'f', 'tppoo', 'P'];
				const expected = ['D', 'F', 'P'];
				const updatedRateProgram = version.updateRateProgram({
					uid: version.ratePrograms[0].uid,
					purchaseOptions
				});

				testSchema('version', version, {
					type: 'model',
					strict: false
				});

				version._hasUpdates.should.equal(true);
				updatedRateProgram.purchaseOptions.should.deepEqual(expected);
			});

			it('Spreads should have one item for every combination of term/amountRangeIndex');
			it('Should update residuals with provided purchaseOptions', () => {
				const purchaseOptions = ['F',
					'P'
				];
				const updatedRateProgram = version.updateRateProgram({
					uid: version.ratePrograms[0].uid,
					purchaseOptions
				});

				testSchema('version', version, {
					type: 'model',
					strict: false
				});

				version._hasUpdates.should.equal(true);
				_.uniq(updatedRateProgram.residuals.map(residual => residual.purchaseOption)).should
					.deepEqual(purchaseOptions);
				_.filter(updatedRateProgram.residuals, {
					purchaseOption: 'P'
				}).length.should.equal(1);
			});
			it('Should update the residual item with the same term and purchaseOption', () => {
				const input = [{
					'term': '12',
					'purchaseOption': 'F',
					'value': 0.12345
				}];

				const updatedRateProgram = version.updateRateProgram({
					uid: version.ratePrograms[0].uid,
					residuals: input
				});

				testSchema('version', version, {
					type: 'model',
					strict: false
				});

				version._hasUpdates.should.equal(true);
				updatedRateProgram.residuals.should.containDeep(input);
			});

			it('Should update the spreads item with the same term, amountRangeMin and amountRangeMax', () => {
				const input = [{
					'term': '12',
					'amountRangeMin': 10000.00,
					'amountRangeMax': 19999.99,
					'value': 0.12
				}];

				const updatedRateProgram = version.updateRateProgram({
					uid: version.ratePrograms[0].uid,
					spreads: input
				});

				testSchema('version', version, {
					type: 'model',
					strict: false
				});

				version._hasUpdates.should.equal(true);
				updatedRateProgram.spreads.should.containDeep(input);
			});
			it('Should update the allInRates with value of cof term plus value of spreads', () => {
				const input = [{
					'term': '12',
					'amountRangeMin': 10000.00,
					'amountRangeMax': 19999.99,
					'value': -0.2
				}];

				const updatedRateProgram = version.updateRateProgram({
					uid: version.ratePrograms[0].uid,
					spreads: input
				});

				testSchema('version', version, {
					type: 'model',
					strict: false
				});

				version._hasUpdates.should.equal(true);
				updatedRateProgram.allInRates.forEach(allInRate => {
					const cof = _.find(version.cofs, {
						term: allInRate.term
					});
					const spread = _.find(updatedRateProgram.spreads, {
						term: allInRate.term,
						amountRangeMin: allInRate.amountRangeMin,
						amountRangeMax: allInRate.amountRangeMax
					});
					let expectedValue = Number(cof.value + spread.value) || 0;
					expectedValue = Number(expectedValue.toFixed(6));

					allInRate.value.should.equal(expectedValue);
				});
			});

		});

		describe('#removeRateProgram', () => {
			// check version._hasUpdates = true
			it('Should remove a rate program', () => {

				const rateProgramUid = version.ratePrograms[0].uid;

				const removedRateProgram = version.removeRateProgram(rateProgramUid);

				removedRateProgram.deleted.should.equal(true);
				removedRateProgram._hasUpdates.should.equal(true);
				version._hasUpdates.should.equal(true);
				version.dependencies().should.not.containDeep(removedRateProgram);

			});

			it('Should throw an error if the ratePrograms is not found', () => {
				const nonExistentUid = 'XXXXXXXXX';

				should(() => {
					version.removeRateProgram(nonExistentUid);
				}).throw(`item.id not found with ID: ${nonExistentUid}`);

			});

		});
		describe('#duplicateRateProgram', () => {
			it('Should create a copy of the rateProgram with the same version id and name with Copy of', () => {
				const rateProgram = version.ratePrograms[0];

				const rateProgramsLength = version.ratePrograms.length;

				const duplicatedRateProgram = version.duplicateRateProgram(rateProgram.uid);
				testSchema('rateProgram', duplicatedRateProgram, {
					type: 'model',
					strict: false
				});

				const maxOrder = _.max(_.map(version.ratePrograms, 'order'));

				duplicatedRateProgram.uid.should.not.equal(rateProgram.uid);
				duplicatedRateProgram.versionId.should.equal(version.uid);
				duplicatedRateProgram.order.should.equal(maxOrder);
				duplicatedRateProgram.name.should.equal(`Copy of ${rateProgram.name}`);
				version._hasUpdates.should.equal(true);
				version.dependencies().should.containDeep([duplicatedRateProgram]);
				version.ratePrograms.length.should.equal(rateProgramsLength + 1);

			});
		});

		describe('#calculateRateFactors', () => {
			const generateRateFactors = (input = {}) => {
				let {
					ratePrograms = new Array(3).fill({}),
						vendorCodes = new Array(2).fill({}),
						terms = ['12', '24', '36'],
						filters = {},
						cofs
				} = input;

				ratePrograms = ratePrograms.map((program, index) => {
					let {
						amountRanges = [{
							min: 1000,
							max: 1999.99
						}],
					} = program;

					let spreads = [];
					let residuals = [{
						purchaseOption: 'P',
						value: 0
					}];

					_.each(terms, term => {
						residuals.push({
							term,
							purchaseOption: 'F',
							value: 0
						});

						_.each(amountRanges, amountRange => {
							spreads.push({
								term,
								value: 0,
								amountRangeMin: amountRange.min,
								amountRangeMax: amountRange.max,
							});
						});
					});

					return _.defaults(program, {
						spreads,
						residuals,
						amountRanges,
						terms,
						uid: '' + index,
						points: 0,
						advancePayments: 0,
						advanceSecurityPayments: 0,
						purchaseOptions: ['F'],
						paymentFrequencies: ['M'],
						deferrals: 0,
					});
				});

				vendorCodes = vendorCodes.map((vendorCode, index) => {
					return _.defaults(vendorCode, {
						uid: '' + index,
						name: `vendor ${index}`,
						points: index
					});
				});

				if (!cofs) {
					cofs = terms.map(term => {
						return {
							term,
							value: 0.025
						};
					});
				}

				const version = Version.create({
					ratePrograms,
					vendorCodes,
					terms,
					cofs
				}).init();

				const rateFactors = version.calculateRateFactors({
					filters
				});

				testSchema('rateFactors', rateFactors);

				return rateFactors;
			};

			it('Should generate rate factors for each rate program', () => {
				const expected = {
					ids: ['1', '2'],
					names: ['rate program 1', 'rate program 2']
				};
				const input = {
					ratePrograms: [{
							uid: expected.ids[0],
							name: expected.names[0]
						},
						{
							uid: expected.ids[1],
							name: expected.names[1]
						},
					]
				};

				const rateFactors = generateRateFactors(input);

				const actualProgramNames = _.chain(rateFactors)
					.map('rateProgram')
					.uniq()
					.value();
				actualProgramNames.should.deepEqual(expected.names);

				const actualProgramIds = _.chain(rateFactors)
					.map('rateProgramId')
					.uniq()
					.value();
				actualProgramIds.should.deepEqual(expected.ids);
			});

			it('Should generate rate factors adding extra points for vendors', () => {
				const expected = {
					names: ['', 'vendor 1', 'vendor 2'],
					points: [0, 1, 2]
				};
				const input = {
					vendorCodes: [{
							name: expected.names[1],
							points: expected.points[1]
						},
						{
							name: expected.names[2],
							points: expected.points[2]
						},
					]
				};

				const rateFactors = generateRateFactors(input);
				const groups = _.groupBy(rateFactors, 'vendorCode');

				_.keys(groups).should.deepEqual(expected.names);
				_.each(groups, (group, name) => {
					group.should.be.Array().not.empty();

					const index = _.indexOf(expected.names, name);
					const expectedPoints = expected.points[index];

					const hasVendorCodePoints = _.every(group, rateFactor => {
						return rateFactor.vendorCodePoints === expectedPoints;
					});

					(hasVendorCodePoints).should.equal(true);
				});
			});

			it('Should add extra points to vendor codes', () => {
				const input = {
					terms: ['36', '48', '60'],
					ratePrograms: [{
						paymentFrequencies: ['M'],
						points: 2,
					}],
					cofs: [{
							term: '36',
							amountRangeMin: 1000,
							amountRangeMax: 1999.99,
							value: 0.0599
						},
						{
							term: '48',
							amountRangeMin: 1000,
							amountRangeMax: 1999.99,
							value: 0.0599
						},
						{
							term: '60',
							amountRangeMin: 1000,
							amountRangeMax: 1999.99,
							value: 0.0599
						},
					],
					vendorCodes: [{
						points: 3
					}],
				};

				const expected = {
					base: [.0310284, .0239496, .0197166],
					vendor: [.0319609, .0246685, .0203116]
				};

				const rateFactors = generateRateFactors(input);

				const actuaBase = _.chain(rateFactors)
					.filter({
						vendorCodePoints: 0,
						points: 2
					})
					.map('value')
					.uniq()
					.value();

				actuaBase.should.deepEqual(expected.base);

				const actualVendors = _.chain(rateFactors)
					.filter({
						vendorCodePoints: 3,
						points: 2
					})
					.map('value')
					.uniq()
					.value();

				actualVendors.should.deepEqual(expected.vendor);
			});
		});

		describe('#availableFilterOptions', () => {
			it('should show all options with no current filters', () => {
				const version = Version.create({
					ratePrograms: [{
							uid: '1',
							name: 'A',
							paymentFrequencies: ['M', 'SA'],
							purchaseOptions: ['P'],
							advancePayments: 1,
							points: 2
						},
						{
							uid: '2',
							name: 'B',
							paymentFrequencies: ['Q', 'SA'],
							purchaseOptions: ['F'],
							advancePayments: 0,
							points: 3
						},
					]
				});

				const expected = {
					ratePrograms: [{
							id: '1',
							name: 'A'
						},
						{
							id: '2',
							name: 'B'
						}
					],
					paymentFrequencies: ['M', 'Q', 'SA'],
					purchaseOptions: ['F', 'P'],
					advancePayments: [0, 1],
					points: [0, 1, 2, 3]
				};

				const actual = version.availableFilterOptions();
				actual.should.deepEqual(expected);
			});

			it('should show filtered options when the selections changes', () => {
				const version = Version.create({
					ratePrograms: [{
							uid: '1',
							name: 'A',
							paymentFrequencies: ['M', 'SA'],
							purchaseOptions: ['P'],
							advancePayments: 1,
							points: 2
						},
						{
							uid: '2',
							name: 'B',
							paymentFrequencies: ['Q', 'SA'],
							purchaseOptions: ['F'],
							advancePayments: 0,
							points: 3
						},
					]
				});

				const result1 = version.availableFilterOptions({
					ratePrograms: ['2']
				});
				result1.should.deepEqual({
					ratePrograms: [{
						id: '2',
						name: 'B'
					}],
					paymentFrequencies: ['Q', 'SA'],
					purchaseOptions: ['F'],
					advancePayments: [0],
					points: [0, 1, 2, 3]
				});

				const result2 = version.availableFilterOptions({
					paymentFrequencies: ['M']
				});
				result2.should.deepEqual({
					ratePrograms: [{
						id: '1',
						name: 'A'
					}],
					paymentFrequencies: ['M', 'SA'],
					purchaseOptions: ['P'],
					advancePayments: [0, 1],
					points: [0, 1, 2]
				});
			});
		});
	});
});
