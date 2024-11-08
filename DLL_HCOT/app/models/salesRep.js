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
			'salesGroup': 'TEXT',
			'quoteSelected': 'TEXT',
			'language': 'TEXT',
			'vendorCode': 'TEXT',
			'name': 'TEXT',
			'title': 'TEXT',
			'rcmToken': 'TEXT',
			'rcmRefreshToken': 'TEXT',
			'rcmVendorCode': 'TEXT'
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
			'salesGroup': null,
			'quoteSelected': null,
			'language': null,
			'vendorCode': null,
			'quotes': [],
			'name': null,
			'title': null,
			'rcmToken': null,
			'rcmRefreshToken': null,
			'rcmVendorCode': null
		},
		adapter: {
			version: 5,
			type: 'joli',
			lastFreshMigration: 2,
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
			 * @method getSelectedQuote
			 * Obtains the selected quote model, selecting the first quote if no quote is selected
			 * @return {Models.quote}
			 */
			getSelectedQuote: function () {
				doLog && console.log('[salesRep] - getSelectedQuote()');
				var quotes = this.get('quotes');
				var quoteID = this.get('quoteSelected');
				var quote = null;

				if (quoteID) {
					quote = quotes.get(quoteID);
				}

				return quote;
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

				if (!quotes) {
					doLog && console.error('[salesRep] - removeQuote() - quotes not available!');
					return false;
				}

				if (quotes.contains(_quote)) {
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

				var quotes = this.get('quotes');
				var quoteSelected = this.get('quoteSelected');
				var quoteId = _quoteToRemove.id;
				var isSubmitted = _quoteToRemove.isSubmitted();

				this.removeQuote(_quoteToRemove);

				// Check if there are active quotes in the list
				var quoteActive = quotes.find(function (_quote) {
					return !_quote.isSubmitted();
				});

				if (!quoteActive) {
					this.addQuote();
				} else if (quotes.length > 0 && quoteSelected === quoteId) {
					var quoteToSelect = quotes.find(function (_quote) {
						return _quote.isSubmitted() === isSubmitted;
					});

					!quoteToSelect && (quoteToSelect = quotes.first());

					this.set('quoteSelected', quoteToSelect.id);
				}
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
			},
			/**
			 * @method isHealthCare
			 * Checks if the sales group is from Health Care
			 * @return {Boolean} Returns true if it's from HC
			 */
			isHealthCare: function () {
				return this.get('salesGroup') === 'HC';
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
