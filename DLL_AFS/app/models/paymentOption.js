var doLog = Alloy.Globals.doLog;

exports.definition = {
	config: {
		columns: {
			// Note: Only the quote and salesRep tables are being saved now on both: ws and local DB
		}
	},
	/**
	 * @class Models.paymentOption
	 * Model definition to store all about the payment options
	 */
	extendModel: function (Model) {
		_.extend(Model.prototype, {
			_states: [],
			idAttribute: 'id',
			/**
			 * @method defaults
			 * Default values of the payment options model
			 * @return {Object} Default values of the payment option model
			 */
			defaults: function (_options) {
				return {
					'id': Alloy.Globals.generateGUID(),
					'equipmentCost': 0,
					'term': '36',
					'additionalCost': null,
					'amountFinanced': null,
					'payment': null,
					'rateCardName': null,
					'rateFactor': null,
					'useRateCard': 1,
					'purchaseOptions': 'F',
					'status': null,
					'paymentFrequency': 'M',
					'structure': null,
					'tradeUpAmount': 0,
					'promoCode': null,
					'promoName': null,
					'advancePayment': null,
					'advancePaymentType': null,
					'points': 0,
					'servicePayment': 0,
					'contractNumber': null,
					'advancePaymentAmount': null,
					'lastRateCardUpdate': null,
					'shouldRecalculate': false,
					'isOutdated': false,
					// Analytics
					'termsTimesChanged': 0
				};
			},
			/**
			 * @method save
			 * Saves the {Models.quote} containing this PaymentOption model
			 * @param {Object} _attributes Attributes for the model
			 * @param {Object} _options Options for the model
			 * @return {void}
			 */
			save: function (_attributes, _options) {
				var myQuote = this.getQuote();

				if (myQuote && myQuote.save) {
					_attributes && this.set(_attributes);
					myQuote.save(null, _options);
				}
			},
			/**
			 * @method clone
			 * Duplicates the PaymentOption's data into a different, new model
			 * @return {Models.paymentOption} Return PaymentOption model with data
			 */
			clone: function () {
				var _clone = JSON.parse(JSON.stringify(this.attributes));

				_clone.id = Alloy.Globals.generateGUID();
				_clone.isOutdated = false;
				_clone.shouldRecalculate = true;
				_clone.termsTimesChanged = 0;

				return Alloy.createModel('paymentOption', _clone);
			},
			/**
			 * @method saveState
			 * Save state for undo usage
			 * @return {void}
			 */
			saveState: function () {
				this._states.push(JSON.parse(JSON.stringify(this.attributes)));
			},
			/**
			 * @method undo
			 * Resets the Payment's data to its last saved state
			 * @return {void}
			 */
			undo: function () {
				if (this._states.length > 0) {
					this.set(this._states.pop());
				}
			},
			/**
			 * @method isSubmitted
			 * Validates if the payment option has been submitted based on its parent quote
			 * @return {Boolean} `true` if the quote has been submitted, false otherwise
			 */
			isSubmitted: function () {
				var myQuote = this.getQuote();

				if (myQuote) {
					return myQuote.isSubmitted();
				}

				return false;
			},
			/**
			 * @method isActive
			 * Defines the current `active` status for this payment option, based in its rateCard in use and the `submitStatus` of its parent quote
			 * @return {Boolean} `true` if the PaymentOption is still Active, `false` otherwise
			 */
			isActive: function () {
				return !!(!this.isSubmitted() && !this.get('isOutdated'));
			},
			/**
			 * @method getQuote
			 * Obtains the quote containing this payment option, if any
			 * @return {Models.quote} Quote model containing this payment model, null if it's a stand-alone model
			 */
			getQuote: function () {
				var myCollection = this.collection;
				if (myCollection && myCollection.parent) {
					return myCollection.parent;
				}

				return null;
			},
			/**
			 * @method addAnalyticsCounter
			 * Add one counter to the selected analytics option
			 * @param {String} _option Selected option
			 * @return {void}
			 */
			addAnalyticsCounter: function (_option) {
				doLog && console.log('[paymentOption] - addAnalyticsCounter');
				var current = 0;
				switch (_option) {
				case 'term':
					current = this.get('termsTimesChanged');
					current = current != null ? current + 1 : 1;
					this.set('termsTimesChanged', current);
					break;
				default:
					doLog && console.warn('[paymentOption] - No valid option selected for analytics counter: ' + _option);
					break;
				}
			},
		});

		return Model;
	},

	/**
	 * @class Collections.paymentOption
	 * Model definition to store all about the payment options
	 */
	extendCollection: function (Collection) {
		_.extend(Collection.prototype, {
			/**
			 * @method clone
			 * Creates a copy of this collection on a differente instance
			 * @return {Collections.paymentOption} Collection of PaymentOption Models cloned
			 */
			clone: function (_options) {
				var newPayments = Alloy.createCollection('paymentOption');
				this.each(function (_paymentOption) {
					newPayments.add(_paymentOption.clone());
				});

				return newPayments;
			}
		});

		return Collection;
	}
};
