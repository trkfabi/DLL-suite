exports.definition = {
	config: {

		adapter: {
			collection_name: "request"
		}
	},
	/**
	 * @class Models.request
	 * Model definition to store all about the requests
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
	 * @class Collections.request
	 * Model definition to store all about the requests
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
