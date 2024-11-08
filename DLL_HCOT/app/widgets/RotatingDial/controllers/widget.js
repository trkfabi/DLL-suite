var TiDragHandler = require(WPATH('TiDragHandler'));
var args = arguments[0] || {};

args.container && args.container.add($.container);

var images = {
	container: $.container.toImage(),
	circularDial: $.circularDial.toImage(),
	centerTarget: $.centerTarget.toImage(),
	touchPoint: $.touchPoint.toImage()
};

var densityFactor = OS_ANDROID ? Alloy.Globals.logicalDensityFactor : 1;

var clockwiseCallback = args.clockwiseCallback;
var counterClockwiseCallback = args.counterClockwiseCallback;
var touchstartCallback = args.touchstartCallback;
var touchendCallback = args.touchendCallback;
var centerTapCallback = args.centerTapCallback;

var debugUsingTouchpoint = false;


var prevPosition = { x: 0, y: 0 };
var touchPointLocation = { left: 0, right: 0 };
var isTouchPointShowing = false;
var isTouchPointHilited = false;
var dialRadius;
var dialCenter;
var touchPointMidway;
var previousAngle;
var sizes;

var internalThreshold;
var externalThreshold;


/**
 * Reset the dial by rotating it to 0 degrees. No callbacks will be fired.
 */
exports.resetDial = function () {
	if (previousAngle !== 0) {
		var angleInfo = { radians: 0, degrees: 0 };
		var x = Math.cos(angleInfo.radians) * dialRadius + dialCenter.x;
		var y = Math.sin(angleInfo.radians) * dialRadius + dialCenter.y;
		touchPointLocation.left = x - touchPointMidway.left;
		touchPointLocation.top = y - touchPointMidway.top;
		previousAngle = angleInfo.degrees;
		$.circularDial.animate({
			transform: Ti.UI.createMatrix2D().rotate(angleInfo.degrees),
			duration: 250
		});
	}
	resetTouchPoint();
};
exports.enable = function () {
	dragHandler.enable();
};

exports.disable = function () {
	dragHandler.disable();
};

exports.init = function () {
	$.centerTarget.addEventListener('singletap', handleCenterTap);

	sizes = {
		container: {
			width: images.container.width / densityFactor,
			height: images.container.height / densityFactor
		},
		circularDial: {
			width: images.circularDial.width / densityFactor,
			height: images.circularDial.height / densityFactor
		},
		centerTarget: {
			width: images.centerTarget.width / densityFactor,
			height: images.centerTarget.height / densityFactor
		},
		touchPoint: {
			width: images.touchPoint.width / densityFactor,
			height: images.touchPoint.height / densityFactor
		}
	};

	images = null;

	$.container.top = (args.top >= 0) ? args.top : null;
	$.container.borderRadius = sizes.container.width / 2;
	$.touchPoint.borderRadius = sizes.touchPoint.width / 2;

	$.container.borderWidth = 2;

	dialRadius = sizes.circularDial.width / 2 - 25;
	dialCenter = { x: sizes.container.width / 2, y: sizes.container.height / 2 };
	touchPointMidway = { left: sizes.touchPoint.width / 2, top: sizes.touchPoint.height / 2 };

	// Define the thresholds where the dragHandler shuts off.
	internalThreshold = dialRadius / 5;
	externalThreshold = 6 * dialRadius;


	showDialUntouched();
	exports.resetDial();
	$.container.visible = true;
};
function showTouchPoint() {
	if (!isTouchPointShowing) {
		$.touchPoint.borderColor = '#f00';
		isTouchPointShowing = true;
	}
};
function hideTouchPoint() {
	if (isTouchPointShowing) {
		$.touchPoint.borderColor = Alloy.Globals.colors.transparent;
		isTouchPointShowing = false;
	}
};
function resetTouchPoint() {
	$.touchPoint.top = touchPointLocation.top;
	$.touchPoint.left = touchPointLocation.left;
};

function touchAnimationDone() {
	$.circularDial.animate({ duration: 50, opacity: 0 });
};
function showDialTouched() {
	$.circularDial.backgroundImage = $.circularDial.backgroundImagePressed;
};
function showDialUntouched() {
	$.circularDial.backgroundImage = $.circularDial.backgroundImageNormal;
};

function knobTouchstartCallback(data) {
	debugUsingTouchpoint && showTouchPoint();
	showDialTouched();
	touchstartCallback && touchstartCallback();
};

function knobTouchendCallback(data) {
	debugUsingTouchpoint && hideTouchPoint();
	if (data) {
		prevPosition.x = data.source.left;
		prevPosition.y = data.source.top;
	}
	$.touchPoint.left = prevPosition.x;
	$.touchPoint.top = prevPosition.y;
	resetTouchPoint();
	dragHandler.enable();
	showDialUntouched();
	touchendCallback && touchendCallback();
};
/**
 * Update the dial to the given angle and fire the callback.
 */
function updateDial(angleInfo) {
	$.circularDial.transform = Ti.UI.createMatrix2D().rotate(angleInfo.degrees);


	// _.defer(function () {
	var x = Math.cos(angleInfo.radians) * dialRadius + dialCenter.x;
	var y = Math.sin(angleInfo.radians) * dialRadius + dialCenter.y;
	touchPointLocation.left = x - touchPointMidway.left;
	touchPointLocation.top = y - touchPointMidway.top;
	var angleDelta = previousAngle - angleInfo.degrees;
	previousAngle = angleInfo.degrees;

	$.touchPoint.top = touchPointLocation.top;
	$.touchPoint.left = touchPointLocation.left;

	if (Math.abs(angleDelta) < 250) {
		if (angleDelta > 0) {
			_.defer(function () {
				counterClockwiseCallback && counterClockwiseCallback({ angleDelta: angleDelta });
			});
		} else {
			_.defer(function () {
				clockwiseCallback && clockwiseCallback({ angleDelta: angleDelta });
			})
		}
	}
	// });
};

function handleDrag(data) {
	var dx = data.source.left + sizes.touchPoint.width / 2 - dialCenter.x;
	var dy = data.source.top + sizes.touchPoint.height / 2 - dialCenter.y;
	var angleRad = Math.atan2(dy, dx);
	var angleDeg = angleRad * 180 / Math.PI;
	updateDial({ radians: angleRad, degrees: angleDeg });

	// When the touchPoint gets too far away from the knob, disable it to avoid exaggerated UI motion.
	var lineLength = Math.sqrt(dx * dx + dy * dy);
	if ((lineLength < internalThreshold) || (lineLength > externalThreshold)) {
		dragHandler.disable();
		hideTouchPoint();
	}
};

var dragHandler = new TiDragHandler({
	draggableView: $.touchPoint,
	rootView: $.container,
	touchstartCallback: knobTouchstartCallback,
	touchendCallback: knobTouchendCallback,
	dragCallback: handleDrag,
	reactFreq: 3
});

function handleCenterTap() {
	centerTapCallback && centerTapCallback();
};