/**
 * @class Configs.othc
 * Config json for US app settings
 * ##version 1.0
 */
module.exports = {
	// Countries to be supported on the settings screen
	languages: [{
		key: 'en',
		language: L('english'),
		locale: 'en-US'
	}, ],
	customizations: {
		en: {
			logo: {
				type: 'LOGO',
				className: 'GENERIC',
				messageid: 'logo',
				isRequired: true,
				localFile: 'LOGO_GENERIC.jpg'
			},
			credit: {
				type: 'TEMPLATE',
				className: 'LEASECONTRACT',
				messageid: 'lease_contract',
				isRequired: true,
				hasTerms: true,
				localFile: '/htmls/en-US/othc_quote.html'
			},
			// TODO: Check the final names from the webservice
			proposal: {
				type: 'TEMPLATE',
				className: 'PROPOSAL',
				messageid: 'proposal',
				isRequired: true,
				hasTerms: false,
				localFile: '/htmls/en-US/othc_proposal.html'
			},
			terms: {
				type: 'TERMS',
				className: 'TERMS',
				messageid: 'terms_and_conditions',
				isRequired: true
			}
		}
	},
	basePath: 'othc/',
	submit: {
		handler: 'othc/submitHandler'
	},
	settings: {
		sections: [{
			controller: 'settings/salesRepView'
		}]
	},
	// Payment Options for each PaymentOption Row
	payment: {
		sections: [{
			// TODO define othc section properties (if any)
			rows: [{
				id: 'rateOptions',
				controller: 'paymentOption/rateCardOptionRow', //alloy controller to load
				property: 'useRateCard',
				options: {
					labels: [L('rate_card_uppercase'), L('rate_factor_uppercase')],
					values: ['RATECARD', 'RATEFACTOR']
				},
				order: 0
			}, {
				id: 'rateFactor',
				controller: 'paymentOption/rateFactorRow', // alloy controller to load
				titleid: 'rate_factor', //i18n id
				property: 'rateFactor', //model id
				pattern: '#.000000',
				order: 1
			}, {
				id: 'rateProgram',
				controller: 'paymentOption/rateProgramPickerRow', //alloy controller to load
				titleid: 'rate_program',
				property: 'rateProgram',
				order: 2
			}, {
				id: 'termOptions',
				controller: 'paymentOption/multiOptionRow', //alloy controller to load
				titleid: 'term',
				property: 'term',
				order: 3
				// options : {
				// 	labels : [ '12', '24', '36', '39', '48', '60', '63' ],
				// 	values : [ '12', '24', '36', '39', '48', '60', '63' ]
				// }
			}, {
				id: 'purchaseOptions',
				controller: 'paymentOption/multiOptionRow', //alloy controller to load
				titleid: 'purchase_option',
				property: 'purchaseOptions',
				// options : {
				// 	labels : [ L('fmv'), L('currency_one'), L('fpo') ],
				// 	values : [ 'F', 'D', 'P' ]
				// },
				definitions: {
					F: L('fmv'),
					D: L('currency_one'),
					P: L('fpo')
				},
				order: 4
			}, {
				id: 'paymentFrequency',
				controller: 'paymentOption/paymentFrequencyRow', //alloy controller to load
				titleid: 'payment_frequency',
				property: 'paymentFrequency',
				// Thiss will need to adapt to different langs
				// options : {
				// 	labels : [ L('M_monthly'), L('Q_quarterly'), L('SA_semiannually'), L('A_annually') ],
				// 	values : [ 'M','Q','S','A' ]
				// },
				definitions: {
					M: L('M_monthly'),
					Q: L('Q_quarterly'),
					S: L('SA_semiannually'),
					A: L('A_annually')
				},
				order: 5
			}, {
				id: 'points',
				controller: 'paymentOption/pointsRow', //alloy controller to load
				titleid: 'points',
				property: 'points',
				order: 6
			}, {
				id: 'advancePayment',
				controller: 'paymentOption/advancePaymentPickerRow', //alloy controller to load
				titleid: 'advance_payments',
				property: 'advancePayment',
				order: 7
			}]
		}]
	},
	// Additional Costs options for the equipmentCost screen
	// Equipment Price and Amount Financed are not movable
	additionalCosts: {
		othc: {
			equipmentPrice: {
				titleid: 'equipment_price' //This is default if not specified
			},
			amountFinanced: {
				titleid: 'amount_financed' //This is default if not specified
			},
			rows: [{
				controller: 'additionalCosts/amountRow', //alloy controller to load
				titleid: 'additional_cost', //i18n id
				property: 'additionalCost' //model id
			}, {
				controller: 'additionalCosts/tradeupAmountRow', //alloy controller to load
				titleid: 'tradeup_amount', //i18n id
				property: 'tradeUpAmount'
			}, {
				controller: 'additionalCosts/amountRow', //alloy controller to load
				titleid: 'service_payment', //i18n id
				property: 'servicePayment'
			}]
		}
	},
	exportCSVColumns: ['rateCardCode', 'promoCode', 'purchaseOption', 'paymentFrequency', 'advancePayment',
		'advancePaymentType', 'term', 'min', 'max', 'paymentLevel', 'payments', 'points', 'rateFactor', 'expirationDate',
		'lastUpdated',
		'interestRate', 'deferral', 'versionId', 'vendorCodePoints', 'promoCodeName'
	],
	// Customer Screen configs
	customer: {
		zip: {
			titleid: 'zip',
			type: 'numeric',
			maxLength: 5,
			lookup: '[^0-9]',
			replacement: ''
		},
		state: {
			titleid: 'state',
			list: [
				'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
				'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA',
				'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE',
				'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK',
				'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
				'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
			]
		}
	},
	equipment: {
		// Nothing to do here… yet
	},
	summary: {
		categories: [{
				id: 'solutionInformation',
				controller: 'summary/equipmentInformation',
				titleid: 'solution'
			}, {
				id: 'customerInformation',
				controller: 'summary/customerInformation',
				titleid: 'customer_information'
			}, {
				id: 'paymentInformation',
				controller: 'summary/paymentInformation',
				titleid: 'payment'
			}, {
				id: 'contractAcceptance',
				controller: 'summary/contractAcceptance',
				titleid: 'contract_acceptance'
			}, {
				id: 'submit',
				controller: 'summary/submitView'
			}

		],

		authorizations: [{
			id: 'signature',
			summaryTitleid: 'signature',
			detailTitleid: 'please_sign_here',
			property: 'signature',
			controller: 'authorization/signatureWindow',
			isModal: true
		}, {
			id: 'ssn',
			summaryTitleid: 'ssn',
			detailTitleid: 'please_enter_social_security_number',
			format: '3-2-4',
			property: 'ssn',
			controller: 'authorization/ssnWindow'
		}, {
			id: 'dob',
			summaryTitleid: 'dob',
			detailTitleid: 'please_enter_date_of_birth',
			property: 'dob',
			controller: 'authorization/dobWindow'
		}, {
			id: 'license',
			summaryTitleid: 'id',
			detailTitleid: 'capture_photo_id',
			property: 'license',
			controller: 'authorization/driversLicenseWindow'
		}]
	},
	strings: {
		en: {
			monthly: 'Monthly',
			quarterly: 'Quarterly',
			semiannually: 'Semi-Annually',
			annually: 'Annually',
			new_str: 'New',
			used: 'Used',
			format_date: 'MM/DD/YYYY',
			format_date_full: 'MMMM DD, YYYY',
			dateSeparator: '/'
		}
	}
};
