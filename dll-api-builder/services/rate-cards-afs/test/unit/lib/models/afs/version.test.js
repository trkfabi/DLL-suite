const _ = require('lodash');
const should = require('should');
const uuid = require('uuid/v4');

const Version = require('../../../../../lib/models/afs/version.model');
const Category = require('../../../../../lib/models/afs/category.model');
const Mocks = require('../../../../lib/afs/mocks');

const {
	testSchema
} = require('../../../../lib/afs/test.helpers');

const {
	id
} = require('../../../../lib/reusable/random');

const versionData = ({
	nCats = 2,
	nProds = 2,
	nVendors = 3,
} = {}) => {

	let categories = [];
	let products = [];
	let vendorCodes = [];
	let vendorCodeNames = [];

	for (let i = 0; i < nCats; i++) {
		let category = Category.create(Mocks.category());

		categories.push(category);

		for (let j = 0; j < nProds; j++) {
			let product = Mocks.product();
			product.categoryId = category.uid;

			products.push(product);
		}
	}

	for (let i = 0; i < nVendors; i++) {
		let vendorCode = Mocks.vendorCode();

		vendorCodes.push(vendorCode);
		vendorCodeNames.push(vendorCode.name);
	}

	return _.extend({}, Mocks.version(), {
		rateCardId: uuid(),
		categories,
		products,
		vendorCodes,
		vendorCodeNames
	});
};

