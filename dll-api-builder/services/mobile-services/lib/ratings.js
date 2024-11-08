var Arrow = require('@axway/api-builder-runtime');
var arrowdb = require('../lib/arrowdb');

/**
 * Calculates the whole leaderboard logic either for the API or Exports calls
 * @class Leaderboard
 * @singleton
 */
var Ratings = (function () {

	const LOG_TAG = '\x1b[35m' + '[ratings]' + '\x1b[39;49m ';

	/**
	 * @method getList
	 * @private
	 * Get the entities by latest update date
	 * @param {Object} _params Callback object
	 * @param {Object} [_params.callback.leaderboard] Action to call after searching
	 * @return {void}
	 */
	function getList(_params) {
		doLog && console.log(LOG_TAG, '- getList');
		_params = _params || {};

		var callback = _params.callback;
		// var RatingsModel = Arrow.Model.getModel('rating');

		arrowdb.queryPaginated('rating', null, function (_error, _response) {
			if (_error) {
				callback && callback({
					success: false,
					error: _error
				});
				return false;
			}

			callback && callback({
				success: true,
				response: _response.items
			});
		});
	}

	/**
	 * @method updateEntity
	 * @private
	 * Update an entity by it's entity id
	 * @param {Object} _params Entity object and callback function
	 * @param {Object} _params.entity Entity to update
	 * @param {String} _params.entity.entity_rxid Entity identificator
	 * @param {String} _params.entity.entity_name Entity name
	 * @param {String} _params.entity.entity_parent Entity parent name
	 * @param {String} _params.entity.st_rating Entity short term rating
	 * @param {String} _params.entity.lt_rating Entity long term rating
	 * @param {Function} _params.callback Action to call after updating
	 * @return {void}
	 */
	function updateEntity(_params) {
		doLog && console.log(LOG_TAG, '- updateEntity');
		_params = _params || {};
		var entity = _params.entity;
		var callback = _params.callback;
		var RatingsModel = Arrow.Model.getModel('rating');
		if (entity.entity_rxid) {
			RatingsModel.query({
				where: {
					'entity_rxid': entity.entity_rxid
				},
				limit: 1,
				order: 'entity_name, -last_update',
				response_json_depth: 2
			}, function (_error, _item) {
				if (_error) {
					callback && callback({
						success: false,
						error: _error
					});
					return false;
				}
				if (!_item) {
					callback && callback({
						success: false,
						error: 'Entity not found.'
					});
					return false;
				}

				var entityToUpdate = {
					id: _item.id,
					entity_rxid: _item.entity_rxid,
					entity_name: checkStringParameter(entity.entity_name, _item.entity_name),
					entity_parent: checkStringParameter(entity.entity_parent, _item.entity_parent),
					st_rating: checkStringParameter(entity.st_rating, _item.st_rating),
					lt_rating: checkStringParameter(entity.lt_rating, _item.lt_rating)
				};

				RatingsModel.update(entityToUpdate, function (_saveError, _result) {
					if (_saveError) {
						callback && callback({
							success: false,
							error: _saveError
						});
						return false;
					}

					callback && callback({
						success: true,
						response: _result
					});
				});

			});
		} else {
			callback && callback({
				success: false,
				error: 'Entity id missing.'
			});
			return false;
		}
	}

	/**
	 * @method checkStringParameter
	 * @private
	 * Check if the parameter is a valid string
	 * @param {String} _newValue String to check
	 * @param {String} _originalValue String to use if new is not valid
	 * @return {String}
	 */
	function checkStringParameter(_newValue, _originalValue) {
		if (_newValue && _newValue.trim() != '') {
			return _newValue.trim();
		}
		return _originalValue;
	}

	return {
		getList: getList,
		updateEntity: updateEntity
	};
})();

module.exports = Ratings;
