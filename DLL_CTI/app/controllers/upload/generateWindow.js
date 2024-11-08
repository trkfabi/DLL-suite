/**
 * @class Controllers.upload.generateWindow
 * Generation of the pdf
 * 
 */
var args = arguments[0] || {};
var analytics = require('/utils/analytics');
var PDF = require('/utils/pdfGeneration');
var amortization = require('/calculations/amortization');
var stringFormatter = require('/helpers/stringFormatter');
var customizations = require('/customizations');
var sessionManager = require('/utils/sessionManager');
var imageHelpers = require('/helpers/imageHelpers');
var appNavigation = require('/appNavigation');

var countryData = sessionManager.getCountryData();
var languageSelected = sessionManager.getDocsLang();
var localeStrings = countryData.strings[languageSelected.key];
var authorizations = countryData.summary.authorizations;
var ssnAuthorization;

var quote;
var customer;
var payments;
var equipments;

var callback;

var pdfs;
var completed;

var today;

var paymentsLength;
var animationSlice;
var preview;
var includeCreditApp;
var creditGenerated;
var appOnPause;
var memPauseData;
var animation;

/**
 * @method init
 * @private
 * Initialize values for the current window
 * @return {void}
 */
function init() {
	analytics.captureApm('[generateWindow] - create()');

	today = new moment();
	pdfs = [];

	quote = args.quote;
	customer = quote.get('customer');
	payments = quote.get('paymentOptions');
	equipments = quote.get('equipments');

	preview = args.preview || false;
	includeCreditApp = args.includeCreditApp || false;
	callback = args.callback;

	completed = false;

	paymentsLength = payments.length;
	animationSlice = 250 / paymentsLength;
	creditGenerated = false;
	appOnPause = false;
	memPauseData = {};
	animation = Ti.UI.createAnimation({
		width: 0,
		duration: 500
	});

	ssnAuthorization = _.find(authorizations, function (_authorization) {
		return _authorization.type === 'ssn';
	});

	if (languageSelected.key === 'en') {
		moment.locale('en');
	} else {
		var momentLanguage = require('/momentLanguages/' + languageSelected.key);
		moment.locale(languageSelected.key, momentLanguage);
	}

	_.defer(function () {
		generatePDF({
			paymentOption: preview ? payments.at(0) : quote.getSelectedPaymentOption(),
			paymentIndex: 0
		});
	});
};

/**
 * @method formatCurrencySelectedLanguage
 * @private
 * Give format to a number based on the current language
 * @param {Number} _number Parameter to be used to format the value
 * @return {String} Return the format to the currency selected language 
 */
function formatCurrencySelectedLanguage(_number) {
	return stringFormatter.formatDecimal(_number, undefined, undefined, languageSelected.locale);
};

/**
 * @method generatePDF
 * @private
 * Generate PDF
 * @param {Object} _params Parameter to be use it to generate the PDF
 * @param {Function} _params.generatePdfFunction Generate PDF
 * @param {Models.PaymentOption} _params.paymentOption It receives a PaymentOption Model
 * @param {Number} _params.paymentIndex  Payment index
 * @return {void}
 */
