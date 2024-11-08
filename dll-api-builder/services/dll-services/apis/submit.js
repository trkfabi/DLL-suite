const _ = require('lodash');
const util = require('util');
const Arrow = require('@axway/api-builder-runtime');
const Helpers = require('../lib/helpers');
const SoapManager = require('../lib/soapManager');
const {
	handleError
} = require('../lib/reusable/helpers');

const LOG_TAG = '\x1b[31m' + '[apis/submit]' + '\x1b[39;49m ';

const CONTENT_ENCODING = 'Base64';
const DEFAULT = {
	NULL: null,
	EMPTY: ''
};
const COST_TYPE = 'AD';
const CONDITION = {
	NEW: 'NEW',
	USED: 'USED'
};

/**
 * @method submitApplication
 * Submits a quote to DLL
 * @param {Object} jsonDocument JSON string
 * @param {Object} jsonDocument.quote Quote 
 * @param {Object} jsonDocument.customer Customer
 * @param {Object} jsonDocument.paymentOption Payment Option
 * @param {Object[]} jsonDocument.equipment Equipments array
 * @param {Object[]} jsonDocument.documents Documents array
 * @return {void}
 */
const SubmitAPI = Arrow.API.extend({
	group: 'submitApplication',
	path: '/api/dll/submitApplication',
	method: 'POST',
	description: 'Submit Application (quote) from DLL API',
	parameters: {
		jsonDocument: {
			description: 'Json document',
			optional: false,
			type: 'body'
		}
	},
	action: function (req, res, next) {
		const {
			headers: {
				'x-userid': userId,
				'x-group': group
			},
			params: {
				jsonDocument
			}
		} = req;

		if (!userId && !group) {
			return next('Missing userId and group in headers.');
		}
		const json = _.isObject(jsonDocument) ? jsonDocument : JSON.parse(jsonDocument);

		const {
			equipment,
			customer,
			documents,
			paymentOption
		} = json;

		let missingKeys = [];
		if (!equipment) {
			missingKeys.push('equipment');
		}
		if (!customer) {
			missingKeys.push('customer');
		}
		if (!documents) {
			missingKeys.push('documents');
		}
		if (!paymentOption) {
			missingKeys.push('paymentOption');
		}
		if (missingKeys.length > 0) {
			const errorMessage = `There are missing keys in JSON parameter: ${missingKeys.join(',')}`;
			return next(errorMessage);
		}

		const groups = group.split(',');
		let vendorCode = null;

		SoapManager.createClient('ExpressFinance')
			.then((client) => {
				const requestor = Helpers.getWsdlRequestor(userId, groups);
				const request = {
					LastRefreshDate: '1970-01-01'
				};
				const EFSearchRateCards = util.promisify(client.EFSearchRateCards);

				return EFSearchRateCards({
					requestor,
					request
				});
			})
			.then((response) => {
				const rateCards = response.SearchRateCardsResult || response;

				const {
					RateCard: {
						Rows: {
							Row: {
								0: {
									RP: rateCardId = ''
								} = {}
							} = {}
						} = {}
					} = {}
				} = rateCards;

				if (rateCardId) {
					const [myVendorCode] = rateCardId.split(':');
					vendorCode = myVendorCode;
				}
			})
			.then(() => {
				return SoapManager.createClient('ExpressFinance');
			})
			.then((client) => {
				const requestor = Helpers.getWsdlRequestor(userId, group);

				let dllApplicationNode = {};
				let documentsNode = [];

				// documents
				const jsonDocumentsObject = _.isArray(documents) ? documents : [documents];
				jsonDocumentsObject.forEach((document) => {
					const {
						type: docType,
						contentType: docContentType,
						content: docContent
					} = document;
					documentsNode.push({
						Type: docType,
						ContentType: docContentType,
						ContentEncoding: CONTENT_ENCODING,
						Content: docContent
					});
				});

				// customer
				const jsonCustomerObject = _.isObject(customer) ? customer : JSON.parse(customer);

				const {
					customerType: custCustomerType = DEFAULT.NULL,
					name: custName = DEFAULT.NULL,
					legalName: custLegalName = DEFAULT.NULL,
					dbaName: custDbaName = DEFAULT.NULL,
					firstName: custFirstName = DEFAULT.NULL,
					middleName: custMiddleName = DEFAULT.NULL,
					lastName: custLastName = DEFAULT.NULL,
					dob: custDob = DEFAULT.NULL,
					ssn: custSsn = DEFAULT.NULL,
					physicalAddress: custPhysicalAddress = DEFAULT.EMPTY,
					physicalAddress2: custPhysicalAddress2 = DEFAULT.EMPTY,
					physicalAddress3: custPhysicalAddress3 = DEFAULT.EMPTY,
					physicalCity: custPhysicalCity = DEFAULT.EMPTY,
					physicalState: custPhysicalState = DEFAULT.EMPTY,
					physicalZip: custPhysicalZip = DEFAULT.EMPTY,
					physicalCountry: custPhysicalCountry = DEFAULT.EMPTY,
					yearsAtAddress: custYearsAtAddress = DEFAULT.EMPTY,
					mailingAddress: custMailingAddress = DEFAULT.EMPTY,
					mailingAddress2: custMailingAddress2 = DEFAULT.EMPTY,
					mailingAddress3: custMailingAddress3 = DEFAULT.EMPTY,
					mailingCity: custMailingCity = DEFAULT.EMPTY,
					mailingState: custMailingState = DEFAULT.EMPTY,
					mailingZip: custMailingZip = DEFAULT.EMPTY,
					mailingCountry: custMailingCountry = DEFAULT.EMPTY,
					contact: custContact = DEFAULT.EMPTY,
					phone: custPhone = DEFAULT.EMPTY,
					email: custEmail = DEFAULT.EMPTY,
					equipmentAddress: custEquipmentAddress = DEFAULT.EMPTY,
					equipmentAddress2: custEquipmentAddress2 = DEFAULT.EMPTY,
					equipmentAddress3: custEquipmentAddress3 = DEFAULT.EMPTY,
					equipmentCity: custEquipmentCity = DEFAULT.EMPTY,
					equipmentState: custEquipmentState = DEFAULT.EMPTY,
					equipmentZip: custEquipmentZip = DEFAULT.EMPTY,
					equipmentCountry: custEquipmentCountry = DEFAULT.EMPTY
				} = jsonCustomerObject;

				const customerNode = {
					Type: custCustomerType,
					Entity: {
						Business: {
							Name: custName,
							LegalName: custLegalName,
							DBAName: custDbaName
						},
						Person: {
							GivenName: custFirstName,
							MiddleName: custMiddleName,
							SurName: custLastName,
							BirthDate: custDob,
							GovernmentID: custSsn
						}
					},
					PhysicalAddress: {
						Address1: custPhysicalAddress,
						Address2: custPhysicalAddress2,
						Address3: custPhysicalAddress3,
						City: custPhysicalCity,
						StateProvince: custPhysicalState,
						ZipPostal: custPhysicalZip,
						Country: custPhysicalCountry
					},
					YearsAtPhysicalAddress: custYearsAtAddress,
					BillingAddress: {
						Address1: custMailingAddress,
						Address2: custMailingAddress2,
						Address3: custMailingAddress3,
						City: custMailingCity,
						StateProvince: custMailingState,
						ZipPostal: custMailingZip,
						Country: custMailingCountry
					},
					ContactName: custContact,
					ContactPhone: custPhone,
					ContactEmail: custEmail
				};

				// equipments
				const jsonAssetsObject = _.isArray(equipment) ? equipment : [equipment];
				let assets = [];
				jsonAssetsObject.forEach((asset) => {
					let usages = [];
					if (asset.usages) {
						asset.usages.forEach((usage) => {
							const {
								description: assetDescriptionUsage = DEFAULT.EMPTY,
								percent: assetPercentUsage
							} = usage;
							usages.push({
								Usage: {
									Type: assetDescriptionUsage,
									Percent: assetPercentUsage
								}
							});
						});
					}

					const {
						description: assetDescription = DEFAULT.EMPTY,
						type: assetType = DEFAULT.NULL,
						manufacturer: assetManufacturer = DEFAULT.EMPTY,
						model: assetModel = DEFAULT.EMPTY,
						modelYear: assetModelYear = DEFAULT.NULL,
						quantity: assetQuantity = DEFAULT.NULL,
						isUsed: assetIsUsed = DEFAULT.NULL,
						msrp: assetMsrp = DEFAULT.NULL,
						price: assetPrice = DEFAULT.NULL,
						hours: assetHours = DEFAULT.NULL,
						tradeAllowance: assetTradeAllowance = DEFAULT.NULL,
						tradePayoff: assetTradePayoff = DEFAULT.NULL,
						usages: assetUsages = DEFAULT.NULL,
						serialNumber: assetSerialNumber = DEFAULT.NULL,
						originalInvoice: assetOriginalInvoice = DEFAULT.NULL
					} = asset;
					let assetUsagesValue = _.isArray(assetUsages) && assetUsages.length > 0 ? assetUsages : DEFAULT.NULL;

					const assetTypeNode = {
						Description: assetDescription,
						Type: assetType,
						Manufacturer: assetManufacturer,
						Model: assetModel,
						ModelYear: assetModelYear,
						Quantity: assetQuantity,
						Condition: assetIsUsed && assetIsUsed > 0 ? CONDITION.USED : CONDITION.NEW,
						MSRP: assetMsrp,
						Cost: assetPrice,
						Location: {
							Address1: custEquipmentAddress,
							Address2: custEquipmentAddress2,
							Address3: custEquipmentAddress3,
							City: custEquipmentCity,
							StateProvince: custEquipmentState,
							ZipPostal: custEquipmentZip,
							Country: custEquipmentCountry
						},
						Hours: assetHours,
						TradeValue: assetTradeAllowance,
						LienPaymentAmount: assetTradePayoff,
						Usages: assetUsagesValue,
						SerialNumber: assetSerialNumber,
						OriginalCost: assetOriginalInvoice
					};
					assets.push(
						assetTypeNode
					);
				});

				// contract
				const jsonPOObject = _.isObject(paymentOption) ? paymentOption : JSON.parse(paymentOption);
				const {
					purchaseOptions: poPurchaseOptions = DEFAULT.NULL,
					term: poTerms = DEFAULT.NULL,
					promoCode: poPromoCode = DEFAULT.NULL,
					tradeUpAmount: poTradeAmount = DEFAULT.NULL,
					contractNumber: poContractNumber = DEFAULT.NULL,
					rateFactor: poRateFactor = DEFAULT.NULL,
					rateFactorOverride: poRateFactorOverride = DEFAULT.NULL,
					leaseCommisionPoints: poLeaseCommisionPoints = DEFAULT.NULL,
					points: poPoints = DEFAULT.NULL
				} = jsonPOObject;

				let updatedPromo = DEFAULT.NULL;

				if (poPromoCode) {
					const [, realPromo] = poPromoCode.split(':');
					updatedPromo = [vendorCode, realPromo].join(':');
				}

				const contract = {
					PurchaseOption: poPurchaseOptions,
					Term: poTerms,
					RatePromoCode: updatedPromo,
					TradeUpAmount: poTradeAmount,
					TradeUpContractNumber: poContractNumber,
					RateFactor: poRateFactor,
					RateFactorOverride: poRateFactorOverride,
					RequestedPoints: poLeaseCommisionPoints || poPoints
				};

				// payment schedule
				let paymentSchedules = [];
				if (jsonPOObject.payment) {
					const {
						paymentScheduleType: psPaymentScheduleType = DEFAULT.NULL,
						paymentFrequency: psPaymentFrequency = DEFAULT.NULL,
						term: psTerm = DEFAULT.NULL,
						payment: psPayment = DEFAULT.NULL,
						paymentAmountOverride: psPaymentAmountOverride = DEFAULT.NULL,
						servicePayment: psServicePayment = DEFAULT.NULL,
					} = jsonPOObject;
					paymentSchedules.push({
						Type: psPaymentScheduleType,
						Frequency: psPaymentFrequency,
						NumberOfPayments: psTerm,
						PaymentAmount: psPayment,
						PaymentAmountOverride: psPaymentAmountOverride,
						ServiceAmount: psServicePayment
					});
				}

				// advancePayments
				let advancePayments = [];
				if (jsonPOObject.advancePaymentAmount) {
					const {
						advancePaymentType: apAdvancePaymentType = DEFAULT.NULL,
						advancePaymentAmount: apAdvancePaymentAmount = DEFAULT.NULL
					} = jsonPOObject;
					advancePayments.push({
						Type: apAdvancePaymentType,
						Amount: apAdvancePaymentAmount
					});
				}

				// costs
				let costs = [];
				if (jsonPOObject.equipmentCost) {
					const {
						equipmentType: costEquipmentType = DEFAULT.NULL,
						equipmentCost: costEquipmentCost = DEFAULT.NULL,
						additionalCost: costAdditionalCost = DEFAULT.NULL
					} = jsonPOObject;
					costs.push({
						Type: costEquipmentType,
						Amount: costEquipmentCost
					});
					costs.push({
						Type: COST_TYPE,
						Amount: costAdditionalCost
					});
				}

				dllApplicationNode.Contract = contract;
				dllApplicationNode.Customer = customerNode;
				dllApplicationNode.PaymentSchedules = {};
				dllApplicationNode.PaymentSchedules.PaymentSchedule = paymentSchedules;
				dllApplicationNode.AdvancePayments = {};
				dllApplicationNode.AdvancePayments.AdvancePayment = advancePayments;
				dllApplicationNode.Assets = {};
				dllApplicationNode.Assets.AssetType = assets;
				dllApplicationNode.Costs = {};
				dllApplicationNode.Costs.Cost = costs;

				const request = {
					DLLApplication: dllApplicationNode,
					Documents: {
						Document: documentsNode
					}
				};

				const EFSubmitApplication = util.promisify(client.EFSubmitApplication);

				return EFSubmitApplication({
					requestor,
					request
				});
			})
			.then((response) => {
				log(LOG_TAG, {
					response
				});
				const submitResult = response.SubmitApplicationResult || response;
				next(null, submitResult);
			})
			.catch(error => {
				handleError(error, req, res, next);
			});

	}
});

module.exports = SubmitAPI;
