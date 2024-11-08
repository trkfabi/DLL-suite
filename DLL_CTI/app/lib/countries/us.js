/**
 * @class Lib.countries.US (United States)
 * Config json for US app settings
 * @revision 1
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
				localFile: 'LOGO_GENERIC.jpg'
			},
			credit: {
				type: 'TEMPLATE',
				className: 'CREDITAPP',
				messageid: 'credit_application',
				isRequired: true,
				hasTerms: true,
				localFile: '/htmls/en-US/AGCO-CreditApp-v10.0.html'
			},
			lease: {
				type: 'TEMPLATE',
				className: 'LEASEQUOTE',
				messageid: 'lease_quotes',
				isRequired: true,
				localFile: '/htmls/en-US/AGCO_Finance_Quote_Template_-_Lease_v10.0.html'
			},
			finance: {
				type: 'TEMPLATE',
				className: 'FINANCEQUOTE',
				messageid: 'finance_quotes',
				isRequired: true,
				localFile: '/htmls/en-US/AGCO_Finance_Quote_Template_-_Doc_v10.0.html'
			},
			terms: {
				type: 'TERMS',
				className: 'TERMS',
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
					type: 'custom', //amount/custom
					controller: 'additionalCosts/insuranceRow', //alloy controller to load
					// For custom controllers, these properties may be ignored and
					// using harcorded values on the controller
					titleid: 'insurance', //i18n id
					property: 'insurance'
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
					type: 'custom', //amount/custom
					controller: 'additionalCosts/insuranceRow', //alloy controller to load
					titleid: 'insurance', //i18n id
					property: 'insurance'
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
			titleid: 'zip',
			type: 'numeric',
			// lookup : '([.]{0,5})',
			// replacement : '$1',
			maxLength: 5
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
		customerTypes: [{
				title: L('individual'),
				value: 'IND'
			},
			{
				title: L('limited_liability_company'),
				value: 'LLC'
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
				summaryTitleid: 'ssn',
				detailTitleid: 'please_enter_social_security_number',
				format: '3-2-4',
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
		}
	}
};
