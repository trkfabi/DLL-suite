/**
 * -- TiDragHandler --
 * Provides the ability to provide robust draggable behavior to a View. Hooks are present to allow external users to
 * define application behavior when the draggable object has changed state.
 * 
 * NOTE: Using this module has the side effect of disabling every touch event of ANY and ALL child Views.
 * 
 * @param {Object} params
 *     - draggableView: The View having draggable behavior.
 *     - touchstartCallback: The CB fired when the draggable gets a touchstart event.
 *     - touchendCallback: The CB fired when the draggable gets a touchend or touchcancel event.
 *     - dragCallback: The CB fired when the draggable is moving.
 *     - reactFreq: React once out of this many touchmove events. (Can help with severe device-specific lag, but beware values >= 3)
 *     - boundaries: The edge limits of where the draggable may move. Values: minX, minY, maxX, maxY
 * 
 * @author Patrick Seda
 */

module.exports = function(params) {
	// +-------------------
	// | Private members.
	// +-------------------
	// console.log('[tiDragHandler] - params=' + JSON.stringify(params));
	var draggableView = params.draggableView;
	var rootView = params.rootView;
	var touchstartCallback = (typeof params.touchstartCallback === 'function') ? params.touchstartCallback : null;
	var touchendCallback = (typeof params.touchendCallback === 'function') ? params.touchendCallback : null;
	var dragCallback = (typeof params.dragCallback === 'function') ? params.dragCallback : null;
	var boundaries = params.boundaries || null;
	
	var maxReactFreq = 6;
	var reactFreq = 1;
	if (params.reactFreq > maxReactFreq) {
		reactFreq = maxReactFreq;
	} else {
		reactFreq = (params.reactFreq > 0) ? params.reactFreq : 1;
	}

	var reactSampleNum = 0;

	var disableChildren = function(view) {
		// console.log('[tiDragHandler] - disableChildren - view=' + JSON.stringify(view));
		if (view) {
			var children = view.children || [];
			for (var i = 0, len = children.length; i < len; i++) {
				disableChildren(children[i]);
				children[i].touchEnabled = false;
			}
		}
	}; 

	var isTouched = false;
	var position = {
		elementYStart : 0,
		elementXStart : 0,
		yStart : 0,
		xStart : 0,
		yCurrent : 0,
		xCurrent : 0
	}; 

	var source = null;
	var isActive = true;
	var isTouchendActive = true;
	var isIOS = (Ti.Platform.name === 'iPhone OS');
	
	// Whether to use (the deprecated) e.globalPoint or (the new) convertPointToView().
	var useEventGlobalPoint = false;

	var ignoringTouchmove = false;
	var acknowledgeTouchmove = function() {
		(reactSampleNum++ >= (reactFreq - 1)) && (reactSampleNum = 0);
		ignoringTouchmove = reactSampleNum !== 0;
		// console.log('[tiDragHandler] - acknowledgeTouchmove - reactSampleNum=' + reactSampleNum + ', ignoringTouchmove=' + ignoringTouchmove);
	};

	var touchHandler = function(e) {
		source = e.source;
		if (/*!isActive ||*/ (source !== draggableView)) {
			return;
		}
		var localPoint = {
			x : e.x,
			y : e.y
		};
		var convPoint = null;
		if (useEventGlobalPoint) {
			convPoint = e.globalPoint;
		} else {
			try {
				convPoint = e.source.convertPointToView(localPoint, rootView);
			} catch (ex) {
				console.error('[tiDragHandler] - ex=' + JSON.stringify(ex));
			}
		}
		
		if (isActive && e.type === 'touchstart') {
			if (!isTouched) {
				isTouched = true;
				
				if (useEventGlobalPoint) {
					var currentOrientation = isIOS ? Ti.UI.orientation : Ti.Gesture.orientation;
					switch (currentOrientation) {
						case Ti.UI.PORTRAIT:
						case Ti.UI.UPSIDE_PORTRAIT:
							position.elementYStart = source.top;
							position.elementXStart = source.left;
							break;
						case Ti.UI.LANDSCAPE_RIGHT:
						case Ti.UI.LANDSCAPE_LEFT:
							position.elementYStart = source.left;
							position.elementXStart = source.top;
							break;
					}
				} else {
					position.elementYStart = source.top;
					position.elementXStart = source.left;
				}

				position.yStart = parseInt(convPoint.y, 10);
				position.xStart = parseInt(convPoint.x, 10);

				touchstartCallback && touchstartCallback();
			}
		} else if (/*isActive &&*/ e.type === 'touchmove') { //NOTE: isActive desactivated to make sure the handler is still active even if the finger goes outside he view
			(reactFreq !== 1) && acknowledgeTouchmove();
			if (isTouched && !ignoringTouchmove) {
				position.yCurrent = parseInt(convPoint.y, 10);
				position.xCurrent = parseInt(convPoint.x, 10);

				var yDistance = position.yCurrent - position.yStart;
				var xDistance = position.xCurrent - position.xStart;
				
				var newTop;
				var newLeft;
				if (useEventGlobalPoint) {
					var currentOrientation = isIOS ? Ti.UI.orientation : Ti.Gesture.orientation;
					switch (currentOrientation) {
						case Ti.UI.PORTRAIT:
							source.top = position.elementYStart + yDistance;
							source.left = position.elementXStart + xDistance;
							break;
						case Ti.UI.UPSIDE_PORTRAIT:
							source.top = position.elementYStart - yDistance;
							source.left = position.elementXStart - xDistance;
							break;
						case Ti.UI.LANDSCAPE_RIGHT:
							source.left = position.elementYStart + yDistance;
							source.top = position.elementXStart - xDistance;
							break;
						case Ti.UI.LANDSCAPE_LEFT:
							source.left = position.elementYStart - yDistance;
							source.top = position.elementXStart + xDistance;
							break;
					}
					newTop = source.top;
					newLeft = source.left;
				} else {
					newTop = position.elementYStart + yDistance;
					newLeft = position.elementXStart + xDistance;
				}
				
				if (boundaries) {
					(newTop < boundaries.minY) && (newTop = boundaries.minY);
					(newTop > boundaries.maxY) && (newTop = boundaries.maxY);
					(newLeft < boundaries.minX) && (newLeft = boundaries.minX);
					(newLeft > boundaries.maxX) && (newLeft = boundaries.maxX);
				}
				source.top = newTop;
				source.left = newLeft;
				
				if (dragCallback) {
					var result = {
						source : source,
						position : {
							y : position.yCurrent,
							x : position.xCurrent
						}
					};
					dragCallback(result);
				}
			}
		} else if (e.type === 'touchend' || e.type === 'touchcancel') {
			if (touchendCallback && isTouchendActive) {
				var result = {
					source : source,
					position : {
						y : position.yCurrent,
						x : position.xCurrent
					}
				};
				touchendCallback(result);
			}

			isTouched = false;
			position = {
				elementYStart : 0,
				elementXStart : 0,
				yStart : 0,
				xStart : 0,
				yCurrent : 0,
				xCurrent : 0
			}; 
		} else {
			// Not a valid event.
		}
	};
	
	if (draggableView && rootView) {
		draggableView.addEventListener('touchstart',  touchHandler);
		draggableView.addEventListener('touchmove',   touchHandler);
		draggableView.addEventListener('touchend',    touchHandler);
		draggableView.addEventListener('touchcancel', touchHandler);
		
		// Disable touch events on children.
		disableChildren(draggableView);
	}
	

	// +-------------------
	// | Public members.
	// +-------------------
	var enable = function() {
		isActive = true;
		isTouchendActive = true;
	};
	var disable = function() {
		isActive = false;
	};
	var isEnabled = function() {
		return isActive === true;
	};
	var disableTouchendCallback = function() {
		isTouchendActive = false;
	};
	var destroy = function() {
		if (draggableView) {
			draggableView.removeEventListener('touchstart',  touchHandler);
			draggableView.removeEventListener('touchmove',   touchHandler);
			draggableView.removeEventListener('touchend',    touchHandler);
			draggableView.removeEventListener('touchcancel', touchHandler);
		}
		draggableView = null;
		rootView = null;
	};
	

	// Public API.
	return {
		enable : enable,
		disable : disable,
		isEnabled : isEnabled,
		disableTouchendCallback : disableTouchendCallback,
		destroy : destroy
	};
};