function generatePDF(_params) {
	_params = _params || {};
	analytics.captureApm('[generateWindow] - generatePDF()');
	var generatePdfFunction = _params.generatePdfFunction;
	var paymentOption = _params.paymentOption;
	var paymentIndex = _params.paymentIndex;

	if (appOnPause == false) {
		if (!generatePdfFunction) {
			if (paymentOption.isLease()) {
				generatePdfFunction = generateAGCOLease;
			} else {
				generatePdfFunction = generateAGCOFinance;
			}
		}

		if (quote.get('submitStatus') == Alloy.Globals.submitStatus.unsubmitted) { // If quote is not submited we update contractDate
			paymentOption.set({
				contractDate: new moment().format()
			});
		}

		PDF.generate(generatePdfFunction({
			payment: paymentOption,
			view: $.container,
			callback: function (params) {
				pdfs.push(params);

				if (preview) {
					animation.width += animationSlice;
				} else {
					animation.width += 125;
				}

				if (preview && paymentIndex < paymentsLength - 1) {
					$.progressView.animate(animation, function (e) {
						generatePDF({
							paymentOption: payments.at(paymentIndex + 1),
							paymentIndex: paymentIndex + 1
						});
					});
				} else {
					$.progressView.animate(animation, function (e) {
						if (includeCreditApp && !creditGenerated) {
							creditGenerated = true;
							generatePDF({
								generatePdfFunction: generateAGCOCreditApplication,
								paymentOption: paymentOption,
								paymentIndex: 0
							});
						} else {
							completed = true;
							appNavigation.closeGenerateWindow();
						}
					});
				}

			},
			errorCallback: function (params) {
				analytics.captureApm('[generateWindow] - generatePDF.error - ' + JSON.stringify(params, null, '\t'));
				console.error('PDF Error: ' + JSON.stringify(params, null, '\t'));

				if (!params.success) {
					appNavigation.showAlertMessage(params.message);
					completed = false;
					appNavigation.closeGenerateWindow();
					return;
				}
			}
		}));
	} else {
		memPauseData = {
			generatePdfFunction: generatePdfFunction,
			paymentOption: paymentOption,
			paymentIndex: paymentIndex
		};
	}
};

/**
 * @method generateAGCODocFields
 * @private
 * Generates the data that is the same for both finance & lease docs for the pdf
 * @param {Object} _params Parameter to be use it to store finance & lease docs information
 * @param {Object} _params.payment Payment
 * @param {Object} _params.totalPayments  Total payments
 * @param {Object} _params.data Data to generate the agco doc fields
 * @return {Object} Return finance & lease docs information
 */
