/**
 * @class Controllers.paymentOption.paymentCategory
 * Payment category
 */
var args = arguments[0] || {};
var categoryData = args.categoryData || {};
var titleid = categoryData.titleid;

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	if (titleid) {
		$.categoryTitleLabel.text = L(titleid);
	} else {
		$.categoryHeader.visible = false;
	}
};

init();
