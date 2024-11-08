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
	 * @class Models.customizations
	 * Model definition to store all about the customizations
	 */
	extendModel: function (Model) {
		_.extend(Model.prototype, {
			// extended functions and properties go here
		});

		return Model;
	},
	/**
	 * @class Collections.customizations
	 * Model definition to store all about the customizations
	 */
	extendCollection: function (Collection) {
		_.extend(Collection.prototype, {
			// extended functions and properties go here
		});

		return Collection;
	}
};
