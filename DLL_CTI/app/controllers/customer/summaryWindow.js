/**
 * @class Controllers.customer.summaryWindow
 * Summary Window
 */
var session = require('/utils/sessionManager');
var appNavigation = require('/appNavigation');
var analytics = require('/utils/analytics');
var amortization = require('/calculations/amortization');
var customizations = require('/customizations');
var stringFormatter = require('/helpers/stringFormatter');
var uiHelpers = require('/helpers/uiHelpers');
var salesRep = Alloy.Models.instance('salesRep');
//var quote = args.quote;
var quote = salesRep.getSelectedQuote();
var paymentOptions = quote.get('paymentOptions');
var customer = quote.get('customer');
var equipments = quote.get('equipments');
var paymentOption = paymentOptions.get(quote.get('paymentOptionSelected'));
var isPaySettingsShow = false;
var hasSSN = customer.get('hasSSN');
var hasDOB = customer.get('hasDOB');
var ssn = customer.get('ssn');
var dob = hasDOB ? new moment(new Date(customer.get('dob'))) : null;
var hasSignature = customer.get('hasSignature');
var hasLicense = customer.get('hasLicense');
var licenseFile = hasLicense ? Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, customer.get(
	'licenseFileName')) : null;
var signatureFile = hasSignature ? Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, customer.get(
	'signatureFileName')) : null;
var licenseFileName = hasLicense ? licenseFile.resolve() : null;
var signatureFileName = hasSignature ? signatureFile.resolve() : null;
var attachments;
var amortizationInfo;
var customerType = {};
var customerName = '';
var legalName = '';
var individualLegalName = '';
var shouldDestroy = false;
var logo = customizations.getFile('logo');
var hideFields = {
	interestRate: false
};
var NO_PDF_SENT_MESSAGE = L("error_ocurred_sending_your_transaction");
var totalPayments;
var firstPaymentDue;
var languageSelected = session.getDocsLang();

//Adding 
var countryData = session.getCountryData();
var customerTypes = countryData.summary.customerTypes;
var authorizations = countryData.summary.authorizations;

// Private functions-------

/**
 * @method init
 * @private
 * Initialize values for the sumamry window
 * @return {void}
 */
