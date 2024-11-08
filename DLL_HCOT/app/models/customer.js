var stringFormatter = require('/helpers/stringFormatter');
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
			'equipmentAddress': null,
			'equipmentCity': null,
			'equipmentState': null,
			'equipmentZip': null,
			'equipmentAddressSameAsPhysical': false,
			'hasSSN': 0,
			'hasDOB': 0,
			'hasSignature': 0,
			'hasLicense': 0
		}
	},
	/**
	 * @class Models.customer
	 * Model definition to store all about the customers
	 */
	extendModel: function (Model) {
		_.extend(Model.prototype, {
			/**
			 * @method save
			 * Save data to the customer model
			 * @param {Object} _attributes Attributes for the model
			 * @param {Object} _options Options for saving the model
			 * @return {Models.customer} Model
			 */
			save: function (_attributes, _options) {
				_attributes && this.set(_attributes);

				if (this.parent && this.parent.save) {
					this.parent.save(null, _options);
				}
			},
			/**
			 * @method getCustomerName
			 * Obtains the Customer's name or if there is not any, the customer's full name
			 * @return {String} Customer's name
			 */
			getCustomerName: function () {
				var customerName = '';
				var name = (this.get('name') || '').trim();

				if (name !== '') {
					customerName = this.get('name');
				} else {
					customerName = this.getCustomerFullName();
				}

				return customerName;
			},
			/**
			 * @method getCustomerFullName
			 * Obtains the complete customer's name based on first + middle + last name
			 * @return {String} Customer's full name
			 */
			getCustomerFullName: function () {
				var nameParts = [
					this.get('firstName'),
					this.get('middleName'),
					this.get('lastName')
				];

				return stringFormatter.restoreSingleQuote(stringFormatter.formatList(nameParts, ' '));
			},
			/**
			 * @method getLegalName
			 * Obtains the legal name according to the business rules:
			 * Checks if there is a custom Legal Name value
			 * If there is not Legal Name, uses Name
			 * If there is no Name, uses First + Middle + Last Names
			 * @return {String} Legal Name, `null` if no values are filled yet
			 */
			getLegalName: function () {
				var result = null;
				var legalName = (this.get('legalName') || '').trim();

				if (this.get('hasLegalName')) {
					result = legalName;
				} else {
					result = this.getCustomerName();
				}

				return result;
			}
		});

		return Model;
	},
	/**
	 * @class Collections.customer
	 * Model definition to store all about the customers
	 */
	extendCollection: function (Collection) {
		_.extend(Collection.prototype, {

		});

		return Collection;
	}
};
