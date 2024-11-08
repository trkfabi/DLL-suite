const _ = require('lodash');
const should = require('should');

const RateCard = require('../../../../../lib/models/othc/rate-card.model');
const Mocks = require('../../../../lib/othc/mocks');

const {
	testSchema
} = require('../../../../lib/othc/test.helpers');

const mockVersions = (n = 3) => {
	return _.chain()
		.range(n)
		.map((n, i) => {
			return _.extend({}, Mocks.version(), {
				published: i === 1,
				archived: i === 2,
			});
		})
		.value();
};

describe('services/rate-cards', () => {
	describe('models/othc/rate-card', () => {
		let params = null;
		let rateCard = null;
		const appName = 'othc';

		beforeEach(() => {
			// Creates a rateCard with 3 versions:
			// [0]: inProgress
			// [1]: published
			// [2]: archived
			params = _.extend({}, Mocks.rateCard(), {
				versions: mockVersions()
			});

			rateCard = RateCard.create(params).init();
		});

		describe('#create()', () => {
			it('Should create a rate card with no params', () => {
				const rateCard = RateCard.create();

				testSchema('rateCard', rateCard, {
					type: 'model',
					strict: false
				});
				rateCard.app.should.equal(appName);
			});

			it('Should create a rateCard with additional params', () => {
				// testing rateCard created with `beforeEach()`
				testSchema('rateCard', rateCard, {
					type: 'model',
					strict: false
				});
				rateCard.name.should.equal(params.name);
				rateCard.app.should.equal(appName);
				rateCard.versions.should.containDeep(params.versions);
			});

			it('Should parse special `[CUSTOM_version]version_ids` from ArrowDB with depth expanded', () => {
				// ArrowDB will return the versions expaneded as regular json object
				const versions = mockVersions();
				const rateCard = RateCard.create({
					'[CUSTOM_version]version_ids': versions
				});

				testSchema('rateCard', rateCard, {
					type: 'model',
					strict: false
				});
				rateCard.should.containDeep({
					versions
				});
				rateCard.versions.should.be.length(3);
			});

			it('Should not parse special `[CUSTOM_version]version_ids` from ArrowDB with depth=1', () => {
				// ArrowDB will return the versions ids only if depth=1
				const versions = ['123', '456', '789']
				const rateCard = RateCard.create({
					'[CUSTOM_version]version_ids': versions
				});

				testSchema('rateCard', rateCard, {
					type: 'model',
					strict: false
				});
				rateCard.versions.should.be.Array().empty();
			});

			it('Should validate the name');
		});

		describe('#init', () => {
			it('Should add a version in progress if no versions are present', () => {
				const rateCard = RateCard.create();

				rateCard.versions.should.have.length(0);
				rateCard.versionInProgress.should.be.empty();

				rateCard.init();

				testSchema('rateCard', rateCard, {
					type: 'model',
					strict: true
				});

				rateCard.versions.should.have.length(1);
				rateCard.versionInProgress.should.equal(rateCard.versions[0].uid);
			});

			it('Should initialice versionInProgress, versionPublished', () => {
				const params = _.extend({}, Mocks.rateCard(), {
					versions: mockVersions()
				});

				const versionInProgress = params.versions[0];
				const versionPublished = params.versions[1];
				const versionArchived = params.versions[2];

				params.versions.should.have.length(3);

				versionInProgress.archived.should.equal(false);
				versionInProgress.published.should.equal(false);

				versionPublished.archived.should.equal(false);
				versionPublished.published.should.equal(true);

				versionArchived.archived.should.equal(true);
				versionArchived.published.should.equal(false);

				const rateCard = RateCard.create(params).init();

				testSchema('rateCard', rateCard, {
					type: 'model',
					strict: true
				});

				rateCard.versionInProgress.should.equal(rateCard.versions[0].uid);
				rateCard.versionPublished.should.equal(rateCard.versions[1].uid);

				rateCard.getVersionInProgress().canPublish.should.equal(true);
			});

			it('Should leave versionInProgress empty if only versions archived or published are present', () => {
				const versions = mockVersions(5);
				versions.forEach(version => {
					version.archived = true;
				});

				const data = _.extend({}, Mocks.rateCard(), {
					versions
				});

				const rateCard = RateCard.create(data).init();

				testSchema('rateCard', rateCard, {
					type: 'model',
					strict: true
				});

				rateCard.versionInProgress.should.be.empty();
				rateCard.versions.should.have.length(5);
			});
		});

		describe('#update', () => {
			it('Should not update the appName', () => {
				rateCard.update({
					app: 'NewAPP'
				});

				testSchema('rateCard', rateCard, {
					type: 'model',
					strict: true
				});

				rateCard.app.should.equal(appName);
			});
			it('Should allow names of 1-20 characters', () => {
				{
					const name = 'a';
					rateCard.update({
						name
					});

					testSchema('rateCard', rateCard, {
						type: 'model',
						strict: true
					});
					rateCard.name.should.equal(name);
				}

				{
					const name = 'abcDEF123GHI980OPQ45';
					rateCard.update({
						name
					});

					testSchema('rateCard', rateCard, {
						type: 'model',
						strict: true
					});
					rateCard.name.should.equal(name);
				}
			});

			it('Should prevent names with invalid characters or length', () => {
				const name = rateCard.name;

				should.throws(() => {
					rateCard.update({
						name: '$#!'
					});
				});

				should.throws(() => {
					rateCard.update({
						name: ''
					});
				});

				should.throws(() => {
					rateCard.update({
						name: '👺😓'
					});
				});

				should.throws(() => {
					rateCard.update({
						name: 'abcdefghijklqmnopqrst'
					});
				});

				rateCard.name.should.equal(name);
			});

			it('Should prevent updates for invalid values', () => {
				const before = JSON.parse(JSON.stringify(rateCard));

				should.throws(() => {
					rateCard.update({
						versionInProgress: '123' // invalid uiud
					});
				});

				should.throws(() => {
					rateCard.update({
						versionPublished: '456' // invalid uiud
					});
				});

				should.throws(() => {
					rateCard.update({
						versions: true // must be array
					});
				});

				const after = JSON.parse(JSON.stringify(rateCard));
				before.should.deepEqual(after);
			});
		});

		describe('#getVersionInProgress', () => {
			it('Should return the version in progress', () => {
				const expected = rateCard.versions[0];
				const actual = rateCard.getVersionInProgress();

				actual.should.not.be.empty();
				actual.should.equal(expected);
				actual.uid.should.equal(rateCard.versionInProgress);
			});

			it('Should return null if there are no versions in progress', () => {
				const rateCard = RateCard.create();
				rateCard.versionInProgress.should.be.empty();
				should(rateCard.getVersionInProgress()).be.empty();
			});
		});
		describe('#getVersionPublished', () => {
			it('Should return the version published', () => {
				const expected = rateCard.versions[1];
				const actual = rateCard.getVersionPublished();

				actual.should.not.be.empty();
				actual.should.equal(expected);
				actual.uid.should.equal(rateCard.versionPublished);
			});

			it('Should return null if there are no versions published', () => {
				const rateCard = RateCard.create();
				rateCard.versionPublished.should.be.empty();
				should(rateCard.getVersionPublished()).be.empty();
			});
		});

		describe('#dependencies()', () => {
			it('Should return only updated versions', () => {
				const version = rateCard.versions[0];

				version.update({
					terms: ['1', '2']
				});

				const dependencies = rateCard.dependencies();
				dependencies.should.be.Array().containEql(version).have.length(1);
			});

			it('Should return an empty array if no versions were updated', () => {
				const dependencies = rateCard.dependencies();
				dependencies.should.be.Array().empty();
			});
		});

		describe('#forArrow()', () => {
			it('Should include data to save in ArrowDB', () => {
				const forArrow = rateCard.forArrow();

				forArrow.should.have.property('uid').equal(rateCard.uid);
				forArrow.should.have.property('name').equal(rateCard.name);
				forArrow.should.have.property('versionInProgress').equal(rateCard.versionInProgress);
				forArrow.should.have.property('versionPublished').equal(rateCard.versionPublished);
				forArrow.should.have.property('order').equal(rateCard.order);
				forArrow.should.have.property('published').equal(rateCard.published);
				forArrow.should.have.property('deleted').equal(rateCard.deleted);
				forArrow.should.have.property('[CUSTOM_version]version_ids').be.Array();
			});

			it('Should exclude data that triggers an error in ArrowDB', () => {
				const forArrow = rateCard.forArrow();

				forArrow.should.not.have.property('created_at');
				forArrow.should.not.have.property('updated_at');
				forArrow.should.not.have.property('_id');
			});

			it('Should include version ids only if `id` is declared', () => {
				const ids = [
					'123',
					'456',
					'789'
				];

				rateCard.versions.forEach((version, index) => {
					version.update({
						id: ids[index]
					});
				});

				const forArrow = rateCard.forArrow();
				forArrow.should.have.property('[CUSTOM_version]version_ids').be.Array().containDeep(ids).length(3);
			});

			it('Should exclude versions with no `id` property', () => {
				const ids = [
					'123',
					null,
					'789'
				];
				const expected = ['123', '789'];

				rateCard.versions.forEach((version, index) => {
					version.update({
						id: ids[index]
					});
				});

				const forArrow = rateCard.forArrow();
				forArrow.should.have.property('[CUSTOM_version]version_ids').be.Array().containDeep(expected).length(2);
			});
		});

		describe('#forAPI()', () => {
			it('Should return the data for API results', () => {
				const forAPI = rateCard.forAPI();

				testSchema('rateCard', forAPI, {
					type: 'api',
					strict: true
				});

				forAPI.id.should.deepEqual(rateCard.uid);
				forAPI.name.should.equal(rateCard.name);
				forAPI.versionInProgress.should.equal(rateCard.versionInProgress);
				forAPI.versionPublished.should.equal(rateCard.versionPublished);
				forAPI.order.should.equal(rateCard.order);
				forAPI.published.should.equal(rateCard.published);
				forAPI.deleted.should.equal(rateCard.deleted);
				forAPI.versions.length.should.equal(rateCard.versions.length);
			});

			it('Should return only non-deleted versions', () => {
				rateCard.versions[1].remove();

				const forAPI = rateCard.forAPI();

				testSchema('rateCard', forAPI, {
					type: 'api',
					strict: true
				});

				rateCard.versions.should.have.length(3);
				forAPI.versions.should.not.containDeep({
					deleted: true
				}).have.length(2);
			});
		});

		describe('#createVersion', () => {
			it('Should create a new versionInProgress with defaults', () => {
				const rateCard = RateCard.create();
				const newVersion = rateCard.createVersion();

				newVersion.rateCardId.should.equal(rateCard.uid);
				rateCard.versionInProgress.should.equal(newVersion.uid);
				rateCard.versions.should
					.containDeep([newVersion])
					.have.length(1);
			});

			it('Should create a new versionInProgress with the given data', () => {
				const rateCard = RateCard.create();
				const version = Mocks.version();

				const newVersion = rateCard.createVersion(version);

				newVersion.should.containDeep(version);
				newVersion.rateCardId.should.equal(rateCard.uid);

				rateCard.versionInProgress.should.equal(newVersion.uid);
				rateCard.versions.should
					.containDeep([newVersion])
					.have.length(1);
			});

			it('Should remove a previous versionInProgress if exists', () => {
				const rateCard = RateCard.create();

				const versionToRemove = rateCard.createVersion();
				const newVersion = rateCard.createVersion();

				newVersion.rateCardId.should.equal(rateCard.uid);
				rateCard.versionInProgress.should.equal(newVersion.uid);
				rateCard.versions.should
					.not.containDeep([versionToRemove])
					.containDeep([newVersion])
					.have.length(1);
			});

			it('Should not remove previous versions if they are published or archived', () => {
				const newVersion = rateCard.createVersion();

				newVersion.rateCardId.should.equal(rateCard.uid);
				rateCard.versionInProgress.should.equal(newVersion.uid);
				rateCard.versions.should
					.containDeep([newVersion])
					.have.length(3);
			});

			it('Should copy vendorCodes from versionInProgress if existed');
			it('Should copy vendorCodes from versionPublished if there was no versionInProgress');
		});

		describe('#addVersion', () => {
			const Version = require('../../../../../lib/models/afs/version.model');

			it('Should add a given version as in-progress', () => {
				const rateCard = RateCard.create();
				const newVersion = Version.create();

				rateCard.addVersion(newVersion);

				newVersion.rateCardId.should.equal(rateCard.uid);
				rateCard.versionInProgress.should.equal(newVersion.uid);
				rateCard.versions.should
					.containDeep([newVersion])
					.have.length(1);
			});

			it('Should remove a previous version in progress if exists', () => {
				const rateCard = RateCard.create();
				const newVersion = Version.create();
				const versionToRemove = rateCard.createVersion();

				rateCard.addVersion(newVersion);

				newVersion.rateCardId.should.equal(rateCard.uid);
				rateCard.versionInProgress.should.equal(newVersion.uid);
				rateCard.versions.should
					.not.containDeep([versionToRemove])
					.containDeep([newVersion])
					.have.length(1);
			});

			it('Should not remove previous versions if they are published or archived', () => {
				const newVersion = Version.create();
				rateCard.addVersion(newVersion);

				newVersion.rateCardId.should.equal(rateCard.uid);
				rateCard.versionInProgress.should.equal(newVersion.uid);
				rateCard.versions.should
					.containDeep([newVersion])
					.have.length(3);
			});
		});

		describe('#removeVersion', () => {
			it('Should remove a version in progress', () => {
				const versionInProgress = rateCard.versions[0];
				const versionRemoved = rateCard.removeVersion(versionInProgress.uid);

				versionRemoved.deleted.should.equal(true);

				rateCard.versionInProgress.should.be.empty();
				rateCard.versions.should.have.length(2);
				rateCard.versions.should.not.containDeep(versionRemoved);
			});

			it('Should throw an error if the version to remove is not in progress', () => {
				const versionInProgress = rateCard.versions[0];
				const versionPublished = rateCard.versions[1];
				const versionArchived = rateCard.versions[2];

				should.doesNotThrow(() => {
					rateCard.removeVersion(versionInProgress.uid);
				});

				should.throws(() => {
					rateCard.removeVersion(versionPublished.uid);
				});

				should.throws(() => {
					rateCard.removeVersion(versionArchived.uid);
				});

				rateCard.versions.should.have.length(2);
			});
		});

		describe('#remove', () => {
			it('Should mark the rateCard and versions as deleted', () => {
				rateCard.remove();

				rateCard.deleted.should.equal(true);
				rateCard.versions.should.have.length(3);

				rateCard.versions.forEach(version => {
					version.deleted.should.equal(true);
				});
			});
		});

		describe('#removeVersionInProgress', () => {
			it('Should remove the versionInProgress', () => {
				const versionInProgress = rateCard.getVersionInProgress();

				rateCard.removeVersionInProgress();

				versionInProgress.deleted.should.equal(true);
				rateCard.versionInProgress.should.be.empty();

				rateCard.versions.should.have.length(2);
			});

			it('Should add a new version when the versions are empty after removing the version in progress', () => {
				const rateCard = RateCard.create();
				rateCard.versions.should.have.length(0);

				const version = rateCard.createVersion();
				rateCard.versions.should.have.length(1);
				version.deleted.should.equal(false);

				rateCard.removeVersionInProgress();

				version.deleted.should.equal(true);
				rateCard.versionInProgress.should.not.be.empty();
				rateCard.versionInProgress.should.not.equal(version.uid);
				rateCard.versions.should.have.length(1);
			});

			it('Should add a new version if #versions is empty', () => {
				const rateCard = RateCard.create();
				rateCard.versions.should.have.length(0);

				rateCard.removeVersionInProgress();

				rateCard.versionInProgress.should.not.be.empty();
				rateCard.versions.should.have.length(1);
			});

			it('Should not change the rateCard if the versions are only #published or #archived', () => {
				const versions = mockVersions(5);
				versions.forEach(version => {
					version.archived = true;
				});

				const data = _.extend({}, Mocks.rateCard(), {
					versions
				});

				const rateCard = RateCard.create(data).init();

				rateCard.versionInProgress.should.be.empty();
				rateCard.versions.should.have.length(5);

				rateCard.removeVersionInProgress();

				rateCard.versionInProgress.should.be.empty();
				rateCard.versions.should.have.length(5);
			});
		});
		/*
		describe('#publishStart', () => {
			it('Should leave the inProgress version as isPublishing', () => {
				const versionInProgress = rateCard.getVersionInProgress();

				rateCard.publishStart();

				versionInProgress.archived.should.equal(false);
				versionInProgress.canPublish.should.equal(false);
				versionInProgress.isPublishing.should.equal(true);
				rateCard.versionInProgress.should.be.empty();

			});

			it('Should throw an error if no versionInProgress is present', () => {
				rateCard.removeVersionInProgress();

				should.throws(() => {
					rateCard.publishStart();
				});

				rateCard.versions.should.have.length(2);
			});
		});
		describe('#publishEnd', () => {
			it('Should leave the inProgress version as published', () => {
				const versionInProgress = rateCard.getVersionInProgress();
				const versionPublished = rateCard.getVersionPublished();

				rateCard.publishStart();

				rateCard.publishEnd();

				versionInProgress.published.should.equal(true);
				versionInProgress.archived.should.equal(false);
				versionInProgress.canPublish.should.equal(false);
				versionInProgress.isPublishing.should.equal(false);

				versionPublished.published.should.equal(false);
				versionPublished.archived.should.equal(true);
				versionPublished.canPublish.should.equal(false);

				rateCard.versionInProgress.should.be.empty();
				rateCard.versionPublished.should.equal(versionInProgress.uid);

				rateCard.versions.should.have.length(3);
			});

			it('Should throw an error if no versionInProgress is present', () => {
				rateCard.removeVersionInProgress();

				should.throws(() => {
					rateCard.publishStart();
				});

				rateCard.versions.should.have.length(2);
			});
			it('Should throw an error if not called publishStart before publishEnd', () => {

				should.throws(() => {
					rateCard.publishEnd();
				});

			});

		});
		*/
		describe('#duplicateVersion', () => {
			const testDuplicated = (original, rateCard) => {
				const versionInProgress = rateCard.getVersionInProgress();
				const duplicate = rateCard.duplicateVersion(original.uid);

				rateCard.versions.should.have.length(3);
				versionInProgress.deleted.should.equal(true);

				testSchema('version', duplicate, {
					type: 'model',
					strict: true
				});
				duplicate.uid.should.not.equal(original.uid);
				duplicate.should.containEql({
					app: original.app,
					terms: original.terms,
					cofs: original.cofs,
					vendorCodeNames: original.vendorCodeNames,
					canPublish: true,
					archived: false,
					published: false,
				});
			};

			it('Should duplicate archived and published versions', () => {
				const versionPublished = rateCard.getVersionPublished();
				const versionArchived = rateCard.versions[2];

				testDuplicated(versionPublished, rateCard);
				testDuplicated(versionArchived, rateCard);
			});

			it('Should not duplicate versionInProgress', () => {
				const versionInProgress = rateCard.getVersionInProgress();

				should.throws(() => {
					rateCard.duplicateVersion(versionInProgress.uid);
				});

				rateCard.versions.should.have.length(3);
			});
		});
		describe('#importVersion', () => {

			it('Should import version and copy vendors from target rateCard', () => {
				const versionToImport = rateCard.getVersionPublished();
				const targetRateCard = RateCard.create();
				const targetVersion = targetRateCard.createVersion();

				addVendors(targetVersion, ['vendor001', 'vendor002', 'vendor003']);

				const importedVersion = targetRateCard.importVersion(versionToImport.forAPI());

				importedVersion.uid.should.not.equal(versionToImport.uid);

				importedVersion.should.containEql({
					cofs: versionToImport.cofs,
					terms: versionToImport.terms,
					canPublish: true,
					archived: false,
					published: false,
				});
				importedVersion.vendorCodeNames.should.containDeep(targetVersion.vendorCodeNames);
				importedVersion.vendorCodes.forEach(vendorCode => {
					vendorCode.rateCardId.should.equal(targetRateCard.uid);
					vendorCode.versionId.should.equal(importedVersion.uid);
				});

			});

		});

		const addVendors = (version, vendors) => {
			vendors.forEach(name => {
				version.createVendorCode({
					name,
					points: 0
				});
			});
		};

		describe('#hasVendorCodeAvailable', () => {
			it('Should validate against versionInProgress', () => {
				addVendors(rateCard.getVersionInProgress(), ['vendor001', 'vendor002', 'vendor003']);

				rateCard.hasVendorCodeAvailable('vendor001', 'versionInProgress').should.equal(false);
				rateCard.hasVendorCodeAvailable('vendor002', 'versionInProgress').should.equal(false);
				rateCard.hasVendorCodeAvailable('vendor003', 'versionInProgress').should.equal(false);
				rateCard.hasVendorCodeAvailable('vendorNew', 'versionInProgress').should.equal(true);

				rateCard.hasVendorCodeAvailable('vendor001', 'versionPublished').should.equal(true);
				rateCard.hasVendorCodeAvailable('vendor002', 'versionPublished').should.equal(true);
				rateCard.hasVendorCodeAvailable('vendor003', 'versionPublished').should.equal(true);
				rateCard.hasVendorCodeAvailable('vendorNew', 'versionPublished').should.equal(true);

			});
			it('Should validate against versionPublished', () => {
				addVendors(rateCard.getVersionPublished(), ['vendor001', 'vendor002', 'vendor003']);

				rateCard.hasVendorCodeAvailable('vendor001', 'versionPublished').should.equal(false);
				rateCard.hasVendorCodeAvailable('vendor002', 'versionPublished').should.equal(false);
				rateCard.hasVendorCodeAvailable('vendor003', 'versionPublished').should.equal(false);
				rateCard.hasVendorCodeAvailable('vendorNew', 'versionPublished').should.equal(true);

				rateCard.hasVendorCodeAvailable('vendor001', 'versionInProgress').should.equal(true);
				rateCard.hasVendorCodeAvailable('vendor002', 'versionInProgress').should.equal(true);
				rateCard.hasVendorCodeAvailable('vendor003', 'versionInProgress').should.equal(true);
				rateCard.hasVendorCodeAvailable('vendorNew', 'versionInProgress').should.equal(true);
			});
		});
		describe('#withVendorCodes', () => {
			it('Should return the vendorCodes inside the inProgress version', () => {
				const vendors = ['vendor001', 'vendor002', 'vendor003'];
				const expectedVendorCodes = vendors.map(name => {
					return {
						name,
						points: 0
					};
				});

				addVendors(rateCard.getVersionInProgress(), vendors);

				const result = rateCard.withVendorCodes();

				testSchema('rateCard', result, {
					type: 'api',
					strict: false
				});
				result.vendorCodes.should.containDeep(expectedVendorCodes);
			});
			it('Should return `[]` if there is an inProgress version with no vendorCodes', () => {
				const result = rateCard.withVendorCodes();

				testSchema('rateCard', result, {
					type: 'api',
					strict: false
				});
				result.vendorCodes.should.be.Array().empty();
			});
			it('Should return the vendorCodes inside the published version when no inProgress version is present', () => {
				const vendors = ['vendor001', 'vendor002', 'vendor003'];
				const expectedVendorCodes = vendors.map(name => {
					return {
						name,
						points: 0
					};
				});

				addVendors(rateCard.getVersionPublished(), vendors);
				rateCard.removeVersionInProgress();

				const result = rateCard.withVendorCodes();

				testSchema('rateCard', result, {
					type: 'api',
					strict: false
				});
				result.vendorCodes.should.containDeep(expectedVendorCodes);
			});
		});
	});
});
