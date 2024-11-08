/**
 * @class Apple.pdfHandler
 * Generates and creates apple pdf
 * @singleton
 * @uses Helpers.stringFormatter
 * @uses Libs.sessionManager
 */
var doLog = Alloy.Globals.doLog;
const LOG_TAG = '\x1b[35m' + '[apple/pdfHandler]' + '\x1b[39;49m ';

var stringFormatter = require('/helpers/stringFormatter');
var sessionManager = require('/utils/sessionManager');
var customizations = require('/customizations');

var ApplePdfHandler = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	/**
	 * @method formatPurchaseOption
	 * @private
	 * Formats purchase option to be displayed in the PDF
	 * @param {String} _purchaseOption holds string to evaluate
	 * @return {String}
	 */
	function formatPurchaseOption(_purchaseOption) {
		var purchaseOption;

		switch (_purchaseOption) {
		case 'F':
			purchaseOption = 'FMV';
			break;
		case 'D':
			purchaseOption = '$1';
			break;
		case 'P':
			purchaseOption = '';
			break;
		}

		return purchaseOption;
	};

	/**
	 * @method formatPaymentFrequency
	 * @private
	 * Formats payment frequency to be displayed in the PDF
	 * @param {String} _paymentFrequency  holds string to evaluate
	 * @return {String}
	 */
	function formatPaymentFrequency(_paymentFrequency) {
		var frequency;

		switch (_paymentFrequency) {
		case 'M':
			frequency = 'Monthly';
			break;
		case 'Q':
			frequency = 'Quarterly';
			break;
		case 'S':
		case 'SA':
			frequency = 'Semi-Annual';
			break;
		case 'A':
			frequency = 'Annual';
			break;
		default:
			frequency = '';
			break;
		}

		return frequency;
	};

	/**
	 * @method getPaybackPercentageValue
	 * @private
	 * @param {Model.Quote} _quote the quote
	 * Returns the payback percentage switch value
	 * @return {Boolean}
	 */
	function getPaybackPercentageValue(_quote) {
		var displayPaybackPercentage = _quote.get('displayPaybackPercentage');
		if (displayPaybackPercentage == null) {
			displayPaybackPercentage = true;
		}
		return displayPaybackPercentage;
	}

	// +-------------------
	// | Public members.
	// +-------------------
	var handlePDFCreation = function (_params) {
		_params = _params || {};

		doLog && console.log('[ApplePdfHandler] - handlePDFCreation()');

		var today = new moment();
		var quote = _params.quote;

		return [{
			today: today,
			quote: quote
		}];
	};

	var handlePDFGeneration = function (_params) {
		doLog && console.log('[ApplePdfHandler] - handlePDFGeneration()');

		_params = _params || {};
		var salesRep = sessionManager.getSalesRep();
		var recipient = _params.recipient;
		var quote = _params.quote;
		var today = _params.today;

		var result = {
			htmlFile: customizations.getFile('credit'),
			// htmlFile : Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'htmls/en-US/apple_quote.html'),
			shouldGenerateWithWebView: false
		};

		var customer = quote.get('customer');
		var equipments = quote.get('equipments');
		var paymentOptions = quote.get('paymentOptions');
		var amountFinanced = stringFormatter.formatCurrency(quote.get('amountFinanced'));
		var expirationDate = new moment(quote.get('expirationDate'));
		var displayPaybackPercentage = getPaybackPercentageValue(quote);

		var equipmentList = [];
		var paymentOptionsList = [];

		var lines = 0;
		var newPage = false;
		const linesPerPage = 25;

		if (recipient === 'share') {
			result.pdfFileName = _params.pdfFileName || 'Quote';
		}

		equipments.each(function (_equipment) {
			var topMargin = false;
			var quantity = stringFormatter.formatDecimal(_equipment.get('quantity'), '0', '#,###.##');

			if (_equipment.get('productName')) {
				lines++;
			}

			if (_equipment.get('description')) {
				lines++;
			}

			if (lines >= linesPerPage && !newPage) {
				topMargin = true;
				newPage = true;
				lines = 0;
			}

			equipmentList.push({
				productName: _equipment.get('productName') || '',
				description: _equipment.get('description') || '',
				quantity: quantity,
				unitPrice: stringFormatter.formatCurrency(_equipment.get('unitPrice')),
				extendedPrice: stringFormatter.formatCurrency(_equipment.get('extendedPrice')),
				topMargin: topMargin
			});

			if (_equipment.hasItad()) {
				topMargin = false;
				var itadRate = _equipment.getItadRate();

				lines++;

				if (lines >= linesPerPage && !newPage) {
					topMargin = true;
					newPage = true;
					lines = 0;
				}

				equipmentList.push({
					productName: itadRate.name,
					description: '',
					quantity: quantity,
					unitPrice: stringFormatter.formatCurrency(itadRate.unitPrice),
					extendedPrice: stringFormatter.formatCurrency(itadRate.extendedPrice),
					topMargin: topMargin
				});
			}
		}) || [];

		paymentOptionsList = paymentOptions.map(function (_paymentOption) {
			var paybackPercentage = _paymentOption.get('paybackPercentage') * 100;

			return {
				paymentAmount: stringFormatter.formatCurrency(_paymentOption.get('payment')),
				paybackPercentage: stringFormatter.formatPercentageAsInteger(paybackPercentage, 0),
				term: String.format('%s -%s %s (%s)', _paymentOption.get('term'), L('month'), formatPurchaseOption(
					_paymentOption.get('purchaseOptions')), formatPaymentFrequency(_paymentOption.get('paymentFrequency')))
			};
		});

		salesRepObj = {
			name: salesRep.get('name'),
			title: salesRep.get('title'),
			email: salesRep.get('email'),
			phone: salesRep.get('phone')
		};

		//Formats contact info accordinly with the information provided
		salesRepObj.contactInfo = stringFormatter.formatList([salesRepObj.phone, salesRepObj.email], ' | ');

		result.data = {
			//Logo
			logoImage: Alloy.Globals.logoImage,

			// survey date
			creationDate: today.format('MMMM DD, YYYY'),

			//customer data
			customerName: customer.get('name'),

			//Sales rep
			salesRep: salesRepObj,

			expirationDate: expirationDate.format('MMMM DD, YYYY'),

			displayPaybackPercentage: (displayPaybackPercentage == 1),

			// equipment data
			equipmentList: equipmentList,
			paymentOptionsList: paymentOptionsList,
			amountFinanced: amountFinanced,
		};

		doLog && console.log('[ApplePdfHandler] - handlePDFGeneration() - ' + JSON.stringify(result));

		return result;
	};

	return {
		handlePDFCreation: handlePDFCreation,
		handlePDFGeneration: handlePDFGeneration

	};
})();

module.exports = ApplePdfHandler;
