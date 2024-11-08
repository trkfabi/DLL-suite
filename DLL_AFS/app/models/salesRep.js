var doLog = Alloy.Globals.doLog;

exports.definition = {
	config: {
		columns: {

			'id': 'TEXT UNIQUE',
			'username': 'TEXT',
			'email': 'TEXT',
			'phone': 'TEXT',
			'activeDirectoryId': 'TEXT',
			'dealerId': 'TEXT',
			'addressId': 'TEXT',
			'tries': 'INTEGER',
			'hasQuotesFromServer': 'INTEGER',
			'lastCustomizationsUpdate': 'TEXT',
			'lastRateCardUpdate': 'TEXT',
			'lastQuotesUpdate': 'TEXT',
			'salesGroup': 'TEXT',
			'quoteSelected': 'TEXT',
			'language': 'TEXT',
			'vendorCode': 'TEXT',
			'name': 'TEXT',
			'title': 'TEXT'
		},
		defaults: {
			'id': null,
			'username': null,
			'email': null,
			'phone': null,
			'activeDirectoryId': null,
			'dealerId': null,
			'addressId': null,
			'tries': 0,
			'hasQuotesFromServer': 0,
			'lastCustomizationsUpdate': null,
			'lastRateCardUpdate': null,
			'lastQuotesUpdate': null,
			'salesGroup': null,
			'quoteSelected': null,
			'language': null,
			'vendorCode': null,
			'quotes': [],
			'name': null,
			'title': null
		},
		adapter: {
			version: 6,
			type: 'joli',
			lastFreshMigration: 5,
			idAttribute: 'id',
			collection_name: 'salesRep'
		}
	},
	/**
	 * @class Models.salesRep
	 * Model definition to store all about sales representative
	 */
	extendModel: function (Model) {
		_.extend(Model.prototype, {
			relations: {
				quotes: require('alloy/models/Quote').Collection
			},
			/**
			 * @method toJSON
			 * Getting JSON for the attributes
			 * @param {Object} _options details for toJSON
			 * @return {Object} Json
			 */
			toJSON: function (_options) {
				_options = _options || {};
				var _json = _.clone(this.attributes);

				if (!_options.showNested) {
					delete _json.quotes;
				}

				return _json;

			},

			/**
			 * @method updateSelectedQuote
			 * Updates the quote selected accordingly.
			 * If there are no quotes, it will create a new one
			 * @return {void}
			 */
			updateSelectedQuote: function (_options) {
				doLog && console.log('[salesRep] - updateSelectedQuote');

				_options = _options || {};
				var list = _options.list;

				var quotes = this.get('quotes');

				var activeQuotes = quotes.filter(function (quote) {
					return !quote.get('deleted');
				});

				var quoteSelected = quotes.get(this.get('quoteSelected'));

				if (!quoteSelected || quoteSelected.get('deleted')) {
					doLog && console.log('[salesRep] - updateSelectedQuote - no quoteSelected');
					if (activeQuotes.length > 0) {
						doLog && console.log('[salesRep] - updateSelectedQuote - select first active quote');

						if (list) {
							var quoteToSelect = _.find(activeQuotes, function (quote) {
								var isSubmitted = quote.isSubmitted();

								if (list === 'submitted') {
									return isSubmitted;
								} else {
									return !isSubmitted;
								}
							});

							if (quoteToSelect) {
								this.set('quoteSelected', quoteToSelect.id);
								return;
							}
						}

						this.set('quoteSelected', _.first(activeQuotes).id);
					} else {
						doLog && console.log('[salesRep] - updateSelectedQuote - create new quote');
						this.addQuote();
					}
				} else {
					doLog && console.log('[salesRep] - updateSelectedQuote - selected quote is correct');
				}

			},

			/**
			 * @method getSelectedQuote
			 * Obtains the selected quote model, selecting the first quote if no quote is selected
			 * @return {Models.quote}
			 */
			getSelectedQuote: function () {
				doLog && console.log('[salesRep] - getSelectedQuote()');
				var _quotes = this.get('quotes');
				var _quoteID = this.get('quoteSelected');
				var _quote = null;

				if (_quoteID) {
					_quote = _quotes.get(_quoteID);
					_quote && _quote.updateDefaultExpirationDate();
				}

				return _quote;
			},
			/**
			 * @method removeQuote
			 * Remove a quote
			 * @param {Models.quote}  it receives a Quote Model
			 * @return {void}
			 */
			removeQuote: function (_quote) {
				doLog && console.log('[salesRep] - removeQuote() - ' + _quote.id);
				var quotes = this.get('quotes');
				var quoteSelected = this.get('quoteSelected');

				if (quotes && quotes.length > 0) {
					quotes.remove(_quote);

					_quote.destroy();
				}

			},
			/**
			 * @method removeQuoteAndValidate
			 * Removes the given quote and creates a new quote if needed
			 * @param {Models.quote} _quoteToRemove Quote to remove
			 * @return {void}
			 */
			removeQuoteAndValidate: function (_quoteToRemove) {
				doLog && console.log('[salesRep] - removeQuoteAndValidate() - ' + _quoteToRemove.id);

				var isSubmitted = _quoteToRemove.isSubmitted();

				this.removeQuote(_quoteToRemove);
				this.updateSelectedQuote({
					list: isSubmitted ? 'submitted' : 'unsubmitted'
				});
			},
			/**
			 * @method addQuote
			 * Add a quote
			 * @return {Models.quote} Returns the added Quote Model
			 */
			addQuote: function () {
				doLog && console.log('[salesRep] - addQuote()');
				var _quotes = this.get('quotes');
				var _newQuote = Alloy.createModel('quote');

				_newQuote.set('salesRepID', this.id).save();

				_quotes.add(_newQuote);

				this
					.set('quoteSelected', _newQuote.id)
					.save();

				return _newQuote;
			},
			/**
			 * @method copyQuote
			 * Copy a quote
			 * @param {Models.quote} _quote Receives a Quote Model to copy 
			 * @return {Models.quote} Returns a copied Quote Model
			 */
			copyQuote: function (_quote) {
				doLog && console.log('[salesRep] - copyQuote() - ' + _quote.id);
				var _quotes = this.get('quotes');
				var _quoteClone = _quote.clone();
				_quoteClone
					.set('salesRepID', this.id)
					.save();

				_quotes.add(_quoteClone);

				this
					.set('quoteSelected', _quoteClone.id)
					.save();

				return _quoteClone;
			}
		});

		return Model;
	},
	/**
	 * @class Collections.salesRep
	 * Model definition to store all about sales representative
	 */
	extendCollection: function (Collection) {
		_.extend(Collection.prototype, {

		});

		return Collection;
	}
};
