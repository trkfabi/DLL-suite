exports.definition = {
	config: {
		columns: {
			// Note: Only the quote and salesRep tables are being saved now on both: ws and local DB
		},
		defaults: {
			// TODO: define allowance default properties
		}
	},
	/**
	 * @class Models.allowance
	 * Allowances data, not in use for now
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
			}
		});

		return Model;
	},
	/**
	 * @class Collections.allowance
	 * Allowances data, not in use for now
	 */
	extendCollection: function (Collection) {
		_.extend(Collection.prototype, {

		});

		return Collection;
	}
};
