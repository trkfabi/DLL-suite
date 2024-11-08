/**
 * @class Models.Customer
 * Model definition to store all about the customers
 */
exports.definition = {
	config: {
		columns: {
			// Note: Only the quote and salesRep tables are being saved now on both: ws and local DB
		},
		defaults: {
			'name': null,
			'firstName': null,
			'middleName': null,
			'lastName': null,
			'legalName': null,
			'contact': null,
			'title': null,
			'email': null,
			'phone': null,
			'contactAddressId': null,
			'billingAddressId': null,
			'maritalStatus': null,
			'yearsAtAddress': 0,
			'physicalAddress': null,
			'physicalCity': null,
			'physicalState': null,
			'physicalZip': null,
			'mailingAddress': null,
			'mailingCity': null,
			'mailingState': null,
			'mailingZip': null,
			'mailingAddressSameAsPhysical': true,
			'updated': 0,
			'ssn': null,
			'dob': null,
			'hasSSN': 0,
			'hasDOB': 0,
			'hasSignature': 0,
			'hasLicense': 0,
			'licenseFileName': null,
			'signatureFileName': null,
			'customerType': 'CCRP',
			'isCustomLegalName': 0
		}
	},
	/**
	 * @method extendModel
	 * Extending the definition of the customer model
	 * @param {Models.Customer} Model
	 * @return {Models.Customer} Model
	 */
	extendModel: function (Model) {
		_.extend(Model.prototype, {
			/**
			 * @method save
			 * Save data to the customer model
			 * @param {Object} _attributes Attributes for the model
			 * @param {Object} _options Options for saving the model
			 * @return {Models.Customer} Model
			 */
			save: function (_attributes, _options) {
				_attributes && this.set(_attributes);

				if (this.parent && this.parent.save) {
					this.parent.save(null, _options);
				}
			},
			/**
			 * @method hasLegalName
			 * Returns true if the customer has a custom legal name (entered manually) or a legalName which is equal to the name.
			 * @return {Boolean}
			 */
			hasLegalName: function () {
				return this.get('legalName') && this.get('legalName') !== '' && (this.get('isCustomLegalName') ||
					this.get('legalName') == this.get('name'));
			},
			/**
			 * @method hasCustomLegalNameOrCorporate
			 * Returns true if the customer has a custom legal name (entered manually) or is not an individual
			 * @return {Boolean}
			 */
			hasCustomLegalNameOrCorporate: function () {
				return this.get('isCustomLegalName') || (this.get('customerType') && this.get('customerType') !==
					'IND');
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
