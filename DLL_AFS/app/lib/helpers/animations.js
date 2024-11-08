/**
 * @class Helpers.animations
 * Module that allows to do quick animations
 * @version 1.1
 * @singleton
 */
var doLog = Alloy.Globals.doLog;
var moment = require('alloy/moment');
const LOG_TAG = '\x1b[36m' + '[helpers/animations]' + '\x1b[39;49m ';

var animations = (function () {

	/**
	 * @method puffIn
	 * Creates a puff in animation in given TiObject
	 * @param {Ti.UI.View} _tiObject View to animate
	 * @param {Object} [_params] Options for the animation
	 * @param {Number} [_params.scale=1.1] Scale to start the animation with
	 * @param {Number} [_params.duration=250] Duration of the whole animation in ms
	 * @param {Number} [_params.fade=1.0] Final opacity of the View to animate
	 * @param {Number} [_params.defaultScale=1.0] Final scale of the view after animation
	 * @param {Function} [_params.callback] Function called once the animation is completed
	 * @return {void}
	 */
	function puffIn(_tiObject, _params) {
		doLog && console.log(LOG_TAG, '- puffIn');
		var isAnimationComplete = false;
		_params = (_params) ? _params : {};
		var scale = (_params.scale) ? _params.scale : 1.1;
		var puffIn = Ti.UI.createMatrix2D().scale(scale);
		var animation = Ti.UI.createAnimation();
		var animationCompleteTimeout = null;
		var completeAnimationCompleteTimeout = null;
		var animationDuration;

		_tiObject.opacity = 0;

		animation.transform = puffIn;
		animation.duration = (_params.duration) ? _params.duration : 250;
		animation.opacity = _params.fade || 1.0;
		_tiObject.animate(animation);

		animation.addEventListener('complete', handleAnimationComplete);
		animationDuration = animation.duration + 100;
		animationCompleteTimeout = setTimeout(handleAnimationComplete, animationDuration);

		//starts animation in the ui elements
		function handleAnimationComplete(_evt) {
			animationCompleteTimeout && clearTimeout(animationCompleteTimeout);
			var scaleNormal = Ti.UI.createMatrix2D().scale(_params.defaultScale || 1.0);
			var completeAnimation = Ti.UI.createAnimation();
			completeAnimation.transform = scaleNormal;
			completeAnimation.duration = (_params.duration) ? _params.duration : 250;
			_tiObject.animate(completeAnimation);
			completeAnimation.addEventListener('complete', handleCompleteAnimationComplete);
			animationDuration = completeAnimation.duration + 100;
			completeAnimationCompleteTimeout = setTimeout(handleCompleteAnimationComplete, animationDuration);
			animationCompleteTimeout = null;
		}

		//finishes animation in the ui elements
		function handleCompleteAnimationComplete(_evt) {
			completeAnimationCompleteTimeout && clearTimeout(completeAnimationCompleteTimeout);
			_params.callback && _params.callback();

			completeAnimationCompleteTimeout = null;
		}

	}

	/**
	 * @method puffOut
	 * Creates a puff out animation in given TiObject
	 * @param {Ti.UI.View} _tiObject View to animate
	 * @param {Object} [_params] Options for the animation
	 * @param {Number} [_params.scale=1.03] Scale to start the animation with
	 * @param {Number} [_params.duration=200] Duration of the whole animation in ms
	 * @param {Number} [_params.fade=1.0] Final opacity of the View to animate
	 * @param {Number} [_params.defaultScale=0.9] Final scale of the view after animation
	 * @param {Function} [_params.callback] Function called once the animation is completed
	 * @return {void}
	 */
	function puffOut(_tiObject, _params) {
		doLog && console.log(LOG_TAG, '- puffOut');
		_params = (_params) ? _params : {};
		var scale = (_params.scale) ? _params.scale : 1.03,
			puffOut = Ti.UI.createMatrix2D().scale(scale),
			animation = Ti.UI.createAnimation();

		animation.transform = puffOut;
		animation.duration = (_params.duration) ? _params.duration : 200;
		animation.opacity = _params.fade || 1.0;
		_tiObject.animate(animation);
		animation.addEventListener('complete', function () {
			var scaleNormal = Ti.UI.createMatrix2D().scale(_params.defaultScale || 0.9);
			var completeAnimation = Ti.UI.createAnimation();
			completeAnimation.transform = scaleNormal;
			completeAnimation.opacity = 0;
			completeAnimation.duration = (_params.duration) ? _params.duration : 200;
			_tiObject.animate(completeAnimation);
			completeAnimation.addEventListener('complete', function () {
				_params.callback && _params.callback();
			});
		});
	}

	/**
	 * @method fadeIn
	 * Creates a fade in animation in given TiObject
	 * @param {Ti.UI.View} _tiObject View to animate
	 * @param {Object} [_params] Options for the animation
	 * @param {Number} [_params.duration=250] Duration of the whole animation in ms
	 * @param {Number} [_params.fade=1.0] Final opacity of the View to animate
	 * @param {Function} [_params.callback] Function called once the animation is completed
	 * @return {void}
	 */
	function fadeIn(_tiObject, _params) {
		doLog && console.log(LOG_TAG, '- fadeIn');
		_params = (_params) ? _params : {};
		var animation = Ti.UI.createAnimation();

		_tiObject.opacity = 0;

		animation.duration = (_params.duration) ? _params.duration : 250;
		animation.opacity = _params.fade || 1.0;
		_tiObject.animate(animation);

		if (_params.callback) {
			animation.addEventListener('complete', _params.callback);
		}
	}

	/**
	 * @method fadeOut
	 * Creates animation fade out animation in given TiObject
	 * @param {Ti.UI.View} _tiObject View to animate
	 * @param {Object} [_params] Options for the animation
	 * @param {Number} [_params.duration=250] Duration of the whole animation in ms
	 * @param {Number} [_params.fade=1.0] Final opacity of the View to animate
	 * @param {Function} [_params.callback] Function called once the animation is completed
	 * @return {void}
	 */
	function fadeOut(_tiObject, _params) {
		doLog && console.log(LOG_TAG, '- fadeOut');
		_params = (_params) ? _params : {};
		var animation = Ti.UI.createAnimation();

		animation.duration = (_params.duration) ? _params.duration : 250;
		animation.opacity = 0;
		_tiObject.animate(animation);

		if (_params.callback) {
			animation.addEventListener('complete', _params.callback);
		}
	}

	/**
	 * @method shake
	 * Creates a shake animation in given TiObject
	 * @param {Ti.UI.View} _tiObject View to animate
	 * @param {Object} [_params] Options for the animation
	 * @param {Number} [_params.duration=250] Duration of the whole animation in ms
	 * @param {Number} [_params.shakeTimes=3] Times to shake the view
	 * @param {Number} [_params.offset=5] points to move the view when shaking
	 * @return {void}
	 */
	function shake(_tiObject, _params) {
		doLog && console.log(LOG_TAG, '- shake');
		_params = _params || {};
		var count = (_params.shakeTimes) ? _params.shakeTimes : 3;
		var offset = _params.offset || 5;
		var duration = _params.duration || 75;
		var callback = _params.callback;
		var originalLeft = _tiObject.left;

		function shakeLeft() {
			if (count) {
				var leftAnimation = Ti.UI.createAnimation();
				leftAnimation.duration = duration;
				leftAnimation.left = originalLeft - offset;
				leftAnimation.addEventListener('complete', shakeRight);
				_tiObject.animate(leftAnimation);
				count--;
			} else {
				shakeComplete();
			}
		}

		function shakeRight() {
			var rightAnimation = Ti.UI.createAnimation();
			rightAnimation.duration = duration;
			rightAnimation.left = originalLeft + offset;
			rightAnimation.addEventListener('complete', shakeLeft);
			_tiObject.animate(rightAnimation);
		}

		function shakeComplete() {
			var completeAnimation = Ti.UI.createAnimation();
			completeAnimation.duration = duration;
			completeAnimation.left = originalLeft;
			callback && completeAnimation.addEventListener('complete', callback);
			_tiObject.animate(completeAnimation);
		}

		shakeLeft();
	}

	//Public API
	return {
		puffIn: puffIn,
		puffOut: puffOut,
		fadeIn: fadeIn,
		fadeOut: fadeOut,
		shake: shake
	};
})();

module.exports = animations;