function generateAGCODocFields(_params) {
	_params = _params || {};
	analytics.captureApm('[generateWindow] - generateAGCODocFields()');
	var logo = customizations.getFile('logo');
	var paymentOption = _params.payment || Alloy.createModel('paymentOption');
	var customerFullName = (customer.get('firstName') || '') + ' ' + (customer.get('lastName') || '');
	var term = (parseInt(paymentOption.get('term')) || 0);
	var frequency = '';
	var interestRate = (paymentOption.has('interestRate') ? formatCurrencySelectedLanguage(paymentOption.get(
		'interestRate')) + '%' : '');

	var fees = parseFloat(paymentOption.get('fees') || 0);

	var paymentFrequency = paymentOption.get('paymentFrequency') || '';

	if ((quote.get('submitStatus') === null) || (quote.get('submitStatus') == Alloy.Globals.submitStatus.unsubmitted)) { // If quote is not submited we update contractDate
		paymentOption.set({
			contractDate: new moment().format()
		}).save();
	}

	var amortizationInfo = args.amortizationInfo || amortization.getAmortizationInfo({
		payment: paymentOption
	});

	var contractDate = amortizationInfo.contractDate.format(localeStrings['format_date']);
	var firstPaymentDue = amortizationInfo.firstPaymentDueDate.format(localeStrings['format_date']);
	var interestStartDate = amortizationInfo.interestStartDate.format(localeStrings['format_date']);
	var totalPayments = _params.totalPayments || amortization.getTotalPaymentsAmount({
		payment: paymentOption
	});

	var paymentSchedule = _.map(amortizationInfo.schedule, function (_scheduleRow) {
		return {
			date: _scheduleRow.date.format(localeStrings['format_date_full']),
			payment: formatCurrencySelectedLanguage(_scheduleRow.payment),
			interest: formatCurrencySelectedLanguage(_scheduleRow.interest),
			principal: formatCurrencySelectedLanguage(_scheduleRow.principal),
			balance: formatCurrencySelectedLanguage(_scheduleRow.balance)
		};
	});

	// if(!contractDate){
	// 	contractDate = new moment();
	// 	interestStartDate = amortization.getInterestStartDate({ payment : paymentOption, contractDate : contractDate });
	// 	firstPaymentDue = amortization.getFirstPaymentDueDate({ payment : paymentOption, interestStartDate : interestStartDate, paymentFrequency : paymentFrequency });
	// 	totalPayments = amortization.getTotalPaymentsAmount({ payment : paymentOption });
	// }

	var quoteDate = quote.get('quoteDate') ? new moment(new Date(quote.get('quoteDate'))) : null;

	switch (paymentFrequency) {
	case 'M':
		frequency = localeStrings.monthly;
		break;
	case 'Q':
		frequency = localeStrings.quarterly;
		break;
	case 'SA':
		frequency = localeStrings.semiannually;
		break;
	case 'A':
		frequency = localeStrings.annually;
		break;
	default:
		frequency = localeStrings.monthly;
		break;
	}

	var equipmentList = _.compact(equipments.map(function (equip) {
		if (!equip.get('isTradein')) {
			return {
				use: equip.get('isUsed') ? localeStrings['used'] : localeStrings['new_str'],
				make: equip.get('make') || '[no make]',
				model: equip.get('model') || '[no model]',
				price: equip.get('price') || '',
				year: equip.get('year') || '',
				serialNumber: equip.get('serialNumber') || '',
				description: equip.get('description') || ''
			};
		} else return false;
	}));

	var tradeInEquipment = _.compact(equipments.map(function (equip) {
		if (equip.get('isTradein')) {
			return {
				make: equip.get('make') || L("no_make"),
				model: equip.get('model') || L("no_model"),
				description: equip.get('description') || ''
			};
		} else return false;
	}));

	var skipPayments = _.map(JSON.parse(paymentOption.get('skipPayments')), function (skipMonth) {
		return new moment(new Date(skipMonth)).format('MMMM');
	});

	if (OS_ANDROID && logo && logo.exists()) {
		var tempLogo = Ti.Filesystem.createTempFile();
		tempLogo.write(logo.read());
		logo = tempLogo;
	}

	var data = {
		customerName: stringFormatter.restoreSingleQuote(customerFullName),
		customerPhone: customer.get('phone'),
		customerEmail: customer.get('email'),
		date: today.format(localeStrings['format_date']),
		equipment: equipmentList,
		tradeInEquipment: tradeInEquipment,
		// Lease Quote Details
		equipmentCost: formatCurrencySelectedLanguage(paymentOption.get('equipmentCost')),

		// cashDown : cashDown,
		// tradeAllowance : tradeAllowance,
		// tradePayoff : stringFormatter.formatDecimal( paymentOption.get('tradePayoff') ),
		insurance: formatCurrencySelectedLanguage(paymentOption.get('insurance')),
		fees: formatCurrencySelectedLanguage(fees),
		totalAmountFinanced: formatCurrencySelectedLanguage(paymentOption.get('amountFinanced')),
		contractDate: contractDate || '',
		interestStartDate: interestStartDate || '',
		firstPaymentDue: firstPaymentDue || '',
		totalPayments: formatCurrencySelectedLanguage(totalPayments),
		//quoteDate : new moment(new Date(quote.get('dateCreated'))).format(localeStrings['format_date']),
		quoteDate: new moment(new Date(paymentOption.get('contractDate'))).format(localeStrings['format_date']),
		term: term,
		paymentFrequency: frequency,
		interestRate: interestRate,
		interestWaiver: paymentOption.get('interestWaiver') || '',
		skipPayments: skipPayments,
		paymentSchedule: paymentSchedule,
		copyright: today.format('© YYYY[ ' + L("all_right_reserverd") + ' ]YY[DLL938 ]MM/YY'),
		hideFields: args.hideFields,
		logo: (logo && logo.exists() && logo.resolve().replace('file:', '')),
		sheetHeight: OS_IOS ? 32.5 : 35.5
	};

	for (var key in data) {
		_params.data[key] = data[key];
	}

	return _params;
};

/**
 * @method generateAGCOLease
 * @private
 * Generate the AGCO lease information for the PDF
 * @param {Object} _params Parameter to be used it to store lease infortion
 * @return {Object} Return lease information
 */
