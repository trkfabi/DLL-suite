/**
 * @class Models.EquipmentUsage
 * Model definition to store all about the equipment usage
 */
exports.definition = {
	config: {
		columns: {
			// Note: Only the quote and salesRep tables are being saved now on both: ws and local DB
		}
	},
	/**
	 * @method extendModel
	 * Extending the definitions, and functionality of the equipment usage model
	 * @param {Models.EquipmentUsage} Model
	 * @return {Models.EquipmentUSage} Model
	 */
	extendModel: function (Model) {
		_.extend(Model.prototype, {
			idAttribute: 'id',
			/**
			 * @method defaults
			 * Defaults values of the equipment usage model
			 * @return {void}
			 */
			defaults: function () {
				return {
					'id': Alloy.Globals.generateGUID(),
					'description': null,
					'percentage': 0
				};
			},
			/**
			 * @method save
			 * Save data  for the equipment usage model
			 * @param {Object} _attributes Attributes for the model
			 * @param {Object} _options Options for the model
			 * @return {Models.EquipmentUsage} Model
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
	 * Extend, override or implement Backbone.Collection
	 * @param {Collection} Collection 
	 * @return {Collection} Collection
	 */
	extendCollection: function (Collection) {
		_.extend(Collection.prototype, {
			// extended functions and properties go here
		});

		return Collection;
	}
};
