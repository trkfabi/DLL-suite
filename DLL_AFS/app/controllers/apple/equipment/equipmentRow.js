/**
 * @class Controllers.apple.equipment.equipmentRow
 * Equipment Row
 * @uses appNavigation
 * @uses Helpers.stringFormatter
 * @uses Calculations.Apple.calculatorManager
 * @uses Helpers.parser
 * @uses Helpers.uiHelpers
 * @uses Apple.rateCards
 */
const LOG_TAG = '\x1b[31m' + '[apple/controllers/equipment/equipmentRow]' + '\x1b[39;49m ';

var args = arguments[0] || {};
var doLog = Alloy.Globals.doLog;
var appNavigation = require('/appNavigation');
var stringFormatter = require('/helpers/stringFormatter');
var calculatorManager = require('/apple/calculations/calculatorManager');
var parser = require('/helpers/parser');
var uiHelpers = require('/helpers/uiHelpers');
var rateCards = require('/apple/rateCards');

/**
 * @property {Models.quote} quote
 * @private
 * Quote containing the equipment model
 */
var quote = args.quote;

/**
 * @property {Models.equipment} equipment
 * @private
 * Equipment model with the info to show and save in the UI
 */
var equipment = args.equipment;

/**
 * @property {Object} productList
 * @private
 * The list of products used by the picker on the row
 */
var productList;

/**
 * @property {Function} updateCallback
 * @private
 * Function executed after the row changes
 */
var updateCallback = args.updateCallback;

/**
 * @property {String} descriptionLastValue
 * @private
 * Last value on description field
 */
var descriptionLastValue;

/**
 * @property {Boolean} hasFocus
 * @private
 * If description field has focus or not.
 */
var hasFocus = false;

/**
 * @property {Controlelrs.apple.equipment.itadView} itadView controller to the ITAD view loaded within the row (if any)
 */
var itadView = null;

/**
 * @method init
 * @private
 * Initializes the controller
 * return {void}
 */
function init() {
	doLog && console.log(LOG_TAG, '- init');

	uiHelpers.addNextButton($.quantityField, $.priceField);
	uiHelpers.initNumberFormatHandler($.quantityField, '#,###', null, false);

	uiHelpers.addDoneButton($.priceField, $.blurFields);
	uiHelpers.initNumberFormatHandler($.priceField, '#,##0.00', null, false);

	equipment.on('change', $.refreshUI);

	$.equipmentRow.equipmentId = equipment.id;

	refreshItadView();
	$.refreshUI();
};

/**
 * @method updateProductList
 * @private
 * Initializes the list of products
 * @return {void}
 */
function updateProductList() {
	var categories = rateCards.getAllCategories();
	var products = rateCards.getAllProducts();
	productList = {
		sections: []
	};

	products = products.map(function (_product) {
		return _product;
	});
	categories = categories.map(function (_category) {
		return _category;
	});
	_.each(categories, function (_category, _index) {
		var categoryProducts = products.filter(function (_product, _index) {
			return _product.get('categoryId') === _category.get('id');
		});
		_.each(categoryProducts, function (_product, _index) {
			var productSection = _product.get('section');
			var productId = _product.get('id');
			var productName = _product.get('name');
			var section = _.findWhere(productList.sections, {
				name: productSection
			});

			if (!section) {
				section = {
					name: productSection,
					options: []
				};
				productList.sections.push(section);
			}

			section.options.push({
				id: productId,
				name: productName
			});

		});

	});

}

/**
 * @method refreshItadView
 * @private
 * Refreshes the ITAD UI based on the selected product
 * @return {void}
 */
function refreshItadView() {
	doLog && console.log(LOG_TAG, '- refreshItadView');

	var product = rateCards.getProduct(equipment.get('productName'));

	if (product && product.get('hasItad')) {
		if (!itadView) {
			itadView = Alloy.createController('apple/equipment/itadView', {
				onChange: handleItadViewChange
			});

			$.equipmentView.add(itadView.getView());
		}

		itadView.setEnabled(equipment.hasItad());
	} else {
		if (itadView) {
			$.equipmentView.remove(itadView.getView());
			itadView = null;
		}
	}
}

/**
 * @method updateProduct
 * @private
 * Updates this equipment's own product info, showing or hiding the ITAD view and recalculating the price
 * @param {String} _productName id of product to update
 * @return {void}
 */
