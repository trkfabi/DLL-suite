/**
 * @class Controllers.customer.equipmentUsageRow
 * Equipment usage row
 * @uses appNavigation
 * @deprecated
 */
var args = arguments[0] || {};
var appNavigation = require('/appNavigation');

var usage = args.usage;

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	$.equipmentUseField.value = usage.get('description') || '';
	$.equipmentPercent.value = usage.get('percentage') || '';
};

/**
 * @method showUseList
 * @private
 * Handle the click event of the useSelector control
 * @param {Object} _evt Click event
 * @return {void}
 */
function showUseList(_evt) {
	var params = {
		options: [{
			title: '',
			value: ''
		}, {
			title: L("farm"),
			value: 'Farm'
		}, {
			title: L("personal"),
			value: 'Personal'
		}, {
			title: L("construction"),
			value: 'Construction'
		}, {
			title: L("commercial_custom"),
			value: 'Commercial/Custom'
		}],
		callback: function (option) {
			$.equipmentUseField.value = option.title;

			usage.set({
				'description': option.value
			});

			args.updateCallback && args.updateCallback({
				source: $,
				usage: usage
			});
		}
	};
	appNavigation.openPickerWindow(params);
};

/**
 * @method showPercentList
 * @private
 * Handle the click event fo the percentSelector control
 * @param {Object} _evt Click event
 * @return {void}
 */
function showPercentList(_evt) {
	var _usages = usage.collection;
	var _totalUsage = 0;
	var _myUsage = Number(usage.get('percentage'));
	var _maxValue = 100;
	var _pickerOptions = [];

	_usages.each(function (_usage) {
		_totalUsage += Number(_usage.get('percentage'));
	});

	_maxValue = 100 - _totalUsage + _myUsage;

	for (var i = 0; i <= _maxValue; i += 25) {
		_pickerOptions.push({
			title: '' + i,
			value: i
		});
	}
	var params = {
		options: _pickerOptions,
		callback: function (option) {
			$.equipmentPercent.value = option.title;

			usage.set({
				'percentage': option.value
			});

			args.updateCallback && args.updateCallback({
				source: $,
				usage: usage
			});
		}
	};

	appNavigation.openPickerWindow(params);
};

/**
 * @method cleanUp
 * @return {void}
 */
$.cleanUp = function () {

};

/**
 * @method finalize
 * Deleting callback
 * @return {void}
 */
$.finalize = function () {
	args.deleteCallback && args.deleteCallback({
		controller: $,
		removeModel: true,
		model: usage,
		index: args.index
	});

	usage.cleanUp();
	usage = null;
};

$.useSelector.addEventListener('click', showUseList);
$.percentSelector.addEventListener('click', showPercentList);

init();
