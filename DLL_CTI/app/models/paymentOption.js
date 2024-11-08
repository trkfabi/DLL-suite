/**
 * @class Models.PaymentOption
 * Model definition to store all about the payment options
 */
exports.definition = {
	config: {
		columns: {
			// Note: Only the quote and salesRep tables are being saved now on both: ws and local DB
		}
	},
	/**
	 * @method extendModel
	 * Extending the definition of the payment option model
	 * @param {Models.PaymentOption} Model
	 * @return {Models.PaymentOption} Model
	 */
	extendModel: function (Model) {
		_.extend(Model.prototype, {
			_states: [],
			idAttribute: 'id',
			LEASE_DEFAULTS: {
				residualValue: 0,
				advancePayment: 0,
				taxOnAdvance: 0,
				taxOnAdvanceAmount: 0
			},
			FINANCE_DEFAULTS: {
				cashDown: 0,
				tradeAllowance: 0,
				tradePayoff: 0,
				taxes: 0,
				taxesAmount: 0,
				balloon: 0
			},
			/**
			 * @method defaults
			 * Default values of the payment options model
			 * @return {Object} Default values of the payment option model
			 */
			defaults: function () {
				return {
					'id': Alloy.Globals.generateGUID(),
					'equipmentCost': 0,
					'dateLastModified': null,
					'expirationDate': null,
					'term': '36',
					'additionalCost': 0,
					'amountFinanced': null,
					'payment': null,
					'purchaseOptions': 'FMV',
					'paymentFrequency': 'M',
					'tradeUpAmount': 0,
					'advancePayment': 0,
					'advancePaymentType': null,
					'orderNo': 0,
					'cashDown': 0,
					'tradeAllowance': 0,
					'tradePayoff': 0,
					'insurance': 0,
					'insuranceFactor': 0,
					'insuranceEnabled': 0,
					'fees': 0,
					'taxes': 0,
					'taxesAmount': 0,
					'contractDate': new moment().format(),
					'interestStartDate': null,
					'firstPaymentDue': null,
					'interestRate': 4.99,
					'balloon': 0,
					'totalPayments': 0,
					'financeCharges': 0,
					'taxOnAdvance': 0,
					'taxOnAdvanceAmount': 0,
					'interestWaiver': 0,
					'skipPayments': null,
					'isLease': 0,
					'residualValue': 0,
					'costPerHour': 0,
					'annualHours': 0,
					'costPerAcre': 0,
					'acres': 0,
					'costPerPTOHour': 0,
					'ptoHP': 0,
					'originalInvoice': 0,
					'residualPercentage': 0,
					'financeOption': 'finance'
				};
			},
			/**
			 * @method isLease
			 * Used to know if the Payment Option represents a lease or finance deal
			 * @return {Boolean} true if it's a Lease Deal, false otherwise
			 */
			isLease: function () {
				return this.get('financeOption') === 'lease';
			},
			/**
			 * @method resetLeaseOrFinanceData
			 * Clears the data not used for this PaymentOption's type of deal
			 * @return {Models.PaymentOption}
			 */
			resetLeaseOrFinanceData: function () {
				var isLease = this.isLease();
				this.set(isLease ? this.FINANCE_DEFAULTS : this.LEASE_DEFAULTS);
				return this;
			},
			/**
			 * @method toJSON
			 * Returns a JSON representation of this Payment Option
			 * @param {Object} _options details for toJSON
			 * @return {Object} JS Object using only the model's attributes
			 */
			toJSON: function (_options) {
				_options = _options || {};
				var _json = _.clone(this.attributes);

				_json.isLease = +this.isLease();

				return _json;
			},
			/**
			 * @method save
			 * Saves the {Model.Quote} containing this PaymentOption model
			 * @param {Object} _attributes Attributes for the model
			 * @param {Object} _options Options for the model
			 * @return {void}
			 */
			save: function (_attributes, _options) {
				var _myCollection = this.collection;

				if (_myCollection && _myCollection.parent && _myCollection.parent.save) {
					_attributes && this.set(_attributes);
					_myCollection.parent.save(null, _options);
				}
			},
			/**
			 * @method clone
			 * Duplicates the PaymentOption's data into a different, new model
			 * @return {Models.PaymentOption} Return PaymentOption model with data
			 */
			clone: function () {
				var _clone = JSON.parse(JSON.stringify(this.attributes));

				_clone.id = Alloy.Globals.generateGUID();

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
