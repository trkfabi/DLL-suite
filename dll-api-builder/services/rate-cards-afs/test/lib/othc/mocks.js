const {
	int,
	float,
	word
} = require('../reusable/random');

const mocks = {
	rateCard() {
		return {
			name: word(20)
		};
	},
	version() {
		return {
			terms: ['12', '24', '36', '48', '72'],
			cofs: [{
					'term': '12',
					'value': float(0, 1)
				},
				{
					'term': '24',
					'value': float(0, 1)
				},
				{
					'term': '36',
					'value': float(0, 1)
				},
				{
					'term': '48',
					'value': float(0, 1)
				},
				{
					'term': '72',
					'value': float(0, 1)
				}
			]
		};
	},
	rateProgram() {
		return {
			name: word(15),
			terms: ['12', '24', '36'],
			points: int(0, 5),
			purchaseOptions: ['F', 'P'],
			paymentFrequencies: ['M', 'A'],
			residuals: [{
					'term': '12',
					'purchaseOption': 'F',
					'value': float(0, 1)
				},
				{
					'term': '24',
					'purchaseOption': 'F',
					'value': float(0, 1)
				},
				{
					'term': '36',
					'purchaseOption': 'F',
					'value': float(0, 1)

				},
				{
					'purchaseOption': 'P',
					'value': float(0, 1)

				}
			],
			spreads: [{
					'term': '12',
					'amountRangeMin': 10000.00,
					'amountRangeMax': 19999.99,
					'value': float(0, 1)
				},
				{
					'term': '12',
					'amountRangeMin': 20000.00,
					'amountRangeMax': 1000000.00,
					'value': float(0, 1)
				},
				{
					'term': '24',
					'amountRangeMin': 10000.00,
					'amountRangeMax': 19999.99,
					'value': float(0, 1)
				},
				{
					'term': '24',
					'amountRangeMin': 20000.00,
					'amountRangeMax': 1000000.00,
					'value': float(0, 1)
				},
				{
					'term': '36',
					'amountRangeMin': 10000.00,
					'amountRangeMax': 19999.99,
					'value': float(0, 1)
				},
				{
					'term': '36',
					'amountRangeMin': 20000.00,
					'amountRangeMax': 1000000.00,
					'value': float(0, 1)
				}
			],
			amountRanges: [{
					'min': 10000.00,
					'max': 19999.99
				},
				{
					'min': 20000.00,
					'max': 1000000.00
				}
			]
		};
	},
	vendorCode() {
		return {
			name: word(15),
			points: int(0, 5),
		};
	}
};

module.exports = mocks;