function generateAGCOLease(_params) {
	analytics.captureApm('[generateWindow] - generateAGCOLease()');
	_params = _params || {};
	var paymentOption = _params.payment || Alloy.createModel('paymentOption');
	var payment = parseFloat(paymentOption.get('payment') || 0);
	var advancePayment = parseFloat(paymentOption.get('advancePayments') || 0);
	var taxOnAdvanceAmount = parseFloat(paymentOption.get('taxOnAdvanceAmount') || 0);
	var residualValue = parseFloat(paymentOption.get('residualValue') || 0);

	_params.fileName = 'agco_lease';
	_params.htmlFile = customizations.getFile('lease');
	//_params.htmlFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'agco_lease.html');
	_params.fileForUser = 'lease_' + paymentOption.get('orderNo');

	_params.data = {
		paymentBeforeTax: formatCurrencySelectedLanguage(payment),
		advancePayment: formatCurrencySelectedLanguage(advancePayment),
		taxOnAdvance: formatCurrencySelectedLanguage(taxOnAdvanceAmount),
		purchaseOption: formatCurrencySelectedLanguage(residualValue),
		cashDown: '$' + formatCurrencySelectedLanguage(0),
		tradeAllowance: '$' + formatCurrencySelectedLanguage(0),
		tradePayoff: formatCurrencySelectedLanguage(0)
	};

	return generateAGCODocFields(_params);
};

/**
 * @method generateAGCOFinance 
 * @private
 * Initialize the data that is only for an AGCO Fianance 
 * @param {Object} _params Parameter to be used to store information about the finance
 * @return {Object} Return finance information
 */
function generateAGCOFinance(_params) {
	analytics.captureApm('[generateWindow] - generateAGCOFinance()');
	_params = _params || {};
	var paymentOption = _params.payment || Alloy.createModel('paymentOption');
	var financeCharges = parseFloat(paymentOption.get('financeCharges') || 0);
	var taxesAmount = parseFloat(paymentOption.get('taxesAmount') || 0);
	var balloon = parseFloat(paymentOption.get('balloon') || 0);
	var amountFinanced = parseFloat(paymentOption.get('amountFinanced') || 0);
	var payment = parseFloat(paymentOption.get('payment') || 0);

	_params.fileName = 'agco_finance';
	_params.htmlFile = customizations.getFile('finance');
	//_params.htmlFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'agco_finance.html');
	_params.fileForUser = 'finance_' + paymentOption.get('orderNo');
	_params.totalPayments = Number(paymentOption.get("totalPayments"));

	var cashDown = '$' + formatCurrencySelectedLanguage(paymentOption.get('cashDown'));
	if (paymentOption.get('cashDown') > 0) {
		cashDown = '(' + cashDown + ')';
	}
	var tradeAllowance = '$' + formatCurrencySelectedLanguage(paymentOption.get('tradeAllowance'));
	if (paymentOption.get('tradeAllowance') > 0) {
		tradeAllowance = '(' + tradeAllowance + ')';
	}

	if (!_params.totalPayments) {
		_params.totalPayments = amortization.getTotalPaymentsAmount({
			payment: paymentOption
		});
	}

	financeCharges = _params.totalPayments - amountFinanced;
	paymentOption.set({
		financeCharges: financeCharges
	}).save();

	financeCharges = formatCurrencySelectedLanguage(financeCharges);
	(financeCharges !== '') && (financeCharges = '$' + financeCharges);

	_params.data = {
		paymentAmount: formatCurrencySelectedLanguage(payment),
		totalAmountFinanced: formatCurrencySelectedLanguage(amountFinanced),
		balloonPayment: formatCurrencySelectedLanguage(balloon),
		taxes: formatCurrencySelectedLanguage(taxesAmount),
		financeCharges: financeCharges,
		cashDown: cashDown,
		tradeAllowance: tradeAllowance,
		tradePayoff: formatCurrencySelectedLanguage(paymentOption.get('tradePayoff'))
	};

	return generateAGCODocFields(_params);
};

