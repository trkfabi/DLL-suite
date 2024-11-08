const uuid = require('uuid/v4');
const moment = require('moment');

const {
	pick,
	collection,
	int,
	float,
	date,
	boolean,
	word,
	words,
} = require('./reusable/random');

const mocks = {
	quote() {
		const cr = pick(['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-', 'BB+', 'BB']);
		const paymentOptions = collection(mocks.payment, 1, 5);

		return {
			id: null,
			alloy_id: uuid(),
			amountFinanced: float(1000, 100000),
			contractDate: date(moment(), moment().add(30, 'days'), 'YYYY-MM-DD'),
			creditRatingId: cr,
			creditRatingName: cr,
			customQuoteName: words(25),
			customer: mocks.customer(),
			dateCreated: date(moment().subtract(30, 'days'), moment(), 'YYYY-MM-DD'),
			deleted: false,
			displayPaybackPercentage: int(0, 2),
			equipments: collection(mocks.equipment, 0, 10),
			expirationDate: date(moment().add(25, 'days'), moment().add(30, 'days'), 'YYYY-MM-DD'),
			isFavorited: boolean(),
			modifiedDate: moment().format(),
			name: words(25),
			paymentOptionOpened: pick(paymentOptions).id,
			paymentOptionSelected: pick(paymentOptions).id,
			paymentOptions: paymentOptions,
			pdfFileName: `${word(10)}.pdf`,
			revision: 1,
			submitStatus: int(0, 3),
			shareButtonTimesPressed: int(0, 3),
			shareSummaryButtonTimesPressed: int(0, 3),
			financedAmountTimesChanged: int(0, 3),
			customerRecordTimesChanged: int(0, 3),
			customerRecordCancelTimesChanged: int(0, 3),
			creditRatingTimesChanged: int(0, 3),
			creditRatingCancelTimesChanged: int(0, 3),
			summaryQuoteValidTimesChanged: int(0, 3),
			summaryFileNameTimesChanged: int(0, 3),
			summaryDisplayPlaybackOnTimesChanged: int(0, 3),
			summaryDisplayPlaybackOffTimesChanged: int(0, 3)
		};
	},
	customer() {
		return {
			name: words(25),
			firstName: words(25),
			middleName: words(25),
			lastName: words(25),
			legalName: words(25),
			contact: words(25),
			title: word(15),
			email: word(25),
			phone: word(25),
			contactAddressId: null,
			billingAddressId: null,
			maritalStatus: word(25),
			yearsAtAddress: int(0, 20),
			physicalAddress: words(25),
			physicalCity: words(25),
			physicalState: words(25),
			physicalZip: word(5),
			equipmentAddress: words(25),
			equipmentCity: words(25),
			equipmentState: words(25),
			equipmentZip: words(5),
			equipmentAddressSameAsPhysical: boolean()
		};
	},
	equipment() {
		return {
			id: uuid(),
			price: float(0, 10000),
			make: word(25),
			model: word(25),
			serialNumber: word(25),
			isUsed: boolean(),
			year: '' + int(2000, 2018),
			description: words(50),
			quantity: int(1, 25),
			tradeAllowance: float(0, 15000),
			tradePayoff: float(0, 15000),
			isTradein: boolean(),
			productId: uuid(),
			productName: words(25),
			unitPrice: float(0, 15000),
			extendedPrice: float(0, 15000),
		};
	},
	payment() {
		return {
			id: uuid(),
			equipmentCost: float(0, 15000),
			term: pick(['12', '24', '36', '48', '72']),
			additionalCost: float(0, 15000),
			amountFinanced: float(0, 15000),
			payment: float(0, 15000),
			rateCardName: words(25),
			rateFactor: float(0, 1),
			useRateCard: boolean(),
			purchaseOptions: pick(['F', 'P', 'D']),
			status: boolean(),
			paymentFrequency: pick(['M', 'A', 'SA', 'Q']),
			structure: null,
			tradeUpAmount: float(0, 15000),
			promoCode: words(25),
			promoName: words(25),
			advancePayment: words(25),
			advancePaymentType: words(25),
			points: int(0, 5),
			servicePayment: float(0, 15000),
			contractNumber: words(5, 15),
			advancePaymentAmount: float(0, 15000),
			lastRateCardUpdate: date(moment().subtract(25, 'days'), moment(), 'YYYY-MM-DD'),
			shouldRecalculate: boolean(),
			isOutdated: boolean(),
			termsTimesChanged: int(0, 3)
		};
	}
};

module.exports = mocks;
