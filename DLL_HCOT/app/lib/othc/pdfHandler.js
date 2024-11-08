/**
 * @class Othc.pdfHandler
 * @singleton
 * Description
 */
var stringFormatter = require('/helpers/stringFormatter');
var parser = require('/helpers/parser');
var calculator = require('/calculations/calculator');
var customizations = require('/customizations');
var rateCards = require('/rateCards');
var sessionManager = require('/utils/sessionManager');

var OthcPdfHandler = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	// +-------------------
	// | Public members.
	// +-------------------

	var handlePDFCreation = function (_params) {
		_params = _params || {};

		doLog && console.log('[OthcPdfHandler] - handlePDFCreation()');

		var today = new moment();
		var recipient = _params.recipient;
		var quote = _params.quote;
		var type = _params.type;
		var paymentOptions = quote.get('paymentOptions');

		switch (recipient) {
		case 'proposal':
			return [{
				today: today,
				quote: quote
			}];
		case 'lease':
			return paymentOptions.map(function (_paymentOption) {
				return {
					today: today,
					quote: quote,
					paymentOption: _paymentOption
				};
			});
		default:
			return [{
				today: today,
				quote: quote,
				paymentOption: quote.getSelectedPaymentOption()
			}];
		}

	};

	function getPaymentFrequency(_paymentOption) {
		var frequency = 1;
		var freqNumber = '';
		switch (_paymentOption.get('paymentFrequency')) {
		case 'M':
			frequencyAbv = 'M';
			frequency = 'Monthly';
			freqNumber = 1;
			break;
		case 'Q':
			frequencyAbv = 'Q';
			frequency = 'Quarterly';
			freqNumber = 3;
			break;
		case 'S':
		case 'SA':
			frequencyAbv = 'SA';
			frequency = 'Semi-Annual';
			freqNumber = 6;
			break;
		case 'A':
			frequencyAbv = 'A';
			frequency = 'Annual';
			freqNumber = 12;
			break;
		default:
			frequencyAbv = 'M';
			frequency = '';
			freqNumber = 1;
			break;
		}
		return {
			frequencyAbv: frequencyAbv,
			frequency: frequency,
			freqNumber: freqNumber
		};
	}

	function getPurchaseOption(_paymentOption) {
		var purchaseOption = '';
		switch (_paymentOption.get('purchaseOptions')) {
		case 'F':
			purchaseOption = 'FMV';
			break;
		case 'D':
			purchaseOption = '$1';
			break;
		case 'P':
			purchaseOption = 'FPO';
			break;
		default:
			purchaseOption = '';
		}
		return purchaseOption;
	}

	function getEquipmentList(_equipments) {
		var equipment = _equipments.first();
		return [{
			quantity: equipment.get('quantity') || 0,
			isUsed: false,
			make: (equipment.get('make') || ''),
			model: (equipment.get('model') || ''),
			description: equipment.getDescriptionAndUpdate()
		}];
	}

	var handlePDFGeneration = function (_params) {
		_params = _params || {};

		doLog && console.log('[OthcPdfHandler] - handlePDFGeneration()');

		var recipient = _params.recipient;
		var quote = _params.quote;
		var paymentOption = _params.paymentOption;
		var index = _params.index;
		var today = _params.today;
		var authorizationsData = _params.authorizationsData || [];
		var hideFields = _params.hideFields || {};
		var customer = quote.get('customer');
		var equipments = quote.get('equipments');

		var advancePaymentAmount = stringFormatter.formatCurrency(calculator.calculateAdvancePaymentAmount(paymentOption));
		var totalPaymentAmount = calculator.calculateTotalPaymentAmount(paymentOption);
		var term = paymentOption.get('term');
		var realTerm = rateCards.getRealTermForPaymentOption(paymentOption);
		var customerFullName = stringFormatter.restoreSingleQuote(customer.getCustomerFullName());
		var isSubmitted = quote.isSubmitted();
		var paymentDescription = [];
		var equipmentList = getEquipmentList(equipments);
		var title = '';
		var rates = null;
		var result = {};

		var signatureData = _.findWhere(authorizationsData, {
			id: 'signature'
		}) || {};
		var ssnData = _.findWhere(authorizationsData, {
			id: 'ssn'
		}) || {};
		var dobData = _.findWhere(authorizationsData, {
			id: 'dob'
		}) || {};
		var licenseData = _.findWhere(authorizationsData, {
			id: 'license'
		}) || {};

		var paymentFrequency = getPaymentFrequency(paymentOption);
		var purchaseOption = getPurchaseOption(paymentOption);

		if (!hideFields.rateProgram) {
			// RATE PROGRAM VISIBLE FROM SUMMARY SETTINGS
			// if (paymentOption.get('useRateCard')) {
			// RATE PROGRAM DESCRIPTION FOR RATE CARD
			rates = rateCards.getRateCardLevelsForPaymentOption(paymentOption);
			if (rates.length > 0) {
				paymentDescription = rates.map(function (_rateCard, _index) {
					var totalPayments = parser.parseToNumber(_rateCard.get('payments'));
					var rateFactor = _rateCard.get('rateFactor');

					if (!paymentOption.get('useRateCard') && _index >= rates.length - 1) {
						rateFactor = paymentOption.get('rateFactor');
					}

					var paymentAmount = calculator.calculateTotalPaymentAmount(Alloy.createModel('paymentOption', {
						amountFinanced: paymentOption.get('amountFinanced'),
						servicePayment: paymentOption.get('servicePayment'),
						rateFactor: rateFactor
					}));

					return {
						totalPayments: totalPayments,
						paymentAmount: paymentAmount
					};
				});
			} else {
				paymentDescription.push({
					totalPayments: term,
					paymentAmount: totalPaymentAmount
				});
			}
			// } else {
			// 	// RATE PROGRAM DESCRIPTION FOR RATE FACTOR
			// 	if (realTerm > term) {
			// 		var promoMonths = realTerm - term;

			// 		paymentDescription.push({
			// 			totalPayments : promoMonths,
			// 			paymentAmount : 0
			// 		});
			// 	}

			// 	paymentDescription.push({
			// 		totalPayments : term,
			// 		paymentAmount : totalPaymentAmount
			// 	});
			// }
		} else {
			// RATE PROGRAM NOT VISIBLE FROM SUMMARY SETTINGS
			paymentDescription.push({
				totalPayments: term,
				paymentAmount: totalPaymentAmount
			});
		}

		paymentDescription = _.map(paymentDescription, function (_paymentRow, _index) {
			var totalPayments = parser.parseToNumber(_paymentRow.totalPayments / paymentFrequency.freqNumber);

			return String.format(
				'%s %s of %s %s',
				'' + totalPayments,
				(totalPayments === 1) ? 'payment' : 'payments',
				stringFormatter.formatCurrency(_paymentRow.paymentAmount),
				(_index < paymentDescription.length - 1) ? 'then' : ''
			);
		});

		signatureData.pdfString = signatureData.hasData ? signatureData.file.resolve().replace('file:', '') : '';
		signatureData.signedBy = '';
		signatureData.title = '';
		signatureData.signatureDate = '';
		signatureData.principalName = '';

		ssnData.pdfString = ssnData.hasData ? ssnData.ssn : '';

		dobData.pdfString = dobData.hasData ? dobData.dob : '';

		licenseData.pdfString = licenseData.hasData ? licenseData.file.resolve().replace('file:', '') : '';

		switch (recipient) {
		case 'customer':
			result.pdfFileName = 'quote_' + (index + 1);
			signatureData.signedBy = isSubmitted ? customerFullName : '';
			signatureData.title = stringFormatter.restoreSingleQuote(customer.get('title'));
			signatureData.signatureDate = isSubmitted ? today.format('MM/DD/YYYY') : '';
			signatureData.principalName = (isSubmitted && (ssnData.hasData || dobData.hasData)) ? customerFullName : '&nbsp';

			ssnData.pdfString = ssnData.hasData ? 'NNN-NN-NNNN' : '&nbsp';
			dobData.pdfString = dobData.hasData ? 'NN/NN/NNNN' : '&nbsp';

			licenseData.hasData = false;
			break;
		case 'dll':
			signatureData.signedBy = customerFullName;
			//signatureData.title = title  // It's working this way
			signatureData.title = stringFormatter.restoreSingleQuote(customer.get('title'));
			signatureData.principalName = (ssnData.hasData || dobData.hasData) ? customerFullName : '&nbsp';
			signatureData.signatureDate = today.format('MM/DD/YYYY');

			ssnData.pdfString = ssnData.hasData ? ssnData.ssn.replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3') : '&nbsp';
			dobData.pdfString = dobData.hasData ? dobData.dob.format('MM/DD/YYYY') : '&nbsp';
			break;
		case 'lease':
			result.pdfFileName = 'quote_' + (index + 1);
			signatureData.hasData = false;
			signatureData.title = '';
			signatureData.signatureDate = '';
			signatureData.principalName = '&nbsp';
			signatureData.signedBy = '';

			licenseData.hasData = false;
			ssnData.pdfString = '&nbsp';
			dobData.pdfString = '&nbsp';
		}

		result.htmlFile = customizations.getFile('credit');
		// result.htmlFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'othc_quote.html');
		result.shouldGenerateWithWebView = true;
		result.data = {
			//customer data
			customerName: stringFormatter.restoreSingleQuote(customer.getLegalName() || '&nbsp'),
			customerEmail: customer.get('email') || '&nbsp',
			date: today.format('MM/DD/YYYY'),
			customerPhone: customer.get('phone') || '&nbsp',

			//payment & equipment information
			term: realTerm,
			advancePayment: advancePaymentAmount,
			frequency: paymentFrequency.frequency,
			payment: totalPaymentAmount,
			paymentDescription: paymentDescription,
			purchaseOption: purchaseOption,
			equipment: equipmentList,

			// Lessee Information and Signature
			lesseLegalName: stringFormatter.restoreSingleQuote(customer.getLegalName() || '&nbsp'),
			lessePhoneNumber: customer.get('phone') || '&nbsp',
			lesseBillingAddress: stringFormatter.restoreSingleQuote(customer.get('physicalAddress') || '&nbsp'),
			city: stringFormatter.restoreSingleQuote(customer.get('physicalCity') || '&nbsp'),
			state: stringFormatter.restoreSingleQuote(customer.get('physicalState') || '&nbsp'),
			zip: customer.get('physicalZip') || '&nbsp',
			emailAddress: customer.get('email') || '&nbsp',

			// Authorizations
			lesseSignature: signatureData.pdfString,
			hasSignature: signatureData.hasData,
			signedBy: stringFormatter.restoreSingleQuote(signatureData.signedBy),
			title: stringFormatter.restoreSingleQuote(signatureData.title),
			signatureDate: signatureData.signatureDate,
			principalName: signatureData.principalName,

			ssn: ssnData.pdfString,

			dob: dobData.pdfString,

			hasLicense: licenseData.hasData,
			license: licenseData.pdfString,

			copyright: today.format('© YYYY[ All Rights Reserved. ]YY[DLL938 ]MM/YY'),
			hideFields: hideFields || {}
		};

		return result;
	};

	var handlePDFProposalGeneration = function (_params) {
		_params = _params || {};

		doLog && console.log('[OthcPdfHandler] - handlePDFProposalGeneration()');

		var recipient = _params.recipient;
		var quote = _params.quote;
		var index = _params.index;
		var today = _params.today;
		var hideFields = _params.hideFields || {};
		var customer = quote.get('customer');
		var equipments = quote.get('equipments');
		var paymentOptions = quote.get('paymentOptions');
		var logo = customizations.getFile('logo');
		var salesRep = sessionManager.getSalesRep();

		var logoBlob = '';
		var paymentListGrouped = [];
		var lastAmount = -1;
		var groupPayment;

		var equipmentList = getEquipmentList(equipments);
		var equipmentString;
		var result = {};

		var footerNotes = [];
		var displayFooterNotes = false;

		var paymentList = paymentOptions.map(function (_paymentOption) {
			var paymentDescription = [];
			var advancePaymentQty = parser.parseToNumber(_paymentOption.get('advancePayment'));
			var advancePaymentType = _paymentOption.get('advancePaymentType');
			var advancePayment = calculator.calculateAdvancePaymentAmount(_paymentOption);
			var advancePaymentAmount = stringFormatter.formatCurrency(advancePayment);
			var totalPaymentAmount = calculator.calculateTotalPaymentAmount(_paymentOption);
			var term = _paymentOption.get('term');
			var realTerm = rateCards.getRealTermForPaymentOption(_paymentOption);
			var paymentFrequency = getPaymentFrequency(_paymentOption);
			var purchaseOption = getPurchaseOption(_paymentOption);

			var rates = rateCards.getRateCardLevelsForPaymentOption(_paymentOption);
			if (rates.length > 0) {
				paymentDescription = rates.map(function (_rateCard, _index) {
					var totalPayments = parser.parseToNumber(_rateCard.get('payments'));
					var rateFactor = _rateCard.get('rateFactor');

					if (!_paymentOption.get('useRateCard') && _index >= rates.length - 1) {
						rateFactor = _paymentOption.get('rateFactor');
					}

					var paymentAmount = calculator.calculateTotalPaymentAmount(Alloy.createModel('paymentOption', {
						amountFinanced: _paymentOption.get('amountFinanced'),
						servicePayment: _paymentOption.get('servicePayment'),
						rateFactor: rateFactor
					}));

					return {
						totalPayments: totalPayments,
						paymentAmount: paymentAmount
					};
				});
			} else {
				paymentDescription.push({
					totalPayments: term,
					paymentAmount: totalPaymentAmount
				});
			}

			var totalPayments = parser.parseToNumber(paymentDescription[paymentDescription.length - 1].totalPayments /
				paymentFrequency.freqNumber);

			if (advancePayment > 0 || _paymentOption.get('servicePayment') > 0) {
				displayFooterNotes = true;
			}

			var paymentFrequencyText = '';
			if (paymentFrequency.frequencyAbv != 'M') {
				paymentFrequencyText = (advancePayment > 0 || _paymentOption.get('servicePayment') > 0) ? ',' +
					paymentFrequency.frequencyAbv : paymentFrequency.frequencyAbv;
			}
			var paymentInfo = String.format(
				'%s%s%s',
				advancePaymentQty > 0 ? getAdvancePaymentReference(advancePaymentQty, advancePaymentType) : '',
				_paymentOption.get('servicePayment') > 0 ? (advancePaymentQty > 0 ? ',' + getServicePaymentReference() :
					getServicePaymentReference()) : '',
				paymentFrequencyText
			);

			return {
				term: realTerm,
				advancePayment: advancePaymentAmount,
				advancePaymentQty: advancePaymentQty,
				frequency: paymentFrequency.frequency,
				payment: stringFormatter.formatCurrency(totalPaymentAmount), //amount + service
				purchaseOption: purchaseOption,
				totalPayments: totalPayments,
				promoName: stringFormatter.removeDefaultTerm(_paymentOption.get('promoName')),
				amountFinanced: _paymentOption.get('amountFinanced'),
				servicePayment: _paymentOption.get('servicePayment'),
				paymentInfo: paymentInfo

			};
		}) || [];

		paymentListGrouped = sortPaymentList(paymentList.slice(0));

		equipmentString = equipmentList.map(function (_equipment) {
			return _equipment.description;
		}).join('; ') || '';

		if (logo && logo.exists()) {
			logoBlob = logo.resolve().replace('file:', '');
		}

		result.htmlFile = customizations.getFile('proposal');
		result.pdfFileName = 'quote_' + (index + 1);
		result.shouldGenerateWithWebView = false; // use mustache template instead of events
		result.data = {
			//Logo
			logoImage: logoBlob,

			//customer data
			customerName: stringFormatter.restoreSingleQuote(customer.getLegalName() || ''),
			customerFirstName: stringFormatter.restoreSingleQuote(customer.get('firstName') || ''),
			customerLastName: stringFormatter.restoreSingleQuote(customer.get('lastName') || ''),
			customerEmail: customer.get('email') || '',
			date: today.format('MMMM DD, YYYY'),

			//payment & equipment information
			payments: paymentListGrouped,
			equipment: equipmentList,
			equipmentString: equipmentString,

			city: stringFormatter.restoreSingleQuote(customer.get('physicalCity') || ''),
			state: customer.get('physicalState') || '',
			zip: customer.get('physicalZip') || '',
			comma: customer.get('physicalCity') ? ', ' : '',
			address: stringFormatter.restoreSingleQuote(customer.get('physicalAddress') || ''),
			emailAddress: customer.get('email') || '',

			userName: stringFormatter.restoreSingleQuote(salesRep.get('name') || ''),
			userTitle: stringFormatter.restoreSingleQuote(salesRep.get('title') || ''),
			userEmail: salesRep.get('email') || '',
			userPhone: salesRep.get('phone') || '',

			termsValidDate: today.add(30, 'days').format('MMMM DD, YYYY'),

			hideFields: hideFields || {},
			displayFooterNotes: displayFooterNotes,
			footerNotes: footerNotes,

			shrinkPaymentsTableSmall: paymentListGrouped.length >= 4,
			shrinkPaymentsFootnotesSmall: paymentListGrouped.length > 4 && footerNotes.length >= 4
		};
		return result;

		/**
		 * @method getAdvancePaymentReference
		 * @private
		 * Returns the reference number to be added in the footer notes for advanced payments
		 * @param {Number} _paymentQuantity The quantity of advanced payments
		 * @param {String} _paymentType The type of the advance payment
		 * @return {String}
		 */
		function getAdvancePaymentReference(_paymentQuantity, _paymentType) {
			var footerNotesLength = footerNotes.length;
			for (var i = 0; i < footerNotesLength; i++) {
				if (footerNotes[i].referenceValue == _paymentQuantity && footerNotes[i].referenceType == _paymentType) {
					return '' + footerNotes[i].reference;
				}
			}
			footerNotesLength++;
			var referenceText = '';
			if (_paymentType == 'A') {
				referenceText = _paymentQuantity + (_paymentQuantity > 1 ? ' Advanced Payments' : ' Advanced Payment');
			} else if (_paymentType == 'S') {
				referenceText = _paymentQuantity + (_paymentQuantity > 1 ? ' Security PMTS' : ' Security PMT');
			}
			footerNotes.push({
				referenceType: _paymentType,
				referenceValue: _paymentQuantity,
				reference: footerNotesLength,
				referenceText: '• ' + footerNotesLength + ': ' + referenceText
			});
			return '' + footerNotesLength;
		}
		/**
		 * @method getServicePaymentReference
		 * @private
		 * Returns the reference number to be added in the footer notes for service payments
		 * @return {String}
		 */
		function getServicePaymentReference() {
			var footerNotesLength = footerNotes.length;
			for (var i = 0; i < footerNotesLength; i++) {
				if (footerNotes[i].referenceType == 'service') {
					return '' + footerNotes[i].reference;
				}
			}
			footerNotesLength++;
			footerNotes.push({
				referenceType: 'service',
				referenceValue: null,
				reference: footerNotesLength,
				referenceText: '• ' + footerNotesLength + ': Includes Service Payment'
			});
			return '' + footerNotesLength;
		}

		/**
		 * @method sortPaymentList
		 * @private
		 * Groups and sorts the paymentList
		 * @param {Array} _listOfPayments A copy of the payments array
		 * @return {Array} paymentListGrouped The list grouped by amount financed
		 * @return {String} paymentListGrouped.amountFinanced The amount financed group
		 * @return {Array} paymentListGrouped.paymentList The array of payments of the group
		 */
		function sortPaymentList(_listOfPayments) {
			// This kind of sorting was requested and described in @B12672
			var paymentListGrouped = [];

			// The first amount financed to group by
			var financedAmount = _listOfPayments[0].amountFinanced;

			var groupPayment = {
				amountFinanced: stringFormatter.formatCurrency(financedAmount),
				paymentList: [_listOfPayments[0]]
			};
			// Remove the payment from the list
			_listOfPayments.splice(0, 1);

			// While there are payments in the list, we'll process them.
			while (_listOfPayments.length > 0) {

				// True if a payment with the same amount financed is found.
				var groupFound = false;

				for (var i = 0; i < _listOfPayments.length; i++) {
					if (_listOfPayments[i].amountFinanced == financedAmount) {
						groupFound = true;
						// Add the payment to the group payment list
						groupPayment.paymentList.push(_listOfPayments[i]);
						// Remove the object from the list.
						_listOfPayments.splice(i, 1);
						break;
					}
				}

				if (!groupFound) {
					// No groups found, so save the group list and move on with the next amount financed.
					paymentListGrouped.push(groupPayment);

					// Get the amount financed of the first element that remains in the list.
					financedAmount = _listOfPayments[0].amountFinanced;

					groupPayment = {
						amountFinanced: stringFormatter.formatCurrency(financedAmount),
						paymentList: [_listOfPayments[0]]
					};
					_listOfPayments.splice(0, 1);

				}
			}

			// save the group
			paymentListGrouped.push(groupPayment);

			return paymentListGrouped;
		}
	};

	return {
		handlePDFCreation: handlePDFCreation,
		handlePDFGeneration: handlePDFGeneration,
		handlePDFProposalGeneration: handlePDFProposalGeneration
	};
})();

module.exports = OthcPdfHandler;
