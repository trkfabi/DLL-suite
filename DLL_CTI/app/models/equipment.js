/**
 * @class Models.Equipment
 * Model definition to store all about equipments
 */
exports.definition = {
	config: {
		columns: {
			// Note: Only the quote and salesRep tables are being saved now on both: ws and local DB
		}
	},
	/**
	 * @method extendModel
	 * Extending the definition of the equipment model
	 * @param {Models.Equipment} Model
	 * @return {Models.Equipment} Model
	 */
	extendModel: function (Model) {
		_.extend(Model.prototype, {
			idAttribute: 'id',
			/**
			 * @method defaults
			 * Defaults values of the equipment model
			 * @return {Object} Default values of the equipment model
			 */
			defaults: function () {
				return {
					'id': Alloy.Globals.generateGUID(),
					'price': 0,
					'make': null,
					'model': null,
					'serialNumber': null,
					'isUsed': 0,
					'year': null,
					'description': null,
					'tradeAllowance': 0,
					'tradePayoff': 0,
					'isTradein': 0
				};
			},
			/**
			 * @method save
			 * Save Data for the equipment model
			 * @param {Object} _attributes Attributes for the model
			 * @param {Object} _options Options for the model
			 * @return {Models.Equipment} Model
			 */
			save: function (_attributes, _options) {
				var _myCollection = this.collection;

				if (_myCollection && _myCollection.parent && _myCollection.parent.save) {
					_myCollection.parent.save(null, _options);
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
			/**
			 * @method comparator
			 * It is for the sorting of the collection
			 * @param {Models.Equipment} Model 
			 * @return {Models.Equipment} Model to know if it is trade in
			 */
			comparator: function (Model) {
				return (Model.get('isTradein'));
			}
		});

		return Collection;
	}
};
