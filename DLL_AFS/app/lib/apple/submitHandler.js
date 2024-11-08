/**
 * @class Apple.submitHandler
 * Description
 * @singleton
 * @uses Helpers.stringFormatter
 */

var doLog = Alloy.Globals.doLog;
var stringFormatter = require('/helpers/stringFormatter');

var AppleSubmitHandler = (function () {
	// +-------------------
	// | Private members.
	// +-------------------

	// +-------------------
	// | Public members.
	// +-------------------

	var generateSubmitJSON = function (_params) {
		_params = _params || {};
		var quote = _params.quote;

		var documents = [];
		var equipments = [];
		var selectedPayment = quote.getSelectedPaymentOption();
		var customer = quote.get('customer');
		var json = {
			'quote': quote.toJSON({
				removeNested: true
			}),
			'customer': quote.get('customer').toJSON(),
			'paymentOption': selectedPayment.toJSON(),
			'equipment': []
		};

		json.customer.legalName = customer.getLegalName();

		json.paymentOption.equipmentCost = json.paymentOption.amountFinanced;
		json.paymentOption.rateFactor = stringFormatter.formatDecimal(json.paymentOption.rateFactor, '', '#.000000');

		quote.get('equipments').each(function (_equipment) {
			var quantity = _equipment.get('quantity');
			equipments.push({
				description: _equipment.get('description'),
				type: null,
				manufacturer: null,
				model: _equipment.get('productName'),
				quantity: quantity,
				location: null
			});

			if (_equipment.hasItad()) {
				var itadRate = _equipment.getItadRate();

				equipments.push({
					description: '',
					type: null,
					manufacturer: null,
					model: itadRate.name,
					quantity: quantity,
					location: null
				});
			}
		});

		json.equipment = equipments;

		_.each(Alloy.Globals.submitDocs, function (_docName) {
			var _type = '';
			var _docFileName = quote.get(_docName) || '';
			var _docFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, _docFileName);

			if (_docFileName && _docFile.exists()) {
				var docName = _docFile.name;

				if (docName.indexOf('othc_quote') !== -1) {
					_type = 'LEASECONTRACT';
				}

				documents.push({
					content: Ti.Utils.base64encode(_docFile.read()).toString().replace(/\s\n/g, ''),
					contentType: 'application/pdf',
					type: _type
				});
				_docFile = null;
			}
		});

		json.documents = documents;

		// doLog && console.debug('[AppleSubmitHandler] - generateSubmitJSON() - json: ' + JSON.stringify(json));

		return json;
	};

	return {
		generateSubmitJSON: generateSubmitJSON
	};
})();

module.exports = AppleSubmitHandler;