function init() {
	// TODO: this controller needs a major cleanup

	var _physicalCity;
	var _physicalState;
	var _physicalStateComma;
	var _physicalZipComma;
	var _physicalZip;

	analytics.captureTiAnalytics('Summary.Open');
	analytics.captureApm('[summaryWindow] - init()');

	if (customer) {

		analytics.captureApm('[summaryWindow] - init() - hasCustomer');

		if ((customer.get('firstName') || '') !== '' && (customer.get('lastName') || '') !== '') {
			var nameParts = [];
			customer.has('firstName') && (customer.get('firstName').trim() !== '') && nameParts.push(stringFormatter.restoreSingleQuote(
				customer.get('firstName')));
			customer.has('middleName') && (customer.get('middleName').trim() !== '') && nameParts.push(stringFormatter.restoreSingleQuote(
				customer.get('middleName')));
			customer.has('lastName') && (customer.get('lastName').trim() !== '') && nameParts.push(stringFormatter.restoreSingleQuote(
				customer.get('lastName')));
			customerName = nameParts.join(' ');
			individualLegalName = nameParts.join(' ');
		}
		if (customer.hasLegalName()) {
			legalName = stringFormatter.restoreSingleQuote(customer.get('legalName'));
		} else if (customer.get('name')) {
			legalName = stringFormatter.restoreSingleQuote(customer.get('name'));
		}

		$.namesLabel.text = customerName;
		$.clientNameLabel.text = stringFormatter.restoreSingleQuote(customer.get('name') || '');
		$.addressLabel.text = stringFormatter.restoreSingleQuote(customer.get('physicalAddress') || '');

		_physicalCity = customer.get('physicalCity') ? customer.get('physicalCity') : '';

		_physicalStateComma = customer.get('physicalState') ? ', ' : '';
		_physicalState = (customer.get('physicalState') ? customer.get('physicalState') : '');

		_physicalZipComma = customer.get('physicalZip') ? ', ' : '';
		_physicalZip = (customer.get('physicalZip') ? customer.get('physicalZip') : '');

		$.cityLabel.text = stringFormatter.restoreSingleQuote(_physicalCity + _physicalStateComma + _physicalState +
			_physicalZipComma + _physicalZip);

		$.phoneLabel.text = customer.get('phone') || '';
		$.emailLabel.text = customer.get('email') || '';
		$.customerTypeField.value = findCustomerTypeTitle(customer.get('customerType')) || '';

		if (customer.hasCustomLegalNameOrCorporate()) {
			$.legalNameTextField.value = legalName;
		} else {
			$.legalNameTextField.value = individualLegalName;
		}

		hasSignature && ($.signatureCheck.image = $.signatureCheck.imageActive);
		hasSSN && ($.ssnCheck.image = $.ssnCheck.imageActive);
		hasDOB && ($.dobCheck.image = $.dobCheck.imageActive);
		hasLicense && ($.idCheck.image = $.idCheck.imageActive);

		equipments && equipments.each(function (_equipment, _index) {
			// As we don't ask for quantity in AGCO, we don't neet to show it.
			if (_equipment.get('isTradein') === 0) {
				var text = ((_equipment.get('make') + ' ') || '') + (_equipment.get('quantity') || "") + '' + (_equipment.get(
					'model') || '');

				var equipmentLabel = Ti.UI.createLabel();
				$.addClass(equipmentLabel, 'summaryLabel', {
					text: text,
					bottom: 10
				});
				$.solutionList.add(equipmentLabel);
			}

		});

		var ssnTitle = _.find(authorizations, function (_authorization) {
			return _authorization.type === 'ssn';
		});

		$.ssnLabel.text = L(ssnTitle.summaryTitleid);

		logo && logo.exists() && ($.brandLogo.image = logo.read());
	}

	/*if (args.paymentOptionId) {
		paymentOption = paymentOptions.get(args.paymentOptionId);
	}*/

	paymentOption = quote.getSelectedPaymentOption();

	!paymentOption && (paymentOption = Alloy.createModel('paymentOption'));
	paymentOptionId = paymentOption.id || '0';

	if ((quote.get('submitStatus') === null) || (quote.get('submitStatus') == Alloy.Globals.submitStatus.unsubmitted)) { // If quote is not submited we update contractDate
		doLog && console.log('[ summaryWindow ] - contractDate Updated : ' + new moment().format());
		paymentOption.set({
			contractDate: new moment().format()
		});
	}

	hideFields.interestRate = (paymentOption.get('showInterestRate'));

	$.interestSwitch.setValue(!hideFields.interestRate);
	showHideInterestRateRow(!hideFields.interestRate);

	analytics.captureApm('[summaryWindow] - init() - ' + (paymentOption.get('isLease') ? 'Lease' : 'Finance'));

	// The current values to display, initialize from the paymentOption model.
	switch (paymentOption.get('financeOption')) {
	case 'lease':
		$.paymentOptionsContainer.remove($.cashDownRow);
		$.paymentOptionsContainer.remove($.tradeAllowanceRow);
		$.paymentOptionsContainer.remove($.tradePayoffRow);
		$.paymentOptionsContainer.remove($.balloonRow);
		$.paymentAmountTitle.text = $.paymentAmountTitle.leaseText;
		break;
	case 'finance':
		$.paymentOptionsContainer.remove($.advancePaymentRow);
		$.paymentOptionsContainer.remove($.taxesOnAdvRow);
		$.paymentOptionsContainer.remove($.purchaseOptionRow);
		$.paymentHeader.remove($.paymentSettingsButton);
		$.paymentAmountTitle.text = $.paymentAmountTitle.financeText;
	}

	var currentValues = {
		paymentOptionId: paymentOptionId,
		term: paymentOption.get('term'),
		firstPaymentDue: paymentOption.get('firstPaymentDue'),

		equipmentCost: Number(paymentOption.get('equipmentCost') || 0),
		paymentFrequency: paymentOption.get('paymentFrequency' || 'M'),
		interestRate: Number(paymentOption.get('interestRate') || 0),
		cashDown: Number(paymentOption.get('cashDown') || 0),
		tradeAllowance: Number(paymentOption.get('tradeAllowance') || 0),
		tradePayoff: Number(paymentOption.get('tradePayoff') || 0),
		balloon: Number(paymentOption.get('balloon') || 0),
		advancePayment: Number(paymentOption.get('advancePayments') || 0),
		taxOnAdvanceAmount: Number(paymentOption.get('taxOnAdvanceAmount') || 0),
		residualValue: Number(paymentOption.get('residualValue') || 0),
		payment: Number(paymentOption.get('payment') || 0)
	};

	amortizationInfo = amortization.getAmortizationInfo({
		payment: paymentOption
	});

	firstPaymentDue = amortizationInfo.firstPaymentDueDate;

	totalPayments = amortization.getTotalPaymentsAmount({
		payment: paymentOption
	});

	doLog && console.error('[summaryWindow] - currentValues=' + JSON.stringify(currentValues));
	$.paymentAmountLabel.text = stringFormatter.formatCurrency(currentValues.payment);
	$.termLabel.text = String.format(L('term_months'), currentValues.term);
	$.equipmentPriceLabel.text = stringFormatter.formatCurrency(currentValues.equipmentCost);
	$.interestRateLabel.text = stringFormatter.formatPercentage(currentValues.interestRate);
	$.cashDownLabel.text = stringFormatter.formatCurrency(currentValues.cashDown);
	$.tradeAllowanceLabel.text = stringFormatter.formatCurrency(currentValues.tradeAllowance);
	$.tradePayoffLabel.text = stringFormatter.formatCurrency(currentValues.tradePayoff);
	$.balloonLabel.text = stringFormatter.formatCurrency(currentValues.balloon);
	$.advancePaymentLabel.text = stringFormatter.formatCurrency(currentValues.advancePayment);
	$.taxesOnAdvLabel.text = stringFormatter.formatCurrency(currentValues.taxOnAdvanceAmount);
	$.purchaseOptionLabel.text = stringFormatter.formatCurrency(currentValues.residualValue);
	$.firstPaymentDueLabel.text = new moment(firstPaymentDue).format(L('format_date'));

	switch (currentValues.paymentFrequency) {
	case L("monthly_acronym"):
		$.paymentFrequencyLabel.text = L("monthly");
		break;
	case L("quarterly_acronym"):
		$.paymentFrequencyLabel.text = L("quarterly");
		break;
	case L("semiannually_acronym"):
		$.paymentFrequencyLabel.text = L("semiannually");
		break;
	case L("annualy_acronym"):
		$.paymentFrequencyLabel.text = L("annually");
		break;
	default:
		$.paymentFrequencyLabel.text = L("monthly");
		break;
	}

	// TODO: Delete not used variables
	/*
	var isCustomerOpen = true;
	var isPaymentOpen = true;
	var isPurchaseOpen = true;
	*/

	if (OS_ANDROID) {
		uiHelpers.expandCollapse({
			container: $.paymentContainer,
			button: $.paymentButton
		});
		uiHelpers.expandCollapse({
			container: $.paymentContainer,
			button: $.paymentButton
		});
	}
};

