const _ = require('lodash');
const VersionBase = require('../version-base.model');
const Category = require('./category.model');
const Product = require('./product.model');
const VendorCode = require('../vendor-code.model');
const RateFactor = require('./rate-factor.model');
const Helpers = require('../../helpers');
const DataError = require('../../reusable/errors/dataError');
const RequestError = require('../../reusable/errors/requestError');
const Calculator = require('../../rateCardCalculator');
const Constants = require('../../../constants/constants');

const {
	compact
} = require('../../reusable/helpers');

const LOG_TAG = '\x1b[34m' + '[models/version]' + '\x1b[39;49m ';

const table = 'version';
const ARROW_FIELDS = {
	PRODUCTS: '[CUSTOM_product]product_ids',
	VENDOR_CODES: '[CUSTOM_vendorcode]vendor_code_ids',
	CATEGORIES: '[CUSTOM_category]category_ids',
};

/**
 * Custom logic for versions
 * @class Models.version
 * @singleton
 */
const Version = _.extend({}, VersionBase, {
	table,

	/**
	 * @method constructor
	 * initialices the object
	 */
	constructor(_defaults = {}) {
		_.extend(this, {
			app: Constants.apps.APP_AFS,
			creditRatings: ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-', 'BB+', 'BB'],
			terms: ['12'],
			inputs: [{
					'terms': {
						'12': 0
					},
					'name': 'FMV',
					'type': 'cof',
					'creditRatings': []
				},
				{
					'terms': {
						'12': 0
					},
					'name': '$1 Out',
					'type': 'cof',
					'creditRatings': []
				},
				{
					'terms': {
						'12': 0
					},
					'name': 'AAA to AA',
					'type': 'spread',
					'creditRatings': ['AAA', 'AA+', 'AA']
				},
				{
					'terms': {
						'12': 0
					},
					'name': 'AA- to A-',
					'type': 'spread',
					'creditRatings': ['AA-', 'A+', 'A', 'A-']
				},
				{
					'terms': {
						'12': 0
					},
					'name': 'BBB+ to BBB-',
					'type': 'spread',
					'creditRatings': ['BBB+', 'BBB', 'BBB-']
				},
				{
					'terms': {
						'12': 0
					},
					'name': 'BB+ to BB',
					'type': 'spread',
					'creditRatings': ['BB+', 'BB']
				},
				{
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
			],
		});

		VersionBase.constructor.call(this, _defaults, {
			products: [],
			categories: [],
			rateFactors: []
		});

		_.each(ARROW_FIELDS, fieldName => {
			if (!this[fieldName]) {
				return;
			}

			switch (fieldName) {
			case ARROW_FIELDS.PRODUCTS:
				this.products = this[fieldName];
				break;
			case ARROW_FIELDS.CATEGORIES:
				this.categories = this[fieldName];
				break;
			case ARROW_FIELDS.VENDOR_CODES:
				this.vendorCodes = this[fieldName];
				break;
			}
		});

		const nested = [{
				field: 'products',
				model: Product
			},
			{
				field: 'categories',
				model: Category
			},
			{
				field: 'vendorCodes',
				model: VendorCode
			},
		];

		_.each(nested, ({
			field,
			model
		}) => {
			if (this[field].length === 0) {
				return;
			}

			this[field] = _.chain(this[field])
				.filter(item => {
					return _.isObject(item) && !item.deleted;
				})
				.compact()
				.map(item => {
					return model.create(item);
				})
				.value();
		});

		this.update({
			terms: _defaults.terms,
			inputs: _defaults.inputs
		});

		this._hasUpdates = false;

		return this;
	},

	/**
	 * @method init
	 * initialices the object
	 */
	init() {
		log(LOG_TAG, 'init');
		VersionBase.init.call(this);

		this.categories.forEach(category => {
			category.versionId = this.uid;
		});

		this.products.forEach(product => {
			product.versionId = this.uid;

			try {
				this.findByUID(this.categories, product.categoryId);
			} catch (error) {
				this.products.splice(this.products.indexOf(product), 1);
			}
		});

		this.vendorCodes.forEach(vendorCode => {
			vendorCode.versionId = this.uid;
			vendorCode.rateCardId = this.rateCardId;
		});

		return this;
	},
	/**
	 * @method duplicate
	 * Duplicates the version creating copies of its dependencies to use on the new version
	 * @return {object} the new version
	 */
	duplicate() {
		log(LOG_TAG, 'duplicate');

		let categories = [];
		let products = [];

		let newVersion = create(_.extend({}, this, {
			uid: undefined,
			id: undefined,
			products: [],
			categories: [],
			vendorCodes: [],
			published: false,
			archived: false,
			canPublish: true,
			datePublished: '',
			rateFactors: []
		}));

		this.categories.forEach(category => {
			const catProducts = this.products.filter(product => {
				return product.categoryId === category.uid;
			});

			const newCategory = category.duplicate();
			newCategory.versionId = newVersion.uid;
			categories.push(newCategory);

			catProducts.forEach(product => {
				const newProduct = product.duplicate();
				newProduct.categoryId = newCategory.uid;
				newProduct.versionId = newVersion.uid;
				products.push(newProduct);
			});
		});

		const vendorCodes = this.vendorCodes.map(vendorCode => {
			let newVendorCode = vendorCode.duplicate();
			newVendorCode.versionId = newVersion.uid;

			return newVendorCode;
		});

		_.extend(newVersion, {
			categories,
			products,
			vendorCodes,
			_hasUpdates: true
		});

		return newVersion;
	},
	/**
	 * @method dependencies
	 * Returns an Array of all external models tied to the version, this is used for saving on ArrowDb
	 * @return {Array[Object]} Array of the dependencies
	 */
	dependencies() {
		return [
			...this.products.filter(product => product._hasUpdates),
			...this.categories.filter(category => category._hasUpdates),
			...this.vendorCodes.filter(vendorCode => vendorCode._hasUpdates)
		];
	},
	/**
	 * @method forAll
	 * Returns an object with the structure of the model. 
	 * @return {object}
	 */
	forAll() {
		const json = VersionBase.forAll.call(this);
		return _.extend(json, {
			creditRatings: this.creditRatings,
			inputs: this.inputs,
			vendorCodeNames: this.vendorCodeNames
		});
	},

	/**
	 * @method forArrow
	 * Returns the properties required to save on ArrowDb
	 * @return {object}
	 */
	forArrow() {
		const json = VersionBase.forArrow.call(this);

		return _.extend(json, this.forAll(), {
			[ARROW_FIELDS.PRODUCTS]: _.compact(this.active('products').map(product => product.id)),
			[ARROW_FIELDS.VENDOR_CODES]: _.compact(this.active('vendorCodes').map(vendorCode => vendorCode.id)),
			[ARROW_FIELDS.CATEGORIES]: _.compact(this.active('categories').map(category => category.id)),
		});
	},

	/**
	 * @method forAPI
	 * Returns the properties required to present in the API
	 * @return {object}
	 */
	forAPI() {
		const json = VersionBase.forAPI.call(this);

		let categoryOrder = {};
		this.active('categories').forEach(category => {
			categoryOrder[category.uid] = category.order;
		});

		const products = this.active('products').map(product => {
			return _.extend(product.forAPI(), {
				categoryOrder: categoryOrder[product.categoryId]
			});
		});

		const productOrder = (a, b) => {
			if (a.categoryOrder < b.categoryOrder) return -1;
			if (a.categoryOrder > b.categoryOrder) return 1;

			if (a.order < b.order) return -1;
			if (a.order > b.order) return 1;
		};

		products.sort(productOrder);

		return _.extend(json, this.forAll(), {
			products,
			categories: _.chain(this.active('categories')).sortBy('order').map(category => category.forAPI()).value(),
			vendorCodes: this.active('vendorCodes').map(vendorCode => vendorCode.forAPI()),
			rateFactors: this.rateFactors.map(rateFactor => rateFactor.forAPI())
		});
	},
	/**
	 * @method remove
	 * Removes the object and all dependencies marking them as deleted, not a physical deletion
	 * @return {object}
	 */
	remove() {
		log(LOG_TAG, 'remove');

		this.categories.forEach(category => category.remove());
		this.products.forEach(product => product.remove());
		this.vendorCodes.forEach(vendorCode => vendorCode.remove());

		const json = VersionBase.remove.call(this);

		return _.extend(json, this);
	},
	/**
	 * @method update
	 * Updates the model 
	 * @param {Object} _newData Data to update
	 * @return {object}
	 */
	update(_newData) {
		const newData = JSON.parse(JSON.stringify(compact(_newData)));

		const updateTerms = (newTerms, inputs) => {
			_.each(inputs, input => {
				input.terms = Helpers.updateObjectFromArray(newTerms, input.terms);
			});
		};

		let {
			terms: newTerms = [],
			inputs: newInputs = []
		} = newData;

		let {
			inputs,
			products
		} = this;

		if (!_.isArray(newTerms)) {
			throw RequestError('terms should be an array.')
		}

		if (!_.isArray(newInputs)) {
			throw RequestError('inputs should be an array.')
		}

		newTerms = Helpers.sanitizeTerms(newTerms);

		delete newData.inputs;
		delete newData.terms;
		delete newData.app;

		if (newTerms.length > 0) {
			this.terms = newTerms;
			updateTerms(newTerms, inputs);
			updateTerms(newTerms, products);
			updateTerms(newTerms, newInputs);
		}

		_.extend(this, newData);

		if (newInputs.length > 0) {
			this.updateInputs(newInputs);
		}

		if (newTerms.length > 0 || newInputs.length > 0) {
			const allIns = Calculator.calculateAllInsAFS({
				terms: this.terms,
				inputs: this.inputs
			});

			this.updateInputs(allIns);
		}

		this._hasUpdates = true;

		return this;
	},
	/**
	 * @method updateInputs
	 * Updates the inputs of the version
	 * @param {Array[Object]} _newInputs Input data to update
	 * @return {void}
	 */
	updateInputs(_newInputs = []) {
		_.each(_newInputs, newInput => {
			const input = _.find(this.inputs, {
				name: newInput.name,
				type: newInput.type
			});

			if (input) {
				_.extend(input, compact(newInput));
			}
		});
	},

	/**
	 * @method createCategory
	 * Creates a category
	 * @param {Object} _newData Data of the category to create
	 * @return {Object} The newly created category
	 */
	createCategory(_newData = {}) {
		log(LOG_TAG, 'createCategory', _newData);

		let {
			name,
			order = -1
		} = _newData;

		if (name) {
			Helpers.validateName({
				collection: this.categories,
				name
			});
		} else {
			throw DataError({
				code: 'missing-required-parameter',
				variable: 'name'
			});
		}
		const category = Category.create(compact(_newData));

		if (_.isNull(order) || order === -1) {
			order = this.getNextOrder(this.categories);
		}

		category.update({
			versionId: this.uid,
			order
		})

		this.categories.push(category);

		this.update({
			canPublish: true
		});

		return category;
	},
	/**
	 * @method updateCategory
	 * Updates a category
	 * @param {Object} _newData Data to update
	 * @return {Object} The updated category
	 */
	updateCategory(_newData = {}) {
		log(LOG_TAG, 'updateCategory', _newData);

		const newData = JSON.parse(JSON.stringify(compact(_newData)));
		const {
			uid,
			name = '',
		} = newData;

		if (!uid) {
			throw Error(`${LOG_TAG} - updateCategory - Missing uid`);
		}

		const category = this.findByUID(this.categories, uid);

		if (name.length > 0 && category && (name !== category.name)) {
			Helpers.validateName({
				collection: this.categories,
				name,
				uid
			});
		}

		category.update(newData);
		this.update({
			canPublish: true
		});

		return category;
	},
	/**
	 * @method removeCategory
	 * Removes a category and its products
	 * @param {String} _categoryId Id of the category to remove
	 * @return {Object} The removed category
	 */
	removeCategory(_categoryId) {
		log(LOG_TAG, 'removeCategory', _categoryId);

		const category = this.findByUID(this.categories, _categoryId);
		category.remove();

		_.chain(this.products)
			.filter(product => {
				return product.categoryId === _categoryId;
			})
			.each(product => {
				product.remove();
			})
			.value();

		this.update({
			canPublish: true
		});

		return category;
	},
	/**
	 * @method createProduct
	 * Creates a product
	 * @param {Object} _newData Data of the product to create
	 * @return {Object} The newly created product
	 */
	createProduct(_newData = {}) {
		log(LOG_TAG, 'createProduct', _newData);

		let {
			name,
			categoryId,
			order = -1
		} = _newData;

		// validates the category exists
		if (categoryId) {
			this.findByUID(this.categories, categoryId);
		} else {
			throw DataError({
				code: 'missing-required-parameter',
				variable: 'categoryId'
			});
		}
		if (name) {
			Helpers.validateName({
				collection: this.products,
				name
			});
		} else {
			throw DataError({
				code: 'missing-required-parameter',
				variable: 'name'
			});
		}

		if (_newData.hasOwnProperty('hasItad') && !_newData.hasItad) {
			_newData.itadValue = 0;
		}

		const product = Product.create(compact(_newData));

		if (_.isNull(order) || order === -1) {
			order = this.getNextOrder(this.products);
		}

		product.update({
			versionId: this.uid,
			order,
			terms: Helpers.updateObjectFromArray(this.terms)
		});

		this.products.push(product);
		this.update({
			canPublish: true
		});

		return product;
	},
	/**
	 * @method updateProduct
	 * Updates a product
	 * @param {Object} _newData Data to update
	 * @return {Object} The updated product
	 */
	updateProduct(_newData = {}) {
		log(LOG_TAG, 'updateProduct', _newData);

		const newData = JSON.parse(JSON.stringify(compact(_newData)));
		const {
			uid,
			categoryId,
			name = '',
		} = newData;

		if (!uid) {
			throw Error(`${LOG_TAG} - updateProduct - Missing uid`);
		}

		// validates the category exists
		this.findByUID(this.categories, categoryId);
		const product = this.findByUID(this.products, uid);

		if (name.length > 0 && product && (name !== product.name)) {
			Helpers.validateName({
				collection: this.products,
				name,
				uid
			});
		}

		if (newData.hasOwnProperty('hasItad') && !newData.hasItad) {
			newData.itadValue = 0;
		}

		product.update(newData);
		this.update({
			canPublish: true
		});

		return product;
	},
	/**
	 * @method removeProduct
	 * Removes a product
	 * @param {String} _productId Id of the product to remove
	 * @return {Object} The removed product
	 */
	removeProduct(_productId) {
		log(LOG_TAG, 'removeProduct', _productId);

		const product = this.findByUID(this.products, _productId);
		product.remove();

		this.update({
			canPublish: true
		});

		return product;
	},

	/**
	 * @method calculateRateFactors
	 * Calculates the ratefactors of the version
	 * @param {String} _vendorCodeId Id of the vendor code to return
	 * @return {Object} The vendor code
	 */
	calculateRateFactors(_options = {}) {
		log(LOG_TAG, 'calculateRateFactors', _options);

		const {
			baseOnly = false
		} = _options;

		let rateFactors = Calculator.calculateRateFactors({
			inputs: this.inputs,
			terms: this.terms,
			versionId: this.uid,
			creditRatings: this.creditRatings,
			products: this.products,
			vendorCodes: _options.vendorCodes ? [_options.vendorCodes] : this.vendorCodes,
			baseOnly
		});

		rateFactors = _.map(rateFactors, rateFactor => {
			return RateFactor.create(rateFactor);
		});

		this.rateFactors = rateFactors;

		return rateFactors;
	},
	/**
	 * @method rateFactorsWithProducts
	 * Returns the ratefactors with product and category data
	 * @return {Array[Object]} The ratefactors
	 */
	rateFactorsWithProducts() {
		const rates = [
			'out',
			'fmv',
		];

		const products = {};
		const categories = {};
		const rateFactorsCache = {};

		this.rateFactors.forEach(rateFactor => {
			rateFactor = rateFactor.forAPI();

			const customId = [
				rateFactor.rate,
				rateFactor.productId || '0',
				rateFactor.creditRating
			].join('-');

			let cachedRateFactor = rateFactorsCache[customId];

			if (!cachedRateFactor) {
				let product = {
					order: 0
				};
				let category = {
					order: 0
				};

				if (rateFactor.rate === 'fmv') {
					product = products[rateFactor.productId] || _.find(this.products, {
						uid: rateFactor.productId
					});
					category = categories[product.categoryId] || _.find(this.categories, {
						uid: product.categoryId
					});

					products[rateFactor.productId] = product;
					categories[product.categoryId] = category;
				}

				const ratesEnabled = product.ratesEnabled || [];

				if (ratesEnabled.includes('1out')) {
					return;
				}

				cachedRateFactor = _.extend({}, rateFactor, {
					terms: {},
					product: {
						id: product.uid,
						name: product.name,
						order: product.order
					},
					category: {
						id: category.uid,
						name: category.name,
						order: category.order
					}
				});

				delete cachedRateFactor.term;
				delete cachedRateFactor.value;

				rateFactorsCache[customId] = cachedRateFactor;
			}
			cachedRateFactor.order = [
				_.indexOf(rates, cachedRateFactor.rate),
				cachedRateFactor.category.order.toString().padStart(3, '0'),
				cachedRateFactor.product.order.toString().padStart(3, '0'),
				_.indexOf(this.creditRatings, cachedRateFactor.creditRating).toString().padStart(2, '0')
			].join('-');
			cachedRateFactor.terms[rateFactor.term] = rateFactor.value;
		});

		return _.chain(rateFactorsCache)
			.toArray()
			.sortBy('order')
			.groupBy('rate')
			.value();
	}
});

/**
 * @method create
 * Creates a new rate card with its required data
 * @return {object}
 */
function create(_params = {}) {
	const version = _.extend({}, Version);

	return version.constructor(_params);
}

module.exports = {
	table,
	create
};