/**
 * @method generateAGCOCreditApplication
 * @private
 * Generate the AGCO credit application information
 * @param {Object} Parameter to be used to store information of the customer
 * @return {Object} Return customer information
 */
function generateAGCOCreditApplication(_params) {
	analytics.captureApm('[generateWindow] - generateAGCOCreditApplication()');
	_params = _params || {};
	var ssn = '';
	var dob = '';
	var equipmentUsage = {
		farmUsage: 0,
		personalUsage: 0,
		constructionUsage: 0,
		commercialUsage: 0
	};
	var isForCustomer = (args.recipient === 'customer');
	var fieldsLength = ssnAuthorization.format.split('-');
	var usageCollection = quote.get('usages');
	var signature = null;
	var license = null;
	var signatureDate = null;
	var isSubmitted = args.isSubmitted || quote.get('submitStatus') !== Alloy.Globals.submitStatus.unsubmitted;

	if (args.hasLicense) {
		license = Ti.Filesystem.getFile(args.licenseFileName);
		license = imageHelpers.resizeInTempFile({
			blob: license.read()
		});
		license = license.resolve();
		license = license.replace('file:', '');
	}

	usageCollection.each(function (usageModel) {
		var description = usageModel.get('description');
		var usageKey;
		switch (description) {
		case 'Farm':
			usageKey = 'farmUsage';
			break;
		case 'Personal':
			usageKey = 'personalUsage';
			break;
		case 'Construction':
			usageKey = 'constructionUsage';
			break;
		case 'Commercial/Custom':
			/* falls through */
		default:
			usageKey = 'commercialUsage';
			break;
		}
		equipmentUsage[usageKey] += parseInt(usageModel.get('percentage'));
	});

	switch (args.recipient) {
	case 'customer':
		args.hasLicense = false;
		ssn = args.ssn ? Array(parseInt(fieldsLength[0]) + 1).join('N') + '-' + Array(parseInt(fieldsLength[1]) + 1).join('N') +
			'-' + Array(parseInt(fieldsLength[2]) + 1).join('N') : '';
		dob = args.dob ? 'NN/NN/NNNN' : '';

		if (args.hasSignature && isSubmitted) {
			signature = Ti.Filesystem.getFile(args.signatureFileName);
			if (signature.exists()) {
				signature = imageHelpers.resizeInTempFile({
					blob: signature.read(),
					width: 500,
					height: 250
				});
			} else {
				signature = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'images', 'blank_line.png');
			}
		} else {
			signature = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'images', 'blank_line.png');
		}
		signature = signature.resolve();
		signature = signature.replace('file:', '');
		signatureDate = (isSubmitted) ? today.format(localeStrings['format_date']) : '';

		break;

	case 'dll':
		var regString = '(\\d{' + fieldsLength[0] + '})(\\d{' + fieldsLength[1] + '})(\\d{' + fieldsLength[2] + '})';
		var replaceRegex = new RegExp(regString, 'g');
		ssn = args.ssn ? args.ssn.replace(replaceRegex, '$1-$2-$3') : '';
		dob = args.dob ? args.dob.format(localeStrings['format_date']) : '';
		if (args.hasSignature) {
			signature = Ti.Filesystem.getFile(args.signatureFileName);
			signature = imageHelpers.resizeInTempFile({
				blob: signature.read(),
				width: 500,
				height: 250
			});

			signature = signature.resolve();

			signature = signature.replace('file:', '');
		}
		signatureDate = today.format(localeStrings['format_date']);

		break;
	case 'share':
		args.hasSignature = false;
		args.hasLicense = false;
		ssn = '';
		dob = '';
		date = '';
		signatureDate = '';
		break;
	}

	_params.fileName = 'agco_credit';
	_params.htmlFile = customizations.getFile('credit');
	//_params.htmlFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'agco_credit.html');
	_params.fileForUser = 'credit_application';

	_params.data = {
		// Customer Data
		firstName: stringFormatter.restoreSingleQuote(customer.get('firstName') || ''),
		middleName: stringFormatter.restoreSingleQuote(customer.get('middleName') || ''),
		lastName: stringFormatter.restoreSingleQuote(customer.get('lastName') || ''),
		ssn: ssn,
		dob: dob,

		phone1: customer.get('phone') || '',
		phone2: '',
		email: customer.get('email') || '',
		physicalAddress: stringFormatter.restoreSingleQuote(customer.get('physicalAddress') || ''),
		city: stringFormatter.restoreSingleQuote(customer.get('physicalCity') || ''),
		state: stringFormatter.restoreSingleQuote(customer.get('physicalState') || ''),
		zip: customer.get('physicalZip') || '',
		mailingAddress: stringFormatter.restoreSingleQuote(customer.get('mailingAddress') || ''),
		mailingCity: stringFormatter.restoreSingleQuote(customer.get('mailingCity') || ''),
		mailingState: stringFormatter.restoreSingleQuote(customer.get('mailingState') || ''),
		mailingZip: stringFormatter.restoreSingleQuote(customer.get('mailingZip') || ''),
		legalName: stringFormatter.restoreSingleQuote(customer.get('legalName') ? customer.get('legalName') : (customer.get(
			'firstName') && customer.get(
			'lastName')) ? (customer.get('firstName') + ' ' + customer.get('lastName')) : ''),
		date: signatureDate,
		customerType: customer.get('customerType'),
		equipmentUsage: equipmentUsage,
		signature: signature,
		hasSignature: args.hasSignature,
		hasLicense: args.hasLicense,
		license: license,
		copyright: today.format('© YYYY[ ' + L("all_right_reserverd") + ' ]YY[DLL938 ]MM/YY')
	};

	return _params;
};

