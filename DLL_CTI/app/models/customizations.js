/**
 * @class Models.Customizations
 * Model definition to store all about the customizations
 */
exports.definition = {
	config: {
		columns: {
			salesRepID: 'TEXT',
			fileName: 'TEXT',
			description: 'TEXT',
			contentType: 'TEXT',
			expirationDate: 'TEXT',
			type: 'TEXT',
			className: 'TEXT',
			content: 'TEXT'
		},
		defaults: {
			salesRepID: null,
			fileName: null,
			description: null,
			contentType: null,
			expirationDate: null,
			type: null,
			className: null,
			content: null
		},
		adapter: {
			version: 1,
			type: "joli",
			lastFreshMigration: 1,
			collection_name: "customizations"
		}
	},
	/**
	 * @method extendModel
	 * Extending the definition of the customizations model
	 * @param {Models.Customization} Model
	 * @return {Models.Customization} Model
	 */
	extendModel: function (Model) {
		_.extend(Model.prototype, {
			// extended functions and properties go here
		});

		return Model;
	},
	/**
	 * @method extendCollection
	 * Extending de definition of the collection
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
