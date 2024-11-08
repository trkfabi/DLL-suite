/**
 * @class Othc.submitHandler
 * @singleton
 * Handler for all the custom settings to follow when submitting a deal
 */
var rateCards = require('/rateCards');
var calculator = require('/calculations/calculator');
var sessionManager = require('/utils/sessionManager');

var OthcSubmitHandler = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	// +-------------------
	// | Public members.
	// +-------------------
	/**
	 * @method generateSubmitJSON
	 * Generates the expected JSON for submitting a Quote Model in OTHC
	 * @param {Object} _params
	 * @param {Models.quote} _params.quote Parameter to be used to generate information
	 * @param {Object[]} [_params.authorizationsData] Authorizations data to attach
	 * @return {Object} Return generated data to be used for submit it
	 */
	var generateSubmitJSON = function (_params) {
		_params = _params || {};

		var quote = _params.quote;
		var authorizationsData = _params.authorizationsData || [];
		var salesRep = sessionManager.getSalesRep();
		var vendorCode = salesRep.get('vendorCode');
		// analytics.captureApm('[OthcSubmitHandler] - generateSubmitJSON()');

		var documents = [];
		var selectedPayment = quote.getSelectedPaymentOption();
		var customer = quote.get('customer');
		var json = {
			'quote': quote.toJSON({
				removeNested: true
			}),
			'customer': quote.get('customer').toJSON(),
			'paymentOption': selectedPayment.toJSON(),
			'equipment': quote.get('equipments').toJSON()
		};

		json.customer.legalName = customer.getLegalName();
		json.paymentOption.term = rateCards.getRealTermForPaymentOption(selectedPayment);
		json.paymentOption.advancePaymentAmount = calculator.calculateAdvancePaymentAmount(selectedPayment);
		json.paymentOption.promoCode = vendorCode + ':' + json.paymentOption.promoCode;

		_.each(Alloy.Globals.submitDocs, function (_docName) {
			var _type = '';
			var _docFileName = quote.get(_docName) || '';
			var _docFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, _docFileName);

			if (_docFileName && _docFile.exists()) {
				var docName = _docFile.name;

				if (docName.indexOf('othc_quote') !== -1) {
					_type = 'LEASECONTRACT';
				}
				if (docName.indexOf('othc_proposal') !== -1) {
					_type = 'PROPOSAL';
				}

				documents.push({
					content: Ti.Utils.base64encode(_docFile.read()).toString().replace(/\s\n/g, ''),
					contentType: 'application/pdf',
					type: _type
				});
				_docFile = null;
			}
		});

		if (authorizationsData) {
			_.each(authorizationsData, function (_authorization) {
				if (_authorization.hasData) {
					switch (_authorization.id) {
					case 'ssn':
						json.customer.ssn = _authorization.ssn;
						break;
					case 'dob':
						json.customer.dob = _authorization.dob.toString();
						break;
					}
				}
			});
		}

		json.documents = documents;

		// doLog && console.debug('[OthcSubmitHandler] - generateSubmitJSON() - json: ' + JSON.stringify(json));

		return json;

	};

	return {
		generateSubmitJSON: generateSubmitJSON
	};
})();

module.exports = OthcSubmitHandler;