/**
 * @method showHideInterestRateRow
 * @private
 * Show or hide the interest rate row
 * @param {Number} _showInterestRate height of the row 
 * @return {void}
 */
function showHideInterestRateRow(_showInterestRate) {
	$.interestRateRow.height = _showInterestRate ? Ti.UI.SIZE : 0;
};

/**
 * @method signatureCallback
 * @private
 * Signature callback 
 * @param {Object} _params Details about the signature
 * @param {Object} _params.signature Signature details
 * @param {Boolean} _params.hasSignature Used to know if it has a signature
 * @return {void}
 */
function signatureCallback(_params) {
	_params = _params || {};
	hasSignature = _params.hasSignature;
	if (hasSignature) {
		signatureFile = _params.signature;
		signatureFileName = (signatureFile ? signatureFile.resolve() : '');
		// signatureFileName = signatureFileName.replace('file:', '');
		doLog && console.log('signatureFileName : ' + signatureFileName);
	}
};

/**
 * @method ssnCallback
 * @private
 * Callback function about the social security number
 * @param {Object} _params Data about the social security number
 * @param {String} _params.ssn Social security number
 * @return {void}
 */
function ssnCallback(_params) {
	_params = _params || {};
	ssn = _params.ssn && _params.ssn.trim();
	if (ssn !== '') {
		hasSSN = true;
	}
};

