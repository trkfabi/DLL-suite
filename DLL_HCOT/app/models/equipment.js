var stringFormatter = require('/helpers/stringFormatter');
exports.definition = {
	config: {
		columns: {
			// Note: Only the quote and salesRep tables are being saved now on both: ws and local DB
		}
	},
	/**
	 * @class Models.equipment
	 * Model definition to store all about equipments
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
					'quantity': 1,
					'tradeAllowance': 0,
					'tradePayoff': 0,
					'isTradein': 0,
					'productId': 0,
					'productName': null,
					'unitPrice': 0,
					'extendedPrice': 0
				};
			},
			/**
			 * @method save
			 * Save Data for the equipment model
			 * @param {Object} _attributes Attributes for the model
			 * @param {Object} _options Options for the model
			 * @return {Models.equipment} Model
			 */
			save: function (_attributes, _options) {
				var _myCollection = this.collection;

				if (_myCollection && _myCollection.parent && _myCollection.parent.save) {
					_myCollection.parent.save(null, _options);
				}
			},
			/**
			 * @method getDescriptionAndUpdate
			 * Obtains this equipment's description using make and model if exists to maintain backward compatibility, updates if null
			 * @return {String} Equipment description
			 */
			getDescriptionAndUpdate: function () {
				var description = this.get('description');

				if (description === null && (this.get('make') || this.get('model'))) {
					description = stringFormatter.formatList([(this.get('quantity') || 0), (this.get('make') || ''), (
						this.get('model') || '')], ' ');
					this.set({
						description: description
					}).save();

				}

				description = stringFormatter.restoreSingleQuote(description);
				return description;
			},
		});

		return Model;
	},
	/**
	 * @class Collections.equipment
	 * Model definition to store all about equipments
	 */
	extendCollection: function (Collection) {
		_.extend(Collection.prototype, {
			/**
			 * @method comparator
			 * It is for the sorting of the collection
			 * @param {Models.equipment} _equipment
			 * @return {Number} comparator value
			 */
			comparator: function (_equipment) {
				return (_equipment.get('isTradein'));
			},
			/**
			 * @method clone
			 * Creates a copy of this collection on a differente instance
			 * @return {Collections.equipment} Collection of Equipment Models cloned
			 */
			clone: function (_options) {
				var newEquipments = Alloy.createCollection('equipment');

				this.each(function (_equipment) {
					newEquipments.add(_equipment.clone());
				});

				return newEquipments;
			}
		});

		return Collection;
	}
};
