/**
 * @class Utils.EntityRatings
 * Handles entity ratings: fetch.
 * @class Lib.EntityRatings
 * @singleton
 * @uses Utils.webservices
 */
var doLog = Alloy.Globals.doLog;
const LOG_TAG = '\x1b[31m' + '[lib/entityRatings]' + '\x1b[39;49m ';
var webservices = require('/utils/webservices');
var parser = require('/helpers/parser');

var entityRatings = (function () {

	/**
	 * @method fetchEntityRatings
	 * Attempts to retrieve an updated list of entity ratings.
	 * @param {Object} _params Parameters for fetching
	 * @param {Function} _params.successCallback Callback function to be called if there was 
	 * an update for the entity ratings
	 * @param {Function} _params.failureCallback Callback Function to be called when no new 
	 * entity ratings have been updated or if there was an error calling the WS
	 * @return {void}
	 */
	function fetchEntityRatings(_params) {
		doLog && console.log(LOG_TAG, '- fetchEntityRatings()');

		_params = _params || {};
		var successCallback = _params.successCallback;
		var failureCallback = _params.failureCallback;
		webservices.fetchEntityRatings({
			successCallback: function (_response) {
				_response = _response || {};
				doLog && console.log(LOG_TAG, '- fetchEntityRatings() - success');
				var entityRatingsCollection = Alloy.createCollection('entityRatings');
				var ratingsData = _response.result || [];

				entityRatingsCollection
					.wipe()
					.add(_.map(ratingsData, function (_newEntityRating) {
						return {
							entityId: _newEntityRating.id,
							rxId: _newEntityRating.entity_rxid,
							entityName: _newEntityRating.entity_name,
							entityParent: _newEntityRating.entity_parent,
							ltRating: _newEntityRating.lt_rating,
							stRating: _newEntityRating.st_rating,
							lastUpdate: _newEntityRating.last_update
						};
					}))
					.save();

				successCallback && successCallback({
					response: _response,
					entityRatingsCollection: entityRatingsCollection
				});
			},
			failCallback: function (_response) {
				failureCallback && failureCallback();
			}
		});
	}

	/**
	 * @method searchEntityRatings
	 * Search entities by name
	 * @param {String} _search Entity name to search
	 * @param {Number} [_page=0] Page to load from the search
	 * @return {void}
	 */
	function searchEntityRatings(_search, _page) {
		doLog && console.log(LOG_TAG, '- searchEntityRatings');
		var entityRatings = [];
		var page = _page || 0;
		var length = 20;
		var start = page * length;

		if (_search != null && _search !== '') {
			var entityRatingsCollection = Alloy.createCollection('entityRatings');
			var search = _search.toLowerCase()
				.replace(/[\u2018\u2019]/g, "'")
				.replace(/[\u201C\u201D]/g, '"');
			entityRatingsCollection.fetch({
				local: true,
				query: {
					limit: [start, length],
					order: 'entityName ASC',
					where: {
						'lower(entityName) LIKE ? OR lower(entityParent) LIKE ?': ['%' + search + '%', '%' + search + '%']
						// 'ltRating like ?': '%' + search + '%'
					}
				}
			});

			entityRatings = entityRatingsCollection.map(function (_rating) {
				return {
					accountName: _rating.get('entityName'),
					parentName: _rating.get('entityParent'),
					rating: _rating.get('ltRating')
				};
			});
		}

		return entityRatings;
	}

	/**
	 * @method countSearchItems
	 * Returns the total number of items from the given search
	 * @param {String} _search Search string to look for
	 * @return {Number}
	 */
	function countSearchItems(_search) {
		doLog && console.log(LOG_TAG, '- countSearchItems');
		var result = 0;

		if (_search != null && _search !== '') {
			var entityRatingsCollection = Alloy.createCollection('entityRatings');
			var search = _search.toLowerCase();

			entityRatingsCollection.fetch({
				local: true,
				query: {
					select: 'count(*) as count',
					where: {
						'lower(entityName) LIKE ? OR lower(entityParent) LIKE ?': ['%' + search + '%', '%' + search + '%']
					}
				}
			});

			result = entityRatingsCollection.at(0).get('count');
		}

		return result;
	}

	/**
	 * @method getEntityRatingsCount
	 * Get the number of entities saved on disk
	 * @return {Number}
	 */
	function getEntityRatingsCount() {
		doLog && console.log(LOG_TAG, '- getEntityRatingsCount');
		var entityRatingsCollection = Alloy.createCollection('entityRatings');
		entityRatingsCollection.fetch({
			local: true,
			query: {
				limit: 1
			}
		});
		return entityRatingsCollection.length;
	}

	// Public API.
	return {
		fetchEntityRatings: fetchEntityRatings,
		searchEntityRatings: searchEntityRatings,
		getEntityRatingsCount: getEntityRatingsCount,
		countSearchItems: countSearchItems
	};
})();

module.exports = entityRatings;