/**
 * @method dobCallback
 * @private
 * Date of birthday callback
 * @param {Object} _params Data about the date of birthday
 * @param {Date} _params.dob Day of birthday information
 * @return {void}
 */
function dobCallback(_params) {
	_params = _params || {};
	dob = _params.dob || 0;
	if (dob) {
		hasDOB = true;
	}
};

/**
 * @method licenseCallback
 * @private
 * License callback
 * @param {Object} _params Details about license
 * @param {Boolean} _params.hasLicense Used it to know if it has license
 * @param {Object} _params.license Details
 * return {void}
 */
function licenseCallback(_params) {
	_params = _params || _params;
	hasLicense = _params.hasLicense || false;
	if (hasLicense) {
		licenseFile = _params.license;
		licenseFileName = (licenseFile ? licenseFile.resolve() : '');
		// licenseFileName = licenseFileName.replace('file:', '');
		doLog && console.log('licenseFileName: ' + licenseFileName);
	}
};

/**
 * @method finishCallback
 * @private
 * Callback finish
 * @param {Object} _params  Finish details for the callback function
 * @return {void}
 */
function finishCallback(_params) {
	_params = _params || {};
	if (hasSignature || hasSSN || hasDOB || hasLicense) {
		if (hasSignature) {
			$.signatureCheck.image = $.signatureCheck.imageActive;
		}
		if (hasSSN) {
			$.ssnCheck.image = $.ssnCheck.imageActive;
		}
		if (hasDOB) {
			$.dobCheck.image = $.dobCheck.imageActive;
		}
		if (hasLicense) {
			$.idCheck.image = $.idCheck.imageActive;
		}
		generatePDF('dll', function (args) {
			attachments = args.attachments || [];
			if (attachments.length > 0) {

				quote.set({
					leaseFileName: attachments[0].originalName,
					creditAppFileName: attachments[1].originalName
				}).save();

				_.defer(submitPDFToWS);
			}
		});
	}
};

/**
 * @method destroyElements
 * @private
 * Delete signature files, and license files
 * @return {void}
 */
function destroyElements() {
	signatureFile && signatureFile.exists() && signatureFile.deleteFile();
	licenseFile && licenseFile.exists() && licenseFile.deleteFile();

	//hasLicense = 0;
	//hasSignature = 0;
	//hasSSN = 0;
	//hasDOB = 0;
	signatureFile = null;
	licenseFile = null;
	ssn = '';
	dob = '';
	customer.set({
		licenseFileName: '',
		signatureFileName: '',
		//hasSignature: 0,
		//hasLicense: 0,
		//hasDOB: 0,
		//hasSSN: 0,
		dob: '',
		ssn: ''
	}).save();
};

/**
 * @method togglePaymentSettings
 * @private
 * Toggle payment settings
 * @return {void}
 */
