/**
 * @class Utils.RateCards
 * Handles rate cards: fetch, save, updates. As well as all the data retrieveing for each operation
 * @class Lib.RateCards
 * @singleton
 * @uses Utils.webservices
 * @uses salesRep
 * @uses moment
 */
const LOG_TAG = '\x1b[36m' + '[rateCards]' + '\x1b[39;49m ';

var doLog = Alloy.Globals.doLog;
var webservices = require('/utils/webservices');
var parser = require('/helpers/parser');

// TODO: When refactor finish, check this lib to verify the use of all functions and separate private from public ones.
var rateCards = (function () {

	/**
	 * @method fetchRateCards
	 * Attempts to retrieve a new Rate Card update for the given user.
	 * @param {Object} _params Parameters for fetching
	 * @param {Function} _params.successCallback Callback function to be called if there was 
	 * an update for the rate cards
	 * @param {Function} _params.failureCallback Callback Function to be called when no new 
	 * rate cards have been updated or if there was an error calling the WS
	 * @return {void}
	 */
	function fetchRateCards(_params) {
		_params = _params || {};

		doLog && console.log('[rateCards] - fetchRateCards()');

		var salesRep = _params.salesRep;
		var _successCallback = _params.successCallback;
		var _failureCallback = _params.failureCallback;

		if (!salesRep) {
			_failureCallback && _failureCallback();
			return false;
		}

		var _lastUpdate = new moment(salesRep.get('lastRateCardUpdate') || 0).toISOString();

		var _vendorCode = salesRep.get('vendorCode');
		if (!_vendorCode) {
			_failureCallback && _failureCallback();
			return false;
		}

		webservices.rateFactors({
			lastRefreshDate: _lastUpdate,
			vendorCode: _vendorCode,
			successCallback: function (_response) {
				_response = _response || {};
				doLog && console.log('[rateFactors] - success');
				if (_response.success && _response.result.rateFactors) {

					var _today = new moment().toISOString();

					var categories = _response.result.categories;
					var products = _response.result.products;
					var creditRatings = _response.result.creditRatings;

					// Category model
					var _categoryCollection = Alloy.createCollection('category');
					_categoryCollection
						.wipe()
						.add(_.map(categories, function (_newCategory) {
							return {
								id: _newCategory.id,
								name: _newCategory.name,
								seq: _newCategory.seq,
								ord: _newCategory.order,
								versionId: _newCategory.versionId
							};
						}))
						.save();

					var getCategoryName = function (_categoryId) {
						return _.find(categories, function (category) {
							return category.id === _categoryId;
						}).name;
					};

					var getProduct = function (_productId) {
						return _.find(products, function (product) {
							return product.id === _productId;
						});
					};

					var getProductRateFactorMatchId = function (_productId) {
						var product = getProduct(_productId);
						if (!product) {
							return {
								productRateFactorMatchId: '',
								categoryName: ''
							};
						}
						var categoryName = getCategoryName(product.categoryId);
						var productRateFactorMatchId = [categoryName, product.name].join('_').toUpperCase();
						return {
							productRateFactorMatchId: productRateFactorMatchId.trim().split(' ').join('_'),
							categoryName: categoryName
						};
					};
					// Product model

					var _productsCollection = Alloy.createCollection('product');
					_productsCollection
						.wipe()
						.add(_.map(products, function (_newProduct) {
							var customObject = getProductRateFactorMatchId(_newProduct.id);
							var productRateFactorMatchId = customObject.productRateFactorMatchId;
							var categoryName = customObject.categoryName;
							return {
								id: _newProduct.id,
								name: _newProduct.name,
								categoryId: _newProduct.categoryId,
								seq: _newProduct.seq,
								ord: _newProduct.order,
								versionId: _newProduct.versionId,
								hasItad: _newProduct.hasItad,
								itadValue: _newProduct.itadValue,
								ratesEnabled: JSON.stringify(_newProduct.ratesEnabled),
								terms: JSON.stringify(_newProduct.terms),
								type: _newProduct.hasItad ? Alloy.Globals.rateType.itad : null,
								section: categoryName,
								rateFactorMatchId: productRateFactorMatchId
							};
						}))
						.save();

					var creditRatingsCollection = Alloy.createCollection('creditRating');
					creditRatingsCollection
						.wipe()
						.add(_.map(creditRatings, function (_item, _index) {
							return {
								id: _index + 1,
								name: _item
							};
						}))
						.save();

					var rateFactors = _response.result.rateFactors;
					doLog && console.log('[rateFactors] - # of rate factors found: ' + rateFactors.length || 0);
					// Ratefactors
					var _rateCardsCollection = Alloy.createCollection('rateCard');
					_rateCardsCollection
						.wipe()
						.add(_.map(rateFactors, function (_newRateCardInfo) {
							var customObject = getProductRateFactorMatchId(_newRateCardInfo.productId);
							return {
								term: _newRateCardInfo.term,
								points: _newRateCardInfo.points,
								rateFactor: _newRateCardInfo.value,
								creditRating: _newRateCardInfo.creditRating,
								productId: _newRateCardInfo.productId,
								vendorCode: _newRateCardInfo.vendorCode,
								versionId: _newRateCardInfo.versionId,
								rate: _newRateCardInfo.rate,
								lastUpdated: _today,
								productRateFactorMatchId: customObject.productRateFactorMatchId
							};
						}))
						.save();

					salesRep
						.set({
							'lastRateCardUpdate': _today
						})
						.save();

					_successCallback && _successCallback({
						response: _response,
						salesRep: salesRep,
						rateCardsCollection: _rateCardsCollection
					});

					return false;

				}

				_failureCallback && _failureCallback(_response);

			},
			failCallback: function (_response) {
				doLog && console.log('[rateFactors] - failed to find a newer rate card');
				_failureCallback && _failureCallback(_response);
			}
		});
	};

	/**
	 * @method getAdvancePaymentTitle
	 * Parses advance payment values into a custom human-readable String
	 * @param {Object} _params advance payment values
	 * @param {Number} _params.advancePayment Advance Payment Number
	 * @param {String} _params.advancePaymentType Advance Payment Type
	 * @return {String} Human-readable advance payment
	 */
	function getAdvancePaymentTitle(_params) {
		doLog && console.log('[rateCards] - getAdvancePaymentTitle()');
		_params = _params || {};

		var advancePayment = parser.parseToNumber(_params.advancePayment);
		var advancePaymentTitle = '' + advancePayment;

		switch (_params.advancePaymentType) {
		case 'A':
			advancePaymentTitle += ' in Advance';
			break;
		case 'S':
			advancePaymentTitle += ' Security PMT';

			if (advancePayment > 1) {
				advancePaymentTitle += 'S';
			}
			break;
		default:
			advancePaymentTitle += _params.advancePaymentType;
		}

		return advancePaymentTitle;
	};

	/**
	 * @method getAllAdvancePayments
	 * Returns an array with all the possible advance payment options
	 * @return {Array} Array of dictionaries
	 */
	function getAllAdvancePayments() {
		doLog && console.log('[rateCards] - getAllAdvancedPayments()');
		var advancePayments = [];
		var rateCards = Alloy.createCollection('rateCard');

		rateCards.fetch({
			query: {
				select: 'distinct advancePayment, advancePaymentType',
				order: 'advancePayment'
			}
		});

		advancePayments = rateCards.map(function (_rateCard) {
			return {
				advancePayment: _rateCard.get('advancePayment'),
				advancePaymentType: _rateCard.get('advancePaymentType')
			};
		});

		return advancePayments;
	};

	/*
	 * @method getAllPromoCodes
	 * Obtains the list of available promos
	 * @return {Collections.Promo} will be empty if no promo was found
	 */
	function getAllPromoCodes() {
		doLog && console.log('[rateCards] - getAllPromoCodes()');
		var promos = Alloy.createCollection('promo');

		promos.fetch({
			query: {
				select: 'distinct promo.*',
				join: [
					'rateCard',
					'promo.program',
					'rateCard.promoCode'
				]
			}
		});

		return promos;
	};

	/**
	 * @method getDefaultAdvancePayment
	 * Returns the first possible advance payment option
	 * @return {Object} advance payment dictionary
	 */
	function getDefaultAdvancePayment() {
		doLog && console.log('[rateCards] - getDefaultAdvancePayment()');
		var rateCard = Alloy.createModel('rateCard');

		rateCard.fetch({
			query: {
				select: 'distinct advancePayment, advancePaymentType',
				limit: 1
			}
		});

		return {
			advancePayment: rateCard.get('advancePayment'),
			advancePaymentType: rateCard.get('advancePaymentType')
		};
	};

	/**
	 * @method filterRateCards
	 * @private
	 * Filter rate card by prop
	 * @param {Array} _rateCards Rate cards
	 * @param {String} _rateCardProp Rate card property
	 * @param {Strin} _searchValue The search value
	 * @return {Array} Filtered rate cards
	 */
	function filterRateCards(_rateCards, _rateCardProp, _searchValue) {
		doLog && console.log('[rateCards] - filterRateCards');
		return _.filter(_rateCards, function (_rateCard) {
			return _rateCard.get(_rateCardProp) == _searchValue;
		});
	}

	/**
	 * @method getDefaultOptionsForPaymentPromo
	 * Obtains the first valid rate card options for the given promo's payment.
	 * @param {Model.PaymentOption} _paymentOption payment option model.
	 * Will use its `amountFinanced` and `promoCode` values
	 * @return {Models.RateCard} Rate Card model with all the valid options
	 */
	function getDefaultOptionsForPaymentPromo(_paymentOption) {
		doLog && console.log('[rateCards] - getDefaultOptionsForPaymentPromo');
		//TODO :  Check right behaviour when user has selected payment options and prevent them to be "reset"
		var promoCode = _paymentOption.get('promoCode');
		var rateCards = Alloy.createCollection('rateCard');
		var amountFinanced = parser.parseToNumber(_paymentOption.get('amountFinanced'));
		var where = {
			'rateFactor > 0': ''
		};
		var result = null;

		if (amountFinanced > 0) {
			where['? between min and max'] = _paymentOption.get('amountFinanced');
		}

		if (isActivePromo(promoCode)) {
			where['promoCode = ?'] = promoCode;
		}

		rateCards.fetch({
			query: {
				join: [
					'promo',
					'promo.program',
					'rateCard.promoCode'
				],
				where: where
			}
		});

		if (rateCards.length > 0) {
			var propertyNames = [
				['payments', 'term'],
				['purchaseOption', 'purchaseOptions'],
				['paymentFrequency', 'paymentFrequency'],
				['points', 'points'],
				['advancePayment', 'advancePayment'],
				['advancePaymentType', 'advancePaymentType']
			];

			var filteredRateCards = rateCards.toArray();
			var previousFilter = filteredRateCards;
			var propertyIndex = 0;
			var searchIndex = 0;
			var propertyValues = null;
			var rateCard = null;

			do {
				var rateCardProp = propertyNames[propertyIndex][0];
				var paymentOptionProp = propertyNames[propertyIndex][1];
				var searchValue = null;

				propertyValues = propertyValues || obtainSearchValues(paymentOptionProp);
				searchValue = propertyValues[searchIndex];

				doLog && console.log('propertyValues: ' + JSON.stringify(propertyValues));

				previousFilter = filteredRateCards;
				filteredRateCards = filterRateCards(filteredRateCards, rateCardProp, searchValue);

				if (filteredRateCards.length > 1) {

					propertyIndex++;
					searchIndex = 0;
					propertyValues = null;

					if (propertyIndex >= propertyNames.length) {
						rateCard = filteredRateCards[0];
					}

				} else if (filteredRateCards.length === 1) {

					rateCard = filteredRateCards[0];

				} else { // filteredRateCards.length = 0;

					filteredRateCards = previousFilter;
					searchIndex++;

					if (searchIndex >= propertyValues.length) {
						rateCard = filteredRateCards[0];
					}
				}
			} while (!rateCard);

			result = rateCard;
		}

		function obtainSearchValues(_propertyName) {
			var searchValues = {
				term: 'down',
				purchaseOptions: ['F', 'D', 'P'],
				paymentFrequency: ['M', 'Q', 'SA', 'A'],
				points: 'up',
				advancePayment: 'up',
				advancePaymentType: ['A', 'S'],
			};

			var propSearchValues = searchValues[_propertyName];
			var rateCardDefaults = null;
			var selectedValues = null;
			var modelDefaults = null;
			var defaultValues = null;
			var lastDefault = null;

			rateCardDefaults = getDefaultValuesForPromo(promoCode);
			selectedValues = _paymentOption.get('selectedValues') || {};
			modelDefaults = _paymentOption.defaults();

			defaultValues = [
				rateCardDefaults[_propertyName] || modelDefaults[_propertyName] || _paymentOption.get(_propertyName)
			];

			if (selectedValues[_propertyName]) {
				defaultValues.unshift(_paymentOption.get(_propertyName));
			}

			lastDefault = parseInt(_.last(defaultValues), 10) || 0;

			if (propSearchValues === 'up') {
				propSearchValues = _.range(lastDefault + 1, 100);
			} else if (propSearchValues === 'down') {
				propSearchValues = _.range(lastDefault - 1, 0, -1);
			}

			propSearchValues = defaultValues.concat(propSearchValues);

			propSearchValues = _.uniq(propSearchValues);
			propSearchValues = _.map(propSearchValues, function (_value) {
				return '' + _value;
			});

			return propSearchValues;
		}

		return result;
	};

	/**
	 * @method getDefaultPromo
	 * Returns the first possible promo model
	 * @return {Models.Promo} First promo 
	 */
	function getDefaultPromo() {
		doLog && console.log('[rateCards] - getDefaultPromo()');
		var promos = getAllPromoCodes();

		if (promos.length > 0) {
			return promos.first();
		} else {
			return null;
		}

	};

	/**
	 * @method getDefaults
	 * Obtains the default values from any rate card, for initialize a payment option model
	 * @return {Object} Set of default values
	 */
	function getDefaults() {
		doLog && console.log('[rateCards] - getDefaults()');
		var defaultAdvPayment = getDefaultAdvancePayment();
		var defaultPromo = getDefaultPromo();

		return {
			'promoCode': defaultPromo.get('program'),
			'promoName': defaultPromo.get('description'),
			'advancePayment': defaultAdvPayment.advancePayment,
			'advancePaymentType': defaultAdvPayment.advancePaymentType
		};
	};

	/**
	 * @method getHigherPoints
	 * Returns the next possible points for the given payment option model
	 * @param {Models.PaymentOption} _paymentOption payment option model to search
	 * @return {Number} Next amount of points, null if couldn't find any
	 */
	function getHigherPoints(_paymentOption) {
		doLog && console.log('[rateCards] - getHigherPoints()');
		var nextPoints = null;
		var rateCard = Alloy.createModel('rateCard');

		if (_paymentOption) {
			rateCard.fetch({
				query: {
					select: 'min(points) as points',
					where: {
						'purchaseOption = ?': _paymentOption.get('purchaseOptions'),
						'paymentFrequency = ?': _paymentOption.get('paymentFrequency'),
						'promoCode = ?': (_paymentOption.get('promoCode')),
						'advancePayment = ?': _paymentOption.get('advancePayment'),
						'advancePaymentType = ?': _paymentOption.get('advancePaymentType'),
						'? BETWEEN min AND max': _paymentOption.get('amountFinanced'),
						'points > ?': _paymentOption.get('points'),
						'payments = ?': _paymentOption.get('term'),
						'rateFactor > 0': ''
					},
					limit: 1
				}

			});

			if (rateCard.has('points')) {
				nextPoints = parser.parseToNumber(rateCard.get('points'));
			} else {
				nextPoints = _paymentOption.get('points');
			}
		}

		return nextPoints;
	};

	/**
	 * @method getHighestPoints
	 * returns the highest possible points for the given payment option model
	 * @param {Models.PaymentOption} _paymentOption payment option model to search
	 * @return {Number} Highest possible points, null if couldn't find any
	 */
	function getHighestPoints(_paymentOption) {
		doLog && console.log('[rateCards] - getHighestPoints()');
		var maxPoints = null;
		var rateCard = Alloy.createModel('rateCard');

		if (_paymentOption) {
			rateCard.fetch({
				query: {
					select: 'max(points) as points',
					where: {
						'purchaseOption = ?': _paymentOption.get('purchaseOptions'),
						'paymentFrequency = ?': _paymentOption.get('paymentFrequency'),
						'promoCode = ?': (_paymentOption.get('promoCode')),
						'advancePayment = ?': _paymentOption.get('advancePayment'),
						'advancePaymentType = ?': _paymentOption.get('advancePaymentType'),
						'? BETWEEN min AND max': _paymentOption.get('amountFinanced'),
						'payments = ?': _paymentOption.get('term'),
						'rateFactor > 0': ''
					},
					limit: 1
				}
			});

			if (rateCard.has('points')) {
				maxPoints = parser.parseToNumber(rateCard.get('points'));
			} else {
				maxPoints = _paymentOption.get('points');
			}
		}

		return maxPoints;
	};

	/**
	 * @method getLowerPoints
	 * Returns the previous possible points for the given payment option model
	 * @param {Models.PaymentOption} _paymentOption payment option model to search
	 * @return {Number} Previous amount of points, null if couldn't find any
	 */
	function getLowerPoints(_paymentOption) {
		doLog && console.log('[rateCards] - getLowerPoints()');
		var previousPoints = null;
		var rateCard = Alloy.createModel('rateCard');

		if (_paymentOption) {
			rateCard.fetch({
				query: {
					select: 'max(points) as points',
					where: {
						'purchaseOption = ?': _paymentOption.get('purchaseOptions'),
						'paymentFrequency = ?': _paymentOption.get('paymentFrequency'),
						'promoCode = ?': (_paymentOption.get('promoCode')),
						'advancePayment = ?': _paymentOption.get('advancePayment'),
						'advancePaymentType = ?': _paymentOption.get('advancePaymentType'),
						'? BETWEEN min AND max': _paymentOption.get('amountFinanced'),
						'points < ?': _paymentOption.get('points'),
						'payments = ?': _paymentOption.get('term'),
						'rateFactor > 0': ''
					},
					limit: 1
				}
			});

			if (rateCard.has('points')) {
				previousPoints = parser.parseToNumber(rateCard.get('points'));
			} else {
				previousPoints = _paymentOption.get('points');
			}
		}

		return previousPoints;
	};

	/**
	 * @method getLowestPoints
	 * returns the lowest possible points for hte given payment option model
	 * @param {Models.PaymentOption} _paymentOption payment option model to search
	 * @return {Number} Lowest possible points, null if couldn't find any
	 */
	function getLowestPoints(_paymentOption) {
		doLog && console.log('[rateCards] - getLowestPoints()');
		var minPoints = null;
		var rateCard = Alloy.createModel('rateCard');

		if (_paymentOption) {
			rateCard.fetch({
				query: {
					select: 'min(points) as points',
					where: {
						'purchaseOption = ?': _paymentOption.get('purchaseOptions'),
						'paymentFrequency = ?': _paymentOption.get('paymentFrequency'),
						'promoCode = ?': (_paymentOption.get('promoCode')),
						'advancePayment = ?': _paymentOption.get('advancePayment'),
						'advancePaymentType = ?': _paymentOption.get('advancePaymentType'),
						'? BETWEEN min AND max': _paymentOption.get('amountFinanced'),
						'payments = ?': _paymentOption.get('term'),
						'rateFactor > 0': ''
					},
					limit: 1
				}
			});

			if (rateCard.has('points')) {
				minPoints = parser.parseToNumber(rateCard.get('points'));
			} else {
				minPoints = _paymentOption.get('points');
			}
		}

		return minPoints;
	};

	/**
	 * @method getMinMaxAmounts
	 * Obtains the minimum and maximum possible values for the given payment option. 
	 * Only checks promo code
	 * @param {Models.PaymentOption} _paymentOption PaymentOption model to obtain its promo rate cards
	 * @return {Object} object with `min` and `max` properties 
	 * Will be empty (length = 0) if no valid rate card was found
	 */
	function getMinMaxAmounts(_paymentOption) {
		doLog && console.log('[rateCards] - getMinMaxAmounts()');
		var minMax = {};
		var rateCard = Alloy.createModel('rateCard');

		if (_paymentOption) {
			rateCard.fetch({
				query: {
					select: 'min(min) as min, max(max) as max',
					where: {
						'promoCode = ?': (_paymentOption.get('promoCode')),
						'rateFactor > 0': ''
					},
					limit: 1
				}
			});

			minMax.min = parser.parseToNumber(rateCard.get('min'));
			minMax.max = parser.parseToNumber(rateCard.get('max'));
		}

		return minMax;
	};

	/**
	 * @method getPromoName
	 * Obtains the current promo's name for the given promo code
	 * @param {String} _promoCode Promo's code to search it's name
	 * @return {String} Actual Promo Name, `null` if the promoCode does not exists
	 */
	function getPromoName(_promoCode) {
		doLog && console.log('[rateCards] - getPromoName()');
		var promoName = null;

		if (_promoCode) {
			var promo = Alloy.createModel('promo');

			promo.fetch({
				query: {
					where: {
						'program = ?': _promoCode
					},
					limit: 1
				}
			});

			promoName = promo.get('description');
		}

		return promoName;
	};

	/**
	 * @method getRateCardsForPaymentOption
	 * Obtains a collection with all valid rate cards for all the selected options in the given payment model
	 * @param {Models.PaymentOption} _paymentOption PaymentOption model to obtain its valid rate cards
	 * @return {Collections.RateCard} Rate card collection with all valid ratecards. 
	 * Will be empty (length = 0) if no valid rate card was found
	 */
	function getRateCardsForPaymentOption(_paymentOption) {
		doLog && console.log('[rateCards] - getRateCardsForPaymentOption()');
		var rateCards = Alloy.createCollection('rateCard');

		if (_paymentOption) {
			rateCards.fetch({
				query: {
					where: {
						'purchaseOption = ?': _paymentOption.get('purchaseOptions'),
						'paymentFrequency = ?': _paymentOption.get('paymentFrequency'),
						'promoCode = ?': (_paymentOption.get('promoCode')),
						'advancePayment = ?': _paymentOption.get('advancePayment'),
						'advancePaymentType = ?': _paymentOption.get('advancePaymentType'),
						'? BETWEEN min AND max': _paymentOption.get('amountFinanced'),
						'points = ?': _paymentOption.get('points'),
						'payments = ?': _paymentOption.get('term')
					}
				}

			});

			doLog && console.log('rateCards.length: ' + JSON.stringify(rateCards.length, null, '\t'));
		}

		return rateCards;
	};

	/**
	 * @method getRateCardLevelsForPaymentOption
	 * Given a Payment Option, will retrieve all of the possible rate cards based on the leves for that
	 * @param {Models.PaymentOption} _paymentOption PaymentOption model to obtain its valid rate cards
	 * @return {Collections.RateCard} Rate card collection with all valid ratecards. 
	 * Will be empty (length = 0) if no valid rate card was found
	 */
	function getRateCardLevelsForPaymentOption(_paymentOption) {
		doLog && console.log('[rateCards] - getRateCardLevelsForPaymentOption()');
		var rateCards = Alloy.createCollection('rateCard');

		if (_paymentOption) {
			var originalRateCards = getRateCardsForPaymentOption(_paymentOption);

			if (originalRateCards.length > 0) {
				var term = originalRateCards.at(0).get('term');

				rateCards.fetch({
					query: {
						where: {
							'purchaseOption = ?': _paymentOption.get('purchaseOptions'),
							'paymentFrequency = ?': _paymentOption.get('paymentFrequency'),
							'promoCode = ?': (_paymentOption.get('promoCode')),
							'advancePayment = ?': _paymentOption.get('advancePayment'),
							'advancePaymentType = ?': _paymentOption.get('advancePaymentType'),
							'? BETWEEN min AND max': _paymentOption.get('amountFinanced'),
							'points = ?': _paymentOption.get('points'),
							'term = ?': term
						}
					}

				});

				doLog && console.log('rateCards.length: ' + JSON.stringify(rateCards.length, null, '\t'));
			}

		}

		return rateCards;
	};

	/**
	 * @method getRangeOfRatesForPaymentOption
	 * Obtains a collection with all valid rate cards for all the selected options in the given payment model. Ignoring the amount financed
	 * @param {Models.PaymentOption} _paymentOption PaymentOption model to obtain its valid rate cards
	 * @return {Collections.RateCard} Rate card collection with all valid ratecards. 
	 * Will be empty (length = 0) if no valid rate card was found
	 */
	function getRangeOfRatesForPaymentOption(_paymentOption) {
		doLog && console.log('[rateCards] - getRangeOfRatesForPaymentOption()');
		var rateCards = Alloy.createCollection('rateCard');

		if (_paymentOption) {

			var where = {
				'paymentFrequency = ?': _paymentOption.get('paymentFrequency'),
				'promoCode = ?': (_paymentOption.get('promoCode')),
				'advancePayment = ?': _paymentOption.get('advancePayment'),
				'advancePaymentType = ?': _paymentOption.get('advancePaymentType'),
				'points = ?': _paymentOption.get('points'),
				'payments = ?': _paymentOption.get('term'),
				'purchaseOption = ?': _paymentOption.get('purchaseOptions')
			};

			rateCards.fetch({
				query: {
					where: where
				}

			});

			doLog && console.log('rateCards.length: ' + JSON.stringify(rateCards.length, null, '\t'));
		}

		return rateCards;
	};

	/**
	 * @method getRateCardsForPromo
	 * Obtains a collection with all valid rate cards for the promo selected in the given payment option
	 * @param {String} _promoCode Promo code to look for
	 * @return {Collections.RateCard} Rate card collection with all valid ratecards. 
	 * Will be empty (length = 0) if no valid rate card was found
	 */
	function getRateCardsForPromo(_promoCode) {
		doLog && console.log('[rateCards] - getRateCardsForPromo()');
		var rateCards = Alloy.createCollection('rateCard');

		if (_promoCode) {

			rateCards.fetch({
				query: {
					where: {
						'promoCode = ?': _promoCode
					}
				}
			});

			doLog && console.log('rateCards.length: ' + JSON.stringify(rateCards.length, null, '\t'));
		}

		return rateCards;
	};

	/**
	 * @method getRateFactorForPaymentOption
	 * Obtains the first valid rate factor from the valid rate cards for the given paymen options
	 * @param {Models.PaymentOption} _paymentOption PaymentOption model to check its rate cards
	 * @return {Number} valid rate factor for the given options
	 * Will be `null` if no valid rate factor was found
	 */
	function getRateFactorForPaymentOption(_paymentOption) {
		doLog && console.log('[rateCards] - getRateFactorForPaymentOption()');
		var rateFactor = null;
		var rateCards = Alloy.createCollection('rateCard');

		if (_paymentOption) {
			rateCards.fetch({
				query: {
					where: {
						'purchaseOption = ?': _paymentOption.get('purchaseOptions'),
						'paymentFrequency = ?': _paymentOption.get('paymentFrequency'),
						'promoCode = ?': (_paymentOption.get('promoCode')),
						'advancePayment = ?': _paymentOption.get('advancePayment'),
						'advancePaymentType = ?': _paymentOption.get('advancePaymentType'),
						'? BETWEEN min AND max': _paymentOption.get('amountFinanced'),
						'points = ?': _paymentOption.get('points'),
						'payments = ?': _paymentOption.get('term'),
						'rateFactor > 0': ''
					}
				}

			});

			if (rateCards.length > 0) {
				rateFactor = parser.parseToNumber(rateCards.at(0).get('rateFactor'));
			}
		}

		return rateFactor;
	};

	/**
	 * @method getRealTermForPaymentOption
	 * Obtains the real term (sum of all payment levels) for a given payment option
	 * @param {Model.PaymentOption} _paymentOption Payment Option model to obtain it's real term
	 * @return {Number} Complete number of payments to do
	 */
	function getRealTermForPaymentOption(_paymentOption) {
		doLog && console.log('[rateCards] - getRealTermForPaymentOption()');
		var realTerm = null;

		if (_paymentOption) {
			realTerm = _paymentOption.get('term');
			// if (_paymentOption.get('useRateCard')) {
			var rateCards = getRateCardLevelsForPaymentOption(_paymentOption);
			if (rateCards.length > 0) {
				realTerm = parser.parseToNumber(rateCards.at(0).get('term'));
			}
			// } else {
			// 	realTerm = parser.parseToNumber(_paymentOption.get('term'));
			// 	// RATE PROGRAM DESCRIPTION FOR RATE FACTOR
			// 	var promoCode = (_paymentOption.get('promoName') || '').trim();
			// 	var daysDef = promoCode.match(/(\d+)DEF/);

			// 	if (daysDef) {
			// 		var promoDays = parseInt(daysDef[1], 10) || 0;
			// 		var promoMonths = promoDays / 30;
			// 		var normalMonts = _paymentOption.get('term');

			// 		realTerm = Number(promoMonths) + Number(normalMonts);
			// 	}
			// }
		}

		doLog && console.log('[rateCards] - getRealTermForPaymentOption() - ' + realTerm);

		return realTerm;
	};

	/**
	 * @method hasValidRateCard
	 * Checks the options in the payment option model and validates if a valid rate card could apply them
	 * @param {Models.PaymentOption} _paymentOption PaymentOption model to check its rate cards
	 * @return {Boolean} `true` if at least 1 valid rate card was found
	 */
	function hasValidRateCard(_paymentOption) {
		doLog && console.log('[rateCards] - hasValidRateCard()');
		var isValid = false;

		if (_paymentOption) {
			var rateCards = getRateCardsForPaymentOption(_paymentOption);

			isValid = (rateCards.length > 0);
		}

		return isValid;
	};

	/**
	 * @method hasRateCards
	 * Determines if there is some rate card data to check
	 * @return {Boolean} `true` if there is at least one rate card, `false` otherwise
	 */
	function hasRateCards() {
		doLog && console.log('[rateCard] - hasRateCards()');
		var rateCard = Alloy.createModel('rateCard');
		var count = 0;

		rateCard.fetch({
			query: {
				select: 'count(*) as count',
				limit: 1
			}
		});

		count = parser.parseToNumber(rateCard.get('count'));

		doLog && console.log('[rateCard] - hasRateCards() - ' + count);

		return (count > 0);
	};

	/**
	 * @method isActivePromo
	 * Validates if the given promo name is valid
	 * @param {String} _promoName promo name to validate
	 * @return {Boolean} true if the promo name is valid
	 */
	function isActivePromo(_promoName) {
		doLog && console.log('[rateCards] - isActivePromo()');
		_promoName = _promoName || '';
		var promos = Alloy.createCollection('promo');

		promos.fetch({
			query: {
				where: {
					'program = ?': _promoName
				},
				limit: 1
			}
		});

		return (promos.length > 0);
	};

	// TODO: Do we need this?
	/**
	 * @method getDeferredRates
	 * Obtains the ratecard with the deferred information given a paymen option
	 * @param {Models.PaymentOption} _paymentOption Payment options to get deferred info
	 * @return {Object} rate card containing deferred information
	 */
	function getDeferredRates(_paymentOption) {
		doLog && console.log('[rateCards] - getDeferredRates()');
		var rateCards = Alloy.createCollection('rateCard');

		if (_paymentOption) {
			rateCards.fetch({
				query: {
					where: {
						'purchaseOption = ?': _paymentOption.get('purchaseOptions'),
						'paymentFrequency = ?': _paymentOption.get('paymentFrequency'),
						'payments > ?': _paymentOption.get('term'),
						'promoCode = ?': (_paymentOption.get('promoCode')),
						'advancePayment = ?': _paymentOption.get('advancePayment'),
						'advancePaymentType = ?': _paymentOption.get('advancePaymentType'),
						'points = ?': _paymentOption.get('points'),
						'? BETWEEN min AND max': _paymentOption.get('amountFinanced')
					},
					order: ['term']
				}
			});
		}

		return rateCards;
	};

	/**
	 * @method getAllRateCards
	 * Retrieves all Rate cards from the table
	 * @return {Collection.rateCards} Collection of rate cards
	 */
	function getAllRateCards() {
		doLog && console.log('[rateCards] - getDeferredRates()');
		var rateCards = Alloy.createCollection('rateCard');

		rateCards.fetch();

		return rateCards;
	};

	/**
	 * @method getAllPromos
	 * Retrieves all Promos from the table
	 * @return {Collection.promos} Collection of promo
	 */
	function getAllPromos() {
		doLog && console.log('[rateCards] - getDeferredRates()');
		var promos = Alloy.createCollection('promo');

		promos.fetch();

		return promos;
	};

	/**
	 * @method getTermsForPaymentOption
	 * Obtains the list of terms that could apply for the given PaymentOption model
	 * @param {Models.paymentOption} _paymentOption
	 * @return {Array} Array of Strings with the terms to show, empty array if no terms apply
	 */
	function getTermsForPaymentOption(_paymentOption) {
		doLog && console.log('[rateCards] - getTermsForPaymentOption()');
		var rateCards = Alloy.createCollection('rateCard');

		if (_paymentOption) {
			var query = {
				select: 'distinct payments',
				order: 'payments ASC',
				where: {
					'rateFactor > ?': 0,
					'promoCode = ?': (_paymentOption.get('promoCode')),
				}
			};

			if (_paymentOption.get('useRateCard') && _paymentOption.get('amountFinanced') > 0) {
				query.where = {
					'purchaseOption = ?': _paymentOption.get('purchaseOptions'),
					'paymentFrequency = ?': _paymentOption.get('paymentFrequency'),
					'advancePayment = ?': _paymentOption.get('advancePayment'),
					'advancePaymentType = ?': _paymentOption.get('advancePaymentType'),
					'? BETWEEN min AND max': _paymentOption.get('amountFinanced'),
					'points = ?': _paymentOption.get('points'),
					'promoCode = ?': (_paymentOption.get('promoCode')),
					'rateFactor > ?': 0
				};
			}

			rateCards.fetch({
				query: query
			});
		}

		return rateCards.map(function (_rateCard) {
			return '' + _rateCard.get('payments');
		});
	};

	/**
	 * @method getPaymentFrequeciesForPaymentOption
	 * Obtains the list of PaymentFrequency that could apply for the given PaymentOption model
	 * @param {Models.paymentOption} _paymentOption
	 * @return {Array} Array of Strings with the paymentFrequency to show, empty array if no paymentFrequency apply
	 */
	function getPaymentFrequeciesForPaymentOption(_paymentOption) {
		doLog && console.log('[rateCards] - getPaymentFrequeciesForPaymentOption()');
		var rateCards = Alloy.createCollection('rateCard');

		if (_paymentOption) {
			var query = {
				select: 'distinct paymentFrequency,\
						CAST(\
							CASE paymentFrequency\
								WHEN \'M\' then 1\
								WHEN \'Q\' then 2\
								WHEN \'S\' then 3\
								WHEN \'A\' then 4\
								ELSE 5\
							END as weight\
						) as weight',
				order: 'weight ASC',
				where: {
					'rateFactor > ?': 0,
					'promoCode = ?': (_paymentOption.get('promoCode'))
				}
			};

			if (_paymentOption.get('useRateCard') && _paymentOption.get('amountFinanced') > 0) {
				query.where = {
					'purchaseOption = ?': _paymentOption.get('purchaseOptions'),
					'promoCode = ?': (_paymentOption.get('promoCode')),
					'advancePayment = ?': _paymentOption.get('advancePayment'),
					'advancePaymentType = ?': _paymentOption.get('advancePaymentType'),
					'? BETWEEN min AND max': _paymentOption.get('amountFinanced'),
					'points = ?': _paymentOption.get('points'),
					'payments = ?': _paymentOption.get('term'),
					'rateFactor > ?': 0
				};
			}

			rateCards.fetch({
				query: query
			});
		}

		return rateCards.map(function (_rateCard) {
			return '' + _rateCard.get('paymentFrequency');
		});
	};

	/**
	 * @method getPurchaseOptionsForPaymentOption
	 * Obtains the list of purchaseOption that could apply for the given PaymentOption model
	 * @param {Models.paymentOption} _paymentOption
	 * @return {Array} Array of Strings with the purchaseOption to show, empty array if no purchaseOption apply
	 */
	function getPurchaseOptionsForPaymentOption(_paymentOption) {
		doLog && console.log('[rateCards] - getPurchaseOptionsForPaymentOption()');
		var rateCards = Alloy.createCollection('rateCard');

		if (_paymentOption) {
			var query = {
				select: 'distinct purchaseOption,\
						CAST(\
							CASE purchaseOption\
								WHEN \'F\' then 1\
								WHEN \'D\' then 2\
								WHEN \'P\' then 3\
								ELSE 4\
							END as weight\
						) as weight',
				order: 'weight ASC',
				where: {
					'rateFactor > ?': 0,
					'promoCode = ?': (_paymentOption.get('promoCode'))
				}
			};

			if (_paymentOption.get('useRateCard') && _paymentOption.get('amountFinanced') > 0) {
				query.where = {
					'paymentFrequency = ?': _paymentOption.get('paymentFrequency'),
					'promoCode = ?': (_paymentOption.get('promoCode')),
					'advancePayment = ?': _paymentOption.get('advancePayment'),
					'advancePaymentType = ?': _paymentOption.get('advancePaymentType'),
					'? BETWEEN min AND max': _paymentOption.get('amountFinanced'),
					'points = ?': _paymentOption.get('points'),
					'payments = ?': _paymentOption.get('term'),
					'rateFactor > ?': 0
				};
			}

			rateCards.fetch({
				query: query
			});
		}

		return rateCards.map(function (_rateCard) {
			return '' + _rateCard.get('purchaseOption');
		});
	};

	/**
	 * @method getDefaultValuesForPromo
	 * Obtains the default values from the rateCard service for the given promo code
	 * @param {String} _promoCode promo to llok its defaults
	 * @return {Collection.defaultValue} Collection of default values
	 */
	function getDefaultValuesForPromo(_promoCode) {
		doLog && console.log('[rateCards] - getDefaultValuesForPromo()');
		var defaultValueCollection = Alloy.createCollection('defaultValue');
		var result = {};

		if (_promoCode) {
			defaultValueCollection.fetch({
				query: {
					where: {
						'promoCode = ?': _promoCode
					},
					limit: 1
				}
			});

			if (defaultValueCollection.length > 0) {
				result = defaultValueCollection.at(0).toJSON();
			}
		}

		_.each(result, function (_value, _key) {
			if (_value == null) {
				delete result[_key];
			}
		});

		return result;
	}

	// Public API.
	return {
		fetchRateCards: fetchRateCards,
		getAdvancePaymentTitle: getAdvancePaymentTitle,
		getAllAdvancePayments: getAllAdvancePayments,
		getAllPromoCodes: getAllPromoCodes,
		getDefaultAdvancePayment: getDefaultAdvancePayment,
		getDefaultOptionsForPaymentPromo: getDefaultOptionsForPaymentPromo,
		getDefaultPromo: getDefaultPromo,
		getDefaults: getDefaults,
		getHigherPoints: getHigherPoints,
		getHighestPoints: getHighestPoints,
		getLowerPoints: getLowerPoints,
		getLowestPoints: getLowestPoints,
		getMinMaxAmounts: getMinMaxAmounts,
		getPromoName: getPromoName,
		getRateCardsForPaymentOption: getRateCardsForPaymentOption,
		getRateCardLevelsForPaymentOption: getRateCardLevelsForPaymentOption,
		getRangeOfRatesForPaymentOption: getRangeOfRatesForPaymentOption,
		getRateCardsForPromo: getRateCardsForPromo,
		getRateFactorForPaymentOption: getRateFactorForPaymentOption,
		getRealTermForPaymentOption: getRealTermForPaymentOption,
		hasValidRateCard: hasValidRateCard,
		hasRateCards: hasRateCards,
		isActivePromo: isActivePromo,
		getDeferredRates: getDeferredRates,
		getAllRateCards: getAllRateCards,
		getAllPromos: getAllPromos,
		getTermsForPaymentOption: getTermsForPaymentOption,
		getPaymentFrequeciesForPaymentOption: getPaymentFrequeciesForPaymentOption,
		getPurchaseOptionsForPaymentOption: getPurchaseOptionsForPaymentOption,
		getDefaultValuesForPromo: getDefaultValuesForPromo
	};
})();

module.exports = rateCards;
