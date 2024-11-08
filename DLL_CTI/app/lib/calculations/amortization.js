var analytics = require('/utils/analytics');
/**
 * # Amortization Module
 * Performs amortization calculations for Lease and Finance Deals
 * @class Lib.calculations.amortization
 * @singleton
 */
var amortization = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	// +-------------------
	// | Public members.
	// +-------------------

	/**
	 * @method getInterestStartDate
	 * @public
	 * Retrieves the interest start date based on contract date.
	 * 
	 * Rules:
	 * contract dates between 2 & 15 have an interestStartDate of 15th same month
	 * contract dates 16 and up or 1st of the month have an interestStartDate of 1st next month
	 *
	 * @param {Object} _params 
	 * @param {models/paymentOption} params.payment Payment Option model
	 * @param {moment.js} [params.contractDate=payment.get('contractDate')] Contract Date
	 * @return {moment.js} Interest Start Date
	 */
	function getInterestStartDate(_params) {
		var params = _params || {};
		var payment = params.payment;
		var interestStartDate;

		if (payment) {
			var contractDate = params.contractDate || new moment(new Date(payment.get('contractDate')));
			doLog && console.log('[amortization] - getInterestStartDate() - contractDate: ' + contractDate.toString());

			interestStartDate = new moment().startOf('day');
			var contractDay = contractDate.date();

			if (contractDay >= 2 && contractDay <= 15) {
				interestStartDate.date(15);
			} else {
				interestStartDate.date(1).add('months', 1);
			}

		}

		analytics.captureApm('[amortization] - getInterestStartDate() - interestStartDate: ' + interestStartDate.toString());

		return interestStartDate;
	};

	/**
	 * @method getFirstPaymentDueDate
	 * @public
	 * Retrieves the first payment due date.
	 * it should be 1, 3, 6, 12 months after the interest start date, depends on payment frequency
	 * @param {Object} _params 
	 * @param {models/paymentOption} params.payment Payment Option model
	 * @param {moment.js} [params.interestStartDate=amortization.getInterestStartDate(params)] Interest Start Date
	 * @param {String} [params.paymentFrequency=payment.get('paymentFrequency')] Payment Frequency
	 * @return {moment.js} First Payment Due Date
	 */
	function getFirstPaymentDueDate(_params) {
		var params = _params || {};
		var payment = params.payment;
		var firstPaymentDue;

		if (payment) {
			var interestStartDate = params.interestStartDate || getInterestStartDate(params);
			var paymentFrequency = params.paymentFrequency || payment.get('paymentFrequency');
			doLog && console.log('[amortization] - getFirstPaymentDueDate() - interestStartDate: ' + interestStartDate.toString());
			firstPaymentDue = new moment(interestStartDate);
			var extraMonths = 0;

			switch (paymentFrequency) {
			case 'M':
				extraMonths = 1;
				break;
			case 'Q':
				extraMonths = 3;
				break;
			case 'SA':
				extraMonths = 6;
				break;
			case 'A':
				extraMonths = 12;
				break;
			}

			firstPaymentDue.add('months', extraMonths);
		}

		analytics.captureApm('[amortization] - getFirstPaymentDueDate() - firstPaymentDue: ' + firstPaymentDue.toString());

		return firstPaymentDue;
	};

	/**
	 * @method getTotalPayments
	 * @public
	 * Retrieves the total amount of the payments to be done.
	 * @param {Object} params 
	 * @param {models/paymentOption} params.payment Payment Option model
	 * @param {String} [params.paymentFrequency=payment.get('paymentFrequency')] Payment Frequency
	 * @param {String} [params.term=payment.get('term')] Payment Term
	 * @return {Number} Number of Total Payments to do.
	 */
	function getTotalPayments(_params) {
		var params = _params || {};
		var payment = params.payment;
		var totalPayments = 0;

		if (payment) {
			var paymentFrequency = params.paymentFrequency || payment.get('paymentFrequency');
			analytics.captureApm('[amortization] - getTotalPayments() - paymentFrequency: ' + paymentFrequency);
			var term = params.term || payment.get('term');

			var frequency = 1;

			switch (paymentFrequency) {
			case 'M':
				frequency = 1;
				break;
			case 'Q':
				frequency = 3;
				break;
			case 'SA':
				frequency = 6;
				break;
			case 'A':
				frequency = 12;
				break;
			}

			totalPayments = term / frequency - 1;

			if (payment.isLease()) {
				switch (paymentFrequency) {
				case 'SA':
				case 'A':
					totalPayments--;
					break;
				}
			}

		}

		analytics.captureApm('[amortization] - getTotalPayments() - totalPayments: ' + totalPayments);

		return totalPayments;

	};

	/**
	 * @method getTotalPaymentsAmount
	 * @public
	 * Calculates the total amount from adding all of the payments calculated from the amortization object
	 * @param {Object} _params 
	 * @param {models/paymentOption} params.payment Payment Option model
	 * @param {String} [params.paymentFrequency=payment.get('paymentFrequency')] Payment Frequency
	 * @param {String} [params.term=payment.get('term')] Payment Term
	 * @param {Number} [params.paymentAmount=payment.get('payment')] Payment Amount
	 * @return {Number} Total Amount to pay from the Total number of Payments to do.
	 */
	function getTotalPaymentsAmount(_params) {
		var params = _params || {};
		var payment = params.payment;
		var totalPaymentsAmount = 0;

		if (payment) {
			var paymentAmount = params.paymentAmount || payment.get('payment');
			var totalPayments = Number(getTotalPayments(params));

			if (!payment.isLease() && !payment.get('balloon')) {
				totalPayments++;
			}

			totalPaymentsAmount = totalPayments * Number(paymentAmount);

			if (!payment.isLease() && payment.get('balloon')) {
				totalPaymentsAmount += Number(payment.get('balloon'));
			}

		}

		analytics.captureApm('[amortization] - getTotalPaymentsAmount() - totalPaymentsAmount: ' + totalPaymentsAmount);

		return totalPaymentsAmount;

	};

	/**
	 * @method getAmortizationInfo
	 * @public
	 * Calculates the whole amortization for the specified Payment Option
	 * @param {Object} _params 
	 * @param {models/paymentOption} params.payment Payment Option model
	 * @param {Number} [params.amountFinanced=payment.get('amountFinanced')] Amount Financed
	 * @param {Number} [params.paymentAmount=payment.get('payment')] Payment Amount
	 * @param {Number} [params.interestRate=payment.get('interestRate') / 100] Interest Rate, as scale from 0 - 1
	 * @param {String} [params.paymentFrequency=payment.get('paymentFrequency')] Payment Frequency
	 * @param {Number} [params.balloon=payment.get('balloon')] Balloon Amount
	 *
	 * @return {Object} Amortization Object
	 */
	function getAmortizationInfo(_params) {
		analytics.captureApm('[amortization] - getAmortizationInfo()');
		var params = _params || {};
		var amortization = {};
		var payment = params.payment;

		if (payment) {
			var isLease = payment.isLease() || false;
			var contractDate = (payment.get('contractDate') ? new Date(payment.get('contractDate')) : new Date());
			contractDate = params.contractDate || new moment(contractDate);
			params.contractDate = contractDate;
			var interestStartDate = getInterestStartDate(params);
			params.interestStartDate = interestStartDate;
			var firstPaymentDueDate = getFirstPaymentDueDate(params);
			var amountFinanced = params.amountFinanced || payment.get('amountFinanced');
			var totalPayments = getTotalPayments(params);
			var paymentAmount = params.paymentAmount || payment.get('payment');
			var interestRate = (params.interestRate || payment.get('interestRate') || 0) / 100;
			var paymentFrequency = params.paymentFrequency || payment.get('paymentFrequency');
			var frequency = 1;
			var totalPaymentsAmount = 0;
			var totalIntertestsAmount = 0;
			var scheduleRow;

			switch (paymentFrequency) {
			case 'M':
				frequency = 1;
				break;
			case 'Q':
				frequency = 3;
				break;
			case 'SA':
				frequency = 6;
				break;
			case 'A':
				frequency = 12;
				break;
			}

			var scheduleLastValues = {
				date: interestStartDate,
				payment: paymentAmount,
				interest: 0,
				principal: 0,
				balance: amountFinanced
			};

			amortization.contractDate = contractDate.clone();
			amortization.interestStartDate = interestStartDate.clone();
			amortization.firstPaymentDueDate = firstPaymentDueDate.clone();
			amortization.schedule = [];

			for (var i = 0, j = totalPayments; i < j; i++) {
				var interest = scheduleLastValues.balance * (interestRate / 360 * 30) * frequency;
				var principal = scheduleLastValues.payment - interest;

				scheduleRow = {
					index: i + 1,
					date: scheduleLastValues.date.clone().add('months', frequency),
					payment: scheduleLastValues.payment,
					interest: interest,
					principal: principal,
					balance: scheduleLastValues.balance - principal
				};

				totalPaymentsAmount += scheduleRow.payment;
				totalIntertestsAmount += scheduleRow.interest;

				scheduleLastValues = _.clone(scheduleRow);

				amortization.schedule.push(scheduleRow);

			}

			scheduleRow = {
				index: totalPayments,
				date: scheduleLastValues.date.clone().add('months', frequency),
				payment: !isLease ? (params.balloon || payment.get('balloon') || paymentAmount) : paymentAmount,
				interest: scheduleLastValues.balance * (interestRate / 360 * 30) * frequency,
				principal: scheduleLastValues.balance,
				balance: 0
			};

			totalPaymentsAmount += scheduleRow.payment;
			totalIntertestsAmount += scheduleRow.interest;

			var interestDifference = totalPaymentsAmount - amountFinanced - totalIntertestsAmount;
			scheduleRow.interest += interestDifference;

			amortization.schedule.push(scheduleRow);
			amortization.lastPaymentDate = scheduleRow.date.clone();

			amortization.numberOfPayments = amortization.schedule.length;

		}

		// doLog && console.log('[amortization] - getAmortizationInfo() - amortization: ' + JSON.stringify(amortization, null, '\t'));

		return amortization;

	};

	// Public API.
	return {
		getInterestStartDate: getInterestStartDate,
		getFirstPaymentDueDate: getFirstPaymentDueDate,
		getTotalPayments: getTotalPayments,
		getTotalPaymentsAmount: getTotalPaymentsAmount,
		getAmortizationInfo: getAmortizationInfo
	};
})();

module.exports = amortization;
