var doLog = Alloy.Globals.doLog;

exports.definition = {
	config: {
		columns: {
			'name': 'TEXT',
			'platformID': 'TEXT',
			'salesRepID': 'TEXT',
			'osName': 'TEXT',
			'osVersion': 'TEXT',
			'appVersion': 'TEXT',
			'width': 'TEXT',
			'height': 'TEXT',
			'density': 'TEXT',
			'model': 'TEXT',
			'manufacturer': 'TEXT',
			'created': 'TEXT',
			'lastUpdate': 'TEXT',
			'isAnalytics': 'INTEGER'
		},
		adapter: {
			version: 1,
			type: "joli",
			collection_name: "analytics",
			lastFreshMigration: 1
		}
	},
	/**
	 * @class Models.analytics
	 * Special model for tracking specific telemetry from users
	 */
	extendModel: function (Model) {
		_.extend(Model.prototype, {
			/**
			 * @method save
			 * Save data for the analytics model
			 * @param {Object} _attributes Additional attributes to set on the model before saving it
			 * @param {Object} _options Options for saving the analytics
			 * @param {Boolean} _options.localOnly Used to know if it should be saved local or remote way
			 * @return {Models.quote} Quote model
			 */
			save: function (_attrs, _options) {
				doLog && console.log('[analytics] - save()');

				_options = _options || {};
				var webservices = require('/utils/webservices');
				var analytics = this;

				var _result = Backbone.Model.prototype.save.call(analytics, _attrs, _options);

				if (!_options.localOnly) {
					!analytics.remoteSaveTimeout && (analytics.remoteSaveTimeout = setTimeout(function () {
						doLog && console.log('[analytics] - save() Remote save()');

						webservices.saveEvent({
							id: analytics.id,
							salesRepID: analytics.get('salesRepID'),
							quote: analytics.toJSON(),

							successCallback: function (_response) {
								doLog && console.log('_response: ' + JSON.stringify(_response, null, '\t'));
								analytics.remoteSaveTimeout = null;
								var _parsedQuote = null;

								try {
									_parsedQuote = _response.result; //JSON.parse(_response.blob.replace(/\'/g, '\"'));
								} catch (_error) {
									console.error("[analytics] - save() - remote error: " + JSON.stringify(_error, null, '\t'));
								}

								doLog && console.debug('[analytics] - save() - remote success: ' + JSON.stringify(_parsedQuote));
							},

							failCallback: function (_response) {
								analytics.remoteSaveTimeout = null;
							}
						});

					}, 3000));
				}

				return _result;
			},

			/**
			 * @method fetch
			 * Attempts to get the quotes locally, and remote
			 * @param {Object} _options Details used to get the quotes 
			 * @param {Number} _options.id Option id
			 * @return {Models.quote}
			 */
			fetch: function (_options) {
				doLog && console.log('[analytics] - fetch()');
				var webservices = require('/utils/webservices');
				var analytics = this;
				var _id = _options.id || analytics.id;

				if (_id) {
					webservices.fetchEvent({
						quoteID: _id,
						successCallback: function (_response) {
							try {
								_quoteData = _response.result; //JSON.parse(_response.blob.replace(/\'/g, '\"'));

								analytics.save(_quoteData, {
									localOnly: true
								});

							} catch (_error) {
								console.error("[analytics] - fetch() - remote error: " + JSON.stringify(_error, null, '\t'));
							}
						},
						failCallback: function (_response) {
							console.error("[analytics] - fetch() - remote error: " + JSON.stringify(_response, null, '\t'));
						}
					});
				}

				return Backbone.Model.prototype.fetch.call(this, _options);

			}
		});

		return Model;
	},
	/**
	 * @class Collections.analytics
	 * Special model for tracking specific telemetry from users
	 */
	extendCollection: function (Collection) {
		_.extend(Collection.prototype, {

		});

		return Collection;
	}
};
