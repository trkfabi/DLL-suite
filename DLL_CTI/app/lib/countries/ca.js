/**
 * @class Lib.countries.Ca (Canada)
 * Config json for Canada app settings
 * @revision 1
 */
module.exports = {
	// Countries to be supported on the settings screen
	languages: [{
			key: 'en',
			language: L('english'),
			locale: 'en-CA'
		},
		{
			key: 'fr',
			language: L('french'),
			locale: 'fr-CA'
		},
	],
	customizations: {
		en: {
			logo: {
				type: 'LOGO',
				className: 'GENERIC',
				messageid: 'logo',
				localFile: '/LOGO_GENERIC.jpg'
			},
			credit: {
				type: 'TEMPLATE',
				className: 'CREDITAPP_CN-EN',
				messageid: 'credit_application',
				isRequired: true,
				hasTerms: true,
				localFile: '/htmls/en-CA/AGCO-CreditApp-v10.0_CN-EN.html'
			},
			lease: {
				type: 'TEMPLATE',
				className: 'LEASEQUOTE_CN-EN',
				messageid: 'lease_quotes',
				isRequired: true,
				localFile: '/htmls/en-CA/AGCO_Finance_Quote_Template_-_Lease_v10.0_CN-EN.html'
			},
			finance: {
				type: 'TEMPLATE',
				className: 'FINANCEQUOTE_CN-EN',
				messageid: 'finance_quotes',
				isRequired: true,
				localFile: '/htmls/en-CA/AGCO_Finance_Quote_Template_-_Doc_v10.0_CN-EN.html'
			},
			terms: {
				type: 'TERMS_CN-EN',
				className: 'TERMS_CN-EN',
				messageid: 'terms_and_conditions',
				isRequired: true
			}

		},
		fr: {
			logo: {
				type: 'LOGO',
				className: 'GENERIC',
				messageid: 'logo',
				localFile: '/LOGO_GENERIC.jpg'
			},
			credit: {
				type: 'TEMPLATE',
				className: 'CREDITAPP_CN-FR',
				messageid: 'credit_application',
				isRequired: true,
				hasTerms: true,
				localFile: '/htmls/fr-CA/AGCO-CreditApp-v10.0_CN-FR.html'
			},
			lease: {
				type: 'TEMPLATE',
				className: 'LEASEQUOTE_CN-FR',
				messageid: 'lease_quotes',
				isRequired: true,
				localFile: '/htmls/fr-CA/AGCO_Finance_Quote_Template_-_Lease_v10.0_CN-FR.html'
			},
			finance: {
				type: 'TEMPLATE',
				className: 'FINANCEQUOTE_CN-FR',
				messageid: 'finance_quotes',
				isRequired: true,
				localFile: '/htmls/fr-CA/AGCO_Finance_Quote_Template_-_Doc_v10.0_CN-FR.html'
			},
			terms: {
				type: 'TERMS_CN-FR',
				className: 'TERMS_CN-FR',
				messageid: 'terms_and_conditions',
				isRequired: true
			}

		}
	},
	// Payment Options for each PaymentOption Row
	payment: {
		categories: [{
				id: 'general',
				rows: [{
						type: 'percentage',
						controller: 'paymentOption/amountRow', //alloy controller to load
						titleid: 'interest_rate',
						property: 'interestRate'
					},
					{
						type: 'multiOption',
						controller: 'paymentOption/multiOptionRow', //alloy controller to load
						titleid: 'term',
						property: 'term',
						options: {
							'24': '24',
							'36': '36',
							'48': '48',
							'60': '60',
							'72': '72',
							'84': '84'
						}
					},
					{
						type: 'multiOption',
						controller: 'paymentOption/multiOptionRow', //alloy controller to load
						titleid: 'payment_frequency',
						property: 'paymentFrequency',
						// Thiss will need to adapt to different langs
						options: {
							'M': 'M',
							'Q': 'Q',
							'SA': 'SA',
							'A': 'A'
						}
					}
				]
			},
			{
				id: 'balloon',
				// If not specified: header won't appear
				titleid: 'modify_standard_payment',
				// The category will appear only when the given additional cost mode is selected
				// Can be array or String
				// If no specified, will always appear
				additionalCosts: 'lease',
				rows: [{
					type: 'amount',
					controller: 'paymentOption/amountRow', //alloy controller to load
					titleid: 'balloon',
					property: 'balloon',
					hintTextid: 'balloon'
				}]
			},
			{
				id: 'costs',
				titleid: 'cost_per_amount',
				rows: [{
					type: 'cost',
					controller: 'paymentOption/multiOptionRow', //alloy controller to load
					titleid: 'payment_frequency',
					property: 'paymentFrequency',
					// Thiss will need to adapt to different langs
					options: {
						'M': 'M',
						'Q': 'Q',
						'SA': 'SA',
						'A': 'A'
					}
				}]
			}
		]
	},
	// Additional Costs options for the equipmentCost screen
	// Equipment Price and Amount Financed are not movable
	additionalCosts: {
		// Finance Options
		finance: {
			titleid: 'finance_uppercase',
			equipmentPrice: {
				titleid: 'equipment_price' //This is default if not specified
			},
			amountFinanced: {
				titleid: 'amount_financed' //This is default if not specified
			},
			rows: [{
					type: 'amount', //amount/custom
					controller: 'additionalCosts/amountRow', //alloy controller to load
					titleid: 'cash_down', //i18n id
					property: 'cashDown' //model id
				},
				{
					type: 'amount', //amount/custom
					controller: 'additionalCosts/amountRow', //alloy controller to load
					titleid: 'trade_allowance', //i18n id
					property: 'tradeAllowance'
				},
				{
					type: 'amount', //amount/custom
					controller: 'additionalCosts/amountRow', //alloy controller to load
					titleid: 'trade_pay_off', //i18n id
					property: 'tradePayoff'
				},
				{
					type: 'amount', //amount/custom
					controller: 'additionalCosts/amountRow', //alloy controller to load
					titleid: 'fees', //i18n id
					property: 'fees'
				},
				{
					type: 'custom', //amount/custom
					controller: 'additionalCosts/taxesRow',
					titleid: 'taxes', //i18n id
					property: 'taxes'
				}
			]
		},
		// Lease Options
		lease: {
			titleid: 'lease_uppercase',
			equipmentPrice: {
				titleid: 'equipment_price' //This is default if not specified
			},
			amountFinanced: {
				titleid: 'leased_property_value'
			},
			rows: [{
					type: 'custom', //amount/custom
					controller: 'additionalCosts/residualRow',
					titleid: 'residual_value', //i18n id
					property: 'residualValue'
				},
				{
					type: 'amount', //amount/custom
					controller: 'additionalCosts/amountRow', //alloy controller to load
					titleid: 'adv_payment', //i18n id
					property: 'advancePayments',
					readOnly: true // Property needed for amountRow controller
				},
				{
					type: 'custom', //amount/custom
					controller: 'additionalCosts/taxOnAdvanceRow',
					titleid: 'tax_on_advance', //i18n id
					property: 'taxOnDavance'
				},
				{
					type: 'amount', //amount/custom
					controller: 'additionalCosts/amountRow', //alloy controller to load
					titleid: 'fees', //i18n id
					property: 'fees'
				}
			]
		}
	},
	// Customer Screen configs
	customer: {
		zip: {
			titleid: 'postal_code',
			type: 'text',
			lookup: '([a-zA-Z0-9]{3})([a-zA-Z0-9]{1,3})',
			replacement: '$1 $2',
			maxLength: 7
		},
		state: {
			titleid: 'province',
			list: ['ON', 'QC', 'NS', 'NB', 'MB', 'BC', 'PE', 'SK', 'AB', 'NL']
		}
	},
	equipment: {
		// Nothing to do here… yet
	},
	summary: {
		customerTypes: [{
				title: L('individual'),
				value: 'IND'
			},
			{
				title: L('corporation'),
				value: 'CCRP'
			},
			{
				title: L('general_partnership'),
				value: 'GPRT'
			},
			{
				title: L('limited_partnership'),
				value: 'LPRT'
			}
		],
		authorizations: [{
				type: 'signature',
				summaryTitleid: 'signature',
				detailTitleid: 'please_sign_here',
				controller: 'authorization/signatureWindow',
			},
			{
				type: 'ssn',
				summaryTitleid: 'sin',
				detailTitleid: 'please_enter_social_insurance_number',
				format: '3-3-3',
				controller: 'authorization/ssnWindow'
			},
			{
				type: 'dob',
				summaryTitleid: 'dob',
				detailTitleid: 'please_enter_date_of_birth',
				controller: 'authorization/dobWindow'
			},
			{
				type: 'id',
				summaryTitleid: 'id',
				detailTitleid: 'capture_photo_id',
				controller: 'authorization/driversLicenseWindow'
			}
		],
		// We may need to adapt it so it load all the rows from this data
		categories: []
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
		},
		fr: {
			monthly: 'Mensuel',
			quarterly: 'Trimestriel',
			semiannually: 'Semi-Annuel',
			annually: 'Annuel',
			new_str: 'Neuf',
			used: 'Usagé',
			format_date: 'DD/MM/YYYY',
			format_date_full: 'MMMM DD, YYYY',
			dateSeparator: '/'
		}
	}
};
