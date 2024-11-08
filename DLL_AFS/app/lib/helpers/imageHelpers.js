/**
 * Helper functions for transforming and obtaining extra data from an image blob
 * ##version 1.1.0
 * @class Helpers.imageHelpers
 * @singleton
 */
var doLog = Alloy.Globals.doLog;
var imageFactory = require('ti.imagefactory');

var imageHelpers = (function () {

	/**
	 * @method
	 * Resizes an image blob with the given options
	 * @param _params {Object}  Dictionary with options
	 * @param _params.blob {Ti.Blob} Image blob to reize
	 * @param [_params.width = 400] {Number}  Width to resize the image
	 * @param [_params.height = 400] {Number}  Height to resize the image
	 * @param [_params.quality = 1.0] {Number}  Quality to compress the image, from 0 (least quality) to 1.0 (highest quality)
	 * @return {Ti.Blob} Resized image blob (will be JPEG format if the quality is minor than 1.0)
	 */
	var resizeImage = function (_params) {
		_params = _params || {};
		var blob = _params.blob;
		var width = _params.width || 400;
		var height = _params.height || 400;
		var quality = _params.quality || 1.0;

		var _newImage = imageFactory.imageAsResized(blob, {
			width: width,
			height: height,
			quality: OS_IOS ? imageFactory.QUALITY_HIGH : 1.0
		});

		if (quality < 1.0) {
			return imageFactory.compress(_newImage, quality);
		} else {
			return _newImage;
		}

	};

	/**
	 * @method
	 * Returns some useful data for an image blob, including its thumbnail, a resized image and its base64 String
	 * @param {Object} _params 
	 * @return {Object} Dictionary with the image's data
	 */
	var obtainImageData = function (_params) {
		_params = _params || {};
		var resizedImage = resizeImage(_params);
		var _blob = _params.blob;

		return {
			image: resizedImage,
			thumbnail: _blob.imageAsThumbnail(80),
			base64String: Ti.Utils.base64encode(resizedImage).toString().replace(/\r\n/g, '')
		};
	};

	/**
	 * @method
	 * Resizes and saves the blob into a temporal file
	 * @return {Ti.Filesystem.File} Temporal File with the resized blob
	 */
	var resizeInTempFile = function (_params) {
		var _blob = resizeImage(_params);
		var _tempFile = Ti.Filesystem.createTempFile();

		_tempFile.write(_blob);

		return _tempFile;
	};

	return {
		resizeImage: resizeImage,
		obtainImageData: obtainImageData,
		resizeInTempFile: resizeInTempFile
	};
})();

module.exports = imageHelpers;
