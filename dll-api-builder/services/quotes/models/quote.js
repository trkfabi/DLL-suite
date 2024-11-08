const Arrow = require('@axway/api-builder-runtime');
const Quote = Arrow.createModel('quote', {
	description: 'Quotes',
	fields: {
		'alloy_id': {
			type: 'string',
			description: 'Id given to the local quote in the mobile app',
			required: false
		},
		'salesRepID': {
			type: 'string',
			description: 'ID if the SalesRep owning the quote',
			required: true
		},
		'name': {
			type: 'string',
			default: 'Name of the quote'
		},
		'isFavorited': {
			type: 'boolean',
			description: '1 if the quote is marked as favorite, 0 otherwise',
			default: false
		},
		'dateCreated': {
			type: 'string',
			description: 'Creation date of the quote',
			required: false
		},
		'contractDate': {
			type: 'string',
			description: 'Date of the quote\'s contract'
		},
		'deleted': {
			type: 'boolean',
			description: 'Flag to mark the quote as deleted',
			default: false,
			required: true
		},
		'submitStatus': {
			type: 'number',
			description: 'Status od the quote submission',
			default: 0
		},
		'modifiedDate': {
			type: 'string',
			description: 'Date the quote was last mosified'
		},
		'revision': {
			type: 'number',
			description: 'internal version of the quote\'s schema',
			default: 1
		},
		'paymentOptions': {
			type: 'array',
			description: 'List of payments',
			required: true,
			default: []
		},
		'customQuoteName': {
			type: 'string',
			description: 'Quote name to use instead of the customer name'
		},
		'customer': {
			type: 'object',
			description: 'Customer associated to this quote',
			required: true,
			default: {}
		},
		'equipments': {
			type: 'array',
			description: 'List of equipments quoted',
			required: true,
			default: []
		},
		'paymentOptionOpened': {
			type: 'string',
			description: 'Id of the payment currently opened',
			required: true
		},
		'paymentOptionSelected': {
			type: 'string',
			description: 'Id of the payment currently selected',
			required: true
		},
		'creditRatingId': {
			type: 'string',
			description: 'Id of the credit rating'
		},
		'creditRatingName': {
			type: 'string',
			description: 'Name of the credit rating'
		},
		'amountFinanced': {
			type: 'number',
			description: 'Amount quoted'
		},
		'expirationDate': {
			type: 'string',
			description: 'Date the quote will expire'
		},
		'pdfFileName': {
			type: 'string',
			description: 'Name of the PDF file to send by email',
			default: ''
		},
		'displayPaybackPercentage': {
			type: 'number',
			description: 'Number indicating if the payback % should show in PDFs, null/1 = show, 0/2 = do not show',
			default: 1
		},
		// Analytics
		'shareButtonTimesPressed': {
			type: 'number',
			description: 'Number indicating the count of the times changed, used for analytics',
			default: 0
		},
		'shareSummaryButtonTimesPressed': {
			type: 'number',
			description: 'Number indicating the count of the times changed, used for analytics',
			default: 0
		},
		'financedAmountTimesChanged': {
			type: 'number',
			description: 'Number indicating the count of the times changed, used for analytics',
			default: 0
		},
		'customerRecordTimesChanged': {
			type: 'number',
			description: 'Number indicating the count of the times changed, used for analytics',
			default: 0
		},
		'customerRecordCancelTimesChanged': {
			type: 'number',
			description: 'Number indicating the count of the times changed, used for analytics',
			default: 0
		},
		'creditRatingTimesChanged': {
			type: 'number',
			description: 'Number indicating the count of the times changed, used for analytics',
			default: 0
		},
		'creditRatingCancelTimesChanged': {
			type: 'number',
			description: 'Number indicating the count of the times changed, used for analytics',
			default: 0
		},
		'summaryQuoteValidTimesChanged': {
			type: 'number',
			description: 'Number indicating the count of the times changed, used for analytics',
			default: 0
		},
		'summaryFileNameTimesChanged': {
			type: 'number',
			description: 'Number indicating the count of the times changed, used for analytics',
			default: 0
		},
		'summaryDisplayPlaybackOnTimesChanged': {
			type: 'number',
			description: 'Number indicating the count of the times changed, used for analytics',
			default: 0
		},
		'summaryDisplayPlaybackOffTimesChanged': {
			type: 'number',
			description: 'Number indicating the count of the times changed, used for analytics',
			default: 0
		}
	},
	connector: 'mbs',
	actions: [
		'read',
		'update'
	],
	autogen: true
});
module.exports = Quote;
