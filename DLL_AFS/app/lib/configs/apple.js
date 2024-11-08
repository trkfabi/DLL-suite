/**
 * @class Configs.apple
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
				localFile: 'AFS_logo_pdf.jpg'
			},
			credit: {
				type: 'TEMPLATE',
				className: 'LEASECONTRACT',
				messageid: 'lease_contract',
				isRequired: true,
				hasTerms: true,
				localFile: '/htmls/en-US/apple_quote.html'
			}
		}
	},
	basePath: 'apple/',
	pdf: {
		handler: 'apple/pdfHandler'
	},
	rateCards: {
		handler: 'apple/rateCards'
	},
	calculations: {
		calculator: 'apple/calculator',
		manager: 'apple/calculatorManager'
	},
	submit: {
		handler: 'apple/submitHandler'
	},
	quoteList: {
		quoteRow: {
			controller: 'apple/quoteList/quoteRow'
		}
	},
	settings: {
		sections: [{
			controller: 'apple/settings/salesRepView'
		}]
	},
	// Payment Options for each PaymentOption Row
	quoteView: {
		controller: 'apple/main/quoteView'
	},
	exportCSVColumns: ['rateCardCode', 'productId', 'term', 'creditRating', 'rate', 'rateFactor', 'points', 'vendorCode',
		'versionId', 'lastUpdated'
	],
	// Customer Screen configs
	customer: {
		zip: {
			titleid: 'zip',
			type: 'integer',
			maxLength: 5,
			lookup: '[^0-9]',
			replacement: ''
		},
		state: {
			titleid: 'state',
			list: [{
				id: '',
				value: '',
				name: L('select_state'),
				customColor: Alloy.Globals.colors.silver
			}, {
				id: 'AL',
				value: 'AL',
				name: 'Alabama'
			}, {
				id: 'AK',
				value: 'AK',
				name: 'Alaska'
			}, {
				id: 'AZ',
				value: 'AZ',
				name: 'Arizona'
			}, {
				id: 'AR',
				value: 'AR',
				name: 'Arkansas'
			}, {
				id: 'CA',
				value: 'CA',
				name: 'California'
			}, {
				id: 'CO',
				value: 'CO',
				name: 'Colorado'
			}, {
				id: 'CT',
				value: 'CT',
				name: 'Connecticut'
			}, {
				id: 'DC',
				value: 'DC',
				name: 'District Of Columbia'
			}, {
				id: 'DE',
				value: 'DE',
				name: 'Delaware'
			}, {
				id: 'FL',
				value: 'FL',
				name: 'Florida'
			}, {
				id: 'GA',
				value: 'GA',
				name: 'Georgia'
			}, {
				id: 'HI',
				value: 'HI',
				name: 'Hawaii'
			}, {
				id: 'ID',
				value: 'ID',
				name: 'Idaho'
			}, {
				id: 'IL',
				value: 'IL',
				name: 'Illinois'
			}, {
				id: 'IN',
				value: 'IN',
				name: 'Indiana'
			}, {
				id: 'IA',
				value: 'IA',
				name: 'Iowa'
			}, {
				id: 'KS',
				value: 'KS',
				name: 'Kansas'
			}, {
				id: 'KY',
				value: 'KY',
				name: 'Kentucky'
			}, {
				id: 'LA',
				value: 'LA',
				name: 'Louisiana'
			}, {
				id: 'ME',
				value: 'ME',
				name: 'Maine'
			}, {
				id: 'MD',
				value: 'MD',
				name: 'Maryland'
			}, {
				id: 'MA',
				value: 'MA',
				name: 'Massachusetts'
			}, {
				id: 'MI',
				value: 'MI',
				name: 'Michigan'
			}, {
				id: 'MN',
				value: 'MN',
				name: 'Minnesota'
			}, {
				id: 'MS',
				value: 'MS',
				name: 'Mississippi'
			}, {
				id: 'MO',
				value: 'MO',
				name: 'Missouri'
			}, {
				id: 'MT',
				value: 'MT',
				name: 'Montana'
			}, {
				id: 'NE',
				value: 'NE',
				name: 'Nebraska'
			}, {
				id: 'NV',
				value: 'NV',
				name: 'Nevada'
			}, {
				id: 'NH',
				value: 'NH',
				name: 'New Hampshire'
			}, {
				id: 'NJ',
				value: 'NJ',
				name: 'New Jersey'
			}, {
				id: 'NM',
				value: 'NM',
				name: 'New Mexico'
			}, {
				id: 'NY',
				value: 'NY',
				name: 'New York'
			}, {
				id: 'NC',
				value: 'NC',
				name: 'North Carolina'
			}, {
				id: 'ND',
				value: 'ND',
				name: 'North Dakota'
			}, {
				id: 'OH',
				value: 'OH',
				name: 'Ohio'
			}, {
				id: 'OK',
				value: 'OK',
				name: 'Oklahoma'
			}, {
				id: 'OR',
				value: 'OR',
				name: 'Oregon'
			}, {
				id: 'PA',
				value: 'PA',
				name: 'Pennsylvania'
			}, {
				id: 'RI',
				value: 'RI',
				name: 'Rhode Island'
			}, {
				id: 'SC',
				value: 'SC',
				name: 'South Carolina'
			}, {
				id: 'SD',
				value: 'SD',
				name: 'South Dakota'
			}, {
				id: 'TN',
				value: 'TN',
				name: 'Tennessee'
			}, {
				id: 'TX',
				value: 'TX',
				name: 'Texas'
			}, {
				id: 'UT',
				value: 'UT',
				name: 'Utah'
			}, {
				id: 'VT',
				value: 'VT',
				name: 'Vermont'
			}, {
				id: 'VA',
				value: 'VA',
				name: 'Virginia'
			}, {
				id: 'WA',
				value: 'WA',
				name: 'Washington'
			}, {
				id: 'WV',
				value: 'WV',
				name: 'West Virginia'
			}, {
				id: 'WI',
				value: 'WI',
				name: 'Wisconsin'
			}, {
				id: 'WY',
				value: 'WY',
				name: 'Wyoming'
			}]
		}
	},
	summary: {
		categories: [{
				id: 'customerInformation',
				controller: 'apple/summary/customerInformation',
				titleid: 'customer_information'
			}, {
				id: 'solutionInformation',
				controller: 'apple/summary/productInfoView',
				titleid: 'Products/Services'
			}, {
				id: 'paymentInformation',
				controller: 'apple/summary/paymentInfoView',
				titleid: 'payment'
			}, {
				id: 'quoteOptions',
				controller: 'apple/summary/quoteOptionsView',
				titleid: 'quote_options'
			},
			{
				id: 'submitButtonView',
				controller: 'apple/summary/submitButtonView'
			}
		],

		authorizations: [

		]
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
