/**
 * @class Models.Quote
 * Model definition to store all about the quotes
 */
var stringFormatter = require('/helpers/stringFormatter');

/*AGCO 2.6- = quote : {
	paymentOptions : [],
	customer : {
		equipment : [],
		equipmentUsage : []
	}
}

AGCO : 3.0+ = quote : {
	paymentOptions : [],
	customer : {},
	equipment : [],
	equipmentUsage : []
}*/

exports.definition = {
	config: {
		columns: {
			// SalesRep relation
			'salesRepID': 'TEXT',
			// Quote Data
			'name': 'TEXT',
			'isFavorited': 'INTEGER',
			'dateCreated': 'TEXT',
			'contractDate': 'TEXT',
			'deleted': 'INTEGER',
			'submitStatus': 'INTEGER',
			'creditAppFileName': 'TEXT',
			'leaseFileName': 'TEXT',
			// For differentiate the old quote model from the new one on the repository
			'revision': 'INTEGER',
			// Nested objects
			'paymentOptions': 'TEXT',
			'customer': 'TEXT',
			'equipments': 'TEXT',
			'usages': 'TEXT',
			'requests': 'TEXT',
			'paymentOptionOpened': 'TEXT',
			'paymentOptionSelected': 'TEXT'
		},
		defaults: {
			'name': L('no_name'),
			'isFavorited': 0,
			'dateCreated': new moment().format(),
			'deleted': 0,
			'submitStatus': Alloy.Globals.submitStatus.unsubmitted,
			'revision': 1,
			customer: {},
			paymentOptions: [],
			equipments: [],
			usages: [{}, {}],
			requests: []
		},
		adapter: {
			version: 4,
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
				customer: require('/alloy/models/Customer').Model,
				paymentOptions: require('/alloy/models/PaymentOption').Collection,
				equipments: require('/alloy/models/Equipment').Collection,
				usages: require('/alloy/models/EquipmentUsage').Collection,
				requests: require('/alloy/models/Request').Collection
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
				doLog && console.log('[quote] - save()');

				_options = _options || {};
				var webservices = require('/utils/webservices');
				var quote = this;

				var _result = Backbone.Model.prototype.save.call(quote, _attrs, _options);

				if (!_options.localOnly) {
					!quote.remoteSaveTimeout && (quote.remoteSaveTimeout = setTimeout(function () {
						doLog && console.log('[quote] - save() Remote save()');
						var quoteJson = quote.toJSON({
							parseNested: true
						});

						try {
							quoteJson = JSON.parse(stringFormatter.replaceSingleQuote(JSON.stringify(quoteJson, null, '	')));
						} catch (_error) {
							console.error('[quote] - Error parsing JSON: ' + JSON.stringify(_error, null, '	'));
						}

						webservices.saveQuote({
							id: quote.id,
							salesRepID: quote.get('salesRepID'),
							quote: quoteJson,

							successCallback: function (_response) {
								quote.remoteSaveTimeout = null;
								var _parsedQuote = null;

								try {
									_parsedQuote = JSON.parse(_response.blob.replace(/\'/g, '\"'));
								} catch (_error) {
									console.error("[quote] - save() - remote error: " + JSON.stringify(_error, null, '\t'));
								}

								doLog && console.debug('[quote] - save() - remote success: ' + JSON.stringify(_parsedQuote));
							},

							failCallback: function (_response) {
								quote.remoteSaveTimeout = null;
								console.error("[quote] - save() - remote error: " + JSON.stringify(_response, null, '\t'));
							}
						});

					}, 10000));
				}

				return _result;
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
								_quoteData = JSON.parse(_response.blob.replace(/\'/g, '\"'));

								this.save(_quoteData, {
									localOnly: true
								});

							} catch (_error) {
								console.error("[quote] - fetch() - remote error: " + JSON.stringify(_error, null, '\t'));
							}
						},
						failCallback: function (_response) {
							console.error("[quote] - fetch() - remote error: " + JSON.stringify(_response, null, '\t'));
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
					case 'usages':
					case 'requests':
						if (_.isString(_value)) {
							_response[_name] = JSON.parse(_value);
						}
					}

				});

				if (_revision < 1) {
					var _selectedPaymentOption = null;

					_response.equipments = _response.equipment;
					_response.usages = _response.usage;
					_response.paymentOptions = _response.payments;

					_selectedPaymentOption = _.findWhere(_response.paymentOptions, {
						isActive: 1
					});

					_.each(_response.paymentOptions, function (_paymentOption) {
						_paymentOption.id = _paymentOption.alloy_id;
						_paymentOption.financeOption = _paymentOption.isLease ? 'lease' : 'finance';
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
				var _clone = JSON.parse(JSON.stringify(this.attributes));

				delete _clone.alloy_id;
				delete _clone.creditAppFileName;
				delete _clone.leaseFileName;
				delete _clone.activeRequest;

				_clone.dateCreated = new moment().format();
				_clone.submitStatus = Alloy.Globals.submitStatus.unsubmitted;
				_clone.customer.hasSignature = 0;
				_clone.customer.hasLicense = 0;
				_clone.customer.hasDOB = 0;
				_clone.customer.hasSSN = 0;
				_clone.customer.isCustomLegalName = 0;

				return Alloy.createModel('quote', _clone);
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

				if (!_options.parseNested) {
					_json.customer = JSON.stringify(_json.customer || {});
					_json.paymentOptions = JSON.stringify(_json.paymentOptions || []);
					_json.equipments = JSON.stringify(_json.equipments || []);
					_json.usages = JSON.stringify(_json.usages || []);
					_json.requests = JSON.stringify(_json.requests || []);
				}

				if (_options.removeNested) {
					delete _json.customer;
					delete _json.paymentOptions;
					delete _json.equipments;
					delete _json.usages;
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
				doLog && console.log('[quote] - getSelectedPaymentOption()');

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
				var _paymentOptions = this.get('paymentOptions');
				var _paymentOption = Alloy.createModel('paymentOption');

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
				var _selectedPaymentOption = this.getSelectedPaymentOption();

				if (_paymentOptions) {
					_paymentOptions.remove(_paymentOption);

					if (_paymentOptions.length < 1) {
						this.addPaymentOption();
					} else if (_selectedPaymentOption === _paymentOption) {
						this.set('paymentOptionSelected', _paymentOptions.at(0).id);
						this.set('paymentOptionOpened', _paymentOptions.at(0).id);
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
			 * @public
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
						stringFormatter.restoreSingleQuote(customer.get('firstName')),
						stringFormatter.restoreSingleQuote(customer.get('lastName'))
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
				var submitStatus = this.get('submitStatus') || Alloy.Globals.submitStatus.unsubmitted;

				if (this.getQuoteName() || submitStatus !== Alloy.Globals.submitStatus.unsubmitted) {
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

				var webservices = require('/utils/webservices');
				var _collection = this;
				var _salesRepID = _options.salesRepID;

				if (_salesRepID) {

					_options.query = {
						where: {
							'salesRepID = ?': _salesRepID,
							'deleted is null or deleted = ?': 0
						}
					};

					if (_options.localOnly) {
						return Backbone.Collection.prototype.fetch.call(this, _options);
					} else {
						webservices.fetchQuotes({
							// NOTE: this 10,000 is intentional so we won't have to retieve multiple pages at the same time
							page: 1,
							size: 10000,
							/**
							 * @method successCallback
							 * Success Callback resonse after getting quotes from the server
							 * @param {Object} _response Success response message
							 * @return {void}
							 */
							successCallback: function (_response) {
								doLog && console.debug('[quote.Collection] - fetch() - remote success: ' + JSON.stringify(_response));
								if (_response.length > 0) {
									var quotesCollection = Alloy.createCollection('quote');
									var parsedQuotes = _.map(_response, function (_quoteData) {
										var parsedQuote = null;

										try {
											parsedQuote = JSON.parse(_quoteData.blob.replace(/\'/g, '\"'));
										} catch (_error) {
											console.warn("[quote.Collection] - fetch() - ERROR parsing quote : " + JSON.stringify(_error));
										}

										return parsedQuote;
									});
									var analyticsQuotes = [];
									var quotes = [];

									parsedQuotes = _.compact(parsedQuotes);

									_.each(parsedQuotes, function (_parsedQuote) {
										if (_parsedQuote.isAnalytics) {
											var analyticsModel = Alloy.createModel('analytics', _parsedQuote);

											analyticsModel.save(null, {
												localOnly: true
											});
										} else {
											quotes.push(_parsedQuote);
										}

									});

									quotesCollection
										.add(quotes, {
											parse: true
										})
										.save({
											localOnly: true
										});

									_options.reset = true;
									Backbone.Collection.prototype.fetch.call(_collection, _options);

								}

								_options.success && _options.success({
									response: _response,
									isRemote: true
								});
							},
							/**
							 * @method failCallback
							 * Fail callback response from the server after getting quotes from the server
							 * @param {Object} _response Fail response message
							 * @return {void}
							 */
							failCallback: function (_response) {
								console.error("[quote.Collection] - fetch() - remote error: " + JSON.stringify(_response, null, '\t'));

								Backbone.Collection.prototype.fetch.call(_collection, _options);
								_options.error && _options.error({
									response: _response,
									isRemote: true
								});
							}
						});

						return _collection;
					}
				} else {
					return Backbone.Collection.prototype.fetch.call(this, _options);
				}

			},
			/**
			 * @method save
			 * Save collection
			 * @param {Object} _options
			 * @return {Models.Quote}
			 */
			save: function (_options) {
				doLog && console.log('[quote.Collection] - save()');

				_options = _options || {};

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