function togglePaymentSettings() {
	isPaySettingsShow = !isPaySettingsShow;
	$.paymentSettingsContainer.height = (isPaySettingsShow ? Ti.UI.SIZE : 0);
	$.settingsPointer.height = (isPaySettingsShow ? Ti.UI.SIZE : 0);
};

/**
 * @method generatePDF
 * @private
 * Generation of the PDF
 * @param {String} _recipient information
 * @param {Function} _callback Function
 * @return {void}
 */
function generatePDF(_recipient, _callback) {
	if (!customer) {
		showNoCustomerError();
		return false;
	}

	analytics.captureApm('[summaryWindow] - generatePDF() - ' + _recipient);

	customer.set({
		ssn: hasSSN ? ssn : '',
		dob: hasDOB ? dob.toString() : '',
		hasSSN: 0 + Boolean(hasSSN),
		hasDOB: 0 + Boolean(hasDOB),
		legalName: $.legalNameTextField.value,
		hasSignature: 0 + Boolean(hasSignature),
		hasLicense: 0 + Boolean(hasLicense),
		licenseFileName: hasLicense ? licenseFile.name : null,
		signatureFileName: hasSignature ? signatureFile.name : null
	}).save();

	paymentOption.set({
		contractDate: amortizationInfo.contractDate.format(),
		interestStartDate: amortizationInfo.interestStartDate.format(),
		firstPaymentDue: firstPaymentDue.format(),
		totalPayments: totalPayments
	}).save();

	paymentOption.resetLeaseOrFinanceData().save();

	var pdfToGenerate = null;

	switch (paymentOption.get('financeOption')) {
	case 'lease':
		pdfToGenerate = 'agco_lease';
		break;
	case 'finance':
		/* falls through */
	default:
		pdfToGenerate = 'agco_finance';
	}

	appNavigation.openGenerateWindow({
		ssn: ssn,
		dob: dob,
		legalName: customer.get('legalName'),
		hasSignature: hasSignature,
		hasLicense: hasLicense,
		licenseFileName: licenseFileName,
		signatureFileName: signatureFileName,
		pdfToGenerate: pdfToGenerate,
		recipient: _recipient,
		hideFields: hideFields,
		includeCreditApp: true,
		customerType: customerType.index,
		quote: quote,
		amortizationInfo: amortizationInfo,
		callback: function (args) {
			_callback && _callback(args);
		}
	});
};

/**
 * @method sendEmail
 * @private
 * Send email
 * @param {String} _recipient information
 * return {void}
 */
function sendEmail(_recipient) {
	analytics.captureApm('[summaryWindow] - sendEmail - ' + _recipient);
	var DLL_EMAIL = 'mobileapps@leasedirect.com';

	if (_recipient === 'customer') {
		generatePDF(_recipient, function (args) {
			var _attachments = args.attachments || [];
			var toRecipients = [(customer.get('email') || '')];
			var ccRecipients = [];

			appNavigation.openEmailDialog({
				subject: " ",
				toRecipients: toRecipients,
				ccRecipients: ccRecipients,
				messageBody: L("attached_are_the_transaction_details"),
				attachments: _attachments
			});
		});
	} else {

		var extraData = {
			// 'Equipment Price' : paymentOption.get('equipmentCost') || 0,
			// 'Additional Cost' : paymentOption.get('additionalCost') || 0,
			// 'Trade-up Amount' : paymentOption.get('tradeUpAmount') || 0,
			// 'Total Amount Financed' : paymentOption.get('amountFinanced') || 0,
			// 'Rate Program' : currentValues.rateProgram,
			// 'Number of Requested Points' : paymentOption.get('points') || 0,
			// 'DLL Rate Factor' : paymentOption.get('rateFactor') || '',
			// 'Rate Factor Entered' : paymentOption.get('rateFactor') || '',
			// 'Payment' : paymentOption.get('payment') || 0,
			// 'Service Payment' : paymentOption.get('servicePayment') || 0,
			// 'Equipment Address' : customer.get('equipmentAddress') || '',
			// 'Equipment City' : customer.get('equipmentCity') || '',
			// 'Equipment State' : customer.get('equipmentState') || '',
			// 'Equipment Zip' : customer.get('equipmentZip') || '',
			// 'App UserID' : Alloy.Globals.mediators.mainWindow.getSalesRepID()
		};

		var dataArray = [];

		for (var fieldName in extraData) {
			var fieldString = fieldName + ': ';
			switch (fieldName) {
			case 'Rate Program':
			case 'Number of Requested Points':
			case 'DLL Rate Factor':
			case 'Rate Factor Entered':
			case 'Equipment Address':
			case 'Equipment City':
			case 'Equipment State':
			case 'Equipment Zip':
			case 'App UserID':
			case 'Contract Number':
				fieldString += extraData[fieldName];
				break;
			default:
				fieldString += stringFormatter.formatCurrency(extraData[fieldName]);
				break;
			}

			dataArray.push(fieldString);
		}

		var toRecipients = [DLL_EMAIL];
		var ccRecipients = [];
		appNavigation.openApplicationEmailWindow({
			subject: " ",
			toRecipients: toRecipients,
			ccRecipients: ccRecipients,
			messageBody: L("attached_are_the_transaction_details") + "\n\n" + dataArray.join('\n'),
			attachments: attachments
		});
	}
};

