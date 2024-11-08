/**
 * Manages all the dataused for Compare
 * @class lib.Compare
 */
const _ = require('lodash');
const RequestError = require('./reusable/errors/requestError');

const Compare = function () {
	// +-------------------
	// | Private members.
	// +-------------------

	const noCategory = '000';
	const noProduct = '0000';
	let versionBeforeModel = {};
	let versionAfterModel = {};
	let compareObject = {};
	let creditRatings = [];

	/**
	 * @method toString
	 * @private
	 * Converts a number/string to string
	 * @param {String} value. Value to convert
	 * @return {String} Converted value
	 */
	const toString = (value) => {
		return '' + (value || '');
	};

	/**
	 * @method createProductCategoryIndex
	 * @private
	 * Converts a string to a string replacing spaces with underscore
	 * @param {String} value. Value to convert
	 * @return {String} Converted value
	 */
	const createProductCategoryIndex = (value) => {
		return value.toUpperCase().trim().split(' ').join('_');
	}

	/**
	 * @method loadComparisonObject
	 * Receives 2 indexed objects and compares them checking for common key and comparing values between them
	 * Returns an indexed object with comparison results
	 * @param {Object} previousObject Indexed object 1
	 * @param {Object} currentObject Indexed object 2
	 * @param {Boolean} isComparingValue Flag that indicates if value to compare is numeric, if false the name is compared
	 * @return {Object} Object with comparison results 
	 */
	const loadComparisonObject = (previousObject, currentObject, isComparingValue = false) => {
		const previousKeys = Object.keys(previousObject);
		const currentKeys = Object.keys(currentObject);
		const commonArray = _.intersection(previousKeys, currentKeys);
		const deletedArray = _.difference(previousKeys, currentKeys);
		const newArray = _.difference(currentKeys, previousKeys);

		const emptyRow = {
			name: '',
			value: ''
		};
		let compareIndex = {};
		commonArray.forEach((index) => {
			const currentRow = currentObject[index] || emptyRow;
			const previousRow = previousObject[index] || emptyRow;

			if (!isComparingValue) {
				compareIndex[index] = {
					data: {
						description: currentRow.name,
						previous: previousRow.name
					},
					status: (currentRow.name !== previousRow.name) ? 'edited' : null,
					order: currentRow.compareOrder,
					nameIndex: createProductCategoryIndex(currentRow.name)
				};
			} else {
				let status = null;
				if (previousRow.value !== currentRow.value) {
					status = (currentRow.value - previousRow.value > 0) ? 'higher' : 'lower';
				}
				compareIndex[index] = {
					data: {
						description: currentRow.value,
						previous: previousRow.value
					},
					status
				};
			}
		});
		deletedArray.forEach((index) => {
			const previousRow = previousObject[index] || emptyRow;
			compareIndex[index] = {
				data: {
					description: null,
					previous: (isComparingValue) ? previousRow.value : previousRow.name
				},
				status: 'deleted',
				order: previousRow.compareOrder,
				nameIndex: (isComparingValue) ? '' : createProductCategoryIndex(previousRow.name)
			};
		});
		newArray.forEach((index) => {
			const currentRow = currentObject[index] || emptyRow;
			compareIndex[index] = {
				data: {
					description: (isComparingValue) ? currentRow.value : currentRow.name,
					previous: null
				},
				status: 'new',
				order: currentRow.compareOrder,
				nameIndex: (isComparingValue) ? '' : createProductCategoryIndex(currentRow.name)
			};
		});
		return compareIndex;
	};

	/**
	 * @method loadResults
	 * @private
	 * Receives 2 indexed objects - categories and products
	 * Iterates all creditRatings and load the rows to return
	 * @param categoryIndex {String} Index
	 * @param productIndex {String} Index
	 * @return {void} Mutates the compareObject
	 */
	const loadResults = (categoryIndex, productIndex) => {
		creditRatings.forEach((creditRating) => {
			const creditRatingIndex = _.indexOf(creditRatings, creditRating).toString().padStart(2, '0');
			let compareRow = {
				category: (categoryIndex !== noCategory) ? compareObject.categoriesNameIndex[categoryIndex] : null,
				product: (productIndex !== noProduct) ? compareObject.productsNameIndex[productIndex] : null,
				creditRating: {
					data: {
						description: creditRating,
						previous: null
					},
					status: null
				},
				terms: []
			};
			compareObject.terms.forEach((term) => {
				term = toString(term);
				const termIndex = term.padStart(3, '0');
				const rateFactorIndex = [categoryIndex, productIndex, creditRatingIndex, termIndex].join('_');
				if (rateFactorIndex in compareObject.rateFactorsNameIndex) {
					const compareRateFactor = compareObject.rateFactorsNameIndex[rateFactorIndex];
					compareRow.terms.push({
						term,
						data: compareRateFactor.data,
						status: compareRateFactor.status
					});
				} else {
					compareRow.terms.push({
						term,
						data: {
							description: null,
							previous: null
						},
						status: null
					});
				}
				if (compareRow.terms.length === compareObject.terms.length) {
					compareObject.results.push(compareRow);
				}
			});
		});
	};

	/**
	 * @method compare
	 * @private
	 * Load comparison object
	 * Iterates all creditRatings and load the rows to return
	 * @return {Object} CompareObject with results
	 */
	const compare = () => {

		compareObject.categoriesNameIndex = loadComparisonObject(versionBeforeModel.categoriesNameIndex, versionAfterModel.categoriesNameIndex);
		compareObject.productsNameIndex = loadComparisonObject(versionBeforeModel.productsNameIndex, versionAfterModel.productsNameIndex);
		compareObject.rateFactorsNameIndex = loadComparisonObject(versionBeforeModel.rateFactorsNameIndex, versionAfterModel.rateFactorsNameIndex,
			true);
		compareObject.terms = _.union(versionBeforeModel.version.terms, versionAfterModel.version.terms).sort();

		compareObject.results = [];

		const orderedCategories = _.sortBy(compareObject.categoriesNameIndex, 'order');

		orderedCategories.forEach((category) => {
			const productsInCategory = getCategoryProductsArray(category.nameIndex);
			const products = _.chain(compareObject.productsNameIndex)
				.filter((product) => {
					return productsInCategory.includes(product.nameIndex);
				})
				.sortBy('order')
				.map('nameIndex')
				.value();

			// TODO: move away from so many nested each
			products.forEach((productIndex) => {
				loadResults(category.nameIndex, productIndex);
			});
		});
		loadResults(noCategory, noProduct); //Adding ratefactors without product
		return {
			terms: compareObject.terms,
			items: compareObject.results
		};
	};

	/**
	 * @method createIndex
	 * @private
	 * Creates an index made of categoryIndex, productIndex,creditRatingIndex and term 
	 * Iterates all creditRatings and load the rows to return
	 * @param rateFactor {Object} RateFactor Object
	 * @param versionModel {Object} Object containing the indexed objects categoriesIdIndex and productsIdIndex
	 * @return {String} The index
	 */
	const createIndex = (rateFactor, versionModel) => {
		let categoryIndex = noCategory;
		if (rateFactor.productId && rateFactor.productId.length > 0) {
			categoryIndex = createProductCategoryIndex(versionModel.categoriesIdIndex[versionModel.productsIdIndex[
				rateFactor.productId].categoryId].name);
		}

		let productIndex = noProduct;
		if (rateFactor.productId && rateFactor.productId.length > 0) {
			productIndex = createProductCategoryIndex(versionModel.productsIdIndex[rateFactor.productId].name);
		}
		const creditRatingIndex = _.indexOf(creditRatings, rateFactor.creditRating).toString().padStart(2, '0');
		const rateFactorTerm = toString(rateFactor.term);
		const term = rateFactorTerm.padStart(3, '0');

		return [
			categoryIndex,
			productIndex,
			creditRatingIndex,
			term
		].join('_');
	};

	/**
	 * @method getCategoryProductsArray
	 * @private
	 * Receives a category index and returns an Array of the products of that category for both versions 
	 * @param categoryIndex {String} The category index
	 * @return {Array} Products of both versions for the category
	 */
	const getCategoryProductsArray = (categoryIndex) => {
		const productsBefore = (categoryIndex in versionBeforeModel.categoriesNameIndex) ? versionBeforeModel.categoriesNameIndex[categoryIndex]
			.products : [];
		const productsAfter = (categoryIndex in versionAfterModel.categoriesNameIndex) ? versionAfterModel.categoriesNameIndex[categoryIndex].products :
			[];

		return _.union(productsBefore, productsAfter);
	};

	/**
	 * @method dataCheck
	 * @private
	 * Check that the data of a version is ok
	 * @param versionModel {Object} The version
	 * @return {Object} error Error returned, null if ok.
	 */

	const dataCheck = (versionModel) => {

		const products = versionModel.version.products || [];
		const categories = versionModel.version.categories || [];
		const rateFactors = versionModel.version.rateFactors || [];

		let errorMsg = '';

		products.forEach((product) => {
			if (product.categoryId) {
				const category = _.find(categories, {
					id: product.categoryId
				});
				if (!category && errorMsg === '') {
					errorMsg = `Product ${product.id} has a category that is not in the version ${versionModel.version.id}`;
				}
			}
		});

		if (errorMsg === '') {
			rateFactors.forEach((rateFactor) => {
				if (rateFactor.productId) {
					const product = _.find(products, {
						id: rateFactor.productId
					});
					if (!product && errorMsg === '') {
						errorMsg = `RateFactor ${rateFactor.id} has a product that is not in the version ${versionModel.version.id}`;
					}
				}
			});
		}
		return errorMsg;
	};

	/**
	 * @method loadVersionModel
	 * @private
	 * Receives a versionObject with categories, products and rateFactors and loads indexedObject of the arrays
	 * @param versionModel {Object} The version
	 * @return {Object} version received with loaded indexed objects
	 */
	const loadVersionModel = (versionModel, isVersionAfter) => {

		versionModel.categoriesNameIndex = {};
		versionModel.categoriesIdIndex = {};

		//Saving indexed object of categories, one by index and one by id
		versionModel.version.categories.forEach((category) => {
			const compareOrder = (isVersionAfter) ? category.order : 1000 * category.order;
			let indexCategory = {
				products: [],
				compareOrder
			};
			Object.assign(indexCategory, category);
			const categoryIndex = createProductCategoryIndex(category.name);
			versionModel.categoriesNameIndex[categoryIndex] = indexCategory;
			versionModel.categoriesIdIndex[category.id] = category;
		});
		versionModel.productsNameIndex = {};
		versionModel.productsIdIndex = {};

		//Saving indexed object of products, one by index and one by id
		versionModel.version.products.forEach((product) => {
			if (product.ratesEnabled.includes('1out')) {
				return;
			}
			const compareOrder = (isVersionAfter) ? product.order : 1000 * product.order;
			let indexProduct = {
				compareOrder
			};
			Object.assign(indexProduct, product);

			const productIndex = createProductCategoryIndex(product.name);
			versionModel.productsNameIndex[productIndex] = indexProduct;
			const categoryIndex = createProductCategoryIndex(versionModel.categoriesIdIndex[product.categoryId].name);
			if (versionModel.categoriesNameIndex[categoryIndex]) {
				versionModel.categoriesNameIndex[categoryIndex].products.push(productIndex);
			}
			versionModel.productsIdIndex[product.id] = product;
		});

		versionModel.rateFactorsNameIndex = {};
		//Create an indexed rateFactors object with index {category.name}_{product.name}_{creditRatingOrder}_{term}
		versionModel.version.rateFactors.forEach((rateFactor) => {
			const index = createIndex(rateFactor, versionModel);
			versionModel.rateFactorsNameIndex[index] = rateFactor;
		});
		return versionModel;
	};

	/**
	 * @method compareVersions
	 * Receives 2 versions to compare
	 * @param versionBefore {Object} Version 1 to compare
	 * @param versionAfter {Object} Version 2 to compare
	 * @return {Object} Array with rows compared
	 */
	const compareVersions = (versionBefore, versionAfter) => {

		versionBeforeModel.version = versionBefore;
		versionAfterModel.version = versionAfter;

		const errorVersionBefore = dataCheck(versionBeforeModel);
		if (errorVersionBefore.length > 0) {
			throw new RequestError(errorVersionBefore);
		}

		const errorVersionAfter = dataCheck(versionAfterModel);
		if (errorVersionAfter.length > 0) {
			throw new RequestError(errorVersionAfter);
		}

		creditRatings = _.union(versionBefore.creditRatings, versionAfter.creditRatings);

		versionBeforeModel = loadVersionModel(versionBeforeModel, false);
		versionAfterModel = loadVersionModel(versionAfterModel, true);

		return compare();
	};

	return {
		compareVersions,
		loadComparisonObject
	};
};

module.exports = Compare;
