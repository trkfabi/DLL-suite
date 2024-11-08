/**
 * @class Controllers.customer.customerSearchRow
 * Customer search row
 */
var args = arguments[0] || {};

$.isSelected = false;
$.data = args.data || {};

/**
 * @property {Object} address holds address information
 */
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
	$.isSelected = (_isSelected != null ? _isSelected : !$.isSelected);
	$.selectMark.visible = $.isSelected;
	$.leftSelectMark.visible = $.isSelected;
	args.selectionCallback && args.selectionCallback({
		controller: $,
		isSelected: $.isSelected
	});
};

$.container.addEventListener('click', function (_evt) {
	$.selectRow(true);
});