/**
 * @method showNoCustomerError
 * @private
 * Show missing customer information message
 * @return {void}
 */
function showNoCustomerError() {
	appNavigation.showAlertMessage(L("missing_customer_information"));
};

/**
 * @method submitPDFToWS
 * @private
 * Submit the PDF to web service
 * @return {void}
 */
function submitPDFToWS() {
	analytics.captureApm('[summaryWindow] - submitPDFToWS()');

	if (Ti.Network.online) {
		appNavigation.showAlertMessage(L("transaction_is_being_processed"));
	} else {
		appNavigation.showAlertMessage(L("reestablish_internet_connection_to_submit"));
	}

	appNavigation.handleQuoteSubmit({
		quote: quote
	});
};

/**
 * @method findCustomerTypeTitle
 * @private
 * Find the customer type title
 * @param {Models.Quote} _customerType Model quote for the customer type
 * @return {String} Title type of the customer
 */
function findCustomerTypeTitle(_customerType) {
	var title = '';
	var option = _.find(customerTypes, function (_option) {
		return (_option.value === _customerType);
	});

	if (option) {
		title = option.title;
	}

	return title;
};

/**
 * @method handleSolutionHeaderClick
 * @private
 * Handle the click event of the solutionHeader control
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleSolutionHeaderClick(_evt) {
	uiHelpers.expandCollapse({
		container: $.solutionContainer,
		button: $.solutionButton
	});
};

/**
 * @method handleCustomerHeaderClick
 * @private
 * Handle the click event of the customerHeader control
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleCustomerHeaderClick(_evt) {
	uiHelpers.expandCollapse({
		container: $.customerContainer,
		button: $.customerButton
	});
};

/**
 * @method handlePaymentHeaderClick
 * @private
 * Handle the click event of the paymentHeader control
 * @param {Object} _evt Click event
 * @return {void}
 */
function handlePaymentHeaderClick(_evt) {
	uiHelpers.expandCollapse({
		container: $.paymentContainer,
		button: $.paymentButton
	});
};

/**
 * @method handlePurchaseHeader
 * @private
 * Handle the click event of the purchaseHeader control
 * @param {Object} _evt Click event
 * @return {void}
 */
function handlePurchaseHeader(_evt) {
	uiHelpers.expandCollapse({
		container: $.purchaseContainer,
		button: $.purchaseButton
	});
};

/**
 * @method handleLegalNameTextFieldChange
 * @private
 * Handle the change event of legalNameTextField control
 * @param {Object} _evt Change event
 * @return {void}
 */
