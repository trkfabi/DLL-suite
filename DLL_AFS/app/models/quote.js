/**
 * @class Models.Quote
 * Model definition to store all about the quotes
 */
var doLog = Alloy.Globals.doLog;
var stringFormatter = require('/helpers/stringFormatter');

const LOG_TAG = '[models/quote] ';

/*OTHC 2.6- = quote : {
	paymentOptions : [
		{
			allowance
		}
	],
	customer : {
		equipment : []
	}
}

OTHC : 3.0+ = quote : {
	paymentOptions : [],
	customer : {},
	equipment : []
}*/

exports.definition = {
	config: {
		columns: {
			'id': 'TEXT',
			// SalesRep relation
			'salesRepID': 'TEXT',
			// Quote Data
			'name': 'TEXT',
			'isFavorited': 'INTEGER',
			'dateCreated': 'TEXT',
			'deleted': 'INTEGER',
			'submitStatus': 'INTEGER',
			'modifiedDate': 'TEXT',
			// For differentiate the old quote model from the new one on the repository
			'revision': 'INTEGER',
			// Nested objects
			'paymentOptions': 'TEXT',
			'customer': 'TEXT',
			'equipments': 'TEXT',
			'paymentOptionOpened': 'TEXT',
			'paymentOptionSelected': 'TEXT',

			'contractDate': 'TEXT',
			'leaseFileName': 'TEXT',
			'pendingSync': 'INTEGER',
			'customQuoteName': 'TEXT',
			'requests': 'TEXT',
			'creditRatingId': 'TEXT',
			'creditRatingName': 'TEXT',
			'amountFinanced': 'TEXT',
			'expirationDate': 'TEXT',
			'pdfFileName': 'TEXT',
			'displayPaybackPercentage': 'INTEGER',
			'syncDate': 'TEXT',
			// Analytics
			'shareButtonTimesPressed': 'INTEGER',
			'shareSummaryButtonTimesPressed': 'INTEGER',
			'financedAmountTimesChanged': 'INTEGER',
			'customerRecordTimesChanged': 'INTEGER',
			'customerRecordCancelTimesChanged': 'INTEGER',
			'creditRatingTimesChanged': 'INTEGER',
			'creditRatingCancelTimesChanged': 'INTEGER',
			'summaryQuoteValidTimesChanged': 'INTEGER',
			'summaryFileNameTimesChanged': 'INTEGER',
			'summaryDisplayPlaybackOnTimesChanged': 'INTEGER',
			'summaryDisplayPlaybackOffTimesChanged': 'INTEGER'
		},
		adapter: {
			version: 17,
			type: "joli",
			collection_name: "quote",
			lastFreshMigration: 4
		}
	},
	/**
	 * @method extendModel
	 * Extending the definition for the quote model
	 * @param {Models.Quote} Model
	 * @return {Models.Quote} Model
	 */
	extendModel: function (Model) {
		_.extend(Model.prototype, {
			relations: {
				customer: require('alloy/models/Customer').Model,
				paymentOptions: require('alloy/models/PaymentOption').Collection,
				equipments: require('alloy/models/Equipment').Collection,
				requests: require('alloy/models/Request').Collection
			},
			defaults: function () {
				return {
					'name': L('no_name'),
					'isFavorited': 0,
					'dateCreated': new moment().toISOString(),
					'deleted': 0,
					'submitStatus': Alloy.Globals.submitStatus.unsubmitted,
					'revision': 1,
					'isOutdated': 0,
					'pendingSync': 0,
					'modifiedDate': null,
					'displayPaybackPercentage': 1,
					'shareButtonTimesPressed': 0,
					'shareSummaryButtonTimesPressed': 0,
					'financedAmountTimesChanged': 0,
					'customerRecordTimesChanged': 0,
					'customerRecordCancelTimesChanged': 0,
					'creditRatingTimesChanged': 0,
					'creditRatingCancelTimesChanged': 0,
					'summaryQuoteValidTimesChanged': 0,
					'summaryFileNameTimesChanged': 0,
					'summaryDisplayPlaybackOnTimesChanged': 0,
					'summaryDisplayPlaybackOffTimesChanged': 0,
					customer: {},
					paymentOptions: [],
					equipments: [{}],
					requests: []
				};
			},
			/**
			 * @method save
			 * Save data for the quote model
			 * @param {Object} _attributes Additional attributes to set on the model before saving it
			 * @param {Object} _options Options for saving the quote
			 * @param {Boolean} _options.localOnly Used to know if it should be saved local or remote way
			 * @return {Models.Quote} Quote model
			 */
			save: function (_attrs, _options) {
				_options = _options || {};

				doLog && console.log('[quote] - save()', JSON.stringify(_options));
				var webservices = require('/utils/webservices');
				var quote = this;
				var success = _options.success;
				var error = _options.error;

				// Quote may be a Collection (?)
				if (quote.set && !_options.reSave) {
					quote.set('modifiedDate', new moment().toISOString());
				}

				var _result = Backbone.Model.prototype.save.call(quote, _attrs, _options);

				//doLog && console.log('_options.localOnly: ' + JSON.stringify(_options.localOnly, null, '\t'));
				//doLog && console.log('_options.reSave: ' + JSON.stringify(_options.reSave, null, '\t'));

				if (!_options.localOnly) {
					if (_options.force) {
						remoteSave();
					} else {
						!quote.remoteSaveTimeout && (quote.remoteSaveTimeout = _.throttle(remoteSave, 2500, {
							leading: false
						}));

						quote.remoteSaveTimeout();
					}
				}

				return _result;

				function remoteSave() {
					doLog && console.log('[quote] - save() Remote save() ' + quote.id);
					var jsonQuote = quote.toJSON({
						parseNested: true
					});
					if (!jsonQuote.id && !jsonQuote.alloy_id) {
						return;
					}

					var quoteData = {
						id: jsonQuote.id || null,
						alloy_id: jsonQuote.alloy_id || null,
						amountFinanced: jsonQuote.amountFinanced || 0,
						contractDate: jsonQuote.contractDate || '',
						creditRatingId: jsonQuote.creditRatingId || '',
						creditRatingName: jsonQuote.creditRatingName || '',
						customQuoteName: jsonQuote.customQuoteName || '',
						customer: jsonQuote.customer || {},
						dateCreated: jsonQuote.dateCreated || '',
						deleted: jsonQuote.deleted || false,
						displayPaybackPercentage: jsonQuote.displayPaybackPercentage || false,
						equipments: jsonQuote.equipments || [],
						expirationDate: jsonQuote.expirationDate || '',
						isFavorited: jsonQuote.isFavorited || false,
						modifiedDate: jsonQuote.modifiedDate || '',
						name: jsonQuote.name || '',
						paymentOptionOpened: jsonQuote.paymentOptionOpened || '',
						paymentOptionSelected: jsonQuote.paymentOptionSelected || '',
						paymentOptions: jsonQuote.paymentOptions || [],
						pdfFileName: jsonQuote.pdfFileName || '',
						revision: jsonQuote.revision || 0,
						salesRepID: jsonQuote.salesRepID,
						submitStatus: jsonQuote.submitStatus || 0,
						shareButtonTimesPressed: jsonQuote.shareButtonTimesPressed || 0,
						shareSummaryButtonTimesPressed: jsonQuote.shareSummaryButtonTimesPressed || 0,
						financedAmountTimesChanged: jsonQuote.financedAmountTimesChanged || 0,
						customerRecordTimesChanged: jsonQuote.customerRecordTimesChanged || 0,
						customerRecordCancelTimesChanged: jsonQuote.customerRecordCancelTimesChanged || 0,
						creditRatingTimesChanged: jsonQuote.creditRatingTimesChanged || 0,
						creditRatingCancelTimesChanged: jsonQuote.creditRatingCancelTimesChanged || 0,
						summaryQuoteValidTimesChanged: jsonQuote.summaryQuoteValidTimesChanged || 0,
						summaryFileNameTimesChanged: jsonQuote.summaryFileNameTimesChanged || 0,
						summaryDisplayPlaybackOnTimesChanged: jsonQuote.summaryDisplayPlaybackOnTimesChanged || 0,
						summaryDisplayPlaybackOffTimesChanged: jsonQuote.summaryDisplayPlaybackOffTimesChanged || 0
					};

					webservices.saveQuote({
						quote: quoteData,

						successCallback: function (_response) {
							doLog && console.log(LOG_TAG, '- save - ws.saveQuote - successCallback - ' + JSON.stringify(_response));

							var result = _response.quote || {};
							result.syncDate = moment().toISOString();

							// quote.save(result, {
							// 	localOnly: true,
							// 	reSave: true
							// });

							quote.save({
								syncDate: moment().toISOString()
							}, {
								localOnly: true,
								reSave: true
							});

							doLog && console.log('quote: ' + JSON.stringify(quote));

							success && success(quote);
						},

						failCallback: function (_response) {
							doLog && console.log(LOG_TAG, '- save - ws.saveQuote - failCallback - ' + JSON.stringify(_response));
							error && error(_response);
						}
					});
				}
			},

			/**
			 * @method destroy
			 * Deletes the quote virtually, not removing it from disk
			 * @return {void}
			 */
			destroy: function () {
				doLog && console.log('[quote] - destroy()');
				this.set({
					deleted: 1
				}).save();
			},

			/**
			 * @method fetch
			 * Attempts to get the quotes locally, and remote
			 * @param {Object} _options Details used to get the quotes 
			 * @param {Number} _options.id Option id
			 * @return {Models.Quote}
			 */
			fetch: function (_options) {
				doLog && console.log('[quote] - fetch()');
				var webservices = require('/utils/webservices');
				var _id = _options.id || this.id;

				if (_id) {
					webservices.fetchQuote({
						quoteID: _id,
						successCallback: function (_response) {
							try {
								var _quoteData = _response.result;

								if (moment(this.modifiedDate).isAfter(moment(_quoteData.modifiedDate))) {
									_quoteData = this;
								}

								this.save(_quoteData, {
									localOnly: true
								});

							} catch (_error) {
								doLog && console.error("[quote] - fetch() - remote error: " + JSON.stringify(_error, null, '\t'));
							}
						},
						failCallback: function (_response) {
							doLog && console.error("[quote] - fetch() - remote error: " + JSON.stringify(_response, null, '\t'));
						}
					});
				}

				return Backbone.Model.prototype.fetch.call(this, _options);

			},
			/**
			 * @method parse
			 * Parse the values from the webservice/local db into the Quote Model attributes
			 * @param {Object} _response
			 * @param {String} _response.equipments Details about the equipments
			 * @param {String} _response.usage Usage Details about the usage
			 * @param {String} _response.payments Payments 
			 * @param {String} _response.paymentOptions Payment options
			 * @param {String} _response.paymentOptionSelected Payment options selected
			 * @param {Object} _options Options for parsing a value
			 * @param {Number} _response.revision Number of the revision
			 * @return {Object} _response Details
			 */
			parse: function (_response, _options) {
				_response = _response || {};
				var _revision = _response.revision || 0;

				_.each(_response, function (_value, _name) {
					switch (_name) {
					case 'customer':
					case 'paymentOptions':
					case 'equipments':
					case 'requests':
						if (_.isString(_value)) {
							_response[_name] = JSON.parse(_value);
						}
					}

				});

				if (_revision < 1) {
					var _selectedPaymentOption = null;

					_response.equipments = _response.equipment;
					_response.paymentOptions = _response.payments;

					_selectedPaymentOption = _.findWhere(_response.paymentOptions, {
						isActive: 1
					});

					_.each(_response.paymentOptions, function (_paymentOption) {
						_paymentOption.id = _paymentOption.alloy_id;
						(!_paymentOption.useRateCard) && (_paymentOption.manualRateFactor = Number(_paymentOption.rateFactor));
					});

					_selectedPaymentOption && (_response.paymentOptionSelected = _selectedPaymentOption.alloy_id);
				}

				return _response;
			},
			/**
			 * @method clone
			 * Duplicates the Quote Model
			 * @return {Models.Quote} Quote model
			 */
			clone: function () {
				var newQuote = JSON.parse(JSON.stringify(this.attributes));
				var selectedOrderNo = this.getSelectedPaymentOption().get('orderNo');
				var newSelectedPayment = null;

				delete newQuote.id;
				delete newQuote.alloy_id;
				delete newQuote.leaseFileName;

				newQuote.dateCreated = new moment().toISOString();
				newQuote.pendingSync = true;
				newQuote.expirationDate = null;
				newQuote.submitStatus = Alloy.Globals.submitStatus.unsubmitted;
				newQuote.customer = this.get('customer').clone().toJSON();
				newQuote.equipments = this.get('equipments').clone().toJSON();
				newQuote.paymentOptions = this.get('paymentOptions').clone().toJSON();
				newQuote.requests = [];
				newQuote.shareButtonTimesPressed = 0;
				newQuote.shareSummaryButtonTimesPressed = 0;
				newQuote.financedAmountTimesChanged = 0;
				newQuote.customerRecordTimesChanged = 0;
				newQuote.customerRecordCancelTimesChanged = 0;
				newQuote.creditRatingTimesChanged = 0;
				newQuote.creditRatingCancelTimesChanged = 0;
				newQuote.summaryQuoteValidTimesChanged = 0;
				newQuote.summaryFileNameTimesChanged = 0;
				newQuote.summaryDisplayPlaybackOnTimesChanged = 0;
				newQuote.summaryDisplayPlaybackOffTimesChanged = 0;

				_.each(newQuote.paymentOptions, function (_paymentOption) {
					_paymentOption.shouldRecalculate = true;
				});

				newSelectedPayment = _.findWhere(newQuote.paymentOptions, {
					orderNo: selectedOrderNo
				}) || {};

				newQuote.paymentOptionSelected = newSelectedPayment.id;
				newQuote.paymentOptionOpened = newSelectedPayment.id;

				return Alloy.createModel('quote', newQuote);
			},
			/**
			 * @method toJSON
			 * Returns a JSON object representation of the model, based on the options given
			 * @param {Object} [_options] Optional options for creating the JSON object
			 * @param {Boolean} [_options.parseNested = false] If true, will show the nested models as JS objects. If false, will show the nested models as plain text (`JSON.stringify()`'ed)
			 * @param {Boolean} [_options.removeNested = false] If true, all the nested models will be removed.
			 * @return {Object} JSON object representation of the quote.
			 */
			toJSON: function (_options) {
				_options = _options || {};
				var _json = _.clone(this.attributes);

				if (_options.parseNested) {
					_json.customer = JSON.parse(JSON.stringify(_json.customer || {}));
					_json.paymentOptions = JSON.parse(JSON.stringify(_json.paymentOptions || []));
					_json.equipments = JSON.parse(JSON.stringify(_json.equipments || []));
					_json.requests = JSON.parse(JSON.stringify(_json.requests || []));
				} else {
					_json.customer = JSON.stringify(_json.customer || {});
					_json.paymentOptions = JSON.stringify(_json.paymentOptions || []);
					_json.equipments = JSON.stringify(_json.equipments || []);
					_json.requests = JSON.stringify(_json.requests || []);
				}

				if (_options.removeNested) {
					delete _json.customer;
					delete _json.paymentOptions;
					delete _json.equipments;
					delete _json.requests;
				}

				return _json;
			},
			/**
			 * @method togglePaymentOptionOpened
			 * Toggle the payment option opened
			 * @param {Object} _paymentOption Payment option
			 * @return {void} 
			 */
			togglePaymentOptionOpened: function (_paymentOption) {
				doLog && console.log('[quote] - togglePaymentOptionOpened()');

				var _currentOpened = this.get('paymentOptionOpened');

				if (_paymentOption.id === _currentOpened) {
					this.set('paymentOptionOpened', null);
				} else {
					this.set('paymentOptionOpened', _paymentOption.id);
				}
			},
			/**
			 * @method getSelectedPaymentOption
			 * Get the selected paymentOption inside this quote
			 * @return {Object} _paymentOption Selected payment
			 */
			getSelectedPaymentOption: function () {
				// doLog && console.log('[quote] - getSelectedPaymentOption()');

				var _paymentOptions = this.get('paymentOptions');
				var _paymentID = this.get('paymentOptionSelected');
				var _paymentOption = null;

				if (_paymentID) {
					_paymentOption = _paymentOptions.get(_paymentID);
				}

				if (!_paymentOption) {
					if (_paymentOptions.length < 1) {
						this.addPaymentOption();
					}

					_paymentOption = _paymentOptions.at(0);

					this.set('paymentOptionSelected', _paymentOption.id);
				}

				return _paymentOption;

			},
			/**
			 * @method getOpenedPaymentOption
			 * Get the paymentOption inside this quote
			 * @return {Models.PaymentOption} Payment Option model
			 */
			getOpenedPaymentOption: function () {
				doLog && console.log('[quote] - getOpenedPaymentOption()');

				var _paymentOptions = this.get('paymentOptions');
				var _paymentID = this.get('paymentOptionOpened');
				var _paymentOption = null;

				if (_paymentID) {
					_paymentOption = _paymentOptions.get(_paymentID);
				}

				if (!_paymentOption) {
					if (_paymentOptions.length < 1) {
						this.addPaymentOption();
					}

					_paymentOption = _paymentOptions.at(0);

					this.set('paymentOptionOpened', _paymentOption.id);
				}

				return _paymentOption;
			},
			/**
			 * @method addPaymentOption
			 * Add a payment option
			 * @return {void} 
			 */
			addPaymentOption: function () {
				doLog && console.log('[quote] - addPaymentOption()');

				var options = {};
				var _paymentOptions = this.get('paymentOptions');
				var _paymentOption = Alloy.createModel('paymentOption');

				options.shouldRecalculate = true;

				_paymentOption.set(options);

				_paymentOptions.add(_paymentOption);

				this.set('paymentOptionSelected', _paymentOption.id);
				this.set('paymentOptionOpened', _paymentOption.id);
			},
			/**
			 * @method removePaymentOption
			 * Remove a pyament option
			 * @param {Object} _paymentOption to be removed
			 * @return {void} 
			 */
			removePaymentOption: function (_paymentOption) {
				var _paymentOptions = this.get('paymentOptions');
				var paymentOptionSelected = this.get('paymentOptionSelected');
				var paymentOptionOpened = this.get('paymentOptionOpened');

				_paymentOptions.remove(_paymentOption);

				if (_paymentOptions && _paymentOptions.length > 0) {
					if (paymentOptionSelected === _paymentOption.id) {
						this.set('paymentOptionSelected', _paymentOptions.at(0).id);
						this.set('paymentOptionOpened', _paymentOptions.at(0).id);
					} else if (paymentOptionOpened === _paymentOption.id) {
						this.set('paymentOptionOpened', _paymentOptions.at(0).id);
					}

					if (_paymentOptions.length < 1) {
						this.addPaymentOption();
					}
				}
			},
			/**
			 * @method copyPaymentOption
			 * Copy a payment option
			 * @param {Models.PaymentOption} _paymentOption Payment Option model
			 * @return {void} 
			 */
			copyPaymentOption: function (_paymentOption) {
				doLog && console.log('[quote] - copyPaymentOption()');

				var _paymentOptions = this.get('paymentOptions');
				var _paymentClone = _paymentOption.clone();
				var _paymentIndex = -1;

				if (_paymentOptions) {
					_paymentIndex = _paymentOptions.indexOf(_paymentOption);
					_paymentOptions.add(_paymentClone, {
						at: _paymentIndex + 1
					});

					this.set('paymentOptionSelected', _paymentClone.id);
					this.set('paymentOptionOpened', _paymentClone.id);
				}
			},
			/**
			 * @method getQuoteName
			 * Obntains this quote's name based on the customer's name or first+last names
			 * @return {String} Quote's name, `null` if the rules don't compell the quote name
			 */
			getQuoteName: function () {
				var customer = this.get('customer');
				var quoteName = null;

				if ((customer.get('name') || '').trim()) {
					quoteName = customer.get('name');
				} else if ((customer.get('firstName') || '').trim()) {
					quoteName = stringFormatter.formatList([
						customer.get('firstName'),
						customer.get('lastName')
					], ' ');
				}

				return quoteName;
			},
			/**
			 * @method isNew
			 * Verifies if the quote has customer information, to determine whether or not it is a new quote.
			 * @return {Boolean} Returns true if the quote is new
			 */
			isNew: function () {
				doLog && console.log('[quote] - isNew()');

				if (this.getQuoteName()) {
					return false;
				}

				return true;
			},
			/**
			 * @method isSubmitted
			 * Defines if the quote has been submitted to DLL
			 * @return {Boolean} true if it has been submitted, false otherwise
			 */
			isSubmitted: function () {
				var submitStatus = this.get('submitStatus') || Alloy.Globals.submitStatus.unsubmitted;

				return (submitStatus !== Alloy.Globals.submitStatus.unsubmitted);
			},
			/**
			 * @method getDisplayPaybackPercentage
			 * Defines if the payback percentage switch should be ON or OFF
			 * @return {Boolean} true if the value is "init" or "on", false otherwise
			 */
			getDisplayPaybackPercentage: function () {
				var displayPaybackPercentage = this.get('displayPaybackPercentage');
				return (displayPaybackPercentage !== Alloy.Globals.displayPaybackPercentage.off && displayPaybackPercentage !==
					Alloy.Globals.displayPaybackPercentage.offAlternative);
			},
			/**
			 * @method removeUnselectedPayments
			 * Removes all the payments that are not the selected one
			 * @return {void}
			 */
			removeUnselectedPayments: function () {
				doLog && console.log('[quote] - removeUnselectedPayments()');

				var selectedID = this.get('paymentOptionSelected');
				var paymentOptions = this.get('paymentOptions');

				this.set('paymentOptionOpened', selectedID);
				paymentOptions.each(function (_paymentOption) {
					if (selectedID !== _paymentOption.id) {
						paymentOptions.remove(_paymentOption);
					}
				});

			},
			/**
			 * @method isOutdated
			 * Validates is the quote is outdated or not, based on the paymentOptions `isOutdated` property
			 * @return {Boolean} `true` if at least on of the PaymentOptions is outdated
			 */
			isOutdated: function () {
				var paymentOptions = this.get('paymentOptions');

				return paymentOptions.any(function (_paymentOption) {
					return !!_paymentOption.get('isOutdated');
				});
			},
			/**
			 * @method isActive
			 * Validates is the quote is still active, meaning it can be editable or not
			 * @return {Boolean} `true` if the quote is still editable, `false` otherwise.
			 */
			isActive: function () {
				var isOutdated = this.isOutdated();
				var isSubmitted = this.isSubmitted();

				return !isOutdated && !isSubmitted;
			},
			/**
			 * @method addAnalyticsCounter
			 * Add one counter to the selected analytics option
			 * @param {String} _option Selected option
			 * @return {void}
			 */
			addAnalyticsCounter: function (_option, _value) {
				doLog && console.log(LOG_TAG, '- addAnalyticsCounter: ' + _option);
				var current = 0;
				switch (_option) {
				case 'share':
					current = this.get('shareButtonTimesPressed');
					current = current != null ? current + 1 : 1;
					this.set('shareButtonTimesPressed', current).save();
					break;
				case 'shareSummary':
					current = this.get('shareSummaryButtonTimesPressed');
					current = current != null ? current + 1 : 1;
					this.set('shareSummaryButtonTimesPressed', current).save();
					break;
				case 'financedAmount':
					current = this.get('financedAmountTimesChanged');
					var currentAmount = this.get('amountFinanced') || 0;
					var value = _value.newAmount;
					var equipment = _value.equipment;
					if (value !== currentAmount) {
						if (equipment && equipment.hasItad()) {
							var itadValue = equipment.getItadRate().extendedPrice;
							var unitPrice = equipment.get('unitPrice');
							var quantity = equipment.get('quantity');
							if (unitPrice === 0 || quantity === 0 || (value === itadValue)) {
								return;
							}
						}
						current = current != null ? current + 1 : 1;
						this.set('financedAmountTimesChanged', current);
					}
					break;
				case 'customerRecord':
					current = this.get('customerRecordTimesChanged');
					current = current != null ? current + 1 : 1;
					this.set('customerRecordTimesChanged', current);
					break;
				case 'customerRecordCancel':
					current = this.get('customerRecordCancelTimesChanged');
					current = current != null ? current + 1 : 1;
					this.set('customerRecordCancelTimesChanged', current).save();
					break;
				case 'creditRating':
					current = this.get('creditRatingTimesChanged');
					current = current != null ? current + 1 : 1;
					this.set('creditRatingTimesChanged', current);
					break;
				case 'creditRatingCancel':
					current = this.get('creditRatingCancelTimesChanged');
					current = current != null ? current + 1 : 1;
					this.set('creditRatingCancelTimesChanged', current).save();
					break;
				case 'quoteValid':
					current = this.get('summaryQuoteValidTimesChanged');
					var currentDate = this.get('expirationDate') || '';
					if (_value != currentDate) {
						current = current != null ? current + 1 : 1;
						this.set('summaryQuoteValidTimesChanged', current);
					}
					break;
				case 'fileName':
					current = this.get('summaryFileNameTimesChanged');
					var currentFileName = this.get('pdfFileName') || '';
					if (_value != currentFileName) {
						current = current != null ? current + 1 : 1;
						this.set('summaryFileNameTimesChanged', current);
					}
					break;
				case 'displayPaybackOn':
					current = this.get('summaryDisplayPlaybackOnTimesChanged');
					current = current != null ? current + 1 : 1;
					this.set('summaryDisplayPlaybackOnTimesChanged', current);
					break;
				case 'displayPaybackOff':
					current = this.get('summaryDisplayPlaybackOffTimesChanged');
					current = current != null ? current + 1 : 1;
					this.set('summaryDisplayPlaybackOffTimesChanged', current);
					break;
				default:
					doLog && console.warn(LOG_TAG, '- No valid option selected for analytics counter: ' + _option);
					break;
				}
			},
			/**
			 * @method exportQuote
			 * Formats the quote to a string for export
			 * @return {String} a JSON.stringify of the quote
			 */
			exportQuote: function () {
				var exportedQuote = this.toJSON();
				try {
					exportedQuote.customer = JSON.parse(exportedQuote.customer);
					exportedQuote.paymentOptions = JSON.parse(exportedQuote.paymentOptions);
					exportedQuote.equipments = JSON.parse(exportedQuote.equipments);
				} catch (_error) {
					doLog && console.warn('[quote] - Unable to parse quote, sending plain string: ' + _error);
				}
				return JSON.stringify(exportedQuote, null, '	');
			}
		});

		return Model;
	},
	/**
	 * @method extendCollection
	 * Extending the definition of the collection
	 * @param {Collection} Collection
	 * @return {Collection}
	 */
	extendCollection: function (Collection) {
		_.extend(Collection.prototype, {
			// Sort the quotes to show the favorites first
			comparator: function (model) {
				var dateCreated = new Date(model.get('dateCreated')).getTime();
				return -model.get("isFavorited") * Math.pow(10, 20) + -dateCreated;
			},
			/**
			 * @method fetch
			 * Getting quote collection
			 * @param {Object} _options Options used for the collections of the quotes
			 * @param {Boolean} _options.localOnly Used to get local quotes if it is true, othersiwe will do a request to the server to get quotes
			 * @param {Number} _options.salesRepID Sales representative id
			 * @return {void}
			 */
			fetch: function (_options) {
				doLog && console.log('[quote.Collection] - fetch()');
				_options = _options || {};

				var _collection = this;
				var _salesRepID = _options.salesRepID;

				if (_salesRepID) {
					_options.query = {
						where: {
							'salesRepID = ?': _salesRepID
						}
					};
				}

				return Backbone.Collection.prototype.fetch.call(_collection, _options);
			},
			/**
			 * @method save
			 * Save collection
			 * @param {Object} _options
			 * @return {Models.Quote}
			 */
			save: function (_options) {
				_options = _options || {};
				doLog && console.log('[quote.Collection] - save()', JSON.stringify(_options));

				return this.model.prototype.save.call(this, null, _options);
			},
			/**
			 * @method isNew
			 * Function to know if it is a new collection
			 * @return {Boolean}
			 */
			isNew: function () {
				return false;
			}
		});

		return Collection;
	}
};
