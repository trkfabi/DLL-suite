/**
 * @class Controllers.customer.customerSearchRow
 * Customer search row
 */
const LOG_TAG = '[controllers/customer/customerSearchRow] ';
var args = arguments[0] || {};

var doLog = Alloy.Globals.doLog;

$.isSelected = false;
$.data = args.data || {};

var address = $.data.Address ||  {};

$.customerLabel.text = $.data.DisplayName;
$.addressLabel.text = (address.Address1 || L("no_adress")) + ', ' +
	(address.City || L("no_city")) + ', ' +
	(address.StateProvince || L("no_state")) + ', ' +
	(address.ZipPostal || L("no_zip"));

/**
 * @method selectRow
 * Select row
 * @param {Boolean} _isSelected Used to know if the row is selected
 * @return {void}
 */
$.selectRow = function (_isSelected) {
	doLog && console.log(LOG_TAG, '- selectRow');
	$.isSelected = (_isSelected != null ? _isSelected : !$.isSelected);
	$.selectMark.visible = $.isSelected;
	$.leftSelectMark.visible = $.isSelected;
	args.selectionCallback && args.selectionCallback({
		controller: $,
		isSelected: $.isSelected
	});
};

$.container.addEventListener('click', function (evt) {
	$.selectRow(true);
});