describe('services/rate-cards', () => {
	describe('models/afs/version', () => {
		let version = null;
		const appName = 'afs';

		beforeEach(() => {
			// Creates a version with:
			// 2 categories
			// 2 products per category
			// 3 vendor codes
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
			});
			it('Should parse ArrowDB nested models', () => {
				const createMultiple = (mock, count = 2) => {
					let result = [];
					for (let i = 0; i < count; i++) {
						result.push(mock());
					}

					return result;
				};
				const categories = createMultiple(Mocks.category, 2);
				const products = createMultiple(Mocks.product, 10);
				const vendorCodes = createMultiple(Mocks.vendorCode, 3);

				const input = _.extend({}, Mocks.version(), {
					'[CUSTOM_category]category_ids': categories,
					'[CUSTOM_product]product_ids': products,
					'[CUSTOM_vendorcode]vendor_code_ids': vendorCodes,
				});
				const version = Version.create(input);
				testSchema('version', version, {
					type: 'model',
					strict: false
				});
				version.should.containDeep({
					categories,
					products,
					vendorCodes
				});
			});
			it('Should not parse ArrowDB ids-only', () => {
				const input = _.extend({}, Mocks.version(), {
					'[CUSTOM_category]category_ids': ['cbsalae123891m3', 'c4salae123891me', 'cb5alae123891me'],
					'[CUSTOM_product]product_ids': ['cbs31oae123891m3', 'c4sal246123891me', 'cb5dk2ae123891me'],
					'[CUSTOM_vendorcode]vendor_code_ids': ['cbsalae12o1891m3', 'c4slp2e123891me', 'cb5aoy423891me'],
				});
				const version = Version.create(input);
				testSchema('version', version, {
					type: 'model',
					strict: false
				});
				version.categories.should.be.Array().empty();
				version.products.should.be.Array().empty();
				version.vendorCodes.should.be.Array().empty();
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

				version.products.forEach(product => {
					product.versionId.should.equal(versionId);
				});

				version.categories.forEach(category => {
					category.versionId.should.equal(versionId);
				});

				version.vendorCodes.forEach(vendorCode => {
					vendorCode.versionId.should.equal(versionId);
				});
			});
			it('Should remove products with not matching categories', () => {
				const params = versionData();
				params.products.forEach((product, index) => {
					if (index > 2) {
						product.categoryId = '';
					}
				})

				const version = Version.create(params).init();

				testSchema('version', version, {
					type: 'model',
					strict: true
				});
				version.categories.should.have.length(2);
				version.products.should.have.length(3);
				version.products.should.containDeep([
					params.products[0],
					params.products[1],
					params.products[2],
				]);
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
					inputs: version.inputs,
					terms: version.terms,
					canPublish: true,
					archived: false,
					published: false,
				});

				duplicate.categories.length.should.equal(version.categories.length);
				duplicate.products.length.should.equal(version.products.length);
				duplicate.vendorCodes.length.should.equal(version.vendorCodes.length);
			});
		});

		describe('#dependencies', () => {
			it('Should return only nested models with updates', () => {
				version.categories[0].update({
					name: 'My new category'
				});

				version.products[0].update({
					name: 'My new product'
				});

				version.vendorCodes[0].update({
					name: 'My new vendor code'
				});

				const dependencies = version.dependencies();
				dependencies.should.be.Array().have.length(3);

				dependencies.should.containDeep([
					version.categories[0],
					version.products[0],
					version.vendorCodes[0]
				]);
			});

			it('Should return `[]` with no updates on nested models', () => {
				const dependencies = version.dependencies();
				dependencies.should.be.Array().empty();
			});
		});

		describe('#forArrow', () => {
			it('Should return the specific properties for arrowdb', () => {
				version.categories.forEach(category => {
					category.id = id();
				});

				version.products.forEach(product => {
					product.id = id();
				});

				version.vendorCodes.forEach(vendorCode => {
					vendorCode.id = id();
				});

				const forArrow = version.forArrow();

				forArrow.should.containDeep({
					rateCardId: version.rateCardId,
					terms: version.terms,
					creditRatings: version.creditRatings,
					canPublish: version.canPublish,
					archived: version.archived,
					deleted: version.deleted,
					published: version.published,
					datePublished: version.datePublished,
					inputs: version.inputs,
				});

				forArrow.should.have.property('[CUSTOM_product]product_ids').be.Array().length(version.products.length);
				forArrow.should.have.property('[CUSTOM_vendorcode]vendor_code_ids').be.Array().length(version.vendorCodes.length);
				forArrow.should.have.property('[CUSTOM_category]category_ids').be.Array().length(version.categories.length);

				forArrow['[CUSTOM_product]product_ids'].forEach(product => {
					product.should.be.String().not.empty();
				});

				forArrow['[CUSTOM_vendorcode]vendor_code_ids'].forEach(vendorCode => {
					vendorCode.should.be.String().not.empty();
				});

				forArrow['[CUSTOM_category]category_ids'].forEach(category => {
					category.should.be.String().not.empty();
				});
			});

			it('Should not return removed categories, products or vendorCodes', () => {
				version.categories.forEach(category => {
					category.id = id();
				});

				version.products.forEach(product => {
					product.id = id();
				});

				version.vendorCodes.forEach(vendorCode => {
					vendorCode.id = id();
				});

				const productRemoved = version.products[0];
				const vendorCodeRemoved = version.vendorCodes[0];

				version.removeProduct(productRemoved.uid);
				version.removeVendorCode(vendorCodeRemoved.uid);

				const forArrow = version.forArrow();

				forArrow.should.containDeep({
					rateCardId: version.rateCardId,
					terms: version.terms,
					creditRatings: version.creditRatings,
					canPublish: version.canPublish,
					archived: version.archived,
					deleted: version.deleted,
					published: version.published,
					datePublished: version.datePublished,
					inputs: version.inputs,
				});

				forArrow.should.have.property('[CUSTOM_product]product_ids').be.Array().length(version.products.length - 1);
				forArrow.should.have.property('[CUSTOM_vendorcode]vendor_code_ids').be.Array().length(version.vendorCodes.length - 1);
				forArrow.should.have.property('[CUSTOM_category]category_ids').be.Array().length(version.categories.length);

				forArrow['[CUSTOM_product]product_ids'].forEach(product => {
					product.should.be.String().not.empty();
				});

				forArrow['[CUSTOM_vendorcode]vendor_code_ids'].forEach(vendorCode => {
					vendorCode.should.be.String().not.empty();
				});

				forArrow['[CUSTOM_category]category_ids'].forEach(category => {
					category.should.be.String().not.empty();
				});
			});

			it('Should not return categories, products or vendorCodes without id', () => {
				const forArrow = version.forArrow();

				forArrow.should.containDeep({
					rateCardId: version.rateCardId,
					terms: version.terms,
					creditRatings: version.creditRatings,
					canPublish: version.canPublish,
					archived: version.archived,
					deleted: version.deleted,
					published: version.published,
					datePublished: version.datePublished,
					inputs: version.inputs,
				});

				forArrow.should.have.property('[CUSTOM_product]product_ids').be.Array().empty();
				forArrow.should.have.property('[CUSTOM_vendorcode]vendor_code_ids').be.Array().empty();
				forArrow.should.have.property('[CUSTOM_category]category_ids').be.Array().empty();
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

				forAPI.categories.should.be.Array().empty();
				forAPI.products.should.be.Array().empty();
				forAPI.vendorCodes.should.be.Array().empty();
			});

			it('Should not return removed nested models', () => {
				const productRemoved = version.products[0];
				const vendorCodeRemoved = version.vendorCodes[0];
				version.removeProduct(productRemoved.uid);
				version.removeVendorCode(vendorCodeRemoved.uid);

				const forAPI = version.forAPI();
				testSchema('version', forAPI, {
					type: 'api',
					strict: true
				});

				forAPI.products.should.not.containDeep([productRemoved]);
				forAPI.vendorCodes.should.not.containDeep([vendorCodeRemoved]);
			});
		});

		describe('#remove', () => {
			it('Should mark deleted=true and all its nested models', () => {
				version.remove();

				version.deleted.should.equal(true);
				version._hasUpdates.should.equal(true);
				version.categories.should.not.be.empty();
				version.categories.forEach(category => {
					category.deleted.should.equal(true);
					category._hasUpdates.should.equal(true);
				});

				version.products.should.not.be.empty();
				version.products.forEach(product => {
					product.deleted.should.equal(true);
					product._hasUpdates.should.equal(true);
				});

				version.vendorCodes.should.not.be.empty();
				version.vendorCodes.forEach(vendorCode => {
					vendorCode.deleted.should.equal(true);
					vendorCode._hasUpdates.should.equal(true);
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

			it('Should throw an error with more than 5 terms');

			it('Should apply the same terms to  existing inputs, products', () => {
				const terms = ['12', '24'];
				const inputs = Mocks.version().inputs;
				version.update({
					terms,
					inputs,
				});

				testSchema('version', version, {
					type: 'model',
					strict: false
				});

				version._hasUpdates.should.equal(true);
				version.terms.should.deepEqual(terms);
				version.inputs.forEach(input => {
					Object.keys(input.terms).should.deepEqual(terms);
				});

				version.products.forEach(product => {
					Object.keys(product.terms).should.deepEqual(terms);
				});

			});
			it('Should update the given non-all-in inputs', () => {

				const validInputs = Mocks.version().inputs;
				const invalidInputs = [{
						'terms': {
							'12': 0
						},
						'name': 'AAA to AA',
						'type': 'allin-fmv',
						'creditRatings': ['AAA', 'AA+', 'AA']
					},
					{
						'terms': {
							'12': 0
						},
						'name': 'AA- to A-',
						'type': 'allin-fmv',
						'creditRatings': ['AA-', 'A+', 'A', 'A-']
					},
					{
						'terms': {
							'12': 0
						},
						'name': 'BBB+ to BBB-',
						'type': 'allin-fmv',
						'creditRatings': ['BBB+', 'BBB', 'BBB-']
					},
					{
						'terms': {
							'12': 0
						},
						'name': 'BB+ to BB',
						'type': 'allin-fmv',
						'creditRatings': ['BB+', 'BB']
					},
					{
						'terms': {
							'12': 0
						},
						'name': 'AAA to AA',
						'type': 'allin-out',
						'creditRatings': ['AAA', 'AA+', 'AA']
					},
					{
						'terms': {
							'12': 0
						},
						'name': 'AA- to A-',
						'type': 'allin-out',
						'creditRatings': ['AA-', 'A+', 'A', 'A-']
					},
					{
						'terms': {
							'12': 0
						},
						'name': 'BBB+ to BBB-',
						'type': 'allin-out',
						'creditRatings': ['BBB+', 'BBB', 'BBB-']
					},
					{
						'terms': {
							'12': 0
						},
						'name': 'BB+ to BB',
						'type': 'allin-out',
						'creditRatings': ['BB+', 'BB']
					}
				];
				const inputs = [...validInputs, ...invalidInputs];

				version.update({
					inputs
				});

				testSchema('version', version, {
					type: 'model',
					strict: false
				});

				version._hasUpdates.should.equal(true);
				version.inputs.should.containDeep(validInputs);
				version.inputs.should.not.containDeep(invalidInputs);
			});
		});

		describe('#validateVersionIsInProgress', () => {
			it('Should throw an error if the current version is not in progress', () => {
				version.update({
					canPublish: true,
					published: true
				});
				should.throws(() => {
					version.validateVersionIsInProgress()
				});
			});
			it('Should not throw an error if the current version is in progress', () => {
				version.update({
					canPublish: true,
					published: false
				});
				should.doesNotThrow(() => {
					version.validateVersionIsInProgress()
				});
			});

		});
		describe('#checkVersionIsNotPublishing', () => {
			it('Should throw an error if the current version is publishing', () => {
				version.update({
					isPublishing: true
				});
				should.throws(() => {
					version.checkVersionIsNotPublishing()
				});
			});
			it('Should not throw an error if the current version is not publishing', () => {
				version.update({
					isPublishing: false
				});
				should.doesNotThrow(() => {
					version.checkVersionIsNotPublishing()
				});
			});

		});

		describe('#getNextOrder', () => {
			it('Should return 1 if the version does not have products, categories', () => {
				const version = Version.create(_.extend(Mocks.version(), {
					rateCardId: uuid()
				})).init();

				const newOrder = version.getNextOrder([]);
				const expected = 1;

				newOrder.should.equal(expected);

			});

			it('Should return largest order + 1 from all the products, categories', () => {
				version.products[0].update({
					order: 100
				});
				version.categories[0].update({
					order: 50
				});

				const newProductOrder = version.getNextOrder(version.products);
				const expectedProductOrder = 101;
				const newCategoryOrder = version.getNextOrder(version.categories);
				const expectedCategoryOrder = 51;

				newProductOrder.should.equal(expectedProductOrder);
				newCategoryOrder.should.equal(expectedCategoryOrder);

			});
		});

		describe('#findByUID', () => {
			it('Should return the product, category, vendorCode based on its uid', () => {
				const categoryUid = version.categories[0].uid;
				const category = version.findByUID(version.categories, categoryUid);

				const productUid = version.products[0].uid;
				const product = version.findByUID(version.products, productUid);

				const vendorCodeUid = version.vendorCodes[0].uid;
				const vendorCode = version.findByUID(version.vendorCodes, vendorCodeUid);

				category.should.deepEqual(version.categories[0]);
				product.should.deepEqual(version.products[0]);
				vendorCode.should.deepEqual(version.vendorCodes[0]);

			});

			it('Should throw an error if the category, product, vendorCode is not found', () => {

				const nonExistentUid = 'XXXXXXXXX';

				should(() => {
					version.findByUID(version.categories, nonExistentUid)
				}).throw(`item.id not found with ID: ${nonExistentUid}`);

				should(() => {
					version.findByUID(version.products, nonExistentUid)
				}).throw(`item.id not found with ID: ${nonExistentUid}`);

				should(() => {
					version.findByUID(version.vendorCodes, nonExistentUid)
				}).throw(`item.id not found with ID: ${nonExistentUid}`);

			});

			it('Should throw an error if the uid is not entered');
		});

		describe('#createCategory', () => {
			// check version._hasUpdates = true
			// check version.dependencies() returns the new category
			// check category.order is correct
			// test schema for category
			// test version.categories.length
			it('Should create a new category with default values', () => {
				const input = {
					name: 'New Category'
				};

				const categoriesLength = version.categories.length;
				const newCategory = version.createCategory(input);

				newCategory.versionId.should.equal(version.uid);
				newCategory.name.should.equal(input.name);
				newCategory.deleted.should.equal(false);
				newCategory.order.should.above(0);
				version._hasUpdates.should.equal(true);
				version.dependencies().should.containDeep([newCategory]);
				version.categories.length.should.equal(categoriesLength + 1);

			});

			it('Should create a new category with the given values', () => {
				const input = {
					name: 'New Category1',
					order: 100
				};

				const categoriesLength = version.categories.length;
				const newCategory = version.createCategory(input);

				newCategory.versionId.should.equal(version.uid);
				newCategory.name.should.equal(input.name);
				newCategory.deleted.should.equal(false);
				newCategory.order.should.equal(input.order);
				version._hasUpdates.should.equal(true);
				version.dependencies().should.containDeep([newCategory]);

				version.categories.length.should.equal(categoriesLength + 1);
			});

			it('Should throw an error if the category name already exists', () => {
				const duplicatedName = version.categories[0].name;
				const input = {
					name: duplicatedName
				};

				should(() => {
					version.createCategory(input)
				}).throw(`There is a duplicated name with value ${duplicatedName.trim().toLowerCase()}`);

			});
			it('Should throw an error if the category name has more than 25 characters', () => {
				const longName = 'SDASWSEDOED23231243FMSED0932w';
				const input = {
					name: longName
				};

				should.throws(() => {
					version.createCategory(input)
				});

			});

			it('Should throw an error if no parameters sent', () => {

				should(() => {
					version.createCategory()
				}).throw(`There is a missing required parameter: name.`);

			});
		});

		describe('#updateCategory', () => {
			// check version._hasUpdates = true
			// check version.dependencies() returns the category
			it('Should update a category when found', () => {
				const input = {
					uid: version.categories[0].uid,
					name: 'Updated CategoryName',
					order: 50
				};

				const categoriesLength = version.categories.length;
				const updatedCategory = version.updateCategory(input);

				updatedCategory.versionId.should.equal(version.uid);
				updatedCategory.name.should.equal(input.name);
				updatedCategory.order.should.equal(input.order);
				version._hasUpdates.should.equal(true);
				version.dependencies().should.containDeep([updatedCategory]);

				version.categories.length.should.equal(categoriesLength);
			});
			it('Should throw an error if the category is not found', () => {
				const nonExistentUid = 'XXXXXXXXX';
				const input = {
					uid: nonExistentUid,
					name: 'Updated CategoryName'
				};

				should(() => {
					version.updateCategory(input)
				}).throw(`item.id not found with ID: ${nonExistentUid}`);

			});
			it('Should throw an error if the category name already exists', () => {
				const duplicatedName = version.categories[1].name;
				const input = {
					uid: version.categories[0].uid,
					name: duplicatedName
				};

				should(() => {
					version.updateCategory(input)
				}).throw(`There is a duplicated name with value ${duplicatedName.trim().toLowerCase()}`);

			});

			it('Should throw an error if the category name has more than 25 characters', () => {
				const longName = 'SDASWSEDOED23231243FMSED0932w';
				const input = {
					uid: version.categories[0].uid,
					name: longName
				};

				should.throws(() => {
					version.updateCategory(input)
				});

			});
		});

		describe('#removeCategory', () => {
			// check version._hasUpdates = true
			// check version.dependencies() returns the category
			it('Should remove a category and it products', () => {

				const categoryUid = version.categories[0].uid;

				const categoryProducts = version.products.filter(product => {
					return product.categoryId === categoryUid;
				});

				const removedCategory = version.removeCategory(categoryUid);

				removedCategory.deleted.should.equal(true);
				removedCategory._hasUpdates.should.equal(true);
				version._hasUpdates.should.equal(true);
				version.dependencies().should.not.containDeep(removedCategory);

				if (categoryProducts.length > 0) {
					categoryProducts.forEach(product => {
						product.deleted.should.equal(true);
						product._hasUpdates.should.equal(true);
						version.dependencies().should.not.containDeep(product);
					});
				}
			});

			it('Should throw an error if the category is not found', () => {
				const nonExistentUid = 'XXXXXXXXX';

				should(() => {
					version.removeCategory(nonExistentUid)
				}).throw(`item.id not found with ID: ${nonExistentUid}`);

			});

		});

		describe('#createProduct', () => {
			// check version._hasUpdates = true
			// check version.dependencies() returns the product
			// check product.terms is correct
			// check product.order is correct
			it('Should create a new product with default values', () => {
				const input = {
					name: 'New Product',
					categoryId: version.categories[0].uid
				};

				const productsLength = version.products.length;
				const newProduct = version.createProduct(input);

				newProduct.versionId.should.equal(version.uid);
				newProduct.categoryId.should.equal(version.categories[0].uid);
				newProduct.name.should.equal(input.name);
				newProduct.deleted.should.equal(false);
				newProduct.order.should.above(0);
				newProduct.hasItad.should.equal(false);
				newProduct.itadValue.should.equal(0);
				Object.keys(newProduct.terms).should.deepEqual(version.terms);
				version._hasUpdates.should.equal(true);
				version.dependencies().should.containDeep([newProduct]);

				version.products.length.should.equal(productsLength + 1);

			});
			it('Should create a new product with given values', () => {
				const input = {
					name: 'New Product1',
					categoryId: version.categories[0].uid,
					order: 50,
					hasItad: true,
					itadValue: 2.0
				};

				const productsLength = version.products.length;
				const newProduct = version.createProduct(input);

				newProduct.versionId.should.equal(version.uid);
				newProduct.categoryId.should.equal(version.categories[0].uid);
				newProduct.name.should.equal(input.name);
				newProduct.deleted.should.equal(false);
				newProduct.order.should.equal(input.order);
				newProduct.hasItad.should.equal(input.hasItad);
				newProduct.itadValue.should.equal(input.itadValue);

				Object.keys(newProduct.terms).should.deepEqual(version.terms);
				version._hasUpdates.should.equal(true);
				version.dependencies().should.containDeep([newProduct]);

				version.products.length.should.equal(productsLength + 1);

			});
			it('Should throw an error if the product name already exists', () => {
				const duplicatedName = version.products[0].name;
				const input = {
					name: duplicatedName,
					categoryId: version.categories[0].uid
				};

				should(() => {
					version.createProduct(input)
				}).throw(`There is a duplicated name with value ${duplicatedName.trim().toLowerCase()}`);

			});

			it('Should throw an error if the product name has more than 25 characters', () => {
				const longName = 'SDASWSEDOED23231243FMSED0932w';
				const input = {
					name: longName,
					categoryId: version.categories[0].uid
				};

				should.throws(() => {
					version.createProduct(input)
				});

			});

			it('Should throw an error if the product name not sent', () => {
				const input = {
					categoryId: version.categories[0].uid
				};

				should(() => {
					version.createProduct(input)
				}).throw(`There is a missing required parameter: name.`);

			});

			it('Should throw an error if the categoryId not found', () => {
				const nonExistentUid = 'XXXXXXXXX';
				const input = {
					name: 'New name',
					categoryId: nonExistentUid
				};

				should(() => {
					version.createProduct(input)
				}).throw(`item.id not found with ID: ${nonExistentUid}`);

			});
			it('Should throw an error if no parameters sent', () => {
				should(() => {
					version.createProduct()
				}).throw(`There is a missing required parameter: categoryId.`);

			});

		});

		describe('#updateProduct', () => {
			// check version._hasUpdates = true
			// check version.dependencies() returns the product
			// check product.terms is correct
			it('Should update a product', () => {
				const input = {
					uid: version.products[0].uid,
					name: 'Product Change name',
					categoryId: version.categories[0].uid,
					order: 90,
					hasItad: true,
					itadValue: 4.0
				};

				const productsLength = version.products.length;
				const updatedProduct = version.updateProduct(input);

				updatedProduct.versionId.should.equal(version.uid);
				updatedProduct.categoryId.should.equal(version.categories[0].uid);
				updatedProduct.name.should.equal(input.name);
				updatedProduct.order.should.equal(input.order);
				updatedProduct.hasItad.should.equal(input.hasItad);
				updatedProduct.itadValue.should.equal(input.itadValue);

				Object.keys(updatedProduct.terms).should.deepEqual(version.terms);
				version._hasUpdates.should.equal(true);
				version.dependencies().should.containDeep([updatedProduct]);

				version.products.length.should.equal(productsLength);

			});
			it('Should set iTadValue to 0 if update a product and hasItad is false', () => {
				const input = {
					uid: version.products[0].uid,
					categoryId: version.categories[0].uid,
					hasItad: false,
					itadValue: 4.0
				};

				const updatedProduct = version.updateProduct(input);

				updatedProduct.versionId.should.equal(version.uid);
				updatedProduct.hasItad.should.equal(input.hasItad);
				updatedProduct.itadValue.should.equal(0);

			});

			it('Should throw an error if the product is not found', () => {
				const nonExistentUid = 'XXXXXXXXX';
				const input = {
					uid: nonExistentUid,
					categoryId: version.categories[0].uid,
					name: 'Updated ProductName'
				};

				should(() => {
					version.updateProduct(input)
				}).throw(`item.id not found with ID: ${nonExistentUid}`);

			});
			it('Should throw an error if the categoryId is not found', () => {
				const nonExistentUid = 'XXXXXXXXX';
				const input = {
					uid: version.products[0].uid,
					categoryId: nonExistentUid,
					name: 'Updated ProductName'
				};

				should(() => {
					version.updateProduct(input)
				}).throw(`item.id not found with ID: ${nonExistentUid}`);

			});

			it('Should throw an error if the product name already exists', () => {
				const duplicatedName = version.products[1].name;
				const input = {
					uid: version.products[0].uid,
					name: duplicatedName,
					categoryId: version.categories[0].uid
				};

				should(() => {
					version.updateProduct(input)
				}).throw(`There is a duplicated name with value ${duplicatedName.trim().toLowerCase()}`);

			});
			it('Should throw an error if the product name has more than 25 characters', () => {
				const longName = 'SDASWSEDOED23231243FMSED0932w';
				const input = {
					uid: version.products[0].uid,
					name: longName,
					categoryId: version.categories[0].uid
				};

				should.throws(() => {
					version.updateProduct(input)
				});

			});
		});

		describe('#removeProduct', () => {
			it('Should remove a product', () => {

				const productUid = version.products[0].uid;

				const removedProduct = version.removeProduct(productUid);

				removedProduct.deleted.should.equal(true);
				removedProduct._hasUpdates.should.equal(true);

				version._hasUpdates.should.equal(true);
				version.dependencies().should.not.containDeep(removedProduct);
			});

			it('Should throw an error if the product is not found', () => {
				const nonExistentUid = 'XXXXXXXXX';

				should(() => {
					version.removeProduct(nonExistentUid)
				}).throw(`item.id not found with ID: ${nonExistentUid}`);

			});
		});

		describe('#createVendorCode', () => {
			it('Should create a new vendorCode with default values', () => {
				const input = {
					name: 'New VendorCode'
				};

				const vendorCodesLength = version.vendorCodes.length;
				const newVendorCode = version.createVendorCode(input);

				newVendorCode.versionId.should.equal(version.uid);
				newVendorCode.rateCardId.should.equal(version.rateCardId);
				newVendorCode.name.should.equal(input.name);
				newVendorCode.deleted.should.equal(false);
				newVendorCode.points.should.equal(0);
				version.vendorCodes.length.should.equal(vendorCodesLength + 1);
				version._hasUpdates.should.equal(true);
				version.dependencies().should.containDeep([newVendorCode]);

			});
			it('Should create a new vendorCode with given values', () => {
				const input = {
					name: 'New VendorCode',
					points: 2.0
				};

				const vendorCodesLength = version.vendorCodes.length;
				const newVendorCode = version.createVendorCode(input);

				newVendorCode.versionId.should.equal(version.uid);
				newVendorCode.rateCardId.should.equal(version.rateCardId);
				newVendorCode.name.should.equal(input.name);
				newVendorCode.deleted.should.equal(false);
				newVendorCode.points.should.equal(input.points);
				version.vendorCodes.length.should.equal(vendorCodesLength + 1);
				version._hasUpdates.should.equal(true);
				version.dependencies().should.containDeep([newVendorCode]);

			});
			it('Should throw an error if the vendorCode name already exists', () => {
				const duplicatedName = version.vendorCodes[0].name;
				const input = {
					name: duplicatedName
				};

				should(() => {
					version.createVendorCode(input)
				}).throw(`There is a duplicated name with value ${duplicatedName.trim().toLowerCase()}`);

			});
			it('Should throw an error if the vendor name not sent', () => {

				should(() => {
					version.createVendorCode()
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

				updatedVendorCode.versionId.should.equal(version.uid);
				updatedVendorCode.rateCardId.should.equal(version.rateCardId);
				updatedVendorCode.name.should.equal(input.name);
				updatedVendorCode.points.should.equal(input.points);
				version.vendorCodes.length.should.equal(vendorCodesLength);
				version._hasUpdates.should.equal(true);
				version.dependencies().should.containDeep([updatedVendorCode]);

			});
			it('Should throw an error if the vendorCode is not found', () => {
				const nonExistentUid = 'XXXXXXXXX';
				const input = {
					uid: nonExistentUid,
					name: 'New name'
				};

				should(() => {
					version.updateVendorCode(input)
				}).throw(`item.id not found with ID: ${nonExistentUid}`);

			});
			it('Should throw an error if the vendorCode name already exists', () => {
				const duplicatedName = version.vendorCodes[1].name;
				const input = {
					uid: version.vendorCodes[0].uid,
					name: duplicatedName
				};

				should(() => {
					version.updateVendorCode(input)
				}).throw(`There is a duplicated name with value ${duplicatedName.trim().toLowerCase()}`);

			});
		});

		describe('#removeVendorCode', () => {
			it('Should remove a vendorCode', () => {

				const vendorCodeUid = version.vendorCodes[0].uid;

				const removedVendorCode = version.removeVendorCode(vendorCodeUid);

				removedVendorCode.deleted.should.equal(true);
				removedVendorCode._hasUpdates.should.equal(true);
				version._hasUpdates.should.equal(true);
				version.dependencies().should.not.containDeep(removedVendorCode);
			});

			it('Should throw an error if the vendorCode is not found', () => {
				const nonExistentUid = 'XXXXXXXXX';

				should(() => {
					version.removeVendorCode(nonExistentUid)
				}).throw(`item.id not found with ID: ${nonExistentUid}`);

			});
		});

		describe('#calculateRateFactors', () => {
			it('Should replace version.rateFactors already existing');
			it('Should leave version.rateFactors=[] when they are not calculated');
			it('Should not include rateFactors for vendorCodes with options.baseOnly = true')
		});

		describe('#rateFactorsWithProducts', () => {
			// test schema for rateFactors type=admin
			it('Should update version.rateFactors={out, fmv} with required data');
			it('Should update version.rateFactors={} with missing data');
		});
	});
});