function updateProduct(_productName) {
	doLog && console.log(LOG_TAG, '- updateProduct name: ' + _productName);

	var product = rateCards.getProduct(_productName);

	if (!product) {
		doLog && console.warn(LOG_TAG, '- updateProduct - product not found: ' + _productName);
		return false;
	}

	calculatorManager.handleQuoteChange({
		quote: quote,
		equipment: equipment,
		productId: product.id,
		productName: product.get('name'),
		productRateFactorMatchId: product.get('rateFactorMatchId'),
		type: Alloy.Globals.rateType.itad
	});

	refreshItadView();
}

/**
 * @method selectProduct
 * Forces a click on the product
 * @param {Function} [_doneCallback] Function called after a product is selected from the list
 * @return {void}
 */
$.selectProduct = function (_doneCallback) {
	updateProductList();

	appNavigation.openOptionsWindow({
		options: productList,
		doneCallback: function (_data) {
			_data = _data || {};
			var option = _data.option;

			if (option) {
				updateProduct(option.name);
			}

			_doneCallback && _doneCallback(option);
		}
	});
};

/**
 * @method refreshUI
 * Updates the window UI
 * @return {void}
 */
$.refreshUI = function () {
	if (equipment.get('productName')) {
		$.productLabel.text = equipment.get('productName');
		$.productLabel.color = Alloy.Globals.colors.black;
	} else {
		$.productLabel.text = $.productLabel.hintText;
		$.productLabel.color = $.productLabel.hintTextColor;
	}
	if (equipment.get('description') !== descriptionLastValue) {
		descriptionLastValue = equipment.get('description');
		$.descriptionField.setValue(equipment.get('description') || '');
	}
	$.quantityField.value = stringFormatter.formatDecimal(equipment.get('quantity'), '', '#,###');
	$.priceField.value = stringFormatter.formatDecimal(equipment.get('unitPrice'), '', '##,###,##0.00');
	$.extendedPriceValueLabel.text = stringFormatter.formatDecimal(equipment.get('extendedPrice'), '0.00', '#,##0.00');
	if (quote && quote.isSubmitted()) {
		$.disableAllControls();
	}

};

/**
 * @method checkAmountLength
 * Reduces Font size when price value is extremely large
 * @return {void}
 */
$.checkAmountLength = function (_isEditing) {
	var amountLong = $.extendedPriceValueLabel.text.length > 13;
	if (amountLong && _isEditing) {
		$.extendedPriceValueLabel.font = {
			fontFamily: Alloy.Globals.fonts.primary.bold,
			fontSize: 13
		};
	} else {
		$.extendedPriceValueLabel.font = {
			fontFamily: Alloy.Globals.fonts.primary.bold,
			fontSize: 15
		};
	}
};

/**
 * @method disableAllControls
 * Disables all fields
 * @return {void}
 */
$.disableAllControls = function () {
	uiHelpers.setElementEnabled($.productLabel, false);
	uiHelpers.setElementEnabled($.descriptionField.getView(), false);
	uiHelpers.setElementEnabled($.quantityField, false);
	uiHelpers.setElementEnabled($.priceField, false);
	uiHelpers.setElementEnabled($.extendedPriceValueLabel, false);
	itadView && itadView.disableAllControls();
	$.productRow.touchEnabled = false;
};

/**
 * @method enableAllControls
 * Enables all fields
 * @return {void}
 */
$.enableAllControls = function () {
	uiHelpers.setElementEnabled($.productLabel, true);
	uiHelpers.setElementEnabled($.descriptionField.getView(), true);
	uiHelpers.setElementEnabled($.quantityField, true);
	uiHelpers.setElementEnabled($.priceField, true);
	uiHelpers.setElementEnabled($.extendedPriceValueLabel, true);
	itadView && itadView.enableAllControls();
	$.productRow.touchEnabled = true;
};

/**
 * @method blurFields
 * Executes the event blur for insuranceFactorField
 * @return {void}
 */
$.blurFields = function () {
	$.descriptionField.blur();
	$.quantityField.blur();
	$.priceField.blur();
};

/**
 * @method checkProductMaxAmounts
 * @private
 * Check top amount depending of item selected 
 * @param {String} _value Amount to check
 * @param {Number} _maxAmount Max amount to top if any product
 * @param {Number} _maxAmountOther Max amount to top if other product
 * @return {Number} fixed amount
 */
