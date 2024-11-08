/**
 * @class Models.Request
 * Model definition to store all about the requests
 */
exports.definition = {
	config: {

		adapter: {
			collection_name: "request"
		}
	},
	/**
	 * @method extendModel
	 * Extending the definitions of the request model
	 * @param {Models.Request} Model
	 * @return {Models.Request} Model
	 */
	extendModel: function (Model) {
		_.extend(Model.prototype, {
			defaults: function () {
				return {
					'date': new moment().format(),
					'status': Alloy.Globals.submitStatus.unsubmitted
				};
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
			// extended functions and properties go here

			// For Backbone v1.1.2, uncomment the following to override the
			// fetch method to account for a breaking change in Backbone.
			/*
			fetch: function(options) {
				options = options ? _.clone(options) : {};
				options.reset = true;
				return Backbone.Collection.prototype.fetch.call(this, options);
			}
			*/
		});

		return Collection;
	}
};