function handleLegalNameTextFieldChange(_evt) {
	var newLegalName = $.legalNameTextField.value;
	if (OS_IOS) {
		newLegalName = uiHelpers.replaceQuotes(newLegalName);
		_evt.source.value = newLegalName;
	}
	var isCustom = 0;
	if (customerType !== 'IND' && newLegalName !== customer.get('name')) {
		isCustom = 1;
	} else if (newLegalName !== individualLegalName) {
		isCustom = 1;
	}
	customer.set({
		'legalName': newLegalName,
		'isCustomLegalName': isCustom
	}).save();
};

/**
 * @method handleCustomerTypeContainer
 * @private
 * Handle the click event of the customerTypeContainer control
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleCustomerTypeContainer(_evt) {
	var params = {
		options: customerTypes,
		callback: function (option) {
			$.customerTypeField.value = option.title;
			customerType = option.value;

			if (!customer.get('isCustomLegalName')) {
				if (customerType !== 'IND') {
					$.legalNameTextField.value = legalName;
				} else {
					$.legalNameTextField.value = individualLegalName;
				}
			}
			customer.set({
				customerType: customerType
			}).save();
		}
	};
	appNavigation.openPickerWindow(params);
};

/**
 * @method handleSignContractClick
 * @private
 * Handle the click event of the signContractButton control
 * @param {Object} Click event
 * @return {void}
 */
function handleSignContractClick(_evt) {
	doLog && console.log("[summaryWindow] - handleSignContractClick");
	if (!customer) {
		showNoCustomerError();
		return false;
	}
	analytics.captureTiAnalytics('Summary.SignContract.Click');

	appNavigation.openSummaryPoliciesWindow({
		customer: customer,
		signatureCallback: signatureCallback,
		ssnCallback: ssnCallback,
		dobCallback: dobCallback,
		licenseCallback: licenseCallback,
		finishCallback: finishCallback
	});
};

/**
 * @method handleSendContractToCustomerClick
 * @private
 * Handle the click event for the sendContractToCustomerButton control
 * @param {Object} _evt Click event
 * @return {void}
 */
function handleSendContractToCustomerClick(_evt) {
	analytics.captureTiAnalytics('Summary.SendContract.Click');
	sendEmail(_evt.source.tag);
};

/**
 * @method handleInterestSwitchChange
 * @private
 * Handle the change event of the interestSwitch control
 * @param {Object} _evt Change event 
 * @return {void}
 */
function handleInterestSwitchChange(_evt) {
	showHideInterestRateRow(_evt.value);
	hideFields.interestRate = !_evt.value;
	paymentOption.set({
		showInterestRate: !_evt.value
	});
};

/**
 * @method handleWindoClose
 * @private
 * Handle the close event for the summary window
 * @param {Object} _evt Close event
 * @return {void}
 */
function handleWindoClose(_evt) {
	OS_IOS && appNavigation.closeSummaryWindow();
	destroyElements();
};

$.window.addEventListener('close', handleWindoClose);
$.paymentSettingsButton.addEventListener('click', togglePaymentSettings);
$.purchaseHeader.addEventListener("click", handlePurchaseHeader);
$.sendContractToCustomerButton.addEventListener('click', handleSendContractToCustomerClick);
$.signContractButton.addEventListener("click", handleSignContractClick);
$.customerTypeContainer.addEventListener('click', handleCustomerTypeContainer);
$.paymentHeader.addEventListener("click", handlePaymentHeaderClick);
$.customerHeader.addEventListener("click", handleCustomerHeaderClick);
$.solutionHeader.addEventListener("click", handleSolutionHeaderClick);
$.legalNameTextField.addEventListener('change', handleLegalNameTextFieldChange);
$.interestSwitch.addEventListener('change', handleInterestSwitchChange);
$.backButton.addEventListener('click', appNavigation.closeSummaryWindow);
OS_ANDROID && $.window.addEventListener('android:back', appNavigation.closeSummaryWindow);

init();
