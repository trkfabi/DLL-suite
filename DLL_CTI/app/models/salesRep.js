/**
 * @class Models.SalesRep
 * Model definition to store all about sales representative
 */
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
			'salesGroup': 'TEXT',
			'quoteSelected': 'TEXT',
			'language': 'TEXT'
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
			'salesGroup': null,
			'quoteSelected': null,
			'language': 'en',
			'quotes': []
		},
		adapter: {
			version: 1,
			type: 'joli',
			lastFreshMigration: 1,
			idAttribute: 'id',
			collection_name: 'salesRep'
		}
	},
	/**
	 * @method extendModel
	 * Extending the definition of the sales rep model
	 * @param {Models.SalesRep} Model
	 * @return {Models.SalesRep} Model
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
			 * @return {Models.Quote}
			 */
			getSelectedQuote: function () {
				doLog && console.log('[salesRep] - getSelectedQuote()');
				var _quotes = this.get('quotes');
				var _quoteID = this.get('quoteSelected');
				var _quote = null;

				if (_quoteID) {
					_quote = _quotes.get(_quoteID);
				}

				return _quote;
			},
			/**
			 * @method removeQuote
			 * Remove a quote
			 * @param {Models.Quote}  it receives a Quote Model
			 * @param {Boolean} _skipCreation should skip creating a new quote if the list is empty
			 * @return {void}
			 */
			removeQuote: function (_quote, _skipCreation) {
				doLog && console.log('[salesRep] - removeQuote() - ' + _quote.id + ' isSubmitted: ' + _quote.isSubmitted());
				var _quotes = this.get('quotes');
				var _selectedQuote = this.getSelectedQuote();
				var _selectedQuoteId = _selectedQuote.id;
				var _quoteToRemoveId = _quote.id;
				var _isSubmitted = _quote.isSubmitted();

				if (_quotes) {
					_quotes.remove(_quote);

					_quote.set('deleted', 1);
					_quote.save();

					// Check if there are active quotes in the list
					var quoteActive = _quotes.find(function (quote) {
						return !quote.isSubmitted() && !quote.get('deleted');
					});

					if (!quoteActive && !_skipCreation) {
						this.addQuote();
					} else if (_quotes.length > 0 && _selectedQuoteId === _quoteToRemoveId) {
						var quoteToSelect = _quotes.find(function (quote) {
							return quote.isSubmitted() === _isSubmitted;
						});

						!quoteToSelect && (quoteToSelect = _quotes.first());

						this.set('quoteSelected', quoteToSelect.id);
					}
				}

			},
			/**
			 * @method addQuote
			 * Add a quote
			 * @return {Models.Quote} Returns the added Quote Model
			 */
			addQuote: function () {
				doLog && console.log('[salesRep] - addQuote()');
				var _quotes = this.get('quotes');
				var _newQuote = Alloy.createModel('quote');

				_newQuote.set('salesRepID', this.id).set('dateCreated', new moment().format()).save();

				_quotes.add(_newQuote);

				this
					.set('quoteSelected', _newQuote.id)
					.save();

				return _newQuote;
			},
			/**
			 * @method copyQuote
			 * Copy a quote
			 * @param {Models.Quote} _quote Receives a Quote Model to copy 
			 * @return {Models.Quote} Returns a copied Quote Model
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
	 * @method extendCollection
	 * Extending the definition of the collection
	 * @param {Collection} Collection
	 * @return {Collection} Collection 
	 */
	extendCollection: function (Collection) {
		_.extend(Collection.prototype, {

		});

		return Collection;
	}
};
