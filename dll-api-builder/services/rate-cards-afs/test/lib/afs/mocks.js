const {
	int,
	float,
	boolean,
	word,
	words,
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
			inputs: [{
					'terms': {
						'12': float(0, 1),
						'24': float(0, 1),
						'36': float(0, 1),
						'48': float(0, 1),
						'72': float(0, 1),
					},
					'name': 'FMV',
					'type': 'cof',
				},
				{
					'terms': {
						'12': float(0, 1),
						'24': float(0, 1),
						'36': float(0, 1),
						'48': float(0, 1),
						'72': float(0, 1),
					},
					'name': '$1 Out',
					'type': 'cof',
				},
				{
					'terms': {
						'12': float(0, 1),
						'24': float(0, 1),
						'36': float(0, 1),
						'48': float(0, 1),
						'72': float(0, 1),
					},
					'name': 'AAA to AA',
					'type': 'spread',
				},
				{
					'terms': {
						'12': float(0, 1),
						'24': float(0, 1),
						'36': float(0, 1),
						'48': float(0, 1),
						'72': float(0, 1),
					},
					'name': 'AA- to A-',
					'type': 'spread',
				},
				{
					'terms': {
						'12': float(0, 1),
						'24': float(0, 1),
						'36': float(0, 1),
						'48': float(0, 1),
						'72': float(0, 1),
					},
					'name': 'BBB+ to BBB-',
					'type': 'spread',
				},
				{
					'terms': {
						'12': float(0, 1),
						'24': float(0, 1),
						'36': float(0, 1),
						'48': float(0, 1),
						'72': float(0, 1),
					},
					'name': 'BB+ to BB',
					'type': 'spread',
				}
			]
		};
	},
	category() {
		return {
			name: words(25)
		};
	},
	product() {
		return {
			name: words(25),
			hasItad: boolean(),
			itadValue: float(0, 2000),
			terms: {
				'12': float(0, 1),
				'24': float(0, 1),
				'36': float(0, 1),
				'48': float(0, 1),
				'72': float(0, 1),
			}
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