function checkProductMaxAmounts(_value, _maxAmount, _maxAmountOther) {
	doLog && console.log(LOG_TAG, '- checkProductMaxAmounts');
	_value = parser.parseToNumber(_value);
	var topAmount = _maxAmount;
	var equipmentSelected = equipment.get('productName') || '';

	if (equipmentSelected === 'Other Product/Service') {
		topAmount = _maxAmountOther;
	}

	if (_value > topAmount) {
		_value = topAmount;
	}
	return _value;
}

/**
 * @method productSelectionCallback
 * @private
 * Callback for the product selection
 * @param {Object} _data
 * @return {void}
 */
function handleProductsWindowDone(_data) {
	_data = _data || {};
	var option = _data.option;

	if (option) {
		calculatorManager.handleQuoteChange({
			quote: quote,
			equipment: equipment,
			productId: option.id,
			productName: option.name
		});
	}
};

/**
 * @method handleProductRowClick
 * @private
 * Handles the product field click
 * @param {Object} _evt
 * @return {void}
 */
function handleProductRowClick(_evt) {
	$.selectProduct();
};

/**
 * @method handleFieldChange
 * @private
 * Handler for both text fields after some value need to update the calculations
 * @param {Object} _evt
 * @return {void}
 */
function handleFieldChange(_evt) {
	var key = _evt.source.tag;
	var value = _evt.source.value;
	var params = {
		quote: quote,
		equipment: equipment
	};
	if (key === 'description') {
		hasFocus = false;
		if ($.descriptionField.getValue() !== '') {
			equipment.set({
				description: $.descriptionField.getValue()
			}).save();
		}
	} else {
		if (key === 'quantity') {
			value = parser.parseToNumber(value, 0);
		} else {
			value = parser.parseToNumber(value);
		}
		params[key] = value;
		calculatorManager.handleQuoteChange(params);
	}
};

/**
 * @method handleFieldFocus
 * @private
 * Handler for description field focus
 * @param {Object} _evt
 * @return {void}
 */
function handleFieldFocus(_evt) {
	//_evt.source.scrollable = true;
	hasFocus = true;
}

/**
 * @method handleDescriptionPostLayout
 * @private
 * Handler for description textare height change. This is to simulate number of lines restriction
 * @param {Object} _evt
 * @return {void}
 */
function handleDescriptionPostLayout(_evt) {
	if (_evt.source.rect.height < 44) {
		// If there's only 1 line, remove length restriction
		_evt.source.maxLength = null;
		_evt.source.scrollable = true;
		_evt.source.bottom = 0;
	} else if (_evt.source.rect.height >= 54) {
		// If there's 3 lines, set the restriction
		_evt.source.value = _evt.source.value.substr(0, _evt.source.value.length - 1);
		_evt.source.maxLength = _evt.source.value.length;
		_evt.source.scrollable = false;
		_evt.source.bottom = 0;
	} else {
		// 2 lines
		if (hasFocus) {
			if (_evt.source.maxLength === -1) {
				_evt.source.bottom = -7;
			} else {
				_evt.source.bottom = 0;
			}
			_evt.source.scrollable = true;
		} else {
			_evt.source.scrollable = false;
			_evt.source.bottom = 0;
		}
	}
}

/**
 * @method handleItadViewChange
 * @private
 * Handler for the change event on the swithc in an ITAD view
 * @param {Object} _evt Change event
 * @return {void}
 */
function handleItadViewChange(_evt) {
	doLog && console.log(LOG_TAG, '- handleItadViewChange');

	var value = _evt.value;
	var type = null;

	if (value) {
		type = Alloy.Globals.rateType.itad;
	}

	calculatorManager.handleQuoteChange({
		quote: quote,
		equipment: equipment,
		type: type
	});
}

$.productRow.addEventListener('click', handleProductRowClick);
$.descriptionField.addEventListener('blur', handleFieldChange);
$.descriptionField.addEventListener('focus', handleFieldFocus);
$.descriptionField.addEventListener('postlayout', handleDescriptionPostLayout);
$.quantityField.addEventListener('blur', handleFieldChange);
$.priceField.addEventListener('blur', handleFieldChange);
init();
