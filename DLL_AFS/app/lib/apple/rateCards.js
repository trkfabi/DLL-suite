/**
 * @class Apple.rateCards
 * @singleton
 * Description
 */
const LOG_TAG = '\x1b[36m' + '[apple/rateCards]' + '\x1b[39;49m ';

var doLog = Alloy.Globals.doLog;
var sessionManager = require('/utils/sessionManager');

var AppleRateCards = (function () {
	var parent = require('/rateCards');

	var fetchRateCards = function (_params) {
		_params = _params || {};

		doLog && console.log('[AppleRateCards] - fetchRateCards()');

		var successCallback = _params.successCallback;

		_params.successCallback = function (_data) {
			_data = _data || {};

			doLog && console.log('[AppleRateCards] - fetchRateCards()');

			successCallback && successCallback(_data);
		};

		parent.fetchRateCards(_params);
	};

	var getAllProducts = function () {
		var productsCollection = Alloy.createCollection('product');

		productsCollection.fetch();

		return productsCollection;
	};
	var getAllCategories = function () {
		var categoryCollection = Alloy.createCollection('category');

		categoryCollection.fetch();

		return categoryCollection;
	};

	/**
	 * @method getProduct
	 * Obtains the whole product model for the given promo name
	 * @param {String} _productName name of thr product to look for
	 * @return {Models.promo}
	 */
	function getProduct(_productName) {
		doLog && console.log(LOG_TAG, '- getProduct name: ' + _productName);

		var products = Alloy.createCollection('product');

		var productName = _productName || '';
		productName = productName.replace(/"/g, '""');
		products.fetch({
			query: {
				where: {
					'UPPER(name) = ?': productName.toUpperCase()
				},
				limit: 1
			}
		});

		if (products.length > 0) {
			return products.first();
		}

		return null;
	}

	var getAllCreditRatings = function () {
		var creditRatingsCollection = Alloy.createCollection('creditRating');

		creditRatingsCollection.fetch();

		return creditRatingsCollection;
	};

	function getValidRatings() {
		return [
			'AAA',
			'AA+',
			'AA',
			'AA-',
			'A+',
			'A',
			'A-',
			'BBB+',
			'BBB',
			'BBB-',
			'BB+',
			'BB',
			'BB-',
			'B+',
			'B',
			'B-',
			'CCC+',
			'CCC',
			'CCC-',
			'CC',
			'C',
			'DDD',
			'DD',
			'D',
			'SD'
		];
	}

	var getRateCard = function (_params) {
		_params = _params || {};
		var salesRep = sessionManager.getSalesRep();
		var creditRating = _params.creditRating;
		var term = _params.term;
		var productRateFactorMatchId = _params.productRateFactorMatchId;
		var rate = _params.rate;
		var rateCards = Alloy.createCollection('rateCard');

		var where = {
			'creditRating = ?': creditRating,
			'term = ?': term
		};

		if (productRateFactorMatchId) {
			where['UPPER(productRateFactorMatchId) = ?'] = productRateFactorMatchId.replace(/"/g, '""');
		}

		if (rate) {
			where['rate = ?'] = rate;
		}

		rateCards.fetch({
			query: {
				where: where,
				limit: 1
			}
		});

		if (rateCards.length > 0) {
			return rateCards.first();
		}

		return null;
	};

	return _.extend({}, parent, {
		fetchRateCards: fetchRateCards,
		getProduct: getProduct,
		getAllProducts: getAllProducts,
		getAllCategories: getAllCategories,
		getAllCreditRatings: getAllCreditRatings,
		getValidRatings: getValidRatings,
		getRateCard: getRateCard,
	});
})();

module.exports = AppleRateCards;