/**
 * @method handleActivityPause
 * @private
 * Handle the pause event of the activity
 * @param {Object} _evt Parameter for the pause event of the activity
 * @return {void}
 */
function handleActivityPause(_evt) {
	doLog && console.log('[generateWindow] - handleActivityPause()');
	appOnPause = true;
};

/**
 * @method handleActivityResume
 * @private
 * Handle the resume event of the activity
 * @param {Object} _evt Parameter for the resume event of the activity
 * @return {void}
 */
function handleActivityResume(_evt) {
	doLog && console.log('[generateWindow] - handleActivityResume()');

	if (appOnPause == true) {
		appOnPause = false;
		generatePDF({
			generatePdfFunction: memPauseData.generatePdfFunction,
			paymentOption: memPauseData.paymentOption,
			paymentIndex: memPauseData.paymentIndex
		});
	}
};

/**
 * @method handleWindowOpen
 * @private
 * Handle the open event of the window
 * @param {Object} _evt Parameter for the open event of the window
 * @return {void}
 */
function handleWindowOpen(_evt) {
	doLog && console.log('[generateWindow] - handleWindowOpen()');

	$.window.getActivity().onPause = handleActivityPause;
	$.window.getActivity().onResume = handleActivityResume;
};

/**
 * @method handleWindowClose
 * @private
 * Handle the close event of the window
 * @param {Object} _evt  Parameter for the close event of the window
 * @return {void}
 */
function handleWindowClose(_evt) {
	doLog && console.log('[generateWindow] - handleWindowClose()');

	moment.locale(Alloy.Globals.currentLocale); // Reset moment to English

	(completed && callback) && callback({
		attachments: pdfs
	});
};

/**
 * @method handleAndroidBack
 * @private
 * Handle the android back button of the window
 * @param {Object} _evt Parameter for the android back event of the window
 * @return {void}
 */
function handleAndroidBack(_evt) {
	//  Do nothing
}

OS_ANDROID && $.window.addEventListener('android:back', handleAndroidBack);
OS_ANDROID && $.window.addEventListener('open', handleWindowOpen);
$.window.addEventListener('close', handleWindowClose);

init();
